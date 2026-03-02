// middlewares/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 5 minutes
    max: 3, // 3 attempts
    skipSuccessfulRequests: true, // Don't count successful logins
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use studentId + IP to prevent bypassing
        return req.body.studentId + req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many login attempts. Please try again after 1 minutes.'
        });
    }
});