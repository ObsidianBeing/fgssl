import jwt from 'jsonwebtoken';


export async function generateUnsubscribeLink(subscriptionId: string, email: string): Promise<string> {
    // Create a secure token that expires in 7 days
    const token = await createExpiringToken(subscriptionId, email);

    return `${process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/cancel-subscription?token=${token}&sub=${encodeURIComponent(subscriptionId)}`;
}

export async function createExpiringToken(subscriptionId: string, email: string): Promise<string> {
    // Use JWT or similar to create a signed token
    const payload = {
        sub: subscriptionId,
        email: email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days expiry
    };

    return jwt.sign(payload, process.env.SECRET_KEY_FOR_TOKENS!);
}