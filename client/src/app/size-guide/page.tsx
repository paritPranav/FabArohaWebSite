// apps/client/src/app/size-guide/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide — Fab Aroha',
  description: 'Find your perfect fit with our detailed size guide for women and men.',
}

const WOMEN = [
  { size: 'XS', chest: '32–33',  waist: '24–25',  hips: '34–35'  },
  { size: 'S',  chest: '34–35',  waist: '26–27',  hips: '36–37'  },
  { size: 'M',  chest: '36–37',  waist: '28–29',  hips: '38–39'  },
  { size: 'L',  chest: '38–40',  waist: '30–32',  hips: '40–42'  },
  { size: 'XL', chest: '41–43',  waist: '33–35',  hips: '43–45'  },
  { size: 'XXL',chest: '44–46',  waist: '36–38',  hips: '46–48'  },
]

const MEN = [
  { size: 'S',  chest: '36–38',  waist: '30–32',  shoulder: '17'   },
  { size: 'M',  chest: '39–41',  waist: '33–35',  shoulder: '17.5' },
  { size: 'L',  chest: '42–44',  waist: '36–38',  shoulder: '18'   },
  { size: 'XL', chest: '45–47',  waist: '39–41',  shoulder: '18.5' },
  { size: 'XXL',chest: '48–50',  waist: '42–44',  shoulder: '19'   },
]

export default function SizeGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-16">
      <div className="text-center mb-14">
        <p className="section-subtitle text-sage mb-3">Fit First</p>
        <h1 className="font-display text-5xl text-bark">Size Guide</h1>
        <p className="text-stone-400 text-sm mt-4 max-w-md mx-auto leading-relaxed">
          All measurements are in inches. When between sizes, we recommend sizing up for a relaxed fit or down for a closer fit.
        </p>
      </div>

      {/* How to measure */}
      <div className="bg-cream-100 rounded-3xl p-8 mb-12">
        <h2 className="font-display text-2xl text-bark mb-5">How to Measure</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-stone-500">
          <div>
            <p className="font-medium text-bark mb-1">Chest / Bust</p>
            Measure around the fullest part of your chest, keeping the tape parallel to the ground.
          </div>
          <div>
            <p className="font-medium text-bark mb-1">Waist</p>
            Measure around your natural waist — the narrowest part of your torso.
          </div>
          <div>
            <p className="font-medium text-bark mb-1">Hips</p>
            Measure around the fullest part of your hips, about 8 inches below your waist.
          </div>
        </div>
      </div>

      {/* Women */}
      <h2 className="font-display text-3xl text-bark mb-6">Women</h2>
      <div className="overflow-x-auto mb-12 rounded-2xl border border-cream-200">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              {['Size', 'Chest (in)', 'Waist (in)', 'Hips (in)'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-stone-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {WOMEN.map(r => (
              <tr key={r.size} className="hover:bg-cream-50">
                <td className="px-5 py-3 font-display text-bark text-lg">{r.size}</td>
                <td className="px-5 py-3 text-stone-500">{r.chest}</td>
                <td className="px-5 py-3 text-stone-500">{r.waist}</td>
                <td className="px-5 py-3 text-stone-500">{r.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Men */}
      <h2 className="font-display text-3xl text-bark mb-6">Men</h2>
      <div className="overflow-x-auto rounded-2xl border border-cream-200">
        <table className="w-full text-sm">
          <thead className="bg-cream-100">
            <tr>
              {['Size', 'Chest (in)', 'Waist (in)', 'Shoulder (in)'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-stone-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {MEN.map(r => (
              <tr key={r.size} className="hover:bg-cream-50">
                <td className="px-5 py-3 font-display text-bark text-lg">{r.size}</td>
                <td className="px-5 py-3 text-stone-500">{r.chest}</td>
                <td className="px-5 py-3 text-stone-500">{r.waist}</td>
                <td className="px-5 py-3 text-stone-500">{r.shoulder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-400 mt-6 text-center">
        Still unsure? Email us at{' '}
        <a href="mailto:hello@fabaroha.in" className="text-bark hover:underline">hello@fabaroha.in</a>
        {' '}and we'll help you find your fit.
      </p>
    </div>
  )
}
