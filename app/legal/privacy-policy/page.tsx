'use client';

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Footer from '@/components/landing/footer'

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* --- SUBPAGE HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
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

      <main className="relative pt-32 pb-20 px-6">
        {/* Soft background gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10" />

        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-16">
          <div className="mb-12 border-b border-slate-100 pb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-blue-900">
              Privacy Policy
            </h1>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                BRNNO ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">2. Information We Collect</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-blue-600 mb-2 uppercase tracking-wide">2.1 Information You Provide</h3>
                  <ul className="space-y-3">
                    {['Account information (name, email, phone number)', 'Business information (business name, address, service area)', 'Payment information (processed securely through Stripe)', 'Customer and job data you input into the platform'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-blue-600 mb-2 uppercase tracking-wide">2.2 Automatically Collected Information</h3>
                  <ul className="space-y-3">
                    {['Device information and IP address', 'Usage data and analytics', 'Cookies and similar tracking technologies'].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">3. How We Use Your Information</h2>
              <p className="text-slate-600 mb-6 font-medium">We use the information we collect to:</p>
              <ul className="grid md:grid-cols-2 gap-4">
                {[
                  'Maintain and improve our services',
                  'Process transactions securely',
                  'Send administrative updates',
                  'Provide customer support',
                  'Monitor usage patterns',
                  'Detect technical issues'
                ].map((item, i) => (
                  <li key={i} className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm font-bold border border-slate-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">4. Information Sharing</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                We do not sell your personal information. We may share your information only with service providers who assist in operating our platform, when required by law, or with your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">5. Data Security</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-blue-900">10. Contact Us</h2>
              <p className="text-blue-800/80 mb-6 font-medium">
                If you have questions about this Privacy Policy, please contact our privacy team:
              </p>
              <div className="space-y-3 text-sm font-bold text-blue-900">
                <p>Email: <a href="mailto:privacy@brnno.com" className="text-blue-600 underline underline-offset-4">privacy@brnno.com</a></p>
                <p>Phone: <a href="tel:+18016137887" className="text-blue-600 underline underline-offset-4">(801) 613-7887</a></p>
                <p className="text-blue-900/60">Address: 7533 S Center View CT # 4801, West Jordan, UT 84084</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}