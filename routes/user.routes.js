import { Router } from 'express';
import zoneRouter from './zone.routes.js';
import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';
import { uploadPhoto, resizePhoto } from '../utils/upload.js';

const router = Router();

// Protect all routes after this middleware
router.use(authController.protect);

// GET /users/1/zones
router.use('/:userId/zones', zoneRouter);

router.get('/me', userController.getMe, userController.getUser);
router
  .route('/updateMe')
  .patch(
    authController.restrictTo('manager'),
    uploadPhoto,
    resizePhoto('users'),
    userController.updateMe
  );

// RESTRICT ALL ROUTES AFTER THIS TO MANAGER AND ACCOUNTANT
router.use(authController.restrictTo('manager', 'accountant'));

router
  .route('/')
  .post(userController.createUser)
  .get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
