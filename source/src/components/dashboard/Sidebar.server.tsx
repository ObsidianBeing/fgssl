/* eslint-disable @typescript-eslint/no-unused-vars */
// components/dashboard/Sidebar.server.tsx
import { auth } from '@/auth';
import { MenuItemModel } from '@/models/MenuItem';
import { connectMongoDB } from '@/lib/mongodb';
import { SidebarClient } from './Sidebar.client';
import { Icons } from './Icons';

// Map icon names to actual icon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: Icons.dashboard,
    calendar: Icons.calendar,
    message: Icons.message,
    bell: Icons.bell,
    donate: Icons.donate,
    users: Icons.users,
    settings: Icons.settings,
    fileText: Icons.fileText,
    barChart: Icons.barChart,
    // Add more icons as needed
};

// Helper for initials
function getInitials(name?: string | null) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function SidebarServer() {
    const session = await auth();

    if (!session || !session.user) {
        return null;
    }

    const userRole = session.user.role || 'member';

    try {
        await connectMongoDB();

        // Get menu items based on user role
        const menuItems = await MenuItemModel.find({
            roles: userRole,
            enabled: true
        }).sort({ order: 1 }).lean();

        // Map menu items to include icon components
        const navItems = menuItems.map(item => {
            const IconComponent = item.icon && iconMap[item.icon] ? iconMap[item.icon] : Icons.dashboard;
            return {
                _id: item._id.toString(),
                name: item.title,
                href: item.path,
                icon: IconComponent
            };
        });

        return (
            <SidebarClient
                navItems={navItems}
                user={{
                    name: session.user.name || '',
                    email: session.user.email || '',
                    role: userRole,
                    image: session.user.image || null
                }}
            />
        );
    } catch (error) {
        console.error('Error fetching menu items:', error);

        // Fallback to basic menu items if database fetch fails
        const fallbackItems = [
            { _id: '1', name: 'Dashboard', href: '/dashboard', icon: Icons.dashboard },
        ];

        if (userRole === 'member') {
            fallbackItems.push(
                { _id: '2', name: 'Appointments', href: '/dashboard/appointments', icon: Icons.calendar },
                { _id: '3', name: 'Donations', href: '/dashboard/donations', icon: Icons.donate }
            );
        } else if (userRole === 'manager') {
            fallbackItems.push(
                { _id: '4', name: 'Events', href: '/dashboard/events', icon: Icons.calendar },
                { _id: '5', name: 'Resources', href: '/dashboard/resources', icon: (props: { className?: string }) => <Icons.fileText {...props} /> }
            );
        } else if (userRole === 'admin') {
            fallbackItems.push(
                { _id: '6', name: 'Users', href: '/dashboard/users', icon: Icons.users },
                { _id: '7', name: 'Analytics', href: '/dashboard/analytics', icon: (props: { className?: string }) => <Icons.barChart {...props} /> },
                { _id: '8', name: 'Settings', href: '/dashboard/settings', icon: (props: { className?: string }) => <Icons.settings {...props} /> }
            );
        }

        return (
            <SidebarClient
                navItems={fallbackItems}
                user={{
                    name: session.user.name || '',
                    email: session.user.email || '',
                    role: userRole,
                    image: session.user.image || null
                }}
            />
        );
    }
}