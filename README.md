<h1 align=center>TAK Infrastructure</h1>

<p align=center>CloudFormation managed infrastructure for TAK Server</p>

## AWS Deployment

### 1. Pre-Requisites

> [!IMPORTANT]
> The TAK service assumes several pre-requisite dependencies are deployed before
> initial TAK Server deployment.

The following are dependencies which need to be created:

| Name                  | Notes |
| --------------------- | ----- |
| `tak-vpc-<name>`      | VPC & networking to place tasks in - [repo](https://github.com/dfpc-coe/vpc) |
| `coe-ecr-tak`         | ECR Repository for storing Server Images - [repo](https://github.com/dfpc-coe/ecr)     |

### 2. Install Tooling Dependencies

From the root directory, install the deploy dependencies

```sh
npm install
```

### 3. Building Docker Images & Pushing to ECR

An script to build docker images and publish them to your ECR is provided and can be run using:

```
npm run build
```

from the root of the project. Ensure that you have created the necessary ECR repositories as described in the
previous step and that you have AWS credentials provided in your current terminal environment as an `aws ecr get-login-password`
call will be issued.

### 4. CloudFormation Stack Deployment
Deployment to AWS is handled via AWS Cloudformation. The templates can be found in the `./cloudformation`
directory. The deployment itself is performed by [Deploy](https://github.com/openaddresses/deploy) which
was installed in the previous step.

The deployed service stores its canonical `CoreConfig.xml` on the shared S3 Files file system. On task startup the
config generator:

1. Creates `CoreConfig.xml` from `CoreConfig.base.xml` if no config exists yet (see the initial secret below).
2. Loads the existing file and overwrites only the deploy-managed values: the `https`/`cert_https` connector
   keystores, the LDAP connection, the Postgres connection, certificate signing paths, TLS keystores and the
   CloudWatch/version attributes on `<network>`.
3. Writes the result back to the file system and symlinks `/opt/tak/CoreConfig.xml` to it.

Everything else in the file is left untouched, so changes made out of band - by the TAK Server admin UI
(federation, inputs, data feeds, etc) or by editing `config/CoreConfig.xml` in the bucket - persist across restarts.
Attributes that the deploy only sets on first creation (for example `validityDays` or `enableNonAdminUI`) can
be tuned by operators without being reset. The startup script still validates the final file against the
TAK Server XSD before launching.

#### Persistent files: S3 Files

Persistent TAK Server files (`/opt/tak/certs/files`, `/etc/letsencrypt` and the canonical `CoreConfig.xml`)
live on an [Amazon S3 Files](https://aws.amazon.com/s3/features/files/) file system created by the network
stack and backed by the `<network-stack>-files-<account>-<region>` bucket. The service mounts it through three
access points, which map to the `certs/`, `letsencrypt/` and `config/` prefixes in that bucket.

S3 Files keeps the bucket and the file system in sync in both directions, so operators can read or replace
`config/CoreConfig.xml` directly in S3 without mounting anything. Writes from the running server are exported to
S3 after 60 seconds of write inactivity; if the same object changes in S3 before that export lands, the S3 copy
wins and the server's version is moved to the file system's lost+found directory. Stop the service (or accept
that the S3 version wins) before editing `CoreConfig.xml` in the bucket.

Existing deployments that still run on the previous EFS file system: copy `CoreConfig.xml` into the new
bucket under `config/` before updating the service stack (certificates are restored from Secrets Manager on
startup, and Let's Encrypt certificates are re-requested). Update the network stack first, then the service
stack. The old EFS file system is retained in AWS for manual cleanup.

If operators would rather not place `config/CoreConfig.xml` in the bucket before first service startup, seed the network-stack secret
`<network-stack>/coreconfig/initial` with the desired `CoreConfig.xml`. The ECS service injects that secret as
`InitialCoreConfigXml`, and startup copies it onto the file system only when `CoreConfig.xml` is not
already present. An existing CoreConfig on the file system always wins.

To migrate certificate secrets and seed the initial CoreConfig directly from an existing TAK host, run:

```sh
./migrate.sh --network-stack tak-server-network-prod <ssh-name>
```

The migration script streams remote files over SSH directly into AWS Secrets Manager; it does not write a local
archive or intermediate migration bundle. Use `--sudo` when the SSH user needs passwordless sudo to read the TAK
files, and repeat `--ssh-option` for custom SSH options.

> [!NOTE]
> The deploy tool can be run via the following
>
> ```sh
> npx deploy
> ```
>
> To install it globally - view the deploy [README](https://github.com/openaddresses/deploy)
>
> Deploy uses your existing AWS credentials. Ensure that your `~/.aws/credentials` has an entry like:
>
> ```
> [coe]
> aws_access_key_id = <redacted>
> aws_secret_access_key = <redacted>
> ```

#### Sub-Stack Deployment

The CloudFormation is split into two stacks to ensure consistent deploy results.

The first portion deploys the ELB, database and all necessary related filestore
components. The second portion deploys the ECS Service itself.

Step 1: Create Network Portion:

```
npx deploy create <stack> --template ./cloudformation/network.template.js
```

Step 2: Setup a DNS CNAME from your desired hostname for the TAK server to the ELB hostname. The ELB hostname is one of the CloudFormation template outputs.

Step3: Create Service Portion (Once DNS been set & propagated)

```
npx deploy create <stack>
```
> [!NOTE]
> Stacks can be created, deleted, cancelled, etc all via the deploy tool. For further information
> information about `deploy` functionality run the following for help.
>
> ```sh
> npx deploy
> ```
>
> Further help about a specific command can be obtained via something like:
>
> ```sh
> npx deploy info --help
> ```

