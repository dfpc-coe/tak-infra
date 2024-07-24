<h1 align=center>TAK Infrastructure</h1>

<p align=center>CloudFormation managed infrastructure for TAK Server</p>

## AWS Deployment

### Pre-Reqs

The TAK service assumes several pre-requisite dependencies are deployed before
initial TAK Server deployment.
The following are dependencies which need to be created:

| Name                  | Notes |
| --------------------- | ----- |
| `coe-vpc-<name>`      | VPC & networking to place tasks in - [repo](https://github.com/dfpc-coe/vpc) |
| `coe-ecs-<name>`      | ECS Cluster for API Service - [repo](https://github.com/dfpc-coe/ecs) |
| `coe-ecr-tak`         | ECR Repository for storing Server Images - [repo](https://github.com/dfpc-coe/ecr)     |

### Installation

From the root directory, install the deploy dependencies

```sh
npm install
```

Deployment to AWS is handled via AWS Cloudformation. The template can be found in the `./cloudformation`
directory. The deployment itself is performed by [Deploy](https://github.com/openaddresses/deploy) which
was installed in the previous step.

The deploy tool can be run via the following

```sh
npx deploy
```

To install it globally - view the deploy [README](https://github.com/openaddresses/deploy)

Deploy uses your existing AWS credentials. Ensure that your `~/.aws/credentials` has an entry like:

```
[coe]
aws_access_key_id = <redacted>
aws_secret_access_key = <redacted>
```

Deployment can then be performed via the following:

```
npx deploy create <stack>
npx deploy update <stack>
npx deploy info <stack> --outputs
npx deploy info <stack> --parameters
```

Stacks can be created, deleted, cancelled, etc all via the deploy tool. For further information
information about `deploy` functionality run the following for help.

```sh
npx deploy
```

Further help about a specific command can be obtained via something like:

```sh
npx deploy info --help
```

