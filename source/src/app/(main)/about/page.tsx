'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, MapPin, Heart, Users, Cross, BookOpen, Handshake, Droplet, Flame } from 'lucide-react'

const missionPoints = [
    "Worship God authentically and passionately",
    "Grow in biblical knowledge and spiritual maturity",
    "Serve one another and our community with love",
    "Share the good news of Jesus locally and globally"
]

const coreValues = [
    {
        title: "ፍቅር (Love)",
        description: "እግዚአብሔር ፍቅር ነው። ያለ እውነተኛ ፍቅር ሁሉ ከንቱ ነው። (1ኛ ቆሮ.13፡1-3; ማቴ.22፡35-40)",
        icon: <Heart className="h-8 w-8 text-red-500 mx-auto" />
    },
    {
        title: "አንድነት (Unity)",
        description: "እኛ የመንፈስና የልብ አንድነትን ለመጠበቅ እንተጋለን። (ዮሐ.17፡21-23; ኤፌ.4፡1-3)",
        icon: <Users className="h-8 w-8 text-blue-500 mx-auto" />
    },
    {
        title: "ጥንታዊ ጴንጠቆስጤያዊነት (Pentecostal Faith)",
        description: "ዳግም የተወለደ አማኝ በመንፈስ ቅዱስ ይጠመቃል። (ሐዋ.2፡1-4; ሐዋ.10፡44-45)",
        icon: <Flame className="h-8 w-8 text-orange-500 mx-auto" />
    },
    {
        title: "ቅድስና (Holiness)",
        description: "ያለ ቅድስና እግዚአብሔርን ማየት አይቻልም። (1ኛ ጴጥ.1፡15-16; ዕብ.12፡14)",
        icon: <Cross className="h-8 w-8 text-green-600 mx-auto" />
    },
    {
        title: "አጋርነት (Fellowship)",
        description: "የክርስቶስ አካል አንድ ነው። ሁሉ በመከባበርና በመጋራት እንሰራለን። (ኤፌ.4፡1-6; 1ቆሮ.12፡14-31)",
        icon: <Handshake className="h-8 w-8 text-purple-500 mx-auto" />
    },
    {
        title: "ጾምና ጸሎት (Fasting & Prayer)",
        description: "መጾምና መፀለይ መጽሐፍ ቅዱሳዊ ልምምድ ነው። (ሐዋ.1፡14; ሐዋ.13፡1-3)",
        icon: <Droplet className="h-8 w-8 text-cyan-600 mx-auto" />
    }
]

const churchStaff = [
    { id: 1, name: "Pastor Fitsum Yab", role: "Pastor", image: "https://res.cloudinary.com/dvdbepqiv/image/upload/v1756056464/fistum_y2jfj5.jpg", bio: "Serving our community with Love and Compassion" },
]

const branches = [
    {
        id: 1,
        name: "Main Campus",
        address: "914 Silver Spring Ave, Suite 204 B, Silver Spring, MD 20910, USA",
        services: "Sunday 9:00 AM & 11:00 AM",
        image: "https://res.cloudinary.com/dvdbepqiv/image/upload/v1756056610/photo_2025-06-14_07-30-54_zci12v.jpg"
    },
]

export default function AboutPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[400px] md:h-[500px] overflow-hidden">
                <Image
                    src="https://res.cloudinary.com/dvdbepqiv/image/upload/v1756056554/WhatsApp_Image_2025-08-24_at_20.08.47_0549bcc5_cf8vmx.jpg"
                    alt="A church congregation during worship service"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-heading drop-shadow-lg">
                        ስለ ቤተክርስቲያናችን (About Our Church)
                    </h1>
                    <p className="text-xl max-w-2xl drop-shadow">
                        እግዚአብሔርን በፍቅር ለማምለክና ሌሎችን ለማገልገል የተሰጠ ህብረት
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            {/* Vision & Mission */}
            <section className="py-16" role="region" aria-labelledby="vision-mission">
                <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Vision */}
                    <div>
                        <h2 id="vision-mission" className="section-title">ዓላማ</h2>
                        <div className="space-y-3 text-lg text-gray-700 mb-6">
                            <p>
                                ጌታችን ኢየሱስ ክርስቶስ ለቤተ ክርስቲያን የሰጠውን ታላቁን ተልእኮ፣
                                ማለትም የወንጌሉን ቃል፣ ላልሰሙት እና ላላመኑት ሰዎች ሁሉ መስበክ፡፡ (ማር. 16፡15)
                            </p>
                            <p>
                                የወንጌሉን ቃል አምነው የዳኑትን እያጠመቁ እና የእግዚአብሔርን ቃል እያስተማሩ ደቀ መዛሙርት ማድረግ፡፡ (ማቴ. 28፡19)
                            </p>
                            <p>
                                ሁለንተናዊ አገልግሎት መስጠት፡፡ (ያዕ. 1፡27)
                            </p>
                        </div>
                        <div className="bg-church-primary/5 p-6 rounded-lg border-l-4 border-church-primary">
                            <p className="italic text-gray-700">
                                "ራእይ ባይኖር ሕዝብ መረን ይሆናል፤ ሕግን የሚጠብቅ ግን የተመሰገነ ነው።"
                            </p>
                            <p className="text-right text-gray-500 mt-2">- Proverbs 29:18</p>
                        </div>
                    </div>

                    {/* Mission */}
                    <div>
                        <h2 className="section-title">የአጥቢያ ቤተክርስትያን ተጨማሪ እሴቶች </h2>
                        <ul className="space-y-3 text-lg text-gray-700 mb-6">
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-church-primary mr-2 mt-1 flex-shrink-0" />
                                <span>እግዚአብሔርን መውደድ፣ መፍራትና ማምለክ፤</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-church-primary mr-2 mt-1 flex-shrink-0" />
                                <span>አገልጋይነት፣ ተዓማኒነትና ግልጽነት፤</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-church-primary mr-2 mt-1 flex-shrink-0" />
                                <span>የህይወት ምሳሌነት፤</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-church-primary mr-2 mt-1 flex-shrink-0" />
                                <span>የወንጌል ማህበርተኛነት፤</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>


            {/* Core Values */}
            <section className="py-16 bg-gray-50" role="region" aria-labelledby="core-values">
                <div className="container-custom">
                    <h2 id="core-values" className="section-title centered text-3xl font-bold mb-6">
                        እሴቶች (Core Values)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                        {coreValues.map((value, index) => (
                            <Card
                                key={index}
                                className="text-center bg-white shadow-md rounded-2xl p-6 hover:shadow-xl transition-transform hover:-translate-y-1"
                            >
                                <CardContent>
                                    {value.icon}
                                    <h3 className="text-xl font-bold mt-4 text-church-primary">{value.title}</h3>
                                    <p className="text-gray-600 mt-2 text-sm">{value.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Staff Section */}
            <section className="py-16 bg-gray-50" role="region" aria-labelledby="leadership-team">
                <div className="container-custom">
                    <h2 id="leadership-team" className="section-title centered">Our Leadership Team</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        Meet the dedicated leaders who serve our church community with passion and dedication.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {churchStaff.map((staff) => (
                            <div key={staff.id} className="group text-center">
                                <div className="relative h-64 mb-4 overflow-hidden rounded-lg card-hover transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <Image
                                        src={staff.image}
                                        alt={`Portrait of ${staff.name}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-church-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
                                <p className="text-church-primary font-medium mb-2">{staff.role}</p>
                                <p className="text-gray-600">{staff.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Branch Locator */}
            <section className="py-16" role="region" aria-labelledby="our-locations">
                <div className="container-custom">
                    <h2 id="our-locations" className="section-title centered">Our Locations</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        You can find us at the following locations:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {branches.map((branch) => (
                            <div key={branch.id} className="card-hover transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                    <Image
                                        src={branch.image}
                                        alt={`Image of ${branch.name}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6 border border-t-0 border-gray-200 rounded-b-lg">
                                    <h3 className="text-xl font-bold mb-2">{branch.name}</h3>
                                    <div className="flex items-start mb-2">
                                        <MapPin className="h-5 w-5 text-church-primary flex-shrink-0 mt-0.5 mr-2" aria-hidden="true" />
                                        <p className="text-gray-600">{branch.address}</p>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        <span className="font-medium">Service Times:</span> {branch.services}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    (position) => {
                                                        const { latitude, longitude } = position.coords;
                                                        const destination = encodeURIComponent(branch.address);
                                                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destination}`;
                                                        window.open(mapsUrl, '_blank');
                                                    },
                                                    () => {
                                                        alert("Location access denied. Please enable location to get directions.");
                                                    }
                                                );
                                            } else {
                                                alert("Geolocation is not supported by your browser.");
                                            }
                                        }}
                                        aria-label={`Get directions to ${branch.name}`}
                                    >
                                        Get Directions
                                    </Button>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
