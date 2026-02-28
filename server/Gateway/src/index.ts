import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from "http-proxy-middleware";
import { userGuard } from './middlewares/auth.middleware.js';
import { connectRedis } from './utils/redis.js';
import { stockGuard } from './middlewares/stock.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Redis Startup:
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});

app.use(cors());

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
})

app.use(
    "/api/identity",
    createProxyMiddleware({
        target: process.env.IDENTITY_SERVICE_URL || "http://dev-sprint-identity:4002",
        changeOrigin: true,
        pathRewrite: {
            "^/api/identity": ""
        },
    })
);
app.use(
    "/api/inventory",
    userGuard,
    stockGuard,
    createProxyMiddleware({
        target: process.env.INVENTORY_SERVICE_URL || "http://dev-sprint-inventory:4003",
        changeOrigin: true,
        pathRewrite: {
            "^/api/inventory": ""
        },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.headers.userId) {
                    proxyReq.setHeader("user_id", req.headers.userId);
                }
            },
        }

    })
);
app.use(
    "/api/notifications",
    userGuard,
    createProxyMiddleware({
        target: process.env.NOTIFICATION_SERVICE_URL || "http://dev-sprint-notification:4005",
        changeOrigin: true,
        pathRewrite: {
            "^/api/notifications": ""
        },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.headers.userId) {
                    proxyReq.setHeader("user_id", req.headers.userId);
                }
            },
        }

    })
);
app.use(express.json());
// Routes
app.get('/api', (req, res) => {
    res.status(200).json({ message: "Gateway Service is up and running" });
});
// app.get('/api/test', userGuard, (req, res) => {
//     res.status(200).json({ message: "Test endpoint working" });
// });


app.listen(PORT, () => {
    console.log(`Gateway Service is running on port ${PORT}`);
}); 