import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, HandCoins, Sparkles } from 'lucide-react'

export default function DonationSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-church-primary/95 to-church-primary text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-church-secondary blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-church-secondary blur-xl"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-5 w-5 text-church-secondary" />
            <span className="text-sm font-medium">Make a Difference</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
            Choose Your Way to Give
          </h2>

          <div className="w-16 h-1 bg-church-secondary mx-auto mb-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <HandCoins className="h-8 w-8 mx-auto mb-3 text-church-secondary" />
              <h3 className="font-semibold mb-2">Tithe</h3>
              <p className="text-sm text-gray-200">Faithful obedience to God by giving the first 10% of your income. Your tithe sustains church ministry, worship, and discipleship. (Malachi 3:10)</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <HandCoins className="h-8 w-8 mx-auto mb-3 text-church-secondary" />
              <h3 className="font-semibold mb-2">Offerings</h3>
              <p className="text-sm text-gray-200">Gifts beyond the tithe, given from a grateful heart to bless others and expand ministry. (2 Corinthians 9:7)
</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <HandCoins className="h-8 w-8 mx-auto mb-3 text-church-secondary" />
              <h3 className="font-semibold mb-2">Building Fund</h3>
              <p className="text-sm text-gray-200">Supports maintenance, improvements, and expansion of our church facilities, creating a welcoming place for worship. (Psalm 127:1)</p>
            </div>
          </div>

          <p className="text-lg mb-8 text-gray-100">
            <span className="font-semibold text-church-secondary">Every gift matters</span> - whether large or small.
            Join <span className="font-semibold">Us</span> in supporting our mission.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild className="bg-church-secondary hover:bg-church-secondary/90 text-church-dark px-8 py-6 text-lg font-bold shadow-lg hover:scale-105 transition-transform group">
              <Link href="/donations" className="flex items-center">
                <Heart className="mr-2 h-5 w-5 group-hover:fill-red-500 transition-colors" />
                Give Now
              </Link>
            </Button>

            <Button asChild variant="outline" className="bg-church-primary border-white/30 hover:bg-white/10 hover:border-white/50 text-white px-8 py-6 text-lg transition-colors">
              <Link href="/about" className="flex items-center">
                See Our Impact
              </Link>
            </Button>
          </div>

          {/*<p className="text-sm text-white/70 mt-6">
            All donations are tax-deductible. 100% goes directly to ministry work.
          </p>*/}
        </div>
      </div>
    </section>
  )
}