// src/lib/getCurrentUser.ts
import { auth } from '@/auth';

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user) return null;
    return {
        name: session.user.name ?? 'Unknown',
        email: session.user.email ?? 'No email',
        role: session.user.role ?? 'member',
        image: session.user.image,
        id: session.user.id
    };
}
