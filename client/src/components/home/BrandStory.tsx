'use client'
// apps/client/src/components/home/BrandStory.tsx
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Leaf, Heart, Gem } from 'lucide-react'

const PILLARS = [
  {
    icon: Heart,
    title: 'Made with Love',
    desc: 'Every garment is designed with genuine care — from the first sketch to the final stitch.',
  },
  {
    icon: Gem,
    title: 'Timeless Elegance',
    desc: 'Clean silhouettes and refined details that feel polished without trying too hard.',
  },
  {
    icon: Sparkles,
    title: 'Everyday Comfort',
    desc: 'Clothes that feel as good as they look — designed for real life, not just runways.',
  },
  {
    icon: Leaf,
    title: 'Built to Last',
    desc: 'Quality fabrics and construction that hold up through every wear, wash, and season.',
  },
]

export default function BrandStory() {
  return (
    <section className="bg-cream-100 border-y border-cream-300 py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Image collage */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="relative h-[520px] hidden lg:block"
        >
          <div className="absolute left-0 top-0 w-64 h-80 rounded-3xl overflow-hidden shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&q=80"
              alt="FabAroha elegance"
              fill className="object-cover"
            />
          </div>
          <div className="absolute right-0 bottom-0 w-72 h-72 rounded-3xl overflow-hidden shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
              alt="FabAroha earthy beauty"
              fill className="object-cover"
            />
          </div>

          {/* Brand meaning card */}
          <div className="absolute right-10 top-1/3 bg-parchment rounded-2xl shadow-card px-6 py-5 text-center border border-cream-300 max-w-[180px]">
            <p className="font-display text-2xl text-bark italic">FabAroha</p>
            <div className="h-px bg-cream-300 my-3" />
            <p className="text-2xs text-stone-400 leading-relaxed uppercase tracking-wide">
              Fashion · Love
            </p>
            <p className="text-2xs text-stone-400 leading-relaxed uppercase tracking-wide">
              Elegance · Earthy Beauty
            </p>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-subtitle text-sand mb-3">Who We Are</p>
          <h2 className="section-title mb-6">
            Fashion Crafted with
            <br />
            <em className="italic text-sand-400">Love &amp; Elegance</em>
          </h2>

          {/* Brand definition block */}
          <div className="bg-white border border-cream-300 rounded-2xl px-5 py-4 mb-6">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">What We Stand For</p>
            <p className="font-display text-xl text-bark">
              "Comfort, style, and elegance —
            </p>
            <p className="font-display text-xl text-sand-400 italic">
              crafted with love."
            </p>
          </div>

          <p className="text-stone-400 text-sm leading-relaxed mb-4">
            FabAroha was built on a simple idea — great clothing should make you feel confident, comfortable, and genuinely yourself. We design pieces for everyday living: refined enough to stand out, relaxed enough to stay in all day.
          </p>
          <p className="text-stone-400 text-sm leading-relaxed mb-8">
            Every collection is curated with intention — thoughtful cuts, quality construction, and a palette that works across moods, seasons, and occasions.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            {PILLARS.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-soft flex items-center justify-center flex-shrink-0 border border-cream-300">
                  <p.icon size={15} className="text-sand-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-bark">{p.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/about" className="btn-outline">Our Full Story</Link>
        </motion.div>
      </div>
    </section>
  )
}
