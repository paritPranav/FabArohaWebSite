// apps/client/src/app/contact/page.tsx
import type { Metadata } from 'next'
import { Mail, Instagram, Clock } from 'lucide-react'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us — FabAroha',
  description: 'Get in touch with the FabAroha team for any queries, order issues, or feedback.',
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-16">
      <div className="text-center mb-12">
        <p className="section-subtitle text-sage mb-3">We're Here</p>
        <h1 className="font-display text-5xl text-bark">Contact Us</h1>
        <p className="text-stone-400 text-sm mt-4 max-w-md mx-auto leading-relaxed">
          Have a question about your order, sizing, or anything else? We'd love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {[
          {
            icon: Mail,
            title: 'Email Us',
            value: 'hello@fabaroha.in',
            href: 'mailto:hello@fabaroha.in',
            sub: 'We reply within 24 hours',
          },
          {
            icon: Instagram,
            title: 'Instagram',
            value: '@fabaroha',
            href: 'https://instagram.com/fabaroha',
            sub: 'DMs welcome',
          },
          {
            icon: Clock,
            title: 'Support Hours',
            value: 'Mon – Sat',
            href: null,
            sub: '10 AM – 6 PM IST',
          },
        ].map(({ icon: Icon, title, value, href, sub }) => (
          <div key={title} className="bg-white rounded-2xl border border-cream-200 p-6 text-center shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center mx-auto mb-3">
              <Icon size={18} className="text-sage" />
            </div>
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{title}</p>
            {href ? (
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                className="font-medium text-bark hover:text-sage transition-colors">
                {value}
              </a>
            ) : (
              <p className="font-medium text-bark">{value}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <ContactForm />
    </div>
  )
}
