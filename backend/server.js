import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './db/db.js';  // Import the connect function
import projectRoutes from './routes/project.routes.js';
import userRoutes from './routes/user.routes.js';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json());

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('collaborators-added', (data) => {
        const { projectId, users, message } = data;
        users.forEach(userId => {
            io.to(userId).emit('project-notification', { projectId, message });
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});