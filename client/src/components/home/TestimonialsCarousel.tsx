'use client'
// apps/client/src/components/home/TestimonialsCarousel.tsx
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import Image from 'next/image'

interface Testimonial {
  _id: string
  name: string
  image?: string
  description: string
  rating: number
}

const SLIDE_INTERVAL = 4500

export default function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/testimonials`)
      .then(r => r.ok ? r.json() : { testimonials: [] })
      .then(d => setTestimonials(d.testimonials || []))
      .catch(() => {})
  }, [])

  const go = useCallback((dir: 1 | -1) => {
    setDirection(dir)
    setCurrent(c => (c + dir + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  // Auto-advance
  useEffect(() => {
    if (testimonials.length < 2 || paused) return
    const id = setInterval(() => go(1), SLIDE_INTERVAL)
    return () => clearInterval(id)
  }, [testimonials.length, paused, go])

  if (testimonials.length === 0) return null

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  const t = testimonials[current]

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-subtitle text-blush mb-2">Happy Customers</p>
          <h2 className="section-title">What They Say</h2>
        </div>

        <div
          className="relative max-w-2xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Quote icon */}
          <div className="absolute -top-6 left-8 text-cream-300 pointer-events-none">
            <Quote size={52} strokeWidth={1} />
          </div>

          {/* Card */}
          <div className="relative min-h-[260px] flex items-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={t._id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.38, ease: 'easeInOut' }}
                className="w-full bg-white rounded-3xl border border-cream-200 shadow-soft px-8 py-8 md:px-12"
              >
                {/* Stars */}
                <div className="flex mb-5">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={18}
                      className={s <= (t.rating ?? 5) ? 'text-sand-400 fill-sand-400' : 'text-cream-300'}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-stone-500 text-base md:text-lg leading-relaxed mb-6 font-body">
                  "{t.description}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {t.image ? (
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-cream-200">
                      <Image src={t.image} alt={t.name} width={44} height={44} className="object-cover w-full h-full"/>
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0 font-display text-bark text-lg border-2 border-cream-300">
                      {t.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-bark text-sm">{t.name}</p>
                    <p className="text-2xs text-stone-400 uppercase tracking-widest mt-0.5">Verified Customer</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / Next */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-cream-200 shadow-soft flex items-center justify-center text-stone-400 hover:text-bark hover:shadow-hover transition-all z-10"
              >
                <ChevronLeft size={18}/>
              </button>
              <button
                onClick={() => go(1)}
                className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-cream-200 shadow-soft flex items-center justify-center text-stone-400 hover:text-bark hover:shadow-hover transition-all z-10"
              >
                <ChevronRight size={18}/>
              </button>
            </>
          )}

          {/* Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-6 h-2 bg-bark'
                      : 'w-2 h-2 bg-cream-300 hover:bg-stone-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
