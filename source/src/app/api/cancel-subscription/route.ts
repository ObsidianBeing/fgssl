import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendSubscriptionCancellationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

interface TokenPayload {
  sub: string // subscription ID
  email: string
  exp: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const subscriptionId = searchParams.get('sub')

  if (!token || !subscriptionId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY_FOR_TOKENS!) as TokenPayload
    
    // Verify the subscription ID matches
    if (decoded.sub !== subscriptionId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Prepare subscription details for the confirmation page
    const priceItem = subscription.items.data[0]
    const amount = (priceItem?.price?.unit_amount || 0) / 100
    const currency = priceItem?.price?.currency?.toUpperCase() || 'USD'
    const frequency = `${priceItem?.price?.recurring?.interval || 'month'}ly`

    // Return subscription details for confirmation
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        amount,
        currency,
        frequency,
        customer: {
          name: customer.name || 'Donor',
          email: customer.email || decoded.email
        }
      },
      token
    })

  } catch (error) {
    console.error('❌ Token verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, confirmed } = await request.json()

    if (!token || !confirmed) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY_FOR_TOKENS!) as TokenPayload
    const subscriptionId = decoded.sub
    const customerEmail = decoded.email

    console.log(`🗑️ Processing cancellation request for subscription: ${subscriptionId}`)

    // Get subscription details before cancellation
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Cancel the subscription
    const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId)
    
    // Extract subscription details
    const priceItem = subscription.items.data[0]
    const amount = (priceItem?.price?.unit_amount || 0) / 100
    const currency = priceItem?.price?.currency?.toUpperCase() || 'USD'
    const frequency = `${priceItem?.price?.recurring?.interval || 'month'}ly`
    const cancelledAt = new Date()

    const customerName = customer.name || 'Donor'

    console.log(`✅ Successfully cancelled subscription: ${subscriptionId}`)

    // Update donor record in database
    try {
      const donor = await xata.db.donors.filter({ email: customerEmail }).getFirst()
      if (donor) {
        await xata.db.donors.update(donor.xata_id, {
          hasActiveSubscription: false,
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: cancelledAt,
          activeSubscriptionId: null,
          donationFrequency: 'one-time',
          lastUpdated: new Date()
        })
        console.log('✅ Updated donor record for cancellation')
      }
    } catch (error) {
      console.error('❌ Failed to update donor record:', error)
    }

    // Log cancellation in database
    try {
      await xata.db.subscriptionCancellation.create({
        subscriptionId,
        customerEmail,
        customerName,
        amount,
        currency,
        frequency,
        cancelledAt,
        cancellationReason: 'user_requested',
        totalDonationsBeforeCancellation: 0, // You might want to calculate this
        voluntaryCancellation: true
      })
      console.log('📝 Logged subscription cancellation')
    } catch (error) {
      console.warn('⚠️ Could not log cancellation to database:', error)
    }

    // Send cancellation confirmation email
    try {
      await sendSubscriptionCancellationEmail({
        to: customerEmail,
        donorName: customerName,
        subscriptionId,
        amount,
        currency,
        frequency,
        cancelledAt,
        totalContributed: amount, // You might want to get the actual total
        reactivateUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donate?reactivate=true&email=${encodeURIComponent(customerEmail)}`
      })
      console.log('✉️ Sent subscription cancellation email')
    } catch (error) {
      console.error('❌ Failed to send cancellation email:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscriptionId,
        status: 'cancelled',
        cancelledAt
      }
    })

  } catch (error) {
    console.error('❌ Cancellation processing error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}