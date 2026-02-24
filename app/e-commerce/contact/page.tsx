"use client";

import React from "react";
import Navigation from "@/components/ecommerce/Navigation";
import { Phone, MapPin, MessageCircle, Clock } from "lucide-react";

const locations = [
  { title: "Mirpur 12",         address: "Level 3, Hazi Kujrat Ali Mollah Market, Mirpur 12", phone: "01942565664" },
  { title: "Jamuna Future Park",address: "3C-17A, Level 3, Jamuna Future Park",                phone: "01307130535" },
  { title: "Bashundhara City",  address: "38, 39, 40, Block D, Level 5, Bashundhara City",     phone: "01336041064" },
];

export default function ContactPage() {
  return (
    <div className="ec-root min-h-screen" style={{ background: 'var(--ink)' }}>
      <Navigation />

      {/* ── Header ── */}
      <section className="ec-page-section relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-80 w-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />
        </div>
        <div className="ec-container relative">
          <div className="ec-dark-tag mb-6">Get in Touch</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(44px, 7vw, 88px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.02em', color: 'white' }}>
            We're Here<br />
            <span style={{ fontWeight: 600, color: 'var(--gold)' }}>For You</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Visit any of our three stores, call us directly, or reach out via WhatsApp. We're always happy to help.
          </p>
        </div>
      </section>

      {/* ── Stores ── */}
      <section className="ec-page-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="ec-container">
          <p className="ec-eyebrow mb-4">Store Locations</p>
          <h2 className="mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 500, color: 'white' }}>
            Visit Us In Person
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {locations.map(loc => (
              <div key={loc.title} className="ec-dark-card ec-dark-card-hover p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(176,124,58,0.15)', border: '1px solid rgba(176,124,58,0.2)' }}>
                  <MapPin className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-3">{loc.title}</h3>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>{loc.address}</p>
                <a href={`tel:${loc.phone}`} className="flex items-center gap-2 text-[13px] font-medium transition-colors" style={{ color: 'var(--gold-light)' }}
                   onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                   onMouseLeave={e => (e.currentTarget.style.color = 'var(--gold-light)')}>
                  <Phone className="h-3.5 w-3.5" />
                  {loc.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick contact cards ── */}
      <section className="ec-page-section">
        <div className="ec-container">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Phone,         title: 'Call Us',          sub: 'Available during store hours', action: 'tel:01942565664',              cta: '01942565664',      gold: true },
              { icon: MessageCircle, title: 'WhatsApp',         sub: 'For international orders too', action: 'https://wa.me/8801942565664', cta: 'Chat on WhatsApp', gold: false },
              { icon: Clock,         title: 'Store Hours',      sub: 'Sat – Thu: 10am – 9pm\nFri: 2pm – 9pm', action: null, cta: null, gold: false },
            ].map(({ icon: Icon, title, sub, action, cta, gold }) => (
              <div key={title} className="ec-dark-card p-6 flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: gold ? 'rgba(176,124,58,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${gold ? 'rgba(176,124,58,0.2)' : 'rgba(255,255,255,0.09)'}` }}>
                  <Icon className="h-5 w-5" style={{ color: gold ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-[13px] whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                </div>
                {action && cta && (
                  <a href={action} target={action.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                     className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                     style={{ color: 'var(--gold-light)' }}
                     onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                     onMouseLeave={e => (e.currentTarget.style.color = 'var(--gold-light)')}>
                    {cta} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
