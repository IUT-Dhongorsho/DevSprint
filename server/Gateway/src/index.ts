import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import { metricsHandler, metricsMiddleware } from './utils/metrics.js';
import { HealthCheck } from './utils/health.js';
import { createProxyMiddleware } from "http-proxy-middleware";
import { adminGuard, userGuard } from './middlewares/auth.middleware.js';
import { connectRedis, redis } from './utils/redis.js';
import { stockGuard } from './middlewares/stock.middleware.js';
import { identityProxy, inventoryOrderProxy, inventoryOthersProxy, inventoryStockProxy, kitchenProxy, notificationProxy } from "./middlewares/proxy.middleware.js";
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 8005;


// HealthCheck class init:
const healthCheck = new HealthCheck('Gateway');

healthCheck.setProxyUrls({
    identity: process.env.IDENTITY_SERVICE_URL || "http://dev-sprint-identity:4002",
    inventory: process.env.INVENTORY_SERVICE_URL || "http://dev-sprint-inventory:4003",
    kitchen: process.env.KITCHEN_SERVICE_URL || "http://dev-sprint-kitchen:4004",
    notification: process.env.NOTIFICATION_SERVICE_URL || "http://dev-sprint-notification:4005"
});


// Redis Startup:
connectRedis().catch((err) => {
    console.error("Failed to connect to Redis:", err);
});


healthCheck.setRedisClient(redis);



// Middleware
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);



// let isKilled = false;

// app.post('/chaos/kill', (req, res) => {
//     isKilled = !isKilled;
//     return res.status(200).json({ message: "Successfully switched Service" });
// })

// app.use((req, res, next) => {
//     if (isKilled) {
//         return res.status(503).json({ message: "Service killed." })
//     } else {
//         return next()
//     }
// })

// Logger Middleware:
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
})
app.post('/api/chaos/load-test', (req, res) => {
    const { action } = req.body;
    const containerName = "dev-sprint-k6-runner"; // Unique name to find and kill
  
    if (action === 'start') {
      console.log("🔥 CHAOS ACTIVE: Starting Load Test...");
      
      // Use --name so we can find it later to kill it
      const startCmd = `docker compose run --rm --name ${containerName} -e API_URL=http://gateway:4001 dev-sprint-k6 run /scripts/load-test.js`;
  
      exec(startCmd, (err) => {
        if (err) console.log("k6 stopped or failed.");
      });
      
      return res.json({ status: "started" });
    } 
  
    if (action === 'stop') {
      console.log("🛡️ CHAOS DISABLED: Killing k6 instantly...");
      
      // Force kill and remove the specific container
      const stopCmd = `docker rm -f ${containerName}`;
      
      exec(stopCmd, (err) => {
        if (err) console.error("Error killing k6:", err.message);
        else console.log("k6 container terminated.");
      });
  
      return res.json({ status: "stopped" });
    }
  });
  
app.use("/api/identity", identityProxy);
app.use(
    "/api/inventory/order",
    userGuard,
    stockGuard,
    inventoryOrderProxy
);
app.use(
    "/api/inventory/stock",
    // adminGuard,
    userGuard,
    inventoryStockProxy
);
app.use(
    "/api/inventory",
    // adminGuard,
    userGuard,
    inventoryOthersProxy
);
app.use(
    "/api/kitchen",
    userGuard,
    kitchenProxy
);
app.use(
    "/api/notification",
    userGuard,
    notificationProxy
);

// Internal endpoints
app.get('/', (req, res) => {
    res.status(200).json({ message: "Gateway Service is up and running" });
});


// Health endpoints
app.get('/health', healthCheck.healthHandler);
app.get('/health/live', healthCheck.livenessHandler);
app.get('/health/ready', healthCheck.readinessHandler);




// Metrics endpoint
app.get('/metrics', metricsHandler);



app.listen(PORT, () => {
    console.log(`Gateway Service is running on port ${PORT}`);
}); 