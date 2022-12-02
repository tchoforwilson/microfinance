import express from 'express';

import accountRouter from './accountRoutes';
import * as authController from '../controllers/authController';
import * as customerController from '../controllers/customerController';

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// GET /customer/1/accounts
router.use('/:customerId/accounts', accountRouter);

// GET A SINGLE CUSTOMER IS NOT RESTRICTED COLLECTOR
router.route('/:id').get(customerController.getCustomer);

router.use(authController.restrictTo('manager', 'accountant'));

// ADD A NEW CUSTOMER ACCOUNT
router.route('/addAccount').post(customerController.addCustomerAccount);

router
  .route('/')
  .post(customerController.createCustomer)
  .get(customerController.getAllCustomers);
router
  .route('/:id')
  .patch(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

export default router;
