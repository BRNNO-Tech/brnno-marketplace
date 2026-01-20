'use client';

import Link from 'next/link'
import { ChevronLeft, Scale, ShieldAlert, Gavel, UserCheck } from 'lucide-react'
import Footer from '@/components/landing/footer'

export default function ProviderAgreementPage() {
  const effectiveDate = "November 6, 2025";

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
          <div className="mb-12 border-b border-slate-100 pb-8 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-blue-900">
              Provider Agreement
            </h1>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">
              Effective Date: {effectiveDate}
            </p>
          </div>

          <div className="space-y-12">
            {/* Introduction Section */}
            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-slate-600 leading-relaxed font-medium italic">
                By accessing or using the Brnno website or related services, you agree to be bound by these Terms. This Agreement sets forth the terms governing your relationship with Brnno and our Customers.
              </p>
            </section>

            {/* Relationship Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">Independent Contractor</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                You are an independent contractor, not an employee, agent, or partner of Brnno. You are solely responsible for:
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Determining how to perform services and supplying your own tools.',
                  'Covering all transportation and material expenses.',
                  'Managing all applicable taxes, insurance, and local permits.',
                  'Compliance with all local, state, and federal environmental laws.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 font-medium text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Fees Section */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                <h3 className="text-blue-900 font-bold mb-2">Platform Commission</h3>
                <p className="text-4xl font-black text-blue-600 mb-2">15%</p>
                <p className="text-blue-800/70 text-sm font-medium">
                  Deducted automatically from each completed booking for Platform usage.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-slate-900 font-bold mb-2">Payout Window</h3>
                <p className="text-4xl font-black text-slate-700 mb-2">24-48h</p>
                <p className="text-slate-500 text-sm font-medium">
                  Released after the 24-hour dispute window expires following job completion.
                </p>
              </div>
            </section>

            {/* Cancellations & Disputes */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">Cancellations & Disputes</h2>
              </div>
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed font-medium">
                  Customers have 24 hours to report issues. Brnno makes final determinations regarding refunds in good faith.
                </p>
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <p className="text-red-900 text-sm font-bold">
                    No-Show Policy: If you fail to appear for a confirmed appointment, the Customer receives a full refund and you forfeit all payment.
                  </p>
                </div>
              </div>
            </section>

            {/* Prohibited Conduct */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Prohibited Conduct</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Circumventing the payment system',
                  'Soliciting Customers for off-platform transactions',
                  'Harassment or fraudulent activity',
                  'Misrepresenting qualifications or identity'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm font-bold">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {/* Legal Section */}
            <section className="bg-slate-900 p-8 rounded-3xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <Gavel className="text-blue-400" size={24} />
                <h2 className="text-2xl font-bold">Governing Law & Arbitration</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                This Agreement is governed by the laws of the **State of Utah**. Any disputes arising out of this Agreement shall be resolved through binding arbitration in Utah, administered by the American Arbitration Association.
              </p>
              <div className="border-t border-slate-800 pt-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Entire Agreement • Brnno, LLC • Utah, USA
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}