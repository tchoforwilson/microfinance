import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as transactionController from '../controllers/transactionController.js';

const router = Router();

router.use(authController.protect);

// Deposit and Withdraw
router.route('/deposit').post(transactionController.deposit);
router
  .route('/withdraw')
  .post(
    authController.restrictTo('manager', 'accountant'),
    transactionController.withdraw
  );
router
  .route('/deduction')
  .get(
    authController.restrictTo('manager'),
    transactionController.monthlyDeduction
  );

// Get all transactions
router.route('/').get(transactionController.getAllTransactions);
router.route('/:id').get(transactionController.getTransaction);

// /:userId/transactions
// /:accountId/transactions
export default router;
