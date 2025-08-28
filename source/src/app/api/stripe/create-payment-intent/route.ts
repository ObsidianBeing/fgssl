// app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
    console.log('📩 Received POST request to /create-payment-intent');

    try {
        const body = await request.json();
        console.log('✅ Parsed request body (masked):', { ...body, email: body.email ? '[masked]' : undefined, phone: body.phone ? '[masked]' : undefined });

        const { name, amount: rawAmount, donationType, currency = 'usd', metadata = {}, email, phone } = body;

        // Validate required fields
        if (!name || !donationType || !email) {
            console.error('❌ Missing required fields');
            throw new Error('Missing required fields: name, donationType, and email are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('❌ Invalid email format:', email);
            throw new Error('Invalid email format');
        }

        // Validate and parse amount (assume input in dollars, convert to cents)
        const amountInDollars = parseFloat(rawAmount);
        if (isNaN(amountInDollars) || amountInDollars <= 0) {
            console.error('❌ Invalid amount:', rawAmount);
            throw new Error('Invalid amount provided: must be a positive number');
        }
        // Limit to 2 decimal places for precision
        const amountInCents = Math.round(amountInDollars * 100);
        if (amountInCents <= 0) {
            console.error('❌ Amount too small after conversion:', amountInCents);
            throw new Error('Amount must be at least $0.50');
        }

        console.log(`✅ Amount validated: ${amountInDollars} dollars → ${amountInCents} cents`);

        // Validate currency (lowercase for Stripe)
        const lowerCurrency = currency.toLowerCase();
        if (lowerCurrency === 'usd' && amountInCents < 50) {
            console.error('❌ Amount below Stripe minimum for USD:', amountInCents);
            throw new Error('Amount must be at least $0.50');
        }

        console.log(`✅ Amount validated: ${amountInDollars} dollars → ${amountInCents} cents`);

        console.log('💳 Creating PaymentIntent...');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: lowerCurrency,
            customer: metadata.customerId, // Optional; undefined is fine if no customer
            metadata: {
                donorName: name,
                donorEmail: email,
                donorPhone: phone || '', // Optional, default empty
                donationType,
            },
            automatic_payment_methods: {
                enabled: true,
            },
            receipt_email: email,
        });
        console.log('✅ PaymentIntent created:', paymentIntent.id);

        if (!paymentIntent.client_secret) {
            console.error('❌ PaymentIntent missing client_secret');
            throw new Error('Failed to create payment intent');
        }

        console.log('🎯 Sending response with clientSecret');
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            customerId: metadata.customerId || null,
        });
    } catch (err: unknown) {
        let errorMessage = 'An unknown error occurred';
        let status = 500;

        if (err instanceof Stripe.errors.StripeError) {
            errorMessage = `${err.type}: ${err.message}`;
            status = err.statusCode || 500;
            console.error('🔥 Stripe-specific error:', errorMessage);
        } else if (err instanceof Error) {
            errorMessage = err.message;
            console.error('🔥 General error:', errorMessage);
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}