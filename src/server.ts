import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import routes from './routes';
import { runScheduledNotifications } from './services/scheduler.service';
import { autoCheckOut } from './services/attendance.service';

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
export const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins for debugging
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Store io instance in app to be accessible in controllers
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL,
credentials: true
 })); // Allow all origins for Express
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', routes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');

        // Schedule expiry notification job to run daily at 9:00 AM
        cron.schedule('0 9 * * *', async () => {
            console.log('[CRON] Running subscription expiry notification job...');
            await runScheduledNotifications();
        });
        console.log('[CRON] Subscription expiry notification job scheduled for 9:00 AM daily');

        // Auto Check-out job to run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            console.log('[CRON] Running auto check-out job...');
            const results = await autoCheckOut();
            if (results.length > 0) {
                console.log(`[CRON] Auto checked out ${results.length} sessions.`);
                // Optionally broadcast to socket if needed
                io.emit('attendance:autoCheckout', { count: results.length });
            }
        });
        console.log('[CRON] Auto check-out job scheduled for every 5 minutes');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err);
    });

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
