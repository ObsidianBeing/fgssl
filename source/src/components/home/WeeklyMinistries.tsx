"use client"

import { Calendar, Clock, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type MinistryItem = {
  id: number
  title: string
  amharicTitle?: string
  day: string
  amharicDay?: string
  time: string
  location: string
  category: string
  description?: string
  amharicDescription?: string
  phone?: string
}

const ministryItems: MinistryItem[] = [
  {
    id: 1,
    title: "Early Morning Teleconference Prayer",
    amharicTitle: "የማለዳ ፀሎት (በቴሌ ኮንፍራንስ)",
    day: "Monday & Thursday",
    amharicDay: "ሰኞ እና ሐሙስ",
    time: "5:00 AM – 6:00 AM",
    location: "Teleconference",
    category: "prayer",
    phone: "https://meetings.dialpad.com/room/efgbcssl",
  },
  {
    id: 2,
    title: "Prayer (Teleconference)",
    amharicTitle: "የፀሎት ጊዜ (በቴሌ ኮንፍራንስ)",
    day: "Tuesday",
    amharicDay: "ማክሰኞ",
    time: "7:00 PM – 9:00 PM",
    location: "Teleconference",
    category: "prayer",
    phone: "https://meetings.dialpad.com/room/efgbcssl"
  },
  {
    id: 3,
    title: "Prayer & Word of God",
    amharicTitle: "የፀሎት እና ተከታታይ ትምህርቶች",
    day: "Wednesday",
    amharicDay: "ዕረቡ",
    time: "7:00 PM – 9:00 PM",
    location: "Church Sanctuary",
    category: "study",
  },
  {
    id: 4,
    title: "Worship Service",
    amharicTitle: "የአምልኮ ፕሮግራም",
    day: "Sunday",
    amharicDay: "እሁድ",
    time: "10:00 AM – 1:00 PM",
    location: "Church Sanctuary",
    category: "worship",
  },
  {
    id: 5,
    title: "Prayer & Consultation",
    amharicTitle: "የማማከር እና የፀሎት አገልግሎት",
    day: "Monday",
    amharicDay: "ሰኞ",
    time: "2:00 PM – 4:00 PM",
    location: "Church Sanctuary / Prayer Room",
    category: "consultation",
  },
  {
    id: 6,
    title: "Prayer for Healing & Holy Spirit Fulfillment",
    amharicTitle: "ለመንፈስ ቅዱስ ሙላት እና ለህመምተኞች የሚፀለይበት ጊዜ",
    day: "Wednesday",
    amharicDay: "ዕረቡ",
    time: "11:00 AM – 1:00 PM",
    location: "Church Sanctuary",
    category: "prayer",
  },
  {
    id: 7,
    title: "Prayer & Consultation",
    amharicTitle: "የማማከር እና የፀሎት አገልግሎት",
    day: "Saturday",
    amharicDay: "ቅዳሜ",
    time: "2:00 PM – 6:00 PM",
    location: "Church Sanctuary / Prayer Room",
    category: "consultation",
  },
]

const categoryColors: Record<string, string> = {
  worship: "bg-blue-100 text-blue-800",
  study: "bg-purple-100 text-purple-800",
  prayer: "bg-yellow-100 text-yellow-800",
  consultation: "bg-green-100 text-green-800",
}

export default function WeeklyMinistries() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="section-title centered">Weekly Ministries / የሳምንቱ አገልግሎቶች</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          Join us in prayer, worship, and fellowship throughout the week.
          አብረውን ያምልኩ ይፀልዩ ቃል ይካፈሉ ሁላችሁም ተጋብዛቹሃል።
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministryItems.map((item) => (
            <Card key={item.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-heading">
                    {item.title}
                    {item.amharicTitle && (
                      <div className="text-sm text-gray-500">{item.amharicTitle}</div>
                    )}
                  </CardTitle>
                  <Badge className={categoryColors[item.category] || "bg-gray-100 text-gray-800"}>
                    {item.category}
                  </Badge>
                </div>
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
                {item.amharicDescription && (
                  <CardDescription className="text-gray-500">{item.amharicDescription}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.day}{item.amharicDay && ` / ${item.amharicDay}`}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-church-primary" />
                    <span>{item.location}</span>
                  </div>
                  {item.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-church-primary" />
                      {item.phone.startsWith('http') ? (
                        <a href={item.phone} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
                          {item.phone}
                        </a>
                      ) : (
                        <a 
                        href={`tel:${item.phone.replace(/[^\d+]/g, '')}`} 
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
                          <span>{item.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
