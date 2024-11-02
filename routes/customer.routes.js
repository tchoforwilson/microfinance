import { Router } from 'express';
import accountRouter from './account.routes.js';
import * as authController from '../controllers/auth.controller.js';
import * as customerController from '../controllers/customer.controller.js';
import { uploadPhoto, resizePhoto } from '../utils/upload.js';

const router = Router({ mergeParams: true });

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
  .post(
    uploadPhoto,
    resizePhoto('customers'),
    customerController.createCustomer
  )
  .get(customerController.getAllCustomers);
router
  .route('/:id')
  .patch(
    uploadPhoto,
    resizePhoto('customers'),
    customerController.updateCustomer
  )
  .delete(customerController.deleteCustomer);

export default router;
