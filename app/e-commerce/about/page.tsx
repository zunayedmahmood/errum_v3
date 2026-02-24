'use client';

import React from 'react';
import Navigation from '@/components/ecommerce/Navigation';
import Link from 'next/link';
import { CheckCircle2, Truck, Gem, HeartHandshake, MapPin, Phone } from 'lucide-react';

const STORES = [
  { name: 'Mirpur 12',       address: 'Level 3, Hazi Kujrat Ali Mollah Market, Mirpur 12', phone: '01942565664' },
  { name: 'Jamuna Future Park', address: '3C-17A, Level 3, Jamuna Future Park',              phone: '01307130535' },
  { name: 'Bashundhara City',   address: '38, 39, 40, Block D, Level 5, Bashundhara City',  phone: '01336041064' },
];

const VALUES = [
  { icon: Gem,           title: 'Premium Quality',    desc: 'Every product is hand-selected for craftsmanship, material quality, and lasting durability.' },
  { icon: CheckCircle2,  title: 'Authentic Sourcing', desc: 'We source directly from verified suppliers — no counterfeits, ever.' },
  { icon: Truck,         title: 'Fast Nationwide Delivery', desc: 'Reliable delivery across all of Bangladesh, with real-time order tracking.' },
  { icon: HeartHandshake,title: 'Customer First',     desc: 'Responsive support before, during, and after every purchase.' },
];

export default function AboutPage() {
  return (
    <div className="ec-root min-h-screen" style={{ background: 'var(--ink)' }}>
      <Navigation />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden ec-page-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #8fa0c8 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="ec-container relative">
          <div className="ec-dark-tag mb-6">About Errum</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(44px, 8vw, 96px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: 'white' }}>
            More Than<br />
            <span style={{ fontWeight: 600, color: 'var(--gold)' }}>a Brand</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Errum is Bangladesh's premium lifestyle destination — fashion, footwear, accessories, and fragrances, curated for those who refuse to compromise on style or quality.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/e-commerce/products" className="ec-btn ec-btn-gold">Shop Collection</Link>
            <Link href="/e-commerce/contact"  className="ec-btn" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>Find a Store</Link>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="ec-page-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="ec-container">
          <p className="ec-eyebrow mb-4">Our Promise</p>
          <h2 className="mb-10" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 500, color: 'white', letterSpacing: '-0.01em' }}>
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="ec-dark-card ec-dark-card-hover p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(176,124,58,0.15)', border: '1px solid rgba(176,124,58,0.2)' }}>
                  <Icon className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-white">{title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="ec-page-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="ec-container">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="ec-eyebrow mb-4">Our Story</p>
              <h2 className="mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 500, color: 'white', letterSpacing: '-0.01em', lineHeight: 1.05 }}>
                Born in Dhaka,<br />
                <span style={{ color: 'var(--gold)' }}>Built for You</span>
              </h2>
              <div className="space-y-4 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <p>Errum was founded with a simple belief: everyone deserves access to premium fashion without the premium price tag. We started small — a single store in Mirpur — and grew into a brand trusted by thousands across Bangladesh.</p>
                <p>Today, with three physical locations and a growing online presence, we continue to handpick every product in our catalogue, ensuring authenticity, quality, and style that stands the test of time.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['2020', 'Founded'], ['3', 'Stores'], ['500+', 'Products'], ['10k+', 'Customers']].map(([val, lbl]) => (
                <div key={lbl} className="ec-dark-card p-6 text-center">
                  <div className="text-4xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold)' }}>{val}</div>
                  <div style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>{lbl.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stores ── */}
      <section className="ec-page-section">
        <div className="ec-container">
          <p className="ec-eyebrow mb-4">Visit Us</p>
          <h2 className="mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 500, color: 'white', letterSpacing: '-0.01em' }}>
            Our Stores
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STORES.map(store => (
              <div key={store.name} className="ec-dark-card ec-dark-card-hover p-5">
                <h3 className="text-[15px] font-semibold text-white mb-3">{store.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <Phone className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                    <span>{store.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
