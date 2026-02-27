import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mq } from './utils/mq.js';
import orderRoutes from './routes/order.routes.js'
import stockRoutes from './routes/stock.routes.js'
import { connectRedis } from './utils/redis.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ Init:
mq.connect().catch((err) => {
    console.error("Failed to connect to RabbitMQ:", err);
});

// Redis Init: 
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});


// Routes

app.use('/order', orderRoutes);
app.use('/stock', stockRoutes);


app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`Inventory Service is running on port ${PORT}`);
}); 