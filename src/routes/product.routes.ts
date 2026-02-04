import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    recordSale
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin, Staff)
 */
router.post(
    '/',
    authenticate,
    authorize(['admin', 'staff']),
    uploadSingle('productImage'),
    createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin, Staff)
 */
router.put(
    '/:id',
    authenticate,
    authorize(['admin', 'staff']),
    uploadSingle('productImage'),
    updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    deleteProduct
);

/**
 * @route   POST /api/products/:id/sell
 * @desc    Record a product sale
 * @access  Private (Admin, Staff, Trainer)
 */
router.post(
    '/:id/sell',
    authenticate,
    authorize(['admin', 'staff', 'trainer']),
    recordSale
);

export default router;
