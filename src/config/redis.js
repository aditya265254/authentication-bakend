import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : 'redis://localhost:6379');

const client = createClient({
    url: redisUrl
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Redis Connected Successfully globally! 🚀');
    }
}

connectRedis();

export default client;