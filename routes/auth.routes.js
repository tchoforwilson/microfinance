import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router({ mergeParams: true });

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updateMyPassword);


export default router;