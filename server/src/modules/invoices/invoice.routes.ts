import express from 'express';
import * as invoiceController from './invoice.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createInvoiceSchema, updateInvoiceSchema } from './invoice.validation';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';
import { Role } from '../../types';

const router = express.Router();

// Strict RBAC: All invoice routes require ADMIN or PM
router.use(authMiddleware, rbacMiddleware([Role.ADMIN, Role.PM]));

router.post(
  '/',
  validate(createInvoiceSchema),
  invoiceController.createInvoice
);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);

router.put(
  '/:id',
  validate(updateInvoiceSchema),
  invoiceController.updateInvoice
);

router.delete(
  '/:id',
  invoiceController.deleteInvoice
);

export default router;
