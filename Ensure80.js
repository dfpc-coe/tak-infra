import http from 'node:http';
import { randomUUID } from 'node:crypto';

if (!process.env.HostedDomain) {
    throw new Error('HostedDomain Env Var must be set');
}

const port = 7000;
const uuid = randomUUID();
const secret = randomUUID();

// Create a web server that listens on port 80
// And responds to a given UUID path
// Once this passes then CertBot will be used to issue a cert
// Ensuring that DNS issues don't kill our allowed retries

const server = http.createServer((req, res) => {
    if (req.url === `/${uuid}`) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(secret);
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found');
    }
});

server.listen(port, '0.0.0.0', async () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);

    if (await test()) {
        return;
    }

    const interval = setInterval(async () => {
        if (await test()) {
            clearInterval(interval);
        }
    }, 10000);

    async function test() {
        try {
            console.error(`ok - testing http://${process.env.HostedDomain}:${port}/${uuid}`);
            const res = await fetch(new URL(`http://${process.env.HostedDomain}:${port}/${uuid}`))
            const text = await res.text();

            if (text !== secret) {
                throw new Error('Invalid Secret Value');
            }

            server.close();
            console.error('ok - success');

            return true;
        } catch (err) {
            console.error('Failed URL', err);
        }

        return false;
    }
});

