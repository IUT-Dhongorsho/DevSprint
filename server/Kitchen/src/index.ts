import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mq } from './utils/mq.js';
import { connectRedis } from './utils/redis.js';
import { KitchenConsumer } from './consumers/kitchen.consumer.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

// Middleware
app.use(cors());
app.use(express.json());
// Redis Init:
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});



// RabbitMQ Init and start consumer after connection
mq.connect()
    .then(() => KitchenConsumer())
    .catch((err) => {
        console.error("Failed to connect RabbitMQ or start consumer:", err);
    });

// Routes



app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`Kitchen Service is running on port ${PORT}`);
}); 