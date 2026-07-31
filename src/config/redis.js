import { createClient } from "redis";

const client = createClient();

client.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Redis Connected Successfully globally! 🚀');
    }
}

connectRedis();

export default client;