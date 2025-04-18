<h1 align=center>TAK Infrastructure</h1>

<p align=center>CloudFormation managed infrastructure for TAK Server</p>

## AWS Deployment

### 1. Pre-Reqs

> [!IMPORTANT]
> The TAK service assumes several pre-requisite dependencies are deployed before
> initial TAK Server deployment.

The following are dependencies which need to be created:

| Name                  | Notes |
| --------------------- | ----- |
| `coe-vpc-<name>`      | VPC & networking to place tasks in - [repo](https://github.com/dfpc-coe/vpc) |
| `coe-ecs-<name>`      | ECS Cluster for API Service - [repo](https://github.com/dfpc-coe/ecs) |
| `coe-ecr-tak`         | ECR Repository for storing Server Images - [repo](https://github.com/dfpc-coe/ecr)     |

### 2. Install Tooling Dependencies

From the root directory, install the deploy dependencies

```sh
npm install
```

### 3. Building Docker Images & Pushing to ECR

An script to build docker images and publish them to your ECR is provided and can be run using:

```
npm run ./bin/build
```

from the root of the project. Ensure that you have created the necessary ECR repositories as described in the
previous step and that you have AWS credentials provided in your current terminal environment as an `aws ecr get-login-password`
call will be issued.

### 4. CloudFormation Stack Deployment
Deployment to AWS is handled via AWS Cloudformation. The templates can be found in the `./cloudformation`
directory. The deployment itself is performed by [Deploy](https://github.com/openaddresses/deploy) which
was installed in the previous step.

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
deploy create <stack> --template ./cloudformation/network.template.js
```

Step 2: Setup a DNS CNAME from your desired hostname for the TAK server to the ELB hostname. The ELB hostname is one of the CloudFormation template outputs. 

Step3: Create Service Portion (Once DNS been set & propagated)

```
deploy create <stack>
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

