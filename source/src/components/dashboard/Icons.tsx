import {
    Sun, Moon, Menu, Bell, User, Settings, LogOut,
    Heart, Repeat, CalendarCheck, Mail, TrendingUp,
    Plus, CalendarPlus, FileText, Monitor, BarChart3
} from 'lucide-react';


export const Icons = {
    // dashboard: LayoutDashboard, // Removed duplicate property
    //calendar: Calendar,
    //message: MessageSquare,
    bell: Bell,
    //donate: DollarSign,
    //users: Users,
    settings: Settings,
    fileText: FileText,
    barChart: BarChart3,
    menu: Menu,
    sun: Sun,
    moon: Moon,
    user: User,
    monitor: Monitor,
    logout: LogOut,
    heart: Heart,
    repeat: Repeat,
    calendarCheck: CalendarCheck,
    mail: Mail,
    trendingUp: TrendingUp,
    plus: Plus,
    calendarPlus: CalendarPlus,
    logo: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-6 w-6 ${className}`}>
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
        </svg>
    ),
    dashboard: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
    ),
    users: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    calendar: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 01-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    donate: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    report: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    message: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    ),
};