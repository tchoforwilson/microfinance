import express from 'express';
import * as authController from '../controllers/authController';
import * as accountController from '../controllers/accountController';

const router = express.Router({ mergeParams: true });

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
