'use client';

import ContactForm from '@/components/contact-form'
import { Phone, Mail, MapPin, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* Simple Header for Subpages */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900">
            BRNNO
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
            <ChevronLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-20 overflow-hidden">
        {/* Soft background gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10" />

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-blue-900">
            Get in Touch
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Have questions? Need help choosing a plan? We're here to help you scale your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-8 text-slate-900">Contact Information</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Phone</h3>
                    <a href="tel:+18016137887" className="text-blue-600 font-semibold hover:underline">
                      (801) 613-7887
                    </a>
                    <p className="text-sm text-slate-400 mt-1 font-medium uppercase tracking-wider">
                      Mon-Fri, 9am-5pm MST
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Email</h3>
                    <a href="mailto:support@brnno.com" className="text-blue-600 font-semibold hover:underline">
                      support@brnno.com
                    </a>
                    <p className="text-sm text-slate-400 mt-1 font-medium uppercase tracking-wider">
                      Response within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Address</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      7533 S Center View CT # 4801<br />
                      West Jordan, UT 84084
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 text-center md:text-left">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">
                Proudly based in Utah
              </p>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
            <ContactForm />
          </div>
        </div>
      </main>
    </div>
  )
}