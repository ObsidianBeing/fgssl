'use client'

import { signIn, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (errorParam) {
      setError('Authentication failed. Please try again.')
    }
  }, [errorParam])

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [callbackUrl, router])

  const handleSignIn = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true)
      setError(null)
      setProvider(provider)

      console.log('Starting sign in with provider:', provider, 'callbackUrl:', callbackUrl)

      const result = await signIn(provider, {
        callbackUrl,
        redirect: true, // Changed to true to let NextAuth handle the redirect
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('Sign in failed with error:', result.error)
        setError(`Authentication failed: ${result.error}`)
      }
      // If redirect is true, this code won't be reached for successful sign-ins
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 relative"
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
            >
              {isLoading && provider === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <div className="mr-2 w-5 h-5 relative">
                  <Image
                    src="/google-icon.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
              )}
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 relative"
              onClick={() => handleSignIn('apple')}
              disabled={isLoading}
            >
              {isLoading && provider === 'apple' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <div className="mr-2 w-5 h-5 relative">
                  <Image
                    src="/apple-icon.svg"
                    alt="Apple"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
              )}
              Continue with Apple
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}