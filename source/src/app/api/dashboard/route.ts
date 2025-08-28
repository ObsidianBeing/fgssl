/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectMongoDB } from '@/lib/mongodb';
import Donation from '@/models/Donation';
import User from '@/models/User';
import MenuItemModel from '@/models/MenuItem';

// Define types for our response data
interface DashboardStats {
    userCount?: number;
    donationCount?: number;
    totalDonations?: number;
    recentDonations?: any[];
    menuItems?: any[];
    userDonations?: any[];
    totalDonated?: number;
}

// GET API endpoint for dashboard data
export async function GET(request: NextRequest) {
    try {
        // Get the user session
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userRole = session.user.role || 'member';
        const userId = session.user.id;

        // Connect to MongoDB
        await connectMongoDB();

        const responseData: DashboardStats = {};

        // Get menu items based on role
        const menuItems = await MenuItemModel.find({
            roles: userRole,
            enabled: true
        }).sort({ order: 1 });

        responseData.menuItems = menuItems;

        // Get data based on user role
        if (userRole === 'member') {
            // Get member's donations
            const donations = await Donation.find({ userId })
                .sort({ date: -1 })
                .limit(5);

            const total = donations.reduce((sum, donation) => sum + donation.amount, 0);

            responseData.userDonations = donations;
            responseData.totalDonated = total;
        } else {
            // Get admin/manager stats
            const userCount = await User.countDocuments();
            const donationCount = await Donation.countDocuments();

            const totalDonationsResult = await Donation.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const recentDonations = await Donation.find()
                .populate('userId', 'name email')
                .sort({ date: -1 })
                .limit(5);

            responseData.userCount = userCount;
            responseData.donationCount = donationCount;
            responseData.totalDonations = totalDonationsResult[0]?.total || 0;
            responseData.recentDonations = recentDonations;
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST API endpoint for updating dashboard preferences (optional)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { preferences } = body;

        // Here you would typically save user preferences to the database
        // For now, we'll just return a success message

        return NextResponse.json({
            message: 'Preferences updated successfully',
            preferences
        });
    } catch (error) {
        console.error('Dashboard Preferences Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}