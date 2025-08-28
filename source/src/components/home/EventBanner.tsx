"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'

type Event = {
  id: string
  title: string
  description?: string
  date: string
  time: string
  location: string
  imageSrc: string
  ctaText: string
  ctaLink: string
  order: number
  expiresAt: string
}

export default function EventBanner({ events }: { events: Event[] }) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])

  useEffect(() => {
    // Filter out expired events and sort by order
    const now = new Date()
    const validEvents = events
      .filter(event => new Date(event.expiresAt) > now)
      .sort((a, b) => a.order - b.order)

    setFilteredEvents(validEvents)
    setCurrentEventIndex(0)
  }, [events])

  useEffect(() => {
    if (filteredEvents.length <= 1) return

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) =>
        prev === filteredEvents.length - 1 ? 0 : prev + 1
      )
    }, 8000)

    return () => clearInterval(interval)
  }, [filteredEvents])

  if (filteredEvents.length === 0) return null

  const currentEvent = filteredEvents[currentEventIndex]

  return (
    <section className="relative bg-gray-50 text-gray-900 overflow-hidden rounded-xl shadow-lg">
      <div className="container-custom py-8 md:py-12">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Event Image */}
          <div className="w-full lg:w-2/3 h-64 md:h-80 lg:h-96 relative rounded-lg overflow-hidden shadow-md bg-gray-200">
            <div className="w-full">
              <Image
                src={currentEvent.imageSrc}
                alt={currentEvent.title}
                width={800}   // max width you allow
                height={600}  // just a ratio, Next.js keeps aspect ratio
                style={{ width: '100%', height: 'auto' }}
                className="object-cover"
                priority
              />
            </div>

            {/* Image overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          </div>

          {/* Event Content */}
          <div className="w-full lg:w-1/3 flex flex-col justify-center p-4 md:p-6 lg:p-8">
            <Badge />
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3 mt-2">
              {currentEvent.title}
            </h2>

            <div className="flex items-center text-church-primary mb-3">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="font-medium">
                {currentEvent.date} • {currentEvent.time}
              </span>
            </div>

            <p className="mb-2 text-gray-700">
              <span className="font-semibold">Location:</span> {currentEvent.location}
            </p>

            {currentEvent.description && (
              <p className="mb-6 text-gray-600">{currentEvent.description}</p>
            )}

            <Button
              className="bg-church-primary text-white hover:bg-church-primary/90 group w-full sm:w-auto"
              onClick={() => window.open(currentEvent.ctaLink, '_blank')}
            >
              {currentEvent.ctaText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Navigation dots */}
            {filteredEvents.length > 1 && (
              <div className="flex justify-center lg:justify-start space-x-2 mt-6">
                {filteredEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentEventIndex(idx)}
                    className={`w-3 h-3 rounded-full ${idx === currentEventIndex
                      ? 'bg-church-primary'
                      : 'bg-gray-300 hover:bg-gray-400'
                      } transition-colors`}
                    aria-label={`View event ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Badge() {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-church-primary/10 text-church-primary uppercase tracking-wide mb-2">
      Featured Event
    </span>
  )
}