import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isClientConnected = true;
    this.client.on('error', (error) => {
      this.isClientConnected = false;
      console.log(`Redis client not connected to the server: ${error.message || error.toString()}`);
    });
    this.client.on('connect', () => {
      this.isClientConnected = true;
    });
  }

  isAlive() {
    return this.isClientConnected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client)(key);
    const value = await getAsync;
    return value;
  }

  async set(key, value, ttl) {
    const setAsync = promisify(this.client.set).bind(this.client)(key, value, 'EX', ttl);
    await setAsync;
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client)(key);
    await delAsync;
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
export default redisClient;
