// components/dashboard/NavBar.tsx
'use client';

import { Icons } from '@/components/dashboard/Icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavbarProps {
    className?: string;
    onMenuToggle?: () => void;
}

export function Navbar({ className, onMenuToggle }: NavbarProps) {
    return (
        <header
            className={cn(
                'sticky top-0 z-40 flex items-center h-16 px-4 sm:px-6 border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/80',
                className
            )}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    {/* Hamburger button - mobile only */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={onMenuToggle}
                    >
                        <Icons.menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>

                    {/* Logo / Title for mobile */}
                    <div className="md:hidden">
                        <h1 className="text-lg font-heading font-semibold">Dashboard</h1>
                    </div>
                </div>

                {/* User greeting for desktop */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    Welcome back!
                </div>
            </div>
        </header>
    );
}