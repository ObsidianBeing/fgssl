import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

interface DonationReceiptPDFParams {
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
    createdDate: string
    receiptNumber: string
    paymentMethod?: string
    currency?: string
    frequency?: string
    isRecurring: boolean
}

const churchLogo = fs.readFileSync(path.resolve('public/logo.png'))

export async function generateDonationReceiptPDF(params: DonationReceiptPDFParams): Promise<Buffer> {
    try {
        console.log('📝 Generating donation receipt PDF...')

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)

        // Embed fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        // Add a new page with proper margins
        const page = pdfDoc.addPage([612, 792]) // Letter size (8.5 x 11 inches)
        const { width, height } = page.getSize()
        const margin = 50 // Slightly reduced margin for more space

        // Color palette for a sleek design
        const colors = {
            primary: rgb(0.15, 0.35, 0.65), // Deep blue
            secondary: rgb(0.25, 0.45, 0.75), // Medium blue
            accent: rgb(0.85, 0.65, 0.13), // Gold accent
            text: rgb(0.2, 0.2, 0.2), // Dark gray
            lightText: rgb(0.5, 0.5, 0.5), // Light gray
            background: rgb(0.97, 0.98, 1), // Very light blue background
        }

        // Draw subtle background
        page.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: height,
            color: colors.background,
        })

        // Draw header background
        page.drawRectangle({
            x: 0,
            y: height - 120,
            width: width,
            height: 120,
            color: colors.primary,
        })

        // Draw church logo
        const logoImage = await pdfDoc.embedPng(churchLogo)
        const logoDims = logoImage.scale(0.4)
        page.drawImage(logoImage, {
            x: margin,
            y: height - margin - logoDims.height - 10,
            width: logoDims.width,
            height: logoDims.height,
        })

        // Add church info in header
        page.drawText('Ethiopian Full Gospel Believers Church', {
            x: margin + logoDims.width + 20,
            y: height - margin - 25,
            size: 16,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        })
        page.drawText('914 Silver Spring Ave, Suite 204 B', {
            x: margin + logoDims.width + 20,
            y: height - margin - 45,
            size: 11,
            font: helvetica,
            color: rgb(0.9, 0.9, 0.9),
        })
        page.drawText('Silver Spring, MD 20910', {
            x: margin + logoDims.width + 20,
            y: height - margin - 60,
            size: 11,
            font: helvetica,
            color: rgb(0.9, 0.9, 0.9),
        })

        // Add receipt number and date in top right
        const receiptInfoX = width - margin - 160
        page.drawText('RECEIPT', {
            x: receiptInfoX,
            y: height - margin - 25,
            size: 14,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        })
        page.drawText(`#${params.receiptNumber}`, {
            x: receiptInfoX,
            y: height - margin - 42,
            size: 12,
            font: helvetica,
            color: colors.accent,
        })
        page.drawText(params.createdDate, {
            x: receiptInfoX,
            y: height - margin - 58,
            size: 10,
            font: helvetica,
            color: rgb(0.9, 0.9, 0.9),
        })

        // Current Y position after header
        let currentY = height - 140

        // Add receipt title with decorative line
        const titleText = params.isRecurring
            ? `RECURRING DONATION RECEIPT - ${params.frequency?.toUpperCase()}`
            : 'DONATION RECEIPT'

        page.drawText(titleText, {
            x: margin,
            y: currentY,
            size: 18,
            font: helveticaBold,
            color: colors.primary,
        })

        // Decorative line under title
        page.drawLine({
            start: { x: margin, y: currentY - 8 },
            end: { x: margin + 300, y: currentY - 8 },
            thickness: 2,
            color: colors.accent,
        })

        currentY -= 50

        // Donor Information Section
        page.drawText('DONOR INFORMATION', {
            x: margin,
            y: currentY,
            size: 12,
            font: helveticaBold,
            color: colors.secondary,
        })

        // Donor info box
        page.drawRectangle({
            x: margin,
            y: currentY - 35,
            width: width - 2 * margin,
            height: 30,
            color: rgb(0.95, 0.97, 1),
            borderColor: colors.secondary,
            borderWidth: 1,
        })

        page.drawText(params.donorName, {
            x: margin + 15,
            y: currentY - 25,
            size: 12,
            font: helvetica,
            color: colors.text,
        })

        currentY -= 70

        // Donation Details Section
        page.drawText('DONATION DETAILS', {
            x: margin,
            y: currentY,
            size: 12,
            font: helveticaBold,
            color: colors.secondary,
        })

        currentY -= 25

        // Create a table for donation details
        const tableData = [
            { label: 'Donation Type', value: params.donationType },
            { label: 'Amount', value: `${params.currency || 'USD'} ${params.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Payment Method', value: params.paymentMethod || 'Credit Card' },
            ...(params.isRecurring ? [{ label: 'Frequency', value: params.frequency || 'Monthly' }] : []),
        ]

        // Draw table background
        const tableHeight = tableData.length * 25 + 10
        page.drawRectangle({
            x: margin,
            y: currentY - tableHeight,
            width: width - 2 * margin,
            height: tableHeight,
            color: rgb(0.98, 0.99, 1),
            borderColor: colors.lightText,
            borderWidth: 1,
        })

        // Draw table rows
        tableData.forEach((row, index) => {
            const rowY = currentY - 15 - (index * 25)

            // Alternate row background
            if (index % 2 === 1) {
                page.drawRectangle({
                    x: margin + 1,
                    y: rowY - 10,
                    width: width - 2 * margin - 2,
                    height: 23,
                    color: rgb(0.94, 0.96, 1),
                })
            }

            page.drawText(row.label + ':', {
                x: margin + 15,
                y: rowY,
                size: 11,
                font: helveticaBold,
                color: colors.text,
            })

            // Special formatting for amount
            const valueColor = row.label === 'Amount' ? colors.primary : colors.text
            const valueFont = row.label === 'Amount' ? helveticaBold : helvetica

            page.drawText(row.value, {
                x: margin + 150,
                y: rowY,
                size: 11,
                font: valueFont,
                color: valueColor,
            })
        })

        currentY -= tableHeight + 40

        // Thank you message with accent background
        page.drawRectangle({
            x: margin - 10,
            y: currentY - 30,
            width: width - 2 * margin + 20,
            height: 40,
            color: colors.accent,
            opacity: 0.1,
        })

        page.drawText('Thank you for your generous support!', {
            x: margin,
            y: currentY - 10,
            size: 16,
            font: helveticaBold,
            color: colors.primary,
        })

        currentY -= 60

        // Bible verse section with better formatting
        page.drawText('SCRIPTURE', {
            x: margin,
            y: currentY,
            size: 10,
            font: helveticaBold,
            color: colors.secondary,
        })

        currentY -= 20

        // Verse box with quote styling
        const verseBoxHeight = 80
        page.drawRectangle({
            x: margin,
            y: currentY - verseBoxHeight,
            width: width - 2 * margin,
            height: verseBoxHeight,
            color: rgb(0.96, 0.98, 1),
            borderColor: colors.accent,
            borderWidth: 1,
        })

        // Quote mark
        page.drawText('"', {
            x: margin + 15,
            y: currentY - 15,
            size: 24,
            font: helveticaBold,
            color: colors.accent,
        })

        // Verse text with proper line spacing
        const verseLines = [
            'Each of you should give what you have decided in your heart to give,',
            'not reluctantly or under compulsion, for God loves a cheerful giver.',
        ]

        verseLines.forEach((line, index) => {
            page.drawText(line, {
                x: margin + 35,
                y: currentY - 20 - (index * 16),
                size: 11,
                font: helvetica,
                color: colors.text,
            })
        })

        // Bible reference
        page.drawText('- 2 Corinthians 9:7', {
            x: width - margin - 120,
            y: currentY - 60,
            size: 11,
            font: helveticaBold,
            color: colors.secondary,
        })

        currentY -= 120

        // Tax information section
        page.drawText('TAX DEDUCTION INFORMATION', {
            x: margin,
            y: currentY,
            size: 10,
            font: helveticaBold,
            color: colors.secondary,
        })

        currentY -= 15

        const taxInfo = [
            'Ethiopian Full Gospel Believers Church is a registered 501(c)(3) organization.',
            'No goods or services were provided in exchange for this donation.',
            'This receipt may be used for tax deduction purposes.',
        ]

        taxInfo.forEach((info, index) => {
            page.drawText(info, {
                x: margin,
                y: currentY - (index * 15),
                size: 9,
                font: helvetica,
                color: colors.lightText,
            })
        })

        // Footer with contact information
        const footerY = 80

        // Footer separator line
        page.drawLine({
            start: { x: margin, y: footerY + 30 },
            end: { x: width - margin, y: footerY + 30 },
            thickness: 1,
            color: colors.lightText,
        })

        page.drawText('For questions about your donation, please contact:', {
            x: margin,
            y: footerY + 15,
            size: 9,
            font: helvetica,
            color: colors.lightText,
        })

        // Contact information with icons simulation
        page.drawText('✉ giving@efgbcssl.org', {
            x: margin,
            y: footerY,
            size: 9,
            font: helvetica,
            color: colors.primary,
        })

        page.drawText('📞 (240) 821-0361', {
            x: margin + 160,
            y: footerY,
            size: 9,
            font: helvetica,
            color: colors.primary,
        })

        page.drawText('🌐 efgbcssl.org', {
            x: margin + 280,
            y: footerY,
            size: 9,
            font: helvetica,
            color: colors.primary,
        })

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save()

        console.log('✅ Donation receipt PDF generated successfully')
        return Buffer.from(pdfBytes)
    } catch (error) {
        console.error('❌ Error generating donation receipt PDF:', error)
        throw new Error('Failed to generate donation receipt')
    }
}