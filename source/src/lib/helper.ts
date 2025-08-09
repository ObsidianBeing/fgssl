import { createExpiringToken } from '@/lib/utils';

export async function generateUnsubscribeLink(subscriptionId: string, email: string): Promise<string> {
    // Create a secure token that expires in 7 days
    const token = await createExpiringToken(subscriptionId, email);

    return `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?token=${token}&sub=${encodeURIComponent(subscriptionId)}`;
}