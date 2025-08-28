"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import slide1 from '@/assets/images/slide1.jpg'
import slide2 from '@/assets/images/slide2.jpg'
import slide3 from '@/assets/images/slide3.jpg'
import slide4 from '@/assets/images/slide4.jpg'
import slide5 from '@/assets/images/slide5.jpg'

const slides = [
  {
    id: 1,
    image: slide1,
    title: "The Ethiopian Full Gospel Belivers Church (Silver Spring Local)",
    subtitle: "የኢትዮጵያ ሙሉ ወንጌል አማኞች ቤተ ክርስቲያን (ሲልቨር ስፕሪንግ አጥቢያ)",
    buttonText: "Join Us Sunday",
    buttonLink: "/",
  },
  {
    id: 2,
    image: slide2,
    title: "Experience Worship",
    subtitle: "Connect with God and fellow believers",
    buttonText: "Service Times",
    buttonLink: "/",
  },
  {
    id: 3,
    image: slide3,
    title: "Make a Difference",
    subtitle: "Serve in our community outreach programs",
    buttonText: "Get Involved",
    buttonLink: "/donations",
  },
  {
    id: 4,
    image: slide4,
    title: "Make a Difference",
    subtitle: "Serve in our community outreach programs",
    buttonText: "Get Involved",
    buttonLink: "/donations",
  },
  {
    id: 5,
    image: slide5,
    title: "Make a Difference",
    subtitle: "Serve in our community outreach programs",
    buttonText: "Get Involved",
    buttonLink: "/donations",
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="container-custom h-full flex flex-col justify-center items-start relative z-20 text-white">
            <div className="max-w-xl animate-slide-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-heading">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-100">
                {slide.subtitle}
              </p>
              <Button
                size="lg"
                className="bg-church-secondary text-church-dark hover:bg-church-secondary/90 font-medium text-lg"
                asChild
              >
                <a href={slide.buttonLink}>{slide.buttonText}</a>
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-church-secondary' : 'bg-white/60'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}