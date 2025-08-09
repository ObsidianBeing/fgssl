/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import AppleProvider, { type AppleProfile } from "next-auth/providers/apple";
import { xata } from "@/lib/xata";
import type { NextAuthConfig } from "next-auth";
import { randomUUID } from 'crypto';

// Type declarations are in src/types/next-auth.d.ts

const authConfig: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: process.env.APPLE_CLIENT_SECRET as string,
        }),
    ],
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl + "/dashboard"
        },
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback:", { user, account, profile });
            try {
                if (!user.email) {
                    throw new Error("No email provided");
                }
                console.log("User Email:", user.email);
                console.log("Checking for existing user in database");

                // Check if user exists in database
                let existingUser = await xata.db.users
                    .filter({ email: user.email })
                    .getFirst();

                if (!existingUser) {
                    // Create new user if doesn't exist
                    console.log("Creating new user in database");
                    const userId = randomUUID();
                    existingUser = await xata.db.users.create({
                        id: userId,
                        email: user.email,
                        name: user.name || profile?.name || "New User",
                        image: user.image || (profile as GoogleProfile)?.picture || null,
                        role: "member",
                        phone: null,
                        emailVerified: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    
                    if (!existingUser) {
                        throw new Error("Failed to create user");
                    }
                    console.log("New user created with ID:", existingUser.id);
                } else {
                    // Update existing user's last login and other info if needed
                    await xata.db.users.update(existingUser.xata_id, {
                        name: user.name || existingUser.name,
                        image: user.image || existingUser.image,
                        updatedAt: new Date(),
                    });
                    console.log("Existing user updated:", existingUser.id);
                }

                // Link account if it doesn't exist
                if (account) {
                    console.log("Linking account:", account.provider, account.providerAccountId);
                    const existingAccount = await xata.db.accounts
                        .filter({
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        })
                        .getFirst();

                    if (!existingAccount) {
                        console.log("Creating new account in database");
                        
                        await xata.db.accounts.create({
                            userId: existingUser.xata_id,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            type: account.type,
                            access_token: account.access_token || null,
                            expires_at: account.expires_at || null,
                            expires_at_timestamp: account.expires_at || null,
                            token_type: account.token_type || null,
                            scope: account.scope || null,
                            id_token: account.id_token || null,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                        
                        console.log("Account linked successfully");
                    } else {
                        console.log("Account already exists");
                    }
                }
                
                console.log("User signed in successfully");
                return true;
            } catch (error) {
                console.error("SignIn Error:", error);
                return false;
            }
        },
        async jwt({ token, user }) {
            console.log("JWT Callback:", { token, user });
            try {
                if (user?.email) {
                    console.log("Fetching user from database for JWT:", user.email);
                    const dbUser = await xata.db.users
                        .filter({ email: user.email })
                        .getFirst();

                    if (dbUser) {
                        console.log("User found in database:", dbUser.xata_id);
                        token.id = dbUser.xata_id;
                        token.role = dbUser.role;
                        token.email = dbUser.email;
                        token.name = dbUser.name;
                        token.picture = dbUser.image;
                    } else {
                        console.log("User not found in database");
                    }
                }
                return token;
            } catch (error) {
                console.error("JWT Callback Error:", error);
                return token;
            }
        },
        async session({ session, token }) {
            console.log("Session Callback:", { session, token });
            try {
                if (session.user && token.id && token.role) {
                    session.user.id = token.id;
                    session.user.role = token.role;
                    console.log("Session updated with user data:", session.user);
                } else {
                    console.log("Missing token data for session:", { tokenId: token.id, tokenRole: token.role });
                }
                return session;
            } catch (error) {
                console.error("Session Callback Error:", error);
                return session;
            }
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export const { GET, POST } = handlers;