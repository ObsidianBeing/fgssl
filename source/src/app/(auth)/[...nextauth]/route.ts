/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import AppleProvider, { type AppleProfile } from "next-auth/providers/apple";
import type { NextAuthConfig } from "next-auth";
import { randomUUID } from "crypto";
import { connectMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { AccountModel } from "@/models/Account";

const authConfig: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            profile(profile: GoogleProfile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
        AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID as string,
            clientSecret: process.env.APPLE_CLIENT_SECRET as string,
            profile(profile: AppleProfile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: null,
                };
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                await connectMongoDB();

                const userId = randomUUID();
                const userData = {
                    id: userId,
                    email: user.email,
                    name: user.name || profile?.name || "New User",
                    image: user.image || (profile as GoogleProfile)?.picture || null,
                    role: "member",
                    phone: null,
                    emailVerified: new Date(),
                };

                let dbUser = await UserModel.findOne({ email: user.email });

                if (dbUser) {
                    Object.assign(dbUser, userData);
                    await dbUser.save();
                } else {
                    dbUser = await UserModel.create(userData);
                }

                if (account) {
                    const accountData = {
                        userId: dbUser._id,
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                        type: account.type,
                        access_token: account.access_token || null,
                        expires_at: account.expires_at || null,
                        token_type: account.token_type || null,
                        scope: account.scope || null,
                        id_token: account.id_token || null,
                    };

                    const existingAccount = await AccountModel.findOne({
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    });

                    if (!existingAccount) {
                        await AccountModel.create(accountData);
                    } else {
                        Object.assign(existingAccount, accountData);
                        await existingAccount.save();
                    }
                }

                return true;
            } catch (error) {
                console.error("SignIn Error:", error);
                return false;
            }
        },

        async jwt({ token, user }) {
            if (user?.email) {
                await connectMongoDB();
                const dbUser = await UserModel.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.email = dbUser.email;
                    token.name = dbUser.name;
                    token.picture = dbUser.image;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.image = token.picture as string | null;
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
    cookies: {
        sessionToken: {
            name:
                process.env.NODE_ENV === "production"
                    ? "__Secure-next-auth.session-token"
                    : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "none",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                domain:
                    process.env.NODE_ENV === "production" ? `fgssl.vercel.app` : undefined,
            },
        },
        callbackUrl: {
            name:
                process.env.NODE_ENV === "production"
                    ? "__Secure-next-auth.callback-url"
                    : "next-auth.callback-url",
            options: {
                sameSite: "none",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                domain:
                    process.env.NODE_ENV === "production" ? `fgssl.vercel.app` : undefined,
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
    trustHost: true,
};

export const { GET, POST } = NextAuth(authConfig).handlers;
