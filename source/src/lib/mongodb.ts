/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Use a more robust global caching approach
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoDB(): Promise<typeof mongoose> {
    if (!MONGODB_URI) {
        throw new Error(
            "Please define the MONGODB_URI environment variable in .env.local"
        );
    }

    // Check if already connected
    if (cached.conn && mongoose.connection.readyState === 1) {
        console.log("✅ Using existing MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        };

        console.log("🔄 Creating new MongoDB connection...");
        
        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((mongooseInstance) => {
                console.log("✅ MongoDB connected successfully");
                if (mongooseInstance.connection.name) {
                    console.log(`📍 Connected to database: ${mongooseInstance.connection.name}`);
                }
                console.log(`🔗 Connection state: ${mongooseInstance.connection.readyState}`);
                return mongooseInstance;
            })
            .catch((error) => {
                console.error("❌ MongoDB connection error:", error);
                cached.promise = null;
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
}

export function getConnectionStatus(): string {
    const states = {
        0: "disconnected",
        1: "connected", 
        2: "connecting",
        3: "disconnecting",
    };
    return states[mongoose.connection.readyState as keyof typeof states] || "unknown";
}

export async function disconnectMongoDB(): Promise<void> {
    if (cached.conn) {
        await mongoose.disconnect();
        cached.conn = null;
        cached.promise = null;
        console.log("🔌 MongoDB disconnected");
    }
}

// Remove the runtime export if you're not using it specifically
// export const runtime = "nodejs";