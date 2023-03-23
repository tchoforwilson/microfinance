import { Router } from 'express';
import zoneRouter from './zoneRoutes.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
//router.get('/logout', authController.logout);

// Protect all routes after this middleware
router.use(authController.protect);

// GET /users/1/zones
router.use('/:userId/zones', zoneRouter);

router.patch('/updateMyPassword', authController.updateMyPassword);
router.get('/me', userController.getMe, userController.getUser);
router
  .route('/updateMe')
  .patch(authController.restrictTo('manager'), userController.updateMe);

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
