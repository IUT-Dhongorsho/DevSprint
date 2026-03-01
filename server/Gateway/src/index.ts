import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from "http-proxy-middleware";
import { adminGuard, userGuard } from './middlewares/auth.middleware.js';
import { connectRedis } from './utils/redis.js';
import { stockGuard } from './middlewares/stock.middleware.js';



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
    "/api/inventory/order",
    userGuard,
    stockGuard,
    createProxyMiddleware({
        target: process.env.INVENTORY_SERVICE_URL || "http://dev-sprint-inventory:4003",
        changeOrigin: true,
        pathRewrite: function (path, req) {
            const fullPath = req.originalUrl;
            return fullPath.replace('/api/inventory/order', '/order');
        },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.headers.user_id) {
                    proxyReq.setHeader("user_id", req.headers.user_id);
                }
            },
        }

    })
);
app.use(
    "/api/inventory/stock",
    // adminGuard,
    userGuard,
    createProxyMiddleware({
        target: process.env.INVENTORY_SERVICE_URL || "http://dev-sprint-inventory:4003",
        changeOrigin: true,
        pathRewrite: function (path, req) {
            const fullPath = req.originalUrl;
            return fullPath.replace('/api/inventory/stock', '/stock');
        },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.headers.user_id) {
                    proxyReq.setHeader("user_id", req.headers.user_id);
                }
                if (req.headers.admin_id) {
                    proxyReq.setHeader("admin_id", req.headers.admin_id);
                }
            },
        }

    })
);
app.use(
    "/api/notification",
    userGuard,
    createProxyMiddleware({
        target: process.env.NOTIFICATION_SERVICE_URL || "http://dev-sprint-notification:4005",
        changeOrigin: true,
        pathRewrite: {
            "^/api/notification": ""
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