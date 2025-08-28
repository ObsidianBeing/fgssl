import Link from 'next/link'
import { Facebook,  Instagram, Youtube, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { FaTiktok } from 'react-icons/fa';
import Image from 'next/image'

const navigation = {
    main: [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Donation', href: '/donation' },
        { name: 'Resources', href: '/resources' },
        { name: 'Contact', href: '/contact' },
    ],
    social: [
        { name: 'Facebook', icon: Facebook, href: '#' },
        { name: 'TikTok', icon: FaTiktok, href: 'https://www.tiktok.com/@thewordoflife82?_t=ZP-8zAsSYujGT1&_r=1' },
        { name: 'Instagram', icon: Instagram, href: '#' },
        { name: 'Youtube', icon: Youtube, href: '#' },
    ],
}

const Footer = () => {
    return (
        <footer className="bg-church-primary text-white">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Church Info */}
                    <div>
                        <Link href="/" className="flex items-center space-x-2">
                            <Image
                                src="/fg-logo.jpg"
                                alt="EFGBC Logo"
                                width={40}
                                height={40}
                            />
                            <span className="font-heading text-xl font-bold">EFGBCSSL</span>
                        </Link>
                        <p className="text-gray-300 mb-6">
                            Transforming lives through faith, hope, and love. Join our community and be part of something greater.
                        </p>
                        <div className="flex space-x-4">
                            {navigation.social.map((item) => (
                                <Link key={item.name} href={item.href} className="text-gray-300 hover:text-church-secondary">
                                    <span className="sr-only">{item.name}</span>
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 font-heading">Quick Links</h3>
                        <ul className="space-y-3">
                            {navigation.main.map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-gray-300 hover:text-church-secondary transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 font-heading">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-church-secondary flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300">914 Silver Spring Ave, Suite 204 B, Silver Spring, MD 20910, USA</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-church-secondary flex-shrink-0" />
                                <span className="text-gray-300"><a href="tel:2408210361">(240) 821-0361</a></span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-church-secondary flex-shrink-0" />
                                <span className="text-gray-300"><a href="mailto:info@efgbcssl.org">info@efgbcssl.org</a></span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Clock className="h-5 w-5 text-church-secondary flex-shrink-0 mt-0.5" />
                                <div className="text-gray-300">
                                    <p>Sunday Service: 9:00 AM & 11:00 AM</p>
                                    <p>Weekday Office: 9:00 AM - 5:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-8 border-gray-700" />

                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-center md:text-left">
                        <p className="text-gray-300 text-sm">
                            &copy; {new Date().getFullYear()} Ethiopian Full Gospel Believers Church. All rights reserved.
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Developed by Next Level Media Events and Communications PLC
                        </p>
                    </div>
                    <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
                        <Link href="/" className="text-gray-300 hover:text-church-secondary">
                            Privacy Policy
                        </Link>
                        <Link href="/" className="text-gray-300 hover:text-church-secondary">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
