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

router.put('/add-user',
    authMiddleware.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray().withMessage('Users must be an array'),
    projectController.addUserToProject
);

router.get('/get-project/:id',
    authMiddleware.authUser,
    projectController.getProjectById
);

router.put('/update-file-tree',
    authMiddleware.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree must be an object'),
    projectController.updateFileTree
);

router.get('/',
    authMiddleware.authUser,
    projectController.getAllProjects
);

export default router;