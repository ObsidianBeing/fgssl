/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { Resend } from 'resend'
import ejs from 'ejs'
import path from 'path'
import fs from 'fs/promises'
import { generateDonationReceiptPDF } from './pdf'
import { format, formatInTimeZone } from 'date-fns-tz'

// Initialize Resend with API key validation
const resend = new Resend(process.env.RESEND_API_KEY)

// Validate configuration on startup
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required')
}

if (!process.env.FROM_EMAIL) {
    throw new Error('FROM_EMAIL environment variable is required')
}

// Enhanced Types
interface EmailMetrics {
    totalSent: number
    totalFailed: number
    totalRetries: number
    lastFailed?: {
        emailType: string
        recipient: string
        error: unknown
        timestamp: Date
        attempts: number
    }
    deliveryRate: number
    averageResponseTime: number
    rateLimitHits: number
}

interface EmailResult {
    success: boolean
    messageId?: string
    error?: unknown
    attempts: number
    responseTime: number
    rateLimited?: boolean
}

interface DonationEmailParams {
    to: string
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate?: Date | string
    paymentMethod?: string
    currency?: string
    frequency?: string
    isRecurring: boolean
    unsubscribeLink?: string
    tags?: Array<{ name: string; value: string }>
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}

interface PaymentFailedEmailParams {
    to: string
    donorName: string
    amount: number
    currency: string
    invoiceId?: string
    hostedInvoiceUrl?: string
    billingReason: string | null
    retryLink?: string
    nextRetryDate: Date | null
    updatePaymentUrl: string
    isRecurring?: boolean
    subscriptionStatus?: string | null
    willRetry?: boolean
    tags?: Array<{ name: string; value: string }>
}

interface SubscriptionConfirmationEmailData {
    to: string
    donorName: string
    amount: number
    currency: string
    frequency: string
    donationType: string
    subscriptionId: string
    nextBillingDate: Date
    manageSubscriptionUrl: string
    unsubscribeUrl: string
    tags?: Array<{ name: string; value: string }>
}

interface SubscriptionUpdateEmailData {
    to: string
    donorName: string
    subscriptionId: string
    changes: string[]
    currentAmount: number
    currency: string
    frequency: string
    nextBillingDate: Date
    subscriptionStatus: string
    manageSubscriptionUrl: string
    tags?: Array<{ name: string; value: string }>
}

interface SubscriptionCancellationEmailData {
    to: string
    donorName: string
    subscriptionId: string
    amount: number
    currency: string
    frequency: string
    cancelledAt: Date
    totalContributed: number
    reactivateUrl: string
    tags?: Array<{ name: string; value: string }>
}

// Enhanced metrics tracking with performance monitoring
const emailMetrics: EmailMetrics = {
    totalSent: 0,
    totalFailed: 0,
    totalRetries: 0,
    deliveryRate: 100,
    averageResponseTime: 0,
    rateLimitHits: 0,
}

// Rate limiting with exponential backoff
class RateLimiter {
    private requests: number[] = []
    private readonly maxRequests: number
    private readonly windowMs: number

    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests
        this.windowMs = windowMs
    }

    canMakeRequest(): boolean {
        const now = Date.now()
        this.requests = this.requests.filter(time => now - time < this.windowMs)
        return this.requests.length < this.maxRequests
    }

    recordRequest(): void {
        this.requests.push(Date.now())
    }

    getNextAvailableTime(): number {
        if (this.requests.length === 0) return 0
        const oldestRequest = Math.min(...this.requests)
        return Math.max(0, this.windowMs - (Date.now() - oldestRequest))
    }
}

const rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Enhanced template rendering with caching and validation
const templateCache = new Map<string, string>()

async function renderTemplate(templateName: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.ejs`)

    let template = templateCache.get(templatePath)

    if (!template) {
        try {
            template = await fs.readFile(templatePath, 'utf8')
            templateCache.set(templatePath, template)
        } catch (error) {
            throw new Error(`Template not found: ${templateName} at ${templatePath}`)
        }
    }

    try {
        return ejs.render(template, {
            siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '',
            ...data,
        }, {
            root: path.join(process.cwd(), 'src', 'emails'),
        })
    } catch (error) {
        throw new Error(`Template rendering failed for ${templateName}: ${error}`)
    }
}

// Enhanced email sending with comprehensive error handling
async function sendWithResend(
    emailData: {
        from: string
        to: string | string[]
        subject: string
        html: string
        attachments?: Array<{
            filename: string
            content: Buffer | string
            contentType?: string
        }>
        tags?: Array<{ name: string; value: string }>
        headers?: Record<string, string>
    },
    emailType: string,
    maxRetries = 3
): Promise<EmailResult> {
    const startTime = Date.now()
    let attempt = 0
    let lastError: unknown = null

    // Validate email addresses
    const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to]
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (const email of recipients) {
        if (!emailRegex.test(email)) {
            throw new Error(`Invalid email address: ${email}`)
        }
    }

    while (attempt < maxRetries) {
        try {
            // Rate limiting check
            if (!rateLimiter.canMakeRequest()) {
                const waitTime = rateLimiter.getNextAvailableTime()
                emailMetrics.rateLimitHits++

                if (waitTime > 0) {
                    console.warn(`⏱️ Rate limit reached. Waiting ${waitTime}ms before retry...`)
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                }
            }

            rateLimiter.recordRequest()

            // Prepare Resend payload with correct types
            const payload = {
                from: emailData.from ?? process.env.FROM_EMAIL ?? "",
                to: recipients,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.html.replace(/<[^>]+>/g, ''), // Simple HTML to text fallback
                ...(emailData.attachments?.length && {
                    attachments: emailData.attachments.map(att => ({
                        filename: att.filename,
                        content: att.content,
                        ...(att.contentType && { contentType: att.contentType }),
                    }))
                }),
                ...(emailData.tags?.length && {
                    tags: emailData.tags
                }),
                ...(emailData.headers && {
                    headers: emailData.headers
                })
            }

            // Send email
            const response = await resend.emails.send(payload)

            if (response.error) {
                throw new Error(`Resend API error: ${response.error.message || JSON.stringify(response.error)}`)
            }

            // Success metrics
            const responseTime = Date.now() - startTime
            emailMetrics.totalSent++
            emailMetrics.averageResponseTime = (
                (emailMetrics.averageResponseTime * (emailMetrics.totalSent - 1) + responseTime) /
                emailMetrics.totalSent
            )
            updateDeliveryRate()

            console.log(`✅ ${emailType} sent to ${recipients.join(', ')} (${responseTime}ms, attempt ${attempt + 1})`)

            return {
                success: true,
                messageId: response.data?.id,
                attempts: attempt + 1,
                responseTime,
            }

        } catch (error) {
            lastError = error
            attempt++
            emailMetrics.totalRetries++

            // Handle specific Resend errors
            const errorMessage = error instanceof Error ? error.message : String(error)

            if (errorMessage.includes('rate_limit')) {
                emailMetrics.rateLimitHits++
                const backoffTime = Math.min(30000, 5000 * Math.pow(2, attempt - 1)) // Max 30s
                console.warn(`🚫 Rate limited. Backing off ${backoffTime}ms before retry ${attempt}/${maxRetries}`)
                await new Promise(resolve => setTimeout(resolve, backoffTime))
            } else if (errorMessage.includes('validation_error')) {
                // Don't retry validation errors
                console.error(`❌ Validation error for ${emailType}: ${errorMessage}`)
                break
            } else if (attempt < maxRetries) {
                const delay = Math.min(10000, 1000 * Math.pow(2, attempt - 1)) + Math.random() * 1000
                console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${emailType}. Retrying in ${Math.round(delay)}ms...`)
                console.warn(`Error: ${errorMessage}`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    // All attempts failed
    const responseTime = Date.now() - startTime
    emailMetrics.totalFailed++
    updateDeliveryRate()

    emailMetrics.lastFailed = {
        emailType,
        recipient: recipients.join(', '),
        error: lastError,
        timestamp: new Date(),
        attempts: attempt,
    }

    console.error(`❌ All ${maxRetries} attempts failed for ${emailType} to ${recipients.join(', ')}`)
    console.error('Final error:', lastError)

    return {
        success: false,
        error: lastError,
        attempts: attempt,
        responseTime,
    }
}

function updateDeliveryRate(): void {
    const totalAttempts = emailMetrics.totalSent + emailMetrics.totalFailed
    emailMetrics.deliveryRate = totalAttempts > 0
        ? (emailMetrics.totalSent / totalAttempts) * 100
        : 100
}

// Export enhanced metrics
export async function getEmailMetrics(): Promise<EmailMetrics> {
    return {
        ...emailMetrics,
        deliveryRate: Math.round(emailMetrics.deliveryRate * 100) / 100,
        averageResponseTime: Math.round(emailMetrics.averageResponseTime),
    }
}

// Health check function
export async function checkEmailHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    metrics: EmailMetrics
}> {
    const checks = {
        apiKeyConfigured: !!process.env.RESEND_API_KEY,
        fromEmailConfigured: !!process.env.FROM_EMAIL,
        deliveryRateHealthy: emailMetrics.deliveryRate >= 95,
        rateLimitHealthy: emailMetrics.rateLimitHits < 10,
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyChecks === totalChecks) {
        status = 'healthy'
    } else if (healthyChecks >= totalChecks * 0.75) {
        status = 'degraded'
    } else {
        status = 'unhealthy'
    }

    return {
        status,
        checks,
        metrics: await getEmailMetrics(),
    }
}

// Main email functions with enhanced error handling

export async function sendDonationEmail(params: DonationEmailParams): Promise<EmailResult> {
    const receiptNumber = `DON-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    const formattedDate = params.createdDate
        ? new Date(params.createdDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

    try {
        // Generate PDF receipt
        const pdfBytes = await generateDonationReceiptPDF({
            donorName: params.donorName,
            amount: params.amount,
            donationType: params.donationType,
            receiptUrl: params.receiptUrl,
            createdDate: formattedDate,
            receiptNumber,
            paymentMethod: params.paymentMethod,
            currency: params.currency,
            frequency: params.frequency,
            isRecurring: params.isRecurring
        })

        // Render email template
        const html = await renderTemplate('donation-receipt', {
            donorName: params.donorName,
            amount: params.amount,
            donationType: params.donationType,
            receiptUrl: params.receiptUrl,
            receiptNumber,
            paymentMethod: params.paymentMethod || 'Card',
            dateReceived: formattedDate,
            currency: params.currency || 'USD',
            frequency: params.frequency,
            isRecurring: params.isRecurring,
            unsubscribeLink: params.unsubscribeLink,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Donations <donations@efgbcssl.org>",
                to: params.to,
                subject: params.isRecurring
                    ? `Thank you for your recurring ${params.donationType} donation`
                    : `Thank you for your ${params.donationType} donation`,
                html,
                attachments: [
                    {
                        filename: `Donation_Receipt_${receiptNumber}.pdf`,
                        content: Buffer.from(pdfBytes),
                        contentType: 'application/pdf',
                    },
                ],
                tags: [
                    { name: 'category', value: 'donation' },
                    { name: 'type', value: 'receipt' },
                    ...(params.tags || [])
                ],
                headers: {
                    'X-Entity-Ref-ID': receiptNumber,
                },
            },
            'donation-receipt'
        )
    } catch (error) {
        console.error('❌ Error in sendDonationEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendPaymentFailedEmail(params: PaymentFailedEmailParams): Promise<EmailResult> {
    try {
        const html = await renderTemplate('payment-failed', {
            donorName: params.donorName,
            amount: params.amount,
            currency: params.currency,
            invoiceId: params.invoiceId,
            hostedInvoiceUrl: params.hostedInvoiceUrl,
            billingReason: params.billingReason,
            retryLink: params.retryLink || params.updatePaymentUrl,
            updatePaymentUrl: params.updatePaymentUrl,
            nextRetryDate: params.nextRetryDate,
            isRecurring: params.isRecurring || false,
            subscriptionStatus: params.subscriptionStatus,
            willRetry: params.willRetry || false,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Donations <donations@efgbcssl.org>",
                to: params.to,
                subject: `Payment ${params.isRecurring ? 'for recurring donation ' : ''}failed - Action required`,
                html,
                tags: [
                    { name: 'category', value: 'payment' },
                    { name: 'type', value: 'failed' },
                    { name: 'priority', value: 'urgent' },
                    ...(params.tags || [])
                ],
                headers: {
                    'X-Priority': '1',
                    'X-Entity-Ref-ID': params.invoiceId || 'unknown',
                },
            },
            'payment-failed'
        )
    } catch (error) {
        console.error('❌ Error in sendPaymentFailedEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendSubscriptionConfirmationEmail(data: SubscriptionConfirmationEmailData): Promise<EmailResult> {
    try {
        const html = await renderTemplate('subscription-confirmation', {
            donorName: data.donorName,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            donationType: data.donationType,
            subscriptionId: data.subscriptionId,
            nextBillingDate: data.nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            manageSubscriptionUrl: data.manageSubscriptionUrl,
            unsubscribeUrl: data.unsubscribeUrl,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Donations <donations@efgbcssl.org>",
                to: data.to,
                subject: `Thank you for your ${data.frequency} donation commitment!`,
                html,
                tags: [
                    { name: 'category', value: 'subscription' },
                    { name: 'type', value: 'confirmation' },
                    ...(data.tags || [])
                ],
                headers: {
                    'X-Entity-Ref-ID': data.subscriptionId,
                },
            },
            'subscription-confirmation'
        )
    } catch (error) {
        console.error('❌ Error in sendSubscriptionConfirmationEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendSubscriptionUpdateEmail(data: SubscriptionUpdateEmailData): Promise<EmailResult> {
    try {
        const html = await renderTemplate('subscription-update', {
            donorName: data.donorName,
            subscriptionId: data.subscriptionId,
            changes: data.changes,
            currentAmount: data.currentAmount,
            currency: data.currency,
            frequency: data.frequency,
            nextBillingDate: data.nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            subscriptionStatus: data.subscriptionStatus,
            manageSubscriptionUrl: data.manageSubscriptionUrl,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Donations <donations@efgbcssl.org>",
                to: data.to,
                subject: 'Your recurring donation has been updated',
                html,
                tags: [
                    { name: 'category', value: 'subscription' },
                    { name: 'type', value: 'update' },
                    ...(data.tags || [])
                ],
                headers: {
                    'X-Entity-Ref-ID': data.subscriptionId,
                },
            },
            'subscription-update'
        )
    } catch (error) {
        console.error('❌ Error in sendSubscriptionUpdateEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendSubscriptionCancellationEmail(data: SubscriptionCancellationEmailData): Promise<EmailResult> {
    try {
        const html = await renderTemplate('subscription-cancellation', {
            donorName: data.donorName,
            subscriptionId: data.subscriptionId,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            cancelledAt: data.cancelledAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            totalContributed: data.totalContributed,
            reactivateUrl: data.reactivateUrl,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Donations <donations@efgbcssl.org>",
                to: data.to,
                subject: 'Your recurring donation has been cancelled',
                html,
                tags: [
                    { name: 'category', value: 'subscription' },
                    { name: 'type', value: 'cancellation' },
                    ...(data.tags || [])
                ],
                headers: {
                    'X-Entity-Ref-ID': data.subscriptionId,
                },
            },
            'subscription-cancellation'
        )
    } catch (error) {
        console.error('❌ Error in sendSubscriptionCancellationEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

// Enhanced appointment email functions with better error handling
export async function sendAppointmentEmail({
    to,
    icalEvent,
    fullName,
    preferredDate,
    preferredTime,
    medium,
    newYorkDate,
    newYorkTime,
    timeDifference,
    meetingLink
}: {
    to: string
    icalEvent: {
        filename: string
        content: string
    }
    fullName?: string
    preferredDate?: string
    preferredTime?: string
    medium?: string
    newYorkDate?: string
    newYorkTime?: string
    timeDifference?: string
    meetingLink?: string
}): Promise<EmailResult> {
    try {
        const html = await renderTemplate('appointment-confirmation', {
            fullName: fullName || "Brother/Sister",
            preferredDate: preferredDate || "",
            preferredTime: preferredTime || "",
            medium: medium || "",
            newYorkDate: newYorkDate || "",
            newYorkTime: newYorkTime || "",
            timeDifference: timeDifference || "",
            meetingLink: meetingLink || "",
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Appointments <appointments@efgbcssl.org>",
                to,
                subject: `Your Appointment Confirmation - ${preferredDate || "Scheduled Appointment"}`,
                html,
                attachments: [
                    {
                        filename: icalEvent.filename,
                        content: icalEvent.content,
                        contentType: "text/calendar; charset=utf-8; method=REQUEST"
                    }
                ],
                tags: [
                    { name: 'category', value: 'appointment' },
                    { name: 'type', value: 'confirmation' }
                ],
                headers: {
                    'X-Entity-Ref-ID': `appointment-${Date.now()}`,
                },
            },
            'appointment-confirmation'
        )
    } catch (error) {
        console.error("❌ Error in sendAppointmentEmail:", error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendReminderEmail({
    to,
    fullName,
    preferredDate,
    preferredTime,
    medium,
    newYorkDate,
    newYorkTime,
    timeDifference,
    meetingLink,
    rescheduleLink,
    cancelLink,
    unsubscribeLink
}: {
    to: string
    fullName: string
    preferredDate: string
    preferredTime: string
    medium: string
    newYorkDate: string
    newYorkTime: string
    timeDifference: string
    meetingLink: string
    rescheduleLink: string
    cancelLink: string
    unsubscribeLink: string
}): Promise<EmailResult> {
    try {
        const html = await renderTemplate('appointment-reminder', {
            fullName,
            preferredDate,
            preferredTime,
            medium,
            newYorkDate,
            newYorkTime,
            timeDifference,
            meetingLink,
            rescheduleLink,
            cancelLink,
            unsubscribeLink,
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Appointments <appointments@efgbcssl.org>",
                to,
                subject: `Reminder: Your Upcoming Appointment - ${preferredDate} at ${preferredTime}`,
                html,
                tags: [
                    { name: 'category', value: 'appointment' },
                    { name: 'type', value: 'reminder' }
                ],
                headers: {
                    'X-Priority': '1',
                },
            },
            'appointment-reminder'
        )
    } catch (error) {
        console.error('❌ Error in sendReminderEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendMessageNotificationEmail({
    to,
    fullName,
    email,
    subject,
    message,
    adminName = "Pastoral Care Team"
}: {
    to: string
    fullName: string
    email: string
    subject?: string
    message: string
    adminName?: string
}): Promise<EmailResult> {
    try {
        const html = await renderTemplate('message-notification', {
            fullName,
            email,
            subject: subject || 'No Subject',
            message,
            adminName,
            date: format(new Date(), 'EEEE, MMMM d, yyyy \'at\' h:mm a'),
            currentYear: new Date().getFullYear()
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Messages <messages@efgbcssl.org>",
                to,
                subject: `New Message: ${subject || 'Contact Form Submission'}`,
                html,
                tags: [
                    { name: 'category', value: 'notification' },
                    { name: 'type', value: 'message' }
                ],
                headers: {
                    'X-Priority': '2',
                    'Reply-To': email,
                },
            },
            'message-notification'
        )
    } catch (error) {
        console.error('❌ Error in sendMessageNotificationEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

export async function sendEventRegistrationEmail({
    to,
    fullName,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    additionalDetails,
    contactEmail,
    contactPhone,
}: {
    to: string
    fullName: string
    eventName: string
    eventDate: string
    eventTime: string
    eventLocation: string
    additionalDetails?: string
    contactEmail?: string
    contactPhone?: string
}): Promise<EmailResult> {
    try {
        const html = await renderTemplate('event-registration', {
            fullName,
            eventName,
            eventDate,
            eventTime,
            eventLocation,
            additionalDetails: additionalDetails || 'None provided',
            contactEmail: contactEmail || 'Not specified',
            contactPhone: contactPhone || 'Not specified',
            currentYear: new Date().getFullYear(),
        })

        return await sendWithResend(
            {
                from: "EFGBCSSL Events <events@efgbcssl.org>",
                to,
                subject: `Registration Confirmation: ${eventName}`,
                html,
                tags: [
                    { name: 'category', value: 'event' },
                    { name: 'type', value: 'registration' }
                ],
                headers: {
                    'X-Entity-Ref-ID': `event-${eventName.replace(/\s+/g, '-').toLowerCase()}`,
                },
            },
            'event-registration'
        )
    } catch (error) {
        console.error('❌ Error in sendEventRegistrationEmail:', error)
        return {
            success: false,
            error,
            attempts: 0,
            responseTime: 0,
        }
    }
}

// Utility functions remain the same
export async function generateTimezoneInfo(appointmentDate: Date) {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const churchTimeZone = 'America/New_York'

    const userLocalDate = formatInTimeZone(appointmentDate, userTimeZone, 'EEEE, MMMM do, yyyy')
    const userLocalTime = formatInTimeZone(appointmentDate, userTimeZone, 'h:mm a')
    const newYorkDate = formatInTimeZone(appointmentDate, churchTimeZone, 'EEEE, MMMM do, yyyy')
    const newYorkTime = formatInTimeZone(appointmentDate, churchTimeZone, 'h:mm a')

    const userOffset = new Date().getTimezoneOffset()
    const nyOffset = new Date(appointmentDate.toLocaleString('en-US', {
        timeZone: churchTimeZone
    })).getTimezoneOffset()
    const diffHours = (nyOffset - userOffset) / 60
    const timeDiffText = diffHours === 0
        ? "the same as your local time"
        : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'behind' : 'ahead'} of your local time`

    return {
        userLocalDate,
        userLocalTime,
        newYorkDate,
        newYorkTime,
        timeDifference: timeDiffText
    }
}