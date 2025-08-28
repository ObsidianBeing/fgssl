/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Phone, Mail, Clock, ExternalLink, Navigation, Loader2, Car, Train, PersonStanding, Copy } from 'lucide-react'
import AppointmentForm from '@/components/home/AppointmentForm'
import { Badge } from '@/components/ui/badge'

const CHURCH_ADDRESS = "914 Silver Spring Avenue Suite 204B, Silver Spring, MD 20910"
const CHURCH_COORDS = { lat: 38.9907, lng: -77.0261 }

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [distance, setDistance] = useState<number | null>(null)
    const [loadingLocation, setLoadingLocation] = useState(false)
    const [locationError, setLocationError] = useState<string | null>(null)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const form = e.currentTarget
        const formData = new FormData(form)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send message')
            }

            toast({
                title: "Message Sent!",
                description: "We've received your message and will respond soon.",
            })
            form.reset()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send message",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3959 // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Get user location
    const getUserLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser")
            return
        }

        setLoadingLocation(true)
        setLocationError(null)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                setUserLocation(userPos)

                const dist = calculateDistance(
                    userPos.lat,
                    userPos.lng,
                    CHURCH_COORDS.lat,
                    CHURCH_COORDS.lng
                )
                setDistance(dist)
                setLoadingLocation(false)

                toast({
                    title: "Location found!",
                    description: `You're about ${dist.toFixed(1)} miles away from the church.`,
                })
            },
            (error) => {
                setLoadingLocation(false)
                let errorMessage = "Unable to get your location"

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services."
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable"
                        break
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out"
                        break
                }

                setLocationError(errorMessage)
                toast({
                    title: "Location Error",
                    description: errorMessage,
                    variant: "destructive"
                })
            },
            { timeout: 10000, enableHighAccuracy: true }
        )
    }

    // Open directions in various apps
    const openDirections = (app: 'google' | 'apple' | 'waze') => {
        const destination = encodeURIComponent(CHURCH_ADDRESS)
        let url = ''

        if (userLocation) {
            const origin = `${userLocation.lat},${userLocation.lng}`

            switch (app) {
                case 'google':
                    url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
                    break
                case 'apple':
                    url = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
                    break
                case 'waze':
                    url = `https://waze.com/ul?ll=${CHURCH_COORDS.lat},${CHURCH_COORDS.lng}&navigate=yes`
                    break
            }
        } else {
            // Fallback without user location
            switch (app) {
                case 'google':
                    url = `https://www.google.com/maps/search/?api=1&query=${destination}`
                    break
                case 'apple':
                    url = `http://maps.apple.com/?q=${destination}`
                    break
                case 'waze':
                    url = `https://waze.com/ul?ll=${CHURCH_COORDS.lat},${CHURCH_COORDS.lng}&navigate=yes`
                    break
            }
        }

        window.open(url, '_blank')
    }

    // Copy address to clipboard
    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(CHURCH_ADDRESS)
            toast({
                title: "Address copied!",
                description: "The church address has been copied to your clipboard.",
            })
        } catch (error) {
            toast({
                title: "Copy failed",
                description: "Unable to copy address. Please copy it manually.",
                variant: "destructive"
            })
        }
    }

    // Estimate travel time based on distance
    const getEstimatedTravelTime = (miles: number) => {
        const drivingTime = Math.round(miles * 2.5) // Rough estimate: 2.5 minutes per mile in city
        const walkingTime = Math.round(miles * 20) // Rough estimate: 20 minutes per mile walking
        const transitTime = Math.round(miles * 4) // Rough estimate: 4 minutes per mile on transit

        return {
            driving: drivingTime,
            walking: walkingTime,
            transit: transitTime
        }
    }

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/934718/pexels-photo-934718.jpeg"
                    alt="Contact Us"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
                        Contact Us
                    </h1>
                    <p className="text-lg max-w-2xl">
                        We&apos;d love to hear from you! Reach out with any questions or prayer requests.
                    </p>
                </div>
            </section>

            {/* Contact Info & Form Section */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Contact Information */}
                        <div>
                            <h2 className="section-title mb-8">Get In Touch</h2>

                            <div className="space-y-8">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <MapPin className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold mb-1">Our Address</h3>
                                                <p className="text-gray-700 mb-2">{CHURCH_ADDRESS}</p>
                                                <Button
                                                    onClick={copyAddress}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy Address
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Phone className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Phone</h3>
                                                <p className="text-gray-700">Main Office: (240) 821-0361</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Mail className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Email</h3>
                                                <p className="text-gray-700">General Inquiries: info@efgbcssl.org</p>
                                                <p className="text-gray-700">Prayer Requests: prayer@efgbcssl.org</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Clock className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Office Hours</h3>
                                                <p className="text-gray-700">Monday - Saturday: 9:00 AM - 5:00 PM</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="section-title mb-8">Send a Message</h2>
                            <Card>
                                <CardContent className="p-6 md:p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input id="name" name="name" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input id="email" name="email" type="email" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" name='subject' required />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea id="message" name="message" rows={5} required />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-church-primary text-white hover:bg-church-primary/90"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                "Send Message"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Location & Directions Section */}
            <section className="py-16 bg-gray-50 dark:bg-gray-800">
                <div className="container-custom">
                    <h2 className="section-title centered">Find Us & Get Directions</h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                        We&apos;re conveniently located in Silver Spring. Get directions using your preferred navigation app.
                    </p>

                    <div className="max-w-4xl mx-auto">
                        {/* Location Status Card */}
                        <Card className="mb-8">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center">
                                        <Navigation className="h-6 w-6 text-church-primary mr-3" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Your Location</h3>
                                            {userLocation ? (
                                                <div className="text-sm text-gray-600">
                                                    <p>Location detected ✓</p>
                                                    {distance && (
                                                        <p className="font-medium text-church-primary">
                                                            {distance.toFixed(1)} miles from church
                                                        </p>
                                                    )}
                                                </div>
                                            ) : locationError ? (
                                                <p className="text-sm text-red-600">{locationError}</p>
                                            ) : (
                                                <p className="text-sm text-gray-600">Click to detect your location</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={getUserLocation}
                                        variant="outline"
                                        disabled={loadingLocation}
                                        className="shrink-0"
                                    >
                                        {loadingLocation ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Getting Location...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {userLocation ? "Update Location" : "Get My Location"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Travel Time Estimates */}
                        {distance && (
                            <Card className="mb-8">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-church-primary" />
                                        Estimated Travel Time
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(() => {
                                            const times = getEstimatedTravelTime(distance)
                                            return (
                                                <>
                                                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        <Car className="h-5 w-5 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium">Driving</p>
                                                            <p className="text-sm text-gray-600">{times.driving} minutes</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        <Train className="h-5 w-5 text-green-600" />
                                                        <div>
                                                            <p className="font-medium">Transit</p>
                                                            <p className="text-sm text-gray-600">{times.transit} minutes</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                                        <PersonStanding className="h-5 w-5 text-orange-600" />
                                                        <div>
                                                            <p className="font-medium">Walking</p>
                                                            <p className="text-sm text-gray-600">{times.walking} minutes</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">
                                        * Times are estimates based on distance and may vary with traffic and actual routes
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation Apps */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4">Open Directions In:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Button
                                        onClick={() => openDirections('google')}
                                        variant="outline"
                                        className="flex items-center justify-center gap-2 h-12"
                                    >
                                        <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">G</span>
                                        </div>
                                        Google Maps
                                    </Button>
                                    <Button
                                        onClick={() => openDirections('apple')}
                                        variant="outline"
                                        className="flex items-center justify-center gap-2 h-12"
                                    >
                                        <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                                            <span className="text-white text-xs">🗺</span>
                                        </div>
                                        Apple Maps
                                    </Button>
                                    <Button
                                        onClick={() => openDirections('waze')}
                                        variant="outline"
                                        className="flex items-center justify-center gap-2 h-12"
                                    >
                                        <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">W</span>
                                        </div>
                                        Waze
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Embedded Map Alternative */}
                        <Card className="mt-8">
                            <CardContent className="p-6">
                                <h3 className="font-semibold mb-4">Interactive Map</h3>
                                <div className="aspect-video rounded-lg overflow-hidden border">
                                    <iframe
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=-77.0361,-77.0161,38.9807,39.0007&layer=mapnik&marker=${CHURCH_COORDS.lat},${CHURCH_COORDS.lng}`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Church Location Map"
                                    ></iframe>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Silver Spring, MD
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Free parking available
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Metro accessible
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Appointment Form Section */}
            <AppointmentForm />
        </>
    )
}