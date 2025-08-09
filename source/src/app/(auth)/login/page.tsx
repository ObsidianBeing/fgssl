'use client'

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SignInPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const bibleVerse = {
        text: "For where two or three gather in my name, there am I with them.",
        reference: "Matthew 18:20"
    };

    const handleSignIn = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        
        try {
            await signIn(provider, { 
                callbackUrl: '/dashboard' 
            });
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-church-light flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
                {/* Church Logo and Name */}
                <div className="mb-6 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-church-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="EFGBC Logo"
                            width={96}
                            height={96}
                            className="object-cover"
                        />
                    </div>
                    <div className="text-church-dark font-medium">
                        Ethiopian Full Gospel Believers Church <br />(Silver Spring Local)
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-church-dark mb-2">Welcome</h1>
                <p className="text-gray-600 mb-6">Sign in to access your church community</p>

                {/* Bible Verse */}
                <div className="bg-church-secondary/10 p-4 rounded-lg mb-8">
                    <p className="italic text-church-dark">&quot;{bibleVerse.text}&quot;</p>
                    <p className="text-church-secondary font-medium mt-2">{bibleVerse.reference}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={() => handleSignIn('google')}
                        disabled={loading}
                        className={`w-full btn btn-primary flex items-center justify-center gap-2 py-3 px-4 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <span className="loading loading-spinner"></span>
                        ) : (
                            <>
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    {/* Google SVG icon */}
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => handleSignIn('apple')}
                        disabled={loading}
                        className={`w-full btn btn-secondary flex items-center justify-center gap-2 py-3 px-4 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <span className="loading loading-spinner"></span>
                        ) : (
                            <>
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    {/* Apple SVG icon */}
                                </svg>
                                Continue with Apple
                            </>
                        )}
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                    By continuing, you agree to our <a href="#" className="text-church-primary hover:underline">Terms</a> and <a href="#" className="text-church-primary hover:underline">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
};

export default SignInPage;