import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as accountController from '../controllers/accountController.js';

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
