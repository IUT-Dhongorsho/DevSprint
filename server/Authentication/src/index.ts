import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/', authRoutes);


app.listen(PORT, () => {
    console.log(`Authentication Service is running on port ${PORT}`);
}); 