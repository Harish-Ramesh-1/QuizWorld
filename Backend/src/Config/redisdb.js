import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: 'rNOlewjzwjnBkOsJPY5BwlRu1CvCcAXE',
    socket: {
        host: 'redis-10628.crce217.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 10628
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));


export default redisClient;

