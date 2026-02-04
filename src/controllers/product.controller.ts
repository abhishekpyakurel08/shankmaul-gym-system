import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import { Income } from '../models/finance.model';
import { deleteUploadedFile } from '../middleware/upload.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all products
 */
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { category, active } = req.query;
        const query: any = {};

        if (category) query.category = category;
        if (active === 'true') query.isActive = true;

        const products = await Product.find(query).sort({ name: 1 });
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

/**
 * Get single product
 */
export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

/**
 * Create new product
 */
export const createProduct = async (req: Request, res: Response) => {
    try {
        const productData = req.body;

        // Handle file upload if present
        if (req.file) {
            productData.image = `/uploads/products/${req.file.filename}`;
        }

        const product = await Product.create(productData);
        res.status(201).json(product);
    } catch (error: any) {
        // Cleanup file if error
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

/**
 * Update product
 */
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Handle file upload
        if (req.file) {
            // Delete old image
            if (product.image && product.image.startsWith('/uploads/')) {
                const oldPath = product.image.replace('/uploads/', '');
                deleteUploadedFile(oldPath);
            }
            updates.image = `/uploads/products/${req.file.filename}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
        res.json(updatedProduct);
    } catch (error: any) {
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete image file
        if (product.image && product.image.startsWith('/uploads/')) {
            const oldPath = product.image.replace('/uploads/', '');
            deleteUploadedFile(oldPath);
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

/**
 * Record a sale (Decrement stock, Add Income)
 */
export const recordSale = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity, paymentMethod, memberId, soldBy } = req.body;

        const qty = parseInt(quantity) || 1;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < qty) {
            return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} remaining.` });
        }

        // Decrement stock
        product.stock -= qty;
        await product.save();

        // Create Income Record
        const income = await Income.create({
            category: 'merchandise',
            amount: product.price * qty,
            description: `Sale: ${product.name} x${qty}`,
            paymentMethod: paymentMethod || 'cash',
            memberId: memberId || undefined,
            receivedBy: soldBy || req.user?._id, // Assuming auth middleware adds user
            date: new Date(),
            status: 'completed'
        });

        res.json({
            message: 'Sale recorded successfully',
            remainingStock: product.stock,
            transaction: income
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Error recording sale', error: error.message });
    }
};
