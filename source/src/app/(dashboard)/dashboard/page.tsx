/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User as UserReact, Users, DollarSign, BarChart3, Settings, Shield, Activity, LogOut, Calendar, Bell, Search, Menu } from 'lucide-react';
import { connectMongoDB } from '@/lib/mongodb';
import Donation from '@/models/Donation';
import User from '@/models/User';
import  { MenuItemModel } from '@/models/MenuItem';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  count?: number;
}

// Function to get menu items based on role
async function getMenuItems(role: string) {
  await connectMongoDB();
  return await MenuItemModel.find({ roles: role, enabled: true }).sort({ order: 1 });
}

// Function to get user donations
async function getUserDonations(userId: string) {
  await connectMongoDB();
  const donations = await Donation.find({ userId }).sort({ date: -1 });
  const total = donations.reduce((sum, donation) => sum + donation.amount, 0);
  return { donations, total };
}

// Function to get dashboard stats for admin/manager
async function getDashboardStats() {
  await connectMongoDB();
  const userCount = await User.countDocuments();
  const donationCount = await Donation.countDocuments();
  const totalDonations = await Donation.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return {
    userCount,
    donationCount,
    totalDonations: totalDonations[0]?.total || 0
  };
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'member': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userRole = session.user?.role || 'member';
  const userId = session.user?.id;

  // Fetch data based on role
  let menuItems: any[] = [];
  let totalDonated = 0;
  let dashboardStats = null;
  let adminCards: any[] = [];

  try {
    // Get menu items for this role
    menuItems = await getMenuItems(userRole);

    if (userRole === 'member' && userId) {
      const donationData = await getUserDonations(userId);
      totalDonated = donationData.total;
    } else if (userRole === 'admin' || userRole === 'manager') {
      dashboardStats = await getDashboardStats();

      // Admin/Manager cards with real counts
      adminCards = [
        {
          title: 'Users Management',
          description: 'Manage user accounts and permissions',
          href: '/dashboard/users',
          icon: Users,
          roles: ['admin'],
          count: dashboardStats.userCount,
        },
        {
          title: 'Donations Overview',
          description: 'View and manage donations',
          href: '/dashboard/donations',
          icon: DollarSign,
          roles: ['admin', 'manager'],
          count: dashboardStats.donationCount,
        },
        {
          title: 'Analytics & Reports',
          description: 'View detailed analytics and generate reports',
          href: '/dashboard/analytics',
          icon: BarChart3,
          roles: ['admin', 'manager'],
        },
        {
          title: 'Settings',
          description: 'Configure application settings',
          href: '/dashboard/settings',
          icon: Settings,
          roles: ['admin', 'manager'],
        },
      ].filter(card => card.roles.includes(userRole));
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Handle error (e.g., show error message to user)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge className={getRoleColor(userRole)}>
                {userRole.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span>Welcome, {session.user?.name}</span>
              </div>
              <Button variant="outline" size="sm" asChild className="text-red-600 hover:text-red-700">
                <Link href="/api/auth/signout?callbackUrl=/login">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Role-specific content */}
        {userRole === 'member' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Your Member Dashboard</span>
              </CardTitle>
              <CardDescription>
                You have donated a total of <strong>${totalDonated.toFixed(2)}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-1 text-gray-700">
                <p><strong>User ID:</strong> {session.user?.id}</p>
                <p><strong>Role:</strong> {userRole}</p>
                <p><strong>Email:</strong> {session.user?.email}</p>
              </div>
              {session.user?.image && (
                <div>
                  <Image
                    src={session.user.image}
                    alt="avatar"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full border border-gray-300"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>{userRole === 'admin' ? 'Admin' : 'Manager'} Dashboard</span>
              </CardTitle>
              <CardDescription>
                You have <strong>{userRole}</strong> privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {adminCards.map(card => (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <card.icon className="h-5 w-5 text-blue-600" />
                        {card.title}
                        {card.count !== undefined && (
                          <Badge variant="secondary" className="ml-auto">
                            {card.count}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Navigation Menu based on role */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Menu className="h-5 w-5" /> Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Button key={item._id} variant="outline" className="h-16 justify-start" asChild>
                <Link href={item.path}>
                  {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16" asChild>
              <Link href="/dashboard/profile">
                <UserReact className="h-5 w-5 mr-2" /> Edit Profile
              </Link>
            </Button>
            {(userRole === 'admin' || userRole === 'manager') && (
              <Button variant="outline" className="h-16" asChild>
                <Link href="/dashboard/donations">
                  <DollarSign className="h-5 w-5 mr-2" /> View Donations
                </Link>
              </Button>
            )}
            <Button variant="outline" className="h-16" asChild>
              <Link href="/">
                <Calendar className="h-5 w-5 mr-2" /> Back to Site
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}