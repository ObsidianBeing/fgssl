// src/scripts/seedMenuItems.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // <-- load environment variables

import { connectMongoDB } from '@/lib/mongodb';
import MenuItemModel from '@/models/MenuItem';

console.log('MONGODB_URI at runtime:', process.env.MONGODB_URI);

const menuItems = [
    // Member menu items
    {
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        roles: ['member', 'manager', 'admin'],
        order: 1,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Appointments',
        path: '/dashboard/appointments',
        icon: 'calendar',
        roles: ['member', 'admin'], // admin gets access automatically
        order: 2,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Donations',
        path: '/dashboard/donations',
        icon: 'donate',
        roles: ['member', 'admin'],
        order: 3,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Profile',
        path: '/dashboard/profile',
        icon: 'users',
        roles: ['member', 'manager', 'admin'],
        order: 10,
        enabled: true,
        category: 'settings'
    },

    // Manager menu items
    {
        title: 'Events',
        path: '/dashboard/events',
        icon: 'calendar',
        roles: ['manager', 'admin'],
        order: 2,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Resources',
        path: '/dashboard/resources',
        icon: 'fileText',
        roles: ['manager', 'admin'],
        order: 3,
        enabled: true,
        category: 'main'
    },

    // Admin menu items
    {
        title: 'Users Management',
        path: '/dashboard/users',
        icon: 'users',
        roles: ['admin'], // admin only
        order: 4,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Analytics & Reports',
        path: '/dashboard/analytics',
        icon: 'barChart',
        roles: ['admin', 'manager'],
        order: 5,
        enabled: true,
        category: 'main'
    },
    {
        title: 'Settings',
        path: '/dashboard/settings',
        icon: 'settings',
        roles: ['admin', 'manager'],
        order: 6,
        enabled: true,
        category: 'settings'
    }
];

async function seedMenuItems() {
    try {
        console.log(`first ${process.env.MONGODB_URI}`)
        await connectMongoDB();
        console.log(`second ${process.env.MONGODB_URI}`)

        // Clear existing menu items
        await MenuItemModel.deleteMany({});
        console.log(`third ${process.env.MONGODB_URI}`)

        // Insert new menu items
        await MenuItemModel.insertMany(menuItems);
        console.log(`fourth ${process.env.MONGODB_URI}`)

        console.log('✅ Menu items seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding menu items:', error);
        process.exit(1);
    }
}

seedMenuItems();
