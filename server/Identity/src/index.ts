import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/auth', authRoutes);
app.use('/users', userRoutes);


app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`Identity Service is running on port ${PORT}`);
}); 