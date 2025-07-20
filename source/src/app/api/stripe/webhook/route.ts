/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail, sendPaymentFailedEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface DonorRecord {
  name?: string
  email: string
  phone?: string
  totalDonations?: number
  lastDonationDate?: string
  donationFrequency?: string
}

interface DonationRecord {
  amount: number
  currency: string
  donationType: string
  frequency?: string
  donorName: string
  donorEmail: string
  donorPhone?: string
  paymentMethod: string
  paymentStatus: string
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeSubscriptionId?: string
  receiptUrl?: string
  date: string
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`🔔 Received event type: ${event.type}`)

  try {
    switch (event.type as string) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event)
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event)
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event)
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event)
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event)
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event)
      case 'invoice.payment_action_required':
        return await handlePaymentActionRequired(event)
      // Additional events for better subscription management
      case 'customer.subscription.past_due':
        return await handleSubscriptionPastDue(event)
      case 'customer.subscription.unpaid':
        return await handleSubscriptionUnpaid(event)
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('🔥 Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Helper functions for each event type
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const metadata = paymentIntent.metadata || {}

  console.log(`💳 PaymentIntent succeeded: ${paymentIntent.id}`)

  // Skip if this is a subscription payment (handled by invoice.payment_succeeded)
  if (metadata.subscriptionId || paymentIntent.invoice) {
    console.log('⏭️ Skipping subscription payment (handled by invoice webhook)')
    return NextResponse.json({ received: true })
  }

  // Get charge details for receipt
  const charge = paymentIntent.latest_charge
    ? await stripe.charges.retrieve(paymentIntent.latest_charge as string)
    : null

  // Prepare donor data
  const donorData = {
    name: metadata.donorName || 'Anonymous',
    email: metadata.donorEmail || (charge?.billing_details?.email || ''),
    phone: metadata.donorPhone || (charge?.billing_details?.phone || ''),
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    donationType: metadata.donationType || 'General Donation',
    frequency: metadata.frequency || 'one-time',
    paymentMethod: getPaymentMethodType(charge),
    receiptUrl: charge?.receipt_url || '',
    created: new Date(paymentIntent.created * 1000)
  }

  if (!donorData.email) {
    console.error('❌ Missing donor email in payment intent:', paymentIntent.id)
    return NextResponse.json({ received: true, error: 'Missing email' })
  }

  // Save donor and donation records
  try {
    const { donor, donation } = await saveDonationRecord({
      ...donorData,
      isRecurring: false,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: charge?.id
    })

    // Send confirmation email
    await sendDonationEmail({
      to: donorData.email,
      donorName: donorData.name,
      amount: donorData.amount,
      donationType: donorData.donationType,
      receiptUrl: donorData.receiptUrl,
      createdDate: donorData.created,
      paymentMethod: donorData.paymentMethod,
      currency: donorData.currency,
      frequency: donorData.frequency,
      isRecurring: false
    })

    console.log(`✅ Processed one-time payment ${paymentIntent.id}`)
  } catch (error) {
    console.error(`❌ Failed to process payment ${paymentIntent.id}:`, error)
  }

  return NextResponse.json({ received: true })
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = (invoice as any).subscription as string | null

  console.log(`💰 Invoice payment succeeded: ${invoice.id}`)

  if (!subscriptionId) {
    console.log('⏭️ Skipping non-subscription invoice')
    return NextResponse.json({ received: true })
  }

  // Get subscription and customer details
  const [subscription, customer] = await Promise.all([
    stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price.product'] }),
    stripe.customers.retrieve(invoice.customer as string)
  ])

  // Get customer details
  let customerEmail: string
  let customerName: string = 'Recurring Donor'
  let customerPhone: string | undefined

  if (customer && typeof customer === 'object' && !('deleted' in customer)) {
    customerEmail = invoice.customer_email || customer.email || ''
    customerName = customer.name || subscription.metadata?.donorName || 'Recurring Donor'
    customerPhone = customer.phone || subscription.metadata?.donorPhone
  } else if (invoice.customer_email) {
    customerEmail = invoice.customer_email
  } else {
    console.error('❌ Missing customer email on invoice:', invoice.id)
    return NextResponse.json({ received: true, error: 'Missing email' })
  }

  // Get payment method info
  let paymentMethod = 'card'
  const paymentIntentId = (invoice as any).payment_intent as string | undefined
  if (paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge']
      })
      const charge = paymentIntent.latest_charge as Stripe.Charge | null
      paymentMethod = getPaymentMethodType(charge)
    } catch (err) {
      console.error('Failed to retrieve payment method info:', err)
    }
  }

  // Prepare donation data
  const donationData = {
    email: customerEmail,
    name: customerName,
    phone: customerPhone,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    donationType: subscription.metadata?.donationType || 'Recurring Donation',
    frequency: subscription.metadata?.frequency || 'monthly',
    receiptUrl: invoice.hosted_invoice_url || '',
    created: new Date(invoice.created * 1000),
    subscriptionId: subscription.id,
    paymentMethod
  }

  try {
    // Save donor and donation records
    const { donor, donation } = await saveDonationRecord({
      ...donationData,
      isRecurring: true,
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscription.id
    })

    // Send confirmation email
    await sendDonationEmail({
      to: donationData.email,
      donorName: donationData.name,
      amount: donationData.amount,
      donationType: donationData.donationType,
      receiptUrl: donationData.receiptUrl,
      createdDate: donationData.created,
      paymentMethod: donationData.paymentMethod,
      currency: donationData.currency,
      frequency: donationData.frequency,
      isRecurring: true,
      unsubscribeLink: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage?customer_id=${invoice.customer}`
    })

    console.log(`✅ Processed recurring payment from invoice ${invoice.id}`)
  } catch (error) {
    console.error(`❌ Failed to process recurring payment ${invoice.id}:`, error)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🆕 Subscription created: ${subscription.id}, status: ${subscription.status}`)

  // Log subscription creation for analytics/tracking
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : 'unknown'

    console.log(`📊 New subscription: ${subscription.id} for ${customerEmail}`)

    // You could add analytics tracking here
    // await analytics.track('Subscription Created', { ... })
  } catch (error) {
    console.error('Failed to log subscription creation:', error)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🔄 Subscription updated: ${subscription.id}, status: ${subscription.status}`)

  // Handle status changes
  if (subscription.status === 'active') {
    console.log(`✅ Subscription ${subscription.id} is now active`)
  } else if (subscription.status === 'canceled') {
    console.log(`❌ Subscription ${subscription.id} was canceled`)
    // Could send cancellation email here
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🗑️ Subscription deleted: ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Could send cancellation confirmation email
      console.log(`📧 Subscription canceled for ${customerEmail}`)
    }
  } catch (error) {
    console.error('Failed to process subscription deletion:', error)
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log(`⚠️ Invoice payment failed: ${invoice.id}`)

  const subscriptionId = (invoice as any).subscription as string | null

  // Get customer email and details
  let customerEmail: string | null = null
  let customerName = 'Donor'

  try {
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if (customer && typeof customer === 'object' && !('deleted' in customer)) {
      customerEmail = customer.email
      customerName = customer.name || 'Donor'
    }
  } catch (error) {
    console.error('Failed to retrieve customer for failed payment:', error)
  }

  if (customerEmail && subscriptionId) {
    try {
      // Get retry information
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const nextRetryDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : null

      await sendPaymentFailedEmail({
        to: customerEmail,
        donorName: customerName,
        invoiceId: invoice.id ?? '',
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        hostedInvoiceUrl: invoice.hosted_invoice_url || '',
        billingReason: invoice.billing_reason || 'subscription_cycle',
        nextRetryDate: nextRetryDate ?? new Date(0),
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/update-payment?customer_id=${invoice.customer}`
      })

      console.log(`📧 Payment failure notification sent to ${customerEmail}`)
    } catch (err) {
      console.error('Failed to send payment failure email:', err)
    }
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentActionRequired(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log(`🔐 Payment action required for invoice: ${invoice.id}`)

  // This could be used to notify users about 3D Secure or other authentication requirements
  // For now, just log it
  return NextResponse.json({ received: true })
}

async function handleSubscriptionPastDue(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`📅 Subscription past due: ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Send past due notification
      console.log(`⚠️ Subscription ${subscription.id} is past due for ${customerEmail}`)
      // Could send specific past due email here
    }
  } catch (error) {
    console.error('Failed to handle past due subscription:', error)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUnpaid(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`💸 Subscription unpaid (final failure): ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Send final failure notification
      console.log(`❌ Subscription ${subscription.id} failed permanently for ${customerEmail}`)
      // Could send subscription canceled due to payment failure email
    }
  } catch (error) {
    console.error('Failed to handle unpaid subscription:', error)
  }

  return NextResponse.json({ received: true })
}

// Helper function to extract payment method type from charge
function getPaymentMethodType(charge: Stripe.Charge | null): string {
  if (!charge) return 'card'

  if (charge.payment_method_details?.card) {
    const brand = charge.payment_method_details.card.brand
    const last4 = charge.payment_method_details.card.last4
    return `${brand} •••• ${last4}`
  }

  return charge.payment_method_details?.type || 'card'
}

// Enhanced function to save donor and donation records
async function saveDonationRecord(data: {
  email: string
  name: string
  phone?: string
  amount: number
  currency: string
  donationType: string
  frequency?: string
  paymentMethod: string
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeSubscriptionId?: string
  receiptUrl?: string
  created: Date
}): Promise<{ donor: DonorRecord, donation: DonationRecord }> {

  // Validate required data
  if (!data.email || !data.amount) {
    throw new Error('Missing required donation data: email or amount')
  }

  try {
    // Save/update donor with proper error handling
    let donor = await xata.db.donors
      .filter({ email: data.email })
      .getFirst()

    const donorUpdate: Partial<DonorRecord> = {
      name: data.name,
      phone: data.phone,
      totalDonations: (donor?.totalDonations || 0) + data.amount,
      lastDonationDate: data.created.toISOString(),
      donationFrequency: data.frequency
    }

    if (donor) {
      donor = await xata.db.donors.update(donor.email, donorUpdate)
    } else {
      donor = await xata.db.donors.create({
        ...donorUpdate,
        email: data.email
      } as DonorRecord)
    }

    if (!donor) {
      throw new Error('Failed to create or update donor record')
    }

    // Save donation record with better error handling
    const donationRecord: DonationRecord = {
      amount: data.amount,
      currency: data.currency,
      donationType: data.donationType,
      frequency: data.frequency,
      donorName: data.name,
      donorEmail: data.email,
      donorPhone: data.phone,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'succeeded',
      isRecurring: data.isRecurring,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeChargeId: data.stripeChargeId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      receiptUrl: data.receiptUrl,
      date: data.created.toISOString()
    }

    const donation = await xata.db.donations.create(donationRecord)

    if (!donation) {
      throw new Error('Failed to create donation record')
    }

    return { donor: donor as DonorRecord, donation }
  } catch (error) {
    console.error('Database error saving donation:', error)
    throw new Error(`Failed to save donation record: ${error}`)
  }
}