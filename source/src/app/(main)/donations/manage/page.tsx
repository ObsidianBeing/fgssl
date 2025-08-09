"use client"

import { useSearchParams } from 'next/navigation'

export default function ManageDonationsPage() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled') === 'true'
  const error = searchParams.get('error')

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Manage your donations</h1>

      {cancelled && (
        <div className="mb-6 rounded border border-green-300 bg-green-50 p-4 text-green-800">
          Your recurring donation has been cancelled. A confirmation email has been sent.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
          {error === 'invalid_link' && 'The unsubscribe link is invalid.'}
          {error === 'expired_link' && 'The unsubscribe link has expired. Please request a new one.'}
          {error === 'cancellation_failed' && 'We could not cancel the subscription. Please try again or contact support.'}
        </div>
      )}

      <p>Here you can manage your donation settings. (Coming soon)</p>
    </div>
  )
}