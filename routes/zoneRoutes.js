import express from 'express';
import customerRouter from './customerRoutes';
import * as zoneController from '../controllers/zoneController';
import * as authController from '../controllers/authController';

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// GET /zone/1/customers
router.use('/:zoneId/customers', customerRouter);

router.use(authController.restrictTo('manager'));
router
  .route('/')
  .post(zoneController.createZone)
  .get(zoneController.getAllZones);
router
  .route('/:id')
  .get(zoneController.getZone)
  .patch(zoneController.updateZone)
  .delete(zoneController.deleteZone);

export default router;
