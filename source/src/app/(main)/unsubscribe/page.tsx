'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, Loader2, Heart } from 'lucide-react'

interface SubscriptionDetails {
  id: string
  status: string
  amount: number
  currency: string
  frequency: string
  customer: {
    name: string
    email: string
  }
}

interface ApiResponse {
  subscription: SubscriptionDetails
  token: string
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const subParam = searchParams.get('sub')

    if (!tokenParam || !subParam) {
      setError('Invalid unsubscribe link. Missing required parameters.')
      setLoading(false)
      return
    }

    // Fetch subscription details
    fetch(`/api/cancel-subscription?token=${tokenParam}&sub=${subParam}`)
      .then(response => response.json())
      .then((data: ApiResponse) => {
        if (data.subscription) {
          setSubscription(data.subscription)
          setToken(data.token)
        } else {
          setError(data.error || 'Failed to load subscription details')
        }
      })
      .catch(err => {
        console.error('Failed to fetch subscription:', err)
        setError('Failed to load subscription details')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams])

  const handleUnsubscribe = async () => {
    if (!token) return

    setCancelling(true)
    setError(null)

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          confirmed: true
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCancelled(true)
        setShowConfirmation(false)
      } else {
        setError(result.error || 'Failed to cancel subscription')
      }
    } catch (err) {
      console.error('Cancellation failed:', err)
      setError('Failed to cancel subscription. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg">Loading subscription details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-800">Unsubscribe Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-800">Successfully Unsubscribed</CardTitle>
            <CardDescription className="text-green-600">
              Your recurring donation has been cancelled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Thank you for your past support. You will receive a confirmation email shortly.
              </p>
              
              <Alert>
                <Heart className="h-4 w-4" />
                <AlertTitle>Consider Supporting Us Again</AlertTitle>
                <AlertDescription>
                  If you'd like to make a one-time donation or set up a new recurring donation in the future, 
                  we'd be grateful for your continued support.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-3 pt-4">
                <Button onClick={() => window.location.href = '/donate'}>
                  Make a One-Time Donation
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Return to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <CardTitle className="text-xl font-bold text-gray-800">
            Unsubscribe from Recurring Donations
          </CardTitle>
          <CardDescription className="text-gray-600">
            You're about to cancel your recurring donation subscription
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 mb-3">Subscription Details</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Donor:</span>
                <p className="font-medium">{subscription.customer.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{subscription.customer.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <p className="font-medium">
                  {subscription.currency} {subscription.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Frequency:</span>
                <p className="font-medium capitalize">{subscription.frequency}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Subscription ID:</span>
                <p className="font-mono text-xs">{subscription.id}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Warning Message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              Once cancelled, your recurring donations will stop immediately. 
              You can always set up a new subscription or make one-time donations in the future.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          {!showConfirmation ? (
            <div className="flex flex-col space-y-3">
              <Button 
                variant="destructive" 
                onClick={() => setShowConfirmation(true)}
                className="w-full"
              >
                Cancel My Subscription
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Keep My Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Final Confirmation</AlertTitle>
                <AlertDescription>
                  Are you sure you want to cancel your recurring donation? This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-3">
                <Button 
                  variant="destructive" 
                  onClick={handleUnsubscribe}
                  disabled={cancelling}
                  className="w-full"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel My Subscription'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)}
                  disabled={cancelling}
                  className="w-full"
                >
                  No, Keep My Subscription
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}