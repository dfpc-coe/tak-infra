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

