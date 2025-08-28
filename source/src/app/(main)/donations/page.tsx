"use client"

import dynamic from 'next/dynamic'
import { Heart, Gift, Building, GraduationCap, HandHeart, Lightbulb } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { Icons } from '@/components/ui/icons'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type DonationType = {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

const donationTypes: DonationType[] = [
    {
        id: 'tithe',
        name: 'Tithe (አስራት)',
        description: 'Regular giving of 10% of your income',
        icon: Heart
    },
    {
        id: 'offering',
        name: 'Offering (የፍቅር ስጦታ)',
        description: 'General donations to support church operations',
        icon: Gift
    },
    {
        id: 'building',
        name: 'Building Fund (ህንፃ ማሰሪያ)',
        description: 'Support church facility improvements',
        icon: Building
    },
    {
        id: 'missions',
        name: 'Missions (ወንጌል ስርጭት)',
        description: 'Support our local and global mission work',
        icon: HandHeart
    },
    {
        id: 'education',
        name: 'Education (ትምህርት)',
        description: 'Support our Sunday School and Bible study programs',
        icon: GraduationCap
    },
    {
        id: 'special',
        name: 'Special Projects (ለልዩ ድጋፎች)',
        description: 'Funding for special community initiatives',
        icon: Lightbulb
    },
]

const DonationForm = dynamic(
    () => import('@/components/donation-form').then((mod) => mod.DonationForm),
    {
        ssr: false,
        loading: () => (
            <div className="flex justify-center items-center h-64">
                <Icons.spinner className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }
)

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export default function DonationPage() {
    const { toast } = useToast()

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[400px] overflow-hidden">
                <Image
                    src="https://res.cloudinary.com/dvdbepqiv/image/upload/v1756057007/WhatsApp_Image_2025-08-24_at_20.08.47_896eea35_nje22d.jpg"
                    alt="Donation"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-heading"
                    >
                        Support Our Ministry<br />
                        አገልግሎቱን ይደግፉ
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl max-w-2xl"
                    >
                        Your generosity makes a difference in our church and community
                    </motion.p>
                </div>
            </section>

            {/* Donation Types */}
            <section className="py-16 bg-white">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold mb-4 font-heading">Ways to Give</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Your financial support enables us to continue our mission of spreading the gospel,
                            caring for those in need, and building a community of faith.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {donationTypes.map((type, index) => (
                            <motion.div
                                key={type.id}
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow border-0 shadow-sm">
                                    <CardContent className="p-8 flex flex-col items-center text-center h-full">
                                        <div className="h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-6">
                                            <type.icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 font-heading">{type.name}</h3>
                                        <p className="text-gray-600 mb-6 flex-grow">{type.description}</p>
                                        <Button
                                            variant="outline"
                                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                const donationForm = document.getElementById('donation-form')
                                                if (donationForm) {
                                                    donationForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                }
                                                toast({
                                                    title: "Ready to Give",
                                                    description: `You've selected ${type.name} donation. Thank you!`,
                                                })
                                            }}
                                        >
                                            Give Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Donation Form */}
            <section className="py-16 bg-gray-50" id="donation-form">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="max-w-4xl mx-auto"
                    >
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="text-center pb-0">
                                <CardTitle className="text-3xl font-heading">Make a Donation</CardTitle>
                                <p className="text-gray-600">
                                    Fill out the form below to make a secure online donation.
                                </p>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <Elements stripe={stripePromise}>
                                    <DonationForm donationTypes={donationTypes} />
                                </Elements>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>


        </>
    )
}