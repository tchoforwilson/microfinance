import express from 'express';
import * as authController from '../controllers/authController';
import * as transactionController from '../controllers/transactionController';

const router = express.Router();

router.use(authController.protect);

// Deposit and Withdraw
router.route('/deposit').post(transactionController.deposit);
router
  .route('/withdraw')
  .post(
    authController.restrictTo('manager', 'accountant'),
    transactionController.withdraw
  );

// Get all transactions
router.route('/').get(transactionController.getTransactions);

router.route('/:id').get(transactionController.getTransaction);

// /:userId/transactions
// /:accountId/transactions
export default router;
