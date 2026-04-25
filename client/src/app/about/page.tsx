// apps/client/src/app/about/page.tsx
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About Us — FabAroha',
  description: 'Learn about FabAroha — fashion built for style, comfort, and everyday elegance.',
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <p className="section-subtitle text-sage mb-3">Who We Are</p>
        <h1 className="font-display text-5xl md:text-6xl text-bark">About FabAroha</h1>
        <p className="text-stone-400 text-sm mt-5 max-w-xl mx-auto leading-relaxed">
          FabAroha is a fashion brand built around one belief — clothing should make you feel genuinely good. Confident, comfortable, and completely yourself.
        </p>
      </div>

      {/* Image banner */}
      <div className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden mb-16 bg-cream-200">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
          alt="FabAroha"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bark/50 to-transparent" />
        <p className="absolute bottom-8 left-0 right-0 text-center font-display text-3xl text-white">
          Dressed for your life. Not just the occasion.
        </p>
      </div>

      {/* Values */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { title: 'Style First', body: 'Every piece is designed to look good and feel intentional — whether you\'re at work, out with friends, or just going about your day.' },
          { title: 'Built for Comfort', body: 'We obsess over fit, fabric, and finish. Clothes that move with you, breathe with you, and hold up to real life.' },
          { title: 'Made with Care', body: 'From concept to delivery, every garment goes through a process driven by quality — not speed, not shortcuts.' },
        ].map(v => (
          <div key={v.title} className="bg-cream-50 rounded-2xl p-8">
            <h3 className="font-display text-xl text-bark mb-3">{v.title}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{v.body}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl text-bark mb-5">Our Mission</h2>
        <p className="text-stone-400 text-sm leading-relaxed">
          To make quality clothing accessible and approachable — pieces you actually reach for, not just own. We want getting dressed to feel easy, confident, and a little bit special every single day.
        </p>
      </div>
    </div>
  )
}
