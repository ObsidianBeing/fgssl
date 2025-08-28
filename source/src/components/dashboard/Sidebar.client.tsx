// components/dashboard/Sidebar.client.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/getCurrentUser';

interface NavItem {
    _id: string;
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface SidebarClientProps {
    navItems: NavItem[];
    user: {
        name: string;
        email: string;
        role: string;
        image: string | null;
    };
    className?: string;
}

export function SidebarClient({ navItems, user: initialUser, className }: SidebarClientProps) {
    const pathname = usePathname();

    const [user, setUser] = useState({ name: initialUser.name, email: initialUser.email, role: initialUser.role, image: initialUser.image });

    useEffect(() => {
        async function fetchUser() {
            try {
                const data = await getCurrentUser();
                if (data) setUser({
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    image: data.image ?? null
                });
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        }
        fetchUser();
    }, []);

    return (
        <div className={cn('flex flex-col h-full bg-card border-r border-border', className)}>
            {/* Logo/Header */}
            <div className="p-4 border-b border-border">
                <h1 className="text-lg font-heading font-semibold">Church Dashboard</h1>
                <p className="text-xs text-muted-foreground capitalize">{user.role} Portal</p>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-2 space-y-1">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link
                                key={item._id}
                                href={item.href}
                                className={cn(
                                    'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors',
                                    pathname === item.href
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <IconComponent className="flex-shrink-0 h-5 w-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User info */}
            <div className="p-4 border-t border-border flex items-center">
                <Avatar>
                    {user.image ? (
                        <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-sm font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                    <p className="text-sm font-medium truncate max-w-[120px]">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
            </div>

            {/* Sign out */}
            <div className="p-4 border-t border-border">
                <Link
                    href="/api/auth/signout?callbackUrl=/login"
                    className="flex items-center text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Link>
            </div>
        </div>
    );
}