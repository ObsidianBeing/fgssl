/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { motion, AnimatePresence } from 'framer-motion'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Icons } from "@/components/ui/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const FormSchema = z.object({
    donationType: z.string().min(1, "Please select a donation type"),
    amount: z.string().min(1, "Please enter an amount"),
    donationFrequency: z.enum(["one-time", "daily", "weekly", "monthly", "yearly"]),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
})

type DonationType = {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

const frequencyOptions = [
    { id: "one-time", label: "One-Time" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
]

const amountPresets = {
    "one-time": [25, 50, 100, 200, 500, 1000],
    "daily": [1, 5, 7, 10],
    "weekly": [10, 25, 50, 100],
    "monthly": [250, 500, 750, 1000],
    "yearly": [5000, 10000, 15000, 20000],
}

export function DonationForm({ donationTypes }: { donationTypes: DonationType[] }) {
    const [step, setStep] = useState<'form' | 'payment'>('form')
    const [clientSecret, setClientSecret] = useState<string>()
    const [setupIntentData, setSetupIntentData] = useState<any>()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentElementReady, setPaymentElementReady] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            donationType: donationTypes[0]?.id || "",
            donationFrequency: "one-time",
            amount: "",
            name: "",
            email: "",
            phone: "",
        },
    })

    const selectedFrequency = form.watch("donationFrequency")
    const selectedType = form.watch("donationType")

    async function createPayment(values: z.infer<typeof FormSchema>) {
        setIsSubmitting(true)
        try {
            const parsedAmount = Math.round(Number(values.amount))
            if (isNaN(parsedAmount) || parsedAmount < 0.50) {
                toast({
                    title: "Invalid amount",
                    description: "Amount must be at least $0.50",
                    variant: "destructive"
                })
                return
            }

            const payload = {
                name: values.name,
                email: values.email,
                phone: values.phone,
                amount: parsedAmount,
                donationType: values.donationType,
                frequency: values.donationFrequency
            }

            if (values.donationFrequency === 'one-time') {
                // One-time payment flow (existing)
                const res = await fetch('/api/stripe/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                const data = await res.json()
                if (!res.ok || !data.clientSecret) {
                    throw new Error(data.message || 'Payment setup failed')
                }

                setClientSecret(data.clientSecret)
                setStep('payment')
            } else {
                // Subscription flow - first create customer and setup intent
                const res = await fetch('/api/stripe/create-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.message || 'Subscription setup failed')
                }

                if (data.requiresPaymentMethod && data.setupIntent) {
                    // Setup Intent flow for subscriptions
                    setClientSecret(data.setupIntent.client_secret)
                    setSetupIntentData({
                        customerId: data.customerId,
                        setupIntentId: data.setupIntent.id,
                        isSubscription: true,
                        subscriptionData: payload
                    })
                    setStep('payment')
                } else if (data.clientSecret) {
                    // Direct payment confirmation flow
                    setClientSecret(data.clientSecret)
                    setSetupIntentData({
                        subscriptionId: data.subscriptionId,
                        isSubscription: true,
                        requiresAction: data.requiresAction
                    })
                    setStep('payment')
                } else {
                    // Subscription created successfully
                    window.location.href = '/donations/thank-you?subscription=true'
                    return
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    Support Our Mission
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <AnimatePresence mode="wait">
                        {step === 'form' ? (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                key="form"
                            >
                                <form onSubmit={form.handleSubmit(createPayment)} className="space-y-6">
                                    {/* Donation Type */}
                                    <FormField
                                        control={form.control}
                                        name="donationType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>I want to support</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select a donation type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {donationTypes.map((type) => (
                                                            <SelectItem key={type.id} value={type.id} className="flex items-center gap-2">
                                                                <type.icon className="w-4 h-4" />
                                                                {type.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Donation Frequency */}
                                    <FormField
                                        control={form.control}
                                        name="donationFrequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Frequency</FormLabel>
                                                <Tabs
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="w-full"
                                                >
                                                    <TabsList className="grid w-full grid-cols-5 h-12">
                                                        {frequencyOptions.map((option) => (
                                                            <TabsTrigger
                                                                key={option.id}
                                                                value={option.id}
                                                                className="py-1 text-xs sm:text-sm"
                                                            >
                                                                {option.label}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </Tabs>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Amount Section */}
                                    <div className="space-y-3">
                                        <FormLabel>Amount</FormLabel>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {amountPresets[selectedFrequency].map((amount) => (
                                                <Button
                                                    key={amount}
                                                    type="button"
                                                    variant="outline"
                                                    className="h-12"
                                                    onClick={() => form.setValue('amount', amount.toString())}
                                                >
                                                    ${amount}
                                                </Button>
                                            ))}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                min="0.50"
                                                                step="0.01"
                                                                className="pl-8 h-12"
                                                                placeholder="Other amount"
                                                            />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Personal Info */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="font-medium">Your Information</h3>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="h-12" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="email" className="h-12" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="tel" className="h-12" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Icons.arrowRight className="mr-2 h-4 w-4" />
                                        )}
                                        Continue to Payment
                                    </Button>
                                </form>
                            </motion.div>
                        ) : clientSecret ? (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                key="payment"
                            >
                                <Elements stripe={stripePromise} options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'flat', // or 'night' or custom
                                        variables: {
                                            fontFamily: 'Arial, sans-serif',
                                            fontSizeBase: '16px',
                                        },
                                        rules: {
                                            '.Input': {
                                                fontFamily: 'monospace',
                                                fontVariantNumeric: 'lining-nums',
                                            },
                                            '.Input--cardNumber': {
                                                // Mask digits visually using bullets instead of numbers
                                                WebkitTextSecurity: 'disc', // Works in Chrome/Safari
                                                MozTextSecurity: 'disc', // Experimental in Firefox
                                                textSecurity: 'disc', // Some browsers
                                            },
                                            '.Input--cardCvc': {
                                                WebkitTextSecurity: 'disc',
                                                MozTextSecurity: 'disc',
                                                textSecurity: 'disc',
                                            },
                                        },
                                    },
                                }}>
                                    <PaymentForm
                                        email={form.getValues('email')}
                                        setIsSubmitting={setIsSubmitting}
                                        isSubmitting={isSubmitting}
                                        paymentElementReady={paymentElementReady}
                                        setPaymentElementReady={setPaymentElementReady}
                                        donationType={donationTypes.find(t => t.id === selectedType)?.name || "Donation"}
                                        amount={form.getValues('amount')}
                                        frequency={selectedFrequency}
                                        setupIntentData={setupIntentData}
                                        onBack={() => setStep('form')}
                                    />
                                </Elements>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </Form>
            </CardContent>
        </Card>
    )
}

function PaymentForm({
    email,
    isSubmitting,
    setIsSubmitting,
    paymentElementReady,
    setPaymentElementReady,
    donationType,
    amount,
    frequency,
    setupIntentData,
    onBack
}: {
    email: string
    isSubmitting: boolean
    setIsSubmitting: (v: boolean) => void
    paymentElementReady: boolean
    setPaymentElementReady: (v: boolean) => void
    donationType: string
    amount: string
    frequency: string
    setupIntentData?: any
    onBack: () => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const { toast } = useToast()

    async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!stripe || !elements || !paymentElementReady) {
            toast({
                title: "Payment not ready",
                description: "Please wait for the payment form to finish loading",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (setupIntentData?.isSubscription && setupIntentData?.customerId) {
                // Handle subscription setup intent flow
                const { error: confirmError, setupIntent } = await stripe.confirmSetup({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/donations/processing`,
                    },
                    redirect: 'if_required'
                });

                if (confirmError) {
                    throw confirmError;
                }

                if (setupIntent?.status === 'succeeded') {
                    // Now create the subscription with the payment method
                    const subscriptionRes = await fetch('/api/stripe/create-subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...setupIntentData.subscriptionData,
                            paymentMethodId: setupIntent.payment_method,
                            customerId: setupIntentData.customerId
                        })
                    });

                    const subscriptionData = await subscriptionRes.json();

                    if (!subscriptionRes.ok) {
                        throw new Error(subscriptionData.message || 'Failed to create subscription');
                    }

                    if (subscriptionData.requiresAction && subscriptionData.clientSecret) {
                        // Handle 3D Secure or other authentication
                        const { error: confirmError } = await stripe.confirmPayment({
                            clientSecret: subscriptionData.clientSecret,
                            redirect: 'if_required'
                        });

                        if (confirmError) {
                            throw confirmError;
                        }
                    }

                    // Build redirect URL with all necessary parameters
                    const redirectUrl = new URL(
                        `/donations/thank-you`,
                        window.location.origin
                    );

                    redirectUrl.searchParams.append('subscription_id', subscriptionData.subscriptionId);
                    redirectUrl.searchParams.append('success', 'true');
                    redirectUrl.searchParams.append('name', encodeURIComponent(setupIntentData.subscriptionData.name));
                    redirectUrl.searchParams.append('email', encodeURIComponent(setupIntentData.subscriptionData.email));
                    redirectUrl.searchParams.append('amount', setupIntentData.subscriptionData.amount.toString());
                    redirectUrl.searchParams.append('donationType', encodeURIComponent(setupIntentData.subscriptionData.donationType));
                    redirectUrl.searchParams.append('frequency', setupIntentData.subscriptionData.frequency);

                    window.location.href = redirectUrl.toString();
                    return;
                }
            } else if (setupIntentData?.requiresAction && setupIntentData?.clientSecret) {
                // Handle payment intent confirmation for subscriptions
                const { error: confirmError } = await stripe.confirmPayment({
                    clientSecret: setupIntentData.clientSecret,
                    redirect: 'if_required'
                });

                if (confirmError) {
                    throw confirmError;
                }

                // For cases where we don't have all subscription data
                window.location.href = '/donations/thank-you?subscription=true';
                return;
            } else {
                // Handle regular one-time payment
                const result = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/donations/thank-you?payment_intent={PAYMENT_INTENT_ID}&amount=${amount}&donationType=${encodeURIComponent(donationType)}`,
                        receipt_email: email,
                    },
                    redirect: 'if_required',
                });

                if (result.error) {
                    throw result.error;
                }

                if (result.paymentIntent?.status === 'succeeded') {
                    window.location.href = `/donations/thank-you?payment_intent=${result.paymentIntent.id}&amount=${amount}&donationType=${encodeURIComponent(donationType)}`;
                    return;
                }
            }
        } catch (err: unknown) {
            const message =
                err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
                    ? (err as { message: string }).message
                    : "An error occurred";
            toast({
                title: "Payment Error",
                description: message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Donation Type</span>
                    <span className="font-medium">{donationType}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="font-medium">${amount}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Frequency</span>
                    <span className="font-medium capitalize">
                        {frequency === "one-time" ? "One-Time" : frequency}
                    </span>
                </div>
                {setupIntentData?.isSubscription && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                        Setting up recurring donation - you&apos;ll be charged {frequency === 'one-time' ? 'once' : frequency}
                    </div>
                )}
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="border rounded-lg p-4">
                    <PaymentElement
                        onReady={() => setPaymentElementReady(true)}
                        options={{
                            layout: 'tabs',
                            wallets: { applePay: 'auto', googlePay: 'auto' },
                        }}
                    />
                </div>

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 h-12"
                        disabled={!stripe || !paymentElementReady || isSubmitting}
                    >
                        {isSubmitting ? (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Icons.creditCard className="mr-2 h-4 w-4" />
                        )}
                        {setupIntentData?.isSubscription ? 'Setup Recurring Donation' : 'Complete Donation'}
                    </Button>
                </div>
            </form>
        </div>
    )
}