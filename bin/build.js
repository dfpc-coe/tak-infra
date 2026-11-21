import fs from 'node:fs/promises';
import CP from 'child_process';

/**
 * Build and push the TAK Server container to AWS ECR
 *
 * Environment may be a comma separated list of environments in the same
 * AWS account - the image is built once and pushed to each of them
 */

process.env.GITSHA = sha();

process.env.Environment = process.env.Environment || 'prod';

for (const env of [
    'GITSHA',
    'AWS_REGION',
    'AWS_ACCOUNT_ID',
    'Environment',
]) {
    if (!process.env[env]) {
        console.error(`${env} Env Var must be set`);
        process.exit();
    }
}

await login();
console.error('ok - building containers');
await tak();

function login() {
    console.error('ok - logging in')

    return new Promise((resolve, reject) => {
        const $ = CP.exec(`
            aws ecr get-login-password \
                --region $\{AWS_REGION\} \
            | docker login \
                --username AWS \
                --password-stdin "$\{AWS_ACCOUNT_ID\}.dkr.ecr.$\{AWS_REGION\}.amazonaws.com"

        `, (err) => {
            if (err) return reject(err);
            return resolve();
        });

        $.stdout.pipe(process.stdout);
        $.stderr.pipe(process.stderr);
    });

}

function tak() {
    const images = process.env.Environment.split(',')
        .map((environment) => environment.trim())
        .filter(Boolean)
        .map((environment) => `$\{AWS_ACCOUNT_ID\}.dkr.ecr.$\{AWS_REGION\}.amazonaws.com/tak-vpc-${environment}-takserver:$\{GITSHA\}`);

    return new Promise((resolve, reject) => {
        const $ = CP.exec([
            'docker build . -t takserver',
            ...images.map((image) => `docker tag takserver:latest "${image}" && docker push "${image}"`)
        ].join(' && '), (err) => {
            if (err) return reject(err);
            return resolve();
        });

        $.stdout.pipe(process.stdout);
        $.stderr.pipe(process.stderr);
    });
}

function sha() {
    const git = CP.spawnSync('git', [
        '--git-dir', new URL('../.git', import.meta.url).pathname,
        'rev-parse', 'HEAD'
    ]);

    if (!git.stdout) throw Error('Is this a git repo? Could not determine GitSha');
    return String(git.stdout).replace(/\n/g, '');

}
