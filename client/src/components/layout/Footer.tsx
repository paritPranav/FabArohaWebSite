'use client'
// apps/client/src/components/layout/Footer.tsx
import Link from 'next/link'
import { Instagram, Twitter, Mail, Sparkles } from 'lucide-react'

const LINKS = {
  Shop: [['Collections', '/collections'], ['Women', '/products?category=Women'], ['Men', '/products?category=Men'], ['Sale', '/products?tag=sale']],
  Help: [['Size Guide', '/size-guide'], ['Track Order', '/track'], ['About Us', '/about'], ['Our Story', '/our-story'], ['Contact Us', '/contact']],
}

export default function Footer() {
  return (
    <footer className="bg-cream-100 border-t border-cream-300 mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="font-display text-3xl text-bark">FabAroha</Link>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Sparkles size={10} className="text-sand-400" />
              <p className="text-xs text-stone-400 italic">
                Style · Comfort · Elegance — crafted with love
              </p>
            </div>
            <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-xs">
              We design clothing for real life — quality pieces made with care, built for style, comfort, and the confidence to show up as yourself.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center text-stone-400 hover:bg-sage hover:text-white transition-all">
                <Instagram size={15} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center text-stone-400 hover:bg-sage hover:text-white transition-all">
                <Twitter size={15} />
              </a>
              <a href="mailto:hello@fabaroha.in"
                className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center text-stone-400 hover:bg-sage hover:text-white transition-all">
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="section-subtitle text-xs mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-stone-400 hover:text-bark transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-14 pt-10 border-t border-cream-300 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl text-bark">
              Stay in the <em className="italic text-sand-400">Loop</em>
            </p>
            <p className="text-sm text-stone-400 mt-1">
              New drops, styling stories &amp; seasonal offers — crafted with love.
            </p>
          </div>
          <form className="flex items-center gap-2 w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="your@email.com" className="input flex-1 py-2.5" />
            <button type="submit" className="btn-primary whitespace-nowrap py-2.5 px-5">Subscribe</button>
          </form>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-10">
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} FabAroha. All rights reserved.</p>
          <p className="text-xs text-stone-400">
            Style · Comfort · Elegance · Love
          </p>
        </div>
      </div>
    </footer>
  )
}
