import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import projectRoutes from './routes/project.routes.js'
import aiRoutes from './routes/ai.routes.js'
import  userRoutes  from './routes/user.routes.js';
import cors from 'cors';

// Connect to database
try {
    connect();
} catch (error) {
    console.error('Database connection failed:', error.message);
}

const mainapp = express();

// Middleware
mainapp.use(cors());
mainapp.use(express.json());
mainapp.use(express.urlencoded({ extended: true }));
mainapp.use(cookieParser()); // Ensure this is before routes
mainapp.use(morgan('dev'));

// Routes
mainapp.use('/user', userRoutes);
mainapp.use('/projects',projectRoutes);
mainapp.use('/ai',aiRoutes)

mainapp.get('/', (req, res) => {
    res.send("Hello World");
});

// Use default export
export default mainapp;
