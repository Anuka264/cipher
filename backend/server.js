const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const crewRoutes = require('./routes/crewRoutes');
const matchRoutes = require('./routes/matchRoutes');
const oracleRoutes = require('./routes/oracleRoutes');

const app = express();
const bodyLimit = process.env.BODY_LIMIT || '15mb';
const allowedOrigins = String(process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const authRequestBuckets = new Map();

const createRateLimiter = ({ windowMs, maxRequests }) => (req, res, next) => {
    const key = `${req.ip || req.connection?.remoteAddress || 'unknown'}:${req.path}`;
    const now = Date.now();
    const existing = authRequestBuckets.get(key);

    if (!existing || now - existing.start > windowMs) {
        authRequestBuckets.set(key, { start: now, count: 1 });
        return next();
    }

    if (existing.count >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    existing.count += 1;
    return next();
};

app.disable('x-powered-by');

app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.header('Vary', 'Origin');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));
app.use('/api/users/register', createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 20 }));
app.use('/api/users/login', createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 25 }));
app.use('/api/users/account', createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 20 }));
app.use('/api/users', userRoutes);
app.use('/api/crews', crewRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/oracle', oracleRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await db.initializeSchema();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
};

startServer();
