// app/dashboard/layout.tsx
import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
    title: 'Church Dashboard',
    description: 'Administrative dashboard for church management',
};

export default function DashboardRootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={cn(
                    'min-h-screen bg-background font-sans antialiased',
                    inter.variable,
                    montserrat.variable
                )}
            >
                <SessionProvider>
                    <DashboardLayout>{children}</DashboardLayout>
                </SessionProvider>
            </body>
        </html>
    );
}