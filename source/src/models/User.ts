import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";

export interface IUser extends Document {
    id: string; // UUID from NextAuth logic
    email: string;
    name: string;
    image?: string | null;
    role: string;
    phone?: string | null;
    emailVerified?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        id: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        image: { type: String, default: null },
        role: { type: String, enum: ['admin', 'manager', 'member'], default: "member" },
        phone: { type: String, default: null },
        emailVerified: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

export const UserModel: Model<IUser> =
    (mongoose.models && mongoose.models.User) || mongoose.model<IUser>("User", UserSchema);

// Utility function to find user by email
export async function getUserByEmail(email: string) {
    await connectMongoDB();
    const user = await UserModel.findOne({ email }).exec();
    return user ? user.toObject() : null;
}

// Utility function to find user by ID
export async function getUserById(id: string) {
    await connectMongoDB();
    const user = await UserModel.findOne({ id }).exec();
    return user ? user.toObject() : null;
}

// Utility function to create or update user
export async function upsertUser(data: Partial<IUser>) {
    await connectMongoDB();
    const user = await UserModel.findOneAndUpdate(
        { email: data.email },
        { $set: data },
        { upsert: true, new: true }
    ).exec();
    return user ? user.toObject() : null;
}

export default UserModel; 