// models/MenuItem.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";

export interface IMenuItem extends Document {
    title: string;
    path: string;
    icon?: string;
    roles: string[];
    order: number;
    enabled: boolean;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
    {
        title: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        icon: {
            type: String,
            default: null,
        },
        roles: [{
            type: String,
            enum: ['admin', 'manager', 'member'],
            required: true,
        }],
        order: {
            type: Number,
            default: 0,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        category: {
            type: String,
            enum: ['main', 'secondary', 'settings'],
            default: 'main',
        },
    },
    {
        timestamps: true,
    }
);

// Check if model already exists to prevent OverwriteModelError
export const MenuItemModel: Model<IMenuItem> =
    mongoose.models.MenuItem || mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);

// Utility function to get menu items by role
export async function getMenuItemsByRole(role: string) {
    await connectMongoDB();
    return await MenuItemModel.find({
        roles: role,
        enabled: true
    }).sort({ order: 1 }).exec();
}

export default MenuItemModel;