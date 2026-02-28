import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mq } from './utils/mq.js';
import { connectRedis } from './utils/redis.js';
import { NotificationConsumer } from './consumers/notification.consumer.js';
import notificationRoutes from './routes/notification.route.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8009;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
})

// RabbitMQ Init and start consumer after connection
mq.connect()
    .then(() => NotificationConsumer())
    .catch((err) => {
        console.error("Failed to connect RabbitMQ or start consumer:", err);
    });


// Redis Init:
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});


// Routes
app.use('/', notificationRoutes);


app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`Notification Service is running on port ${PORT}`);
}); 