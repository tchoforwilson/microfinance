import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as accountController from '../controllers/account.controller.js';
import 

const router = Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route('/sumAllCustomersBalance')
  .get(accountController.getSumAllCustomersBalance);

router.route('/').get(accountController.getAllAccounts);
router
  .route('/:id')
  .get(accountController.getAccount)
  .patch(
    authController.restrictTo('manager', 'accountant'),
    accountController.updateAccount
  )
  .delete(
    authController.restrictTo('manager', 'accountant'),
    accountController.deleteAccount
  );

export default router;
