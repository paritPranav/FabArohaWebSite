'use client'

export default function ContactForm() {
  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-8">
      <h2 className="font-display text-2xl text-bark mb-6">Send a Message</h2>
      <form
        onSubmit={e => e.preventDefault()}
        className="space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input type="text" className="input" placeholder="Priya Sharma" required />
          </div>
          <div>
            <label className="label">Email or Phone</label>
            <input type="text" className="input" placeholder="your@email.com or 98765 43210" required />
          </div>
        </div>
        <div>
          <label className="label">Subject</label>
          <select className="input">
            <option>Order Issue</option>
            <option>Return / Exchange</option>
            <option>Sizing Question</option>
            <option>Payment Query</option>
            <option>Product Feedback</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input resize-none" rows={5} placeholder="Tell us what's on your mind…" required />
        </div>
        <button type="submit" className="btn-primary w-full py-3">
          Send Message
        </button>
        <p className="text-xs text-stone-400 text-center">
          For fastest help on orders, email us with your Order ID.
        </p>
      </form>
    </div>
  )
}
