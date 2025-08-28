"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    //{ name: 'Blog', href: '/blog' },
    { name: 'Donation', href: '/donations' },
    { name: 'Resources', href: '/resources' },
    { name: 'Contact', href: '/contact' }
]

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/80 backdrop-blur-md py-4'
            }`}>
            <nav className="container-custom flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/logo.png"
                            alt="EFGBC Logo"
                            width={40}
                            height={40}
                        />
                        <span className="font-heading text-xl font-bold text-church-primary">EFGBCSSL</span>
                    </Link>
                </div>

                {/* Desktop navigation */}
                <div className="hidden md:flex md:gap-x-8 items-center">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`navlink ${pathname === item.href ? 'active' : ''}`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Link href="/donations">
                        <Button className="bg-church-primary hover:bg-church-primary/90 text-white">
                            Donate
                        </Button>
                    </Link>

                </div>

                {/* Mobile menu button */}
                <div className="flex md:hidden">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2 text-gray-700"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="sr-only">Open main menu</span>
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="space-y-1 px-4 pb-3 pt-2 bg-white shadow-lg animate-fade-in">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block rounded-md px-3 py-2 text-base font-medium ${pathname === item.href
                                    ? 'text-church-primary font-semibold'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link href="/donations">
                            <Button className="w-full mt-3 bg-church-primary hover:bg-church-primary/90 text-white">
                                Donate
                            </Button>
                        </Link>

                    </div>
                </div>
            )}
        </header>
    )
}