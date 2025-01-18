import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';  // Import the authMiddleware

const router = Router();

router.post('/create',
    authMiddleware.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
);

router.get('/',
    authMiddleware.authUser,
    projectController.getAllProjects
);

export default router;