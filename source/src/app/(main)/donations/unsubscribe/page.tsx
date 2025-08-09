"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export default function UnsubscribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token') || ''
  const subscriptionId = searchParams.get('sub') || ''

  const isInvalid = useMemo(() => !token || !subscriptionId, [token, subscriptionId])

  const onConfirm = () => {
    if (isInvalid) {
      router.replace('/donations/manage?error=invalid_link')
      return
    }
    // Navigate to the API route which verifies the token, cancels the subscription,
    // and then redirects to the manage page with a status query.
    window.location.href = `/api/stripe/cancel-subscription?token=${encodeURIComponent(token)}&sub=${encodeURIComponent(subscriptionId)}`
  }

  const onCancel = () => {
    router.replace('/donations/manage')
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-4">Cancel recurring donation</h1>
      {isInvalid ? (
        <p className="text-red-600">This link is invalid or incomplete. Please request a new unsubscribe link.</p>
      ) : (
        <>
          <p className="mb-6">Are you sure you want to cancel your recurring donation (Subscription ID: <span className="font-mono">{subscriptionId}</span>)? This will stop future scheduled charges.</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Yes, cancel</button>
            <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">No, keep it</button>
          </div>
        </>
      )}
    </div>
  )
}