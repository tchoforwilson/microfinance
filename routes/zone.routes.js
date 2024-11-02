import { Router } from 'express';
import customerRouter from './customer.routes.js';
import * as zoneController from '../controllers/zone.controller.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router({ mergeParams: true });

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
