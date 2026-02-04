import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document { }

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ['supplements', 'gear', 'apparel', 'drinks', 'other'], required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number }, // For profit calculation
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    brand: { type: String },
    image: { type: String }, // URL to product image
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Product = mongoose.model<IProductDocument>('Product', ProductSchema);
