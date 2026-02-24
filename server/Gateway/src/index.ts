import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from "http-proxy-middleware";
// import authRoutes from "./routes/api.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL || "http://dev-sprint-authentication:8002",
        changeOrigin: true,
        pathRewrite: {
            "^/api/auth": ""
        },
    })
);
app.use(express.json());
// Routes
app.get('/api', (req, res) => {
    res.status(200).json({ message: "Gateway Service is up and running" });
});

// Proxy setup for Authentication Service
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: `${process.env.AUTH_SERVICE_URL}` || "http://dev-sprint-authentication:4002",
        changeOrigin: true,
        pathRewrite: { "^/": '/' },
    })
);

// app.post('/api/auth/register', (req, res) => {
//     console.log(req.body);
//     res.status(201).json({ message: "Created successfully" })
// })


app.listen(PORT, () => {
    console.log(`Gateway Service is running on port ${PORT}`);
}); 