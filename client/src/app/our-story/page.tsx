// apps/client/src/app/our-story/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Story — FabAroha',
  description: 'The story behind FabAroha — how a love for great clothing and real people came together.',
}

export default function OurStoryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-16">
      <div className="text-center mb-14">
        <p className="section-subtitle text-sage mb-3">How It Began</p>
        <h1 className="font-display text-5xl text-bark">Our Story</h1>
      </div>

      <div className="space-y-6 text-stone-500 text-sm leading-relaxed">
        <p className="text-lg text-bark font-light leading-loose">
          FabAroha started with a frustration we all share — finding clothes that actually fit well, look great, and last more than a season.
        </p>
        <p>
          The name comes from two simple ideas: <em>Fab</em> — for the craft of fashion — and <em>Aroha</em> — love, in the Māori language. Together, they stand for what we do: make fashion with love. Not trends, not throwaway pieces, but clothing built with real intention.
        </p>
        <p>
          We started small. A handful of silhouettes, a clean palette, and a commitment to getting the details right. Our customers noticed. They didn't just want something to wear — they wanted pieces that felt like them. Comfortable. Considered. Confident.
        </p>
        <div className="bg-cream-100 rounded-2xl p-8 my-10 border-l-4 border-sage">
          <p className="font-display text-2xl text-bark leading-snug">
            "We make clothes for people, not mannequins."
          </p>
        </div>
        <p>
          Every collection we release goes through the same question: would we wear this ourselves? If the fit isn't right, we go back. If the fabric doesn't feel good to touch, we change it. We move slowly by design.
        </p>
        <p>
          Today, FabAroha ships across India. We're growing — but we haven't changed what matters. Every order is still packed with care. Every piece is still made to last.
        </p>
        <p>
          If you're here, you've already found something that caught your eye. We hope it earns a permanent spot in your wardrobe.
        </p>
        <p className="font-display text-xl text-bark mt-8">
          — The FabAroha Team
        </p>
      </div>
    </div>
  )
}
