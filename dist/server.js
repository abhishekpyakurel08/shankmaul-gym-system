"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const node_cron_1 = __importDefault(require("node-cron"));
const routes_1 = __importDefault(require("./routes"));
const scheduler_service_1 = require("./services/scheduler.service");
const attendance_service_1 = require("./services/attendance.service");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Setup Socket.IO
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Allow all origins for debugging
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});
// Store io instance in app to be accessible in controllers
app.set('io', exports.io);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: '*' })); // Allow all origins for Express
app.use(express_1.default.json());
// Routes
app.use('/api', routes_1.default);
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
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('MongoDB Connected');
    // Schedule expiry notification job to run daily at 9:00 AM
    node_cron_1.default.schedule('0 9 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[CRON] Running subscription expiry notification job...');
        yield (0, scheduler_service_1.runScheduledNotifications)();
    }));
    console.log('[CRON] Subscription expiry notification job scheduled for 9:00 AM daily');
    // Auto Check-out job to run every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[CRON] Running auto check-out job...');
        const results = yield (0, attendance_service_1.autoCheckOut)();
        if (results.length > 0) {
            console.log(`[CRON] Auto checked out ${results.length} sessions.`);
            // Optionally broadcast to socket if needed
            exports.io.emit('attendance:autoCheckout', { count: results.length });
        }
    }));
    console.log('[CRON] Auto check-out job scheduled for every 5 minutes');
})
    .catch((err) => {
    console.error('MongoDB Connection Error:', err);
});
// Socket.IO Connection Handler
exports.io.on('connection', (socket) => {
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
