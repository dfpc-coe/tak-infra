# CHANGELOG

## Emoji Cheatsheet
- :pencil2: doc updates
- :bug: when fixing a bug
- :rocket: when making general improvements
- :white_check_mark: when adding tests
- :arrow_up: when upgrading dependencies
- :tada: when adding new features

## Version History

### Pending Release

- :bug: Fix `CoreConfig.xml` being written with two XML declarations, which failed `validateConfig.sh` on startup
- :rocket: Only overwrite deploy-managed `CoreConfig.xml` attributes; operator and TAK Server UI edits are preserved
- :rocket: Schema mismatches in an existing `CoreConfig.xml` now log a warning instead of refusing to start
- :bug: Fix `Fn::GetAtt` on the initial CoreConfig secret which prevented the network stack from deploying
- :tada: Persist TAK Server certs, Let's Encrypt state and `CoreConfig.xml` on an Amazon S3 Files file system backed by a network-stack bucket, so files can be read and edited directly in S3
- :rocket: Remove the EFS file system, access points and mount targets from the network stack (the retained file system can be deleted manually)

### v2.2.0

- :rocket: Move ECS service from public to private subnet. As a result disable assignment of public IP for the task itself. External connectivity will be solely via the NLB - which is in the public subnet.


### v2.1.0

- :rocket: Moves Let's Encrypt cert requests via certbot into an asynchronous script that does not block the Docker entrypoint.

### v2.0.0

- :tada: Split stack into ELB/DB components and ECS Service for more reliable DNS/Service creation

### v1.5.0

- :rocket: Use a local TAK Server bundle is available & fallback to S3 Bucket

### v1.4.0

- :rocket: Improvements to Certificate Issuance

### v1.3.2

- :bug: Check for JKS attributes before validating

### v1.3.1

- :rocket: Rename SG to reference ECS instead of EC2

### v1.3.0

- :rocket: Update TAK Server version to 5.4

### v1.2.0 (@chriselsen :tada:)

- Bumped up the PostgreSQL version
- Changed filesystem layout to adopt to release 5.3. Everything is in /opt/tak and only /opt/tak/certs/files is persistent.
- Added port 80 for Letsencrypt
- Added workflow to chose between Letsencrypt Prod and Test cert
- TAK admin.p12 cert is persisted into Secrets Manager
- Various other small fixes

### v1.1.0

- :bug: Lock Service Traffic to ELB

### v1.0.1

- :rocket: Removed unused cloud deps

### v1.0.0

- :rocket: Initial Release

