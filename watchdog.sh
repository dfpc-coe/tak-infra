#!/usr/bin/env bash
#
# TAK Server Watchdog
#
# Monitors the TAK Server JVMs, the takserver-api HTTP endpoint and the expiry
# of the certificates referenced by the CoreConfig <connector> elements.
# Failures (and recoveries) are published to an AWS SNS topic.
#

set -uo pipefail

usage() {
    cat <<'EOF'
Usage: ./watchdog.sh [options]

Monitor a running TAK Server and publish failures to AWS SNS.

Checks:
  takserver-*  Each TAK Server JVM (config, messaging, api, retention, plugins) is running
  api          takserver-api answers GET /Marti/api/version with HTTP 200
  cert         Every keystore referenced by a CoreConfig <connector keystoreFile=...>
               holds a certificate that is valid for at least WATCHDOG_CERT_MIN_DAYS

Options:
      --once               Run every check once, print the results and exit non-zero
                           if any check fails. Notifications are not published
      --notify             With --once, publish notifications for failing checks
  -h, --help               Show this help

Environment:
  WATCHDOG_SNS_TOPIC_ARN   SNS topic that receives notifications. Unset: log only
  WATCHDOG_CORECONFIG      CoreConfig.xml to read            (default: /opt/tak/CoreConfig.xml)
  WATCHDOG_API_URL         API health URL                   (default: https://localhost:8446/Marti/api/version)
  WATCHDOG_API_TIMEOUT     Seconds to wait for the API      (default: 5)
  WATCHDOG_API_FAILURES    Consecutive API failures before notifying (default: 3)
  WATCHDOG_INTERVAL        Seconds between process and API checks (default: 5)
  WATCHDOG_CERT_INTERVAL   Seconds between certificate checks (default: 3600)
  WATCHDOG_CERT_MIN_DAYS   Notify when fewer days remain    (default: 7)
  WATCHDOG_GRACE           Seconds after start before process and API failures notify (default: 300)
  WATCHDOG_RENOTIFY        Seconds between repeat notifications for a still failing check (default: 3600)
  WATCHDOG_NOTIFY_RECOVERY Publish a resolved notification when a check recovers (default: true)
EOF
}

log() {
    echo "ok - Watchdog - $*"
}

warn() {
    echo "warn - Watchdog - $*" >&2
}

fail() {
    echo "not ok - Watchdog - $*" >&2
}

die() {
    fail "$*"
    exit 1
}

SNS_TOPIC_ARN="${WATCHDOG_SNS_TOPIC_ARN:-}"
CORECONFIG="${WATCHDOG_CORECONFIG:-/opt/tak/CoreConfig.xml}"
API_URL="${WATCHDOG_API_URL:-https://localhost:8446/Marti/api/version}"
API_TIMEOUT="${WATCHDOG_API_TIMEOUT:-5}"
API_FAILURES="${WATCHDOG_API_FAILURES:-3}"
INTERVAL="${WATCHDOG_INTERVAL:-5}"
CERT_INTERVAL="${WATCHDOG_CERT_INTERVAL:-3600}"
CERT_MIN_DAYS="${WATCHDOG_CERT_MIN_DAYS:-7}"
GRACE="${WATCHDOG_GRACE:-300}"
RENOTIFY="${WATCHDOG_RENOTIFY:-3600}"
NOTIFY_RECOVERY="${WATCHDOG_NOTIFY_RECOVERY:-true}"

STACK_NAME="${StackName:-tak-server}"
ENVIRONMENT="${Environment:-unknown}"
DOMAIN="${HostedDomain:-}"

# name|regex - matched against the java command lines started by configureInDocker.sh
JAVA='^([^ ]*/)?java '
PROCESSES=(
    "takserver-config|${JAVA}.*-Dspring\\.profiles\\.active=config( |\$)"
    "takserver-messaging|${JAVA}.*-Dspring\\.profiles\\.active=messaging( |\$)"
    "takserver-api|${JAVA}.*-Dspring\\.profiles\\.active=api( |\$)"
    "takserver-retention|${JAVA}.*takserver-retention\\.jar( |\$)"
    "takserver-plugins|${JAVA}.*takserver-pm\\.jar( |\$)"
)

ONCE="false"
NOTIFY_ENABLED="true"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --once)
            ONCE="true"
            NOTIFY_ENABLED="false"
            shift
            ;;
        --notify)
            NOTIFY_ENABLED="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage >&2
            die "Unknown argument: $1"
            ;;
    esac
done

for tool in pgrep curl xmllint keytool openssl date; do
    command -v "$tool" > /dev/null 2>&1 || die "Required tool not found: ${tool}"
done

if [[ -n "$SNS_TOPIC_ARN" ]]; then
    command -v aws > /dev/null 2>&1 || die "WATCHDOG_SNS_TOPIC_ARN is set but the aws cli was not found"
    [[ "$SNS_TOPIC_ARN" == arn:*:sns:*:*:* ]] || die "WATCHDOG_SNS_TOPIC_ARN is not an SNS topic ARN: ${SNS_TOPIC_ARN}"
fi

declare -A STATE NOTIFIED NOTIFIED_AT
CHECK_DETAIL=""
CHECK_SUMMARY=""
CHECK_SEVERITY=""
API_FAILS=0
ONCE_FAILED="false"
STARTED_AT=$(date +%s)
GRACE_END=$((STARTED_AT + GRACE))
NEXT_CERT_CHECK=0

json_escape() {
    local s=$1
    s=${s//\\/\\\\}
    s=${s//\"/\\\"}
    s=${s//$'\n'/\\n}
    s=${s//$'\r'/\\r}
    s=${s//$'\t'/\\t}
    printf '%s' "$s"
}

task_arn() {
    [[ -n "${ECS_CONTAINER_METADATA_URI_V4:-}" ]] || return 0
    curl --silent --max-time 2 "${ECS_CONTAINER_METADATA_URI_V4}/task" 2>/dev/null \
        | grep -o '"TaskARN":"[^"]*"' | head -n 1 | cut -d'"' -f4
}

# notify <check> <firing|resolved> <severity> <summary> <description>
notify() {
    local check=$1 status=$2 severity=$3 summary=$4 description=$5
    local subject message region

    subject="[${STACK_NAME}] ${status^^}: ${summary}"
    subject=${subject:0:100}

    message=$(cat <<EOF
{
  "source": "tak-infra/watchdog",
  "stack": "$(json_escape "$STACK_NAME")",
  "environment": "$(json_escape "$ENVIRONMENT")",
  "domain": "$(json_escape "$DOMAIN")",
  "task": "$(json_escape "$(task_arn)")",
  "hostname": "$(json_escape "$(hostname)")",
  "check": "$(json_escape "$check")",
  "status": "$(json_escape "$status")",
  "severity": "$(json_escape "$severity")",
  "summary": "$(json_escape "$summary")",
  "description": "$(json_escape "$description")",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    )

    if [[ "$NOTIFY_ENABLED" != "true" ]]; then
        return 0
    fi

    if [[ -z "$SNS_TOPIC_ARN" ]]; then
        log "Notification skipped, WATCHDOG_SNS_TOPIC_ARN is not set: ${subject}"
        return 0
    fi

    region=$(cut -d: -f4 <<< "$SNS_TOPIC_ARN")

    if aws sns publish \
        --region "$region" \
        --topic-arn "$SNS_TOPIC_ARN" \
        --subject "$subject" \
        --message "$message" \
        --message-attributes "{\"check\":{\"DataType\":\"String\",\"StringValue\":\"$(json_escape "$check")\"},\"status\":{\"DataType\":\"String\",\"StringValue\":\"${status}\"},\"severity\":{\"DataType\":\"String\",\"StringValue\":\"${severity}\"}}" \
        > /dev/null
    then
        log "Notification published: ${subject}"
    else
        fail "Notification failed to publish to ${SNS_TOPIC_ARN}: ${subject}"
        return 1
    fi
}

# evaluate <check> <severity> <result 0|1>
# Tracks state transitions for a check and decides when to notify
evaluate() {
    local check=$1 severity=$2 result=$3 now
    now=$(date +%s)

    if [[ "$ONCE" == "true" ]]; then
        if [[ "$result" -eq 0 ]]; then
            log "${check} - ${CHECK_DETAIL}"
        else
            fail "${check} - ${CHECK_DETAIL}"
            ONCE_FAILED="true"
            notify "$check" firing "$severity" "$CHECK_SUMMARY" "$CHECK_DETAIL" || true
        fi
        return 0
    fi

    if [[ "$result" -eq 0 ]]; then
        if [[ "${STATE[$check]:-ok}" == "failing" ]]; then
            log "${check} recovered - ${CHECK_DETAIL}"

            if [[ "${NOTIFIED[$check]:-0}" -eq 1 && "$NOTIFY_RECOVERY" == "true" ]]; then
                notify "$check" resolved "$severity" "${check} recovered" "$CHECK_DETAIL" || true
            fi
        fi

        STATE[$check]="ok"
        NOTIFIED[$check]=0
        NOTIFIED_AT[$check]=0
        return 0
    fi

    if [[ "${STATE[$check]:-ok}" != "failing" ]]; then
        fail "${check} failing - ${CHECK_DETAIL}"
        STATE[$check]="failing"
    fi

    if (( now < GRACE_END )) && [[ "$check" != "cert" ]]; then
        return 0
    fi

    if (( ${NOTIFIED_AT[$check]:-0} == 0 || now - ${NOTIFIED_AT[$check]:-0} >= RENOTIFY )); then
        if notify "$check" firing "$severity" "$CHECK_SUMMARY" "$CHECK_DETAIL"; then
            NOTIFIED[$check]=1
            NOTIFIED_AT[$check]=$now
        fi
    fi
}

# check_process <name> <pattern>
check_process() {
    local name=$1 pattern=$2 pids

    if pids=$(pgrep -f -- "$pattern"); then
        CHECK_DETAIL="running (pid ${pids//$'\n'/,})"
        return 0
    fi

    CHECK_SUMMARY="${name} process is not running"
    CHECK_DETAIL="no java process matches ${pattern}"
    return 1
}

check_api() {
    local code rc

    code=$(curl --silent --insecure --output /dev/null --write-out '%{http_code}' --max-time "$API_TIMEOUT" "$API_URL" 2>/dev/null)
    rc=$?

    if [[ "$rc" -eq 0 && "$code" == "200" ]]; then
        CHECK_DETAIL="HTTP ${code} from ${API_URL}"
        return 0
    fi

    CHECK_SUMMARY="takserver-api is not responding"
    CHECK_DETAIL="HTTP ${code:-000} from ${API_URL} (curl exit ${rc}, timeout ${API_TIMEOUT}s)"
    return 1
}

xpath() {
    xmllint --xpath "$1" "$CORECONFIG" 2>/dev/null
}

# Prints "name<TAB>keystoreFile<TAB>keystorePass" for each <network><connector> with a keystoreFile
coreconfig_keystores() {
    local selector="//*[local-name()='network']/*[local-name()='connector'][@keystoreFile]"
    local count i

    count=$(xpath "count(${selector})") || return 1

    for ((i = 1; i <= count; i++)); do
        printf '%s\t%s\t%s\n' \
            "$(xpath "string((${selector})[${i}]/@_name)")" \
            "$(xpath "string((${selector})[${i}]/@keystoreFile)")" \
            "$(xpath "string((${selector})[${i}]/@keystorePass)")"
    done
}

# Prints "alias<TAB>notAfter epoch<TAB>subject" for each private key entry in a keystore
keystore_certificates() {
    local file=$1 pass=$2 aliases alias pem enddate epoch subject

    aliases=$(keytool -list -keystore "$file" -storepass "$pass" 2>/dev/null | awk -F', ' '/PrivateKeyEntry/ { print $1 }')
    [[ -n "$aliases" ]] || return 1

    while IFS= read -r alias; do
        pem=$(keytool -exportcert -rfc -alias "$alias" -keystore "$file" -storepass "$pass" 2>/dev/null) || return 1
        enddate=$(openssl x509 -noout -enddate <<< "$pem" 2>/dev/null | cut -d= -f2-)
        epoch=$(date -d "$enddate" +%s 2>/dev/null) || return 1
        subject=$(openssl x509 -noout -subject <<< "$pem" 2>/dev/null | sed -e 's/^subject= *//')
        printf '%s\t%s\t%s\n' "$alias" "$epoch" "$subject"
    done <<< "$aliases"
}

check_cert() {
    local entries name file pass certs alias epoch subject days expires
    local -a seen=() details=() problems=() summaries=()
    local now severity="warning"
    now=$(date +%s)

    if [[ ! -r "$CORECONFIG" ]]; then
        CHECK_SUMMARY="CoreConfig is not readable"
        CHECK_DETAIL="cannot read ${CORECONFIG}"
        CHECK_SEVERITY="critical"
        return 1
    fi

    entries=$(coreconfig_keystores)

    if [[ -z "$entries" ]]; then
        CHECK_SUMMARY="CoreConfig has no connector keystore"
        CHECK_DETAIL="no <connector keystoreFile=...> found in ${CORECONFIG}"
        CHECK_SEVERITY="critical"
        return 1
    fi

    while IFS=$'\t' read -r name file pass; do
        [[ -n "$file" ]] || continue
        [[ " ${seen[*]} " == *" ${file} "* ]] && continue
        seen+=("$file")

        if ! certs=$(keystore_certificates "$file" "$pass"); then
            problems+=("${name}: cannot read a certificate from keystore ${file}")
            summaries+=("${name} keystore is unreadable")
            severity="critical"
            continue
        fi

        while IFS=$'\t' read -r alias epoch subject; do
            days=$(( (epoch - now) / 86400 ))
            expires=$(date -u -d "@${epoch}" +%Y-%m-%dT%H:%M:%SZ)

            if (( epoch <= now )); then
                problems+=("${name}: '${alias}' (${subject}) expired ${expires}")
                summaries+=("${name} certificate '${alias}' expired")
                severity="critical"
            elif (( days < CERT_MIN_DAYS )); then
                problems+=("${name}: '${alias}' (${subject}) expires in ${days} days (${expires})")
                summaries+=("${name} certificate '${alias}' expires in ${days} days")
            else
                details+=("${name}: '${alias}' (${subject}) expires in ${days} days (${expires})")
            fi
        done <<< "$certs"
    done <<< "$entries"

    CHECK_SEVERITY="$severity"

    if (( ${#problems[@]} > 0 )); then
        CHECK_SUMMARY="${summaries[0]}"
        if (( ${#summaries[@]} > 1 )); then
            CHECK_SUMMARY="${CHECK_SUMMARY} (+$(( ${#summaries[@]} - 1 )) more)"
        fi
        CHECK_DETAIL=$(printf '%s; ' "${problems[@]}" "${details[@]}")
        CHECK_DETAIL=${CHECK_DETAIL%; }
        return 1
    fi

    CHECK_DETAIL=$(printf '%s; ' "${details[@]}")
    CHECK_DETAIL=${CHECK_DETAIL%; }
    return 0
}

run_checks() {
    local entry name pattern now

    for entry in "${PROCESSES[@]}"; do
        name=${entry%%|*}
        pattern=${entry#*|}

        if check_process "$name" "$pattern"; then
            evaluate "$name" critical 0
        else
            evaluate "$name" critical 1
        fi
    done

    if check_api; then
        API_FAILS=0
        evaluate api critical 0
    else
        API_FAILS=$((API_FAILS + 1))

        if (( API_FAILS >= API_FAILURES )); then
            CHECK_DETAIL="${CHECK_DETAIL}, ${API_FAILS} consecutive failures"
            evaluate api critical 1
        elif (( API_FAILS == 1 )); then
            warn "api check failed (${API_FAILS}/${API_FAILURES}) - ${CHECK_DETAIL}"
        fi
    fi

    now=$(date +%s)

    if (( now >= NEXT_CERT_CHECK )); then
        NEXT_CERT_CHECK=$((now + CERT_INTERVAL))

        if check_cert; then
            [[ "$ONCE" == "true" ]] || log "cert - ${CHECK_DETAIL}"
            evaluate cert warning 0
        else
            evaluate cert "$CHECK_SEVERITY" 1
        fi
    fi
}

if [[ "$ONCE" == "true" ]]; then
    API_FAILURES=1
    run_checks

    if [[ "$ONCE_FAILED" == "true" ]]; then
        exit 1
    fi

    exit 0
fi

trap 'log "Stopping"; exit 0' TERM INT

log "Starting - stack ${STACK_NAME}, environment ${ENVIRONMENT}, domain ${DOMAIN:-unset}"
log "Processes and API checked every ${INTERVAL}s (API ${API_URL}, ${API_FAILURES} failures to notify), certificates every ${CERT_INTERVAL}s (notify under ${CERT_MIN_DAYS} days), ${GRACE}s startup grace"

if [[ -n "$SNS_TOPIC_ARN" ]]; then
    log "Notifications publish to ${SNS_TOPIC_ARN}"
else
    warn "WATCHDOG_SNS_TOPIC_ARN is not set, failures are logged only"
fi

while true; do
    run_checks
    sleep "$INTERVAL" &
    wait "$!"
done
