'use client';

import Link from 'next/link'
import { ChevronLeft, ShieldCheck, Clock, Ban, HelpCircle } from 'lucide-react'
import Footer from '@/components/landing/footer'

export default function CustomerAgreementPage() {
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
          <div className="mb-12 border-b border-slate-100 pb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-blue-900">
              Customer Agreement
            </h1>
            <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">
              Last Updated: {effectiveDate}
            </p>
          </div>

          <div className="space-y-12">
            {/* Overview Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Overview of Service</h2>
              <p className="text-slate-600 leading-relaxed font-medium">
                Brnno operates an online marketplace connecting you with independent mobile vehicle detailing providers. 
                <span className="text-blue-600 font-bold"> Please note:</span> Brnno facilitates the booking and payment, 
                but services are performed by independent Providers who are not employees or agents of Brnno.
              </p>
            </section>

            {/* Payment & Escrow Section */}
            <section className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-blue-900">Secure Booking & Payment</h2>
              </div>
              <p className="text-blue-800/80 mb-6 font-medium">
                All services must be prepaid in full. Your payment is held securely in <span className="font-bold">escrow</span> until the service is completed.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">Escrow Period</p>
                  <p className="text-slate-600">Funds are held until job completion confirmation.</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <p className="font-bold text-blue-900 mb-1">Release Window</p>
                  <p className="text-slate-600">Payments reach providers 24-48h after your review window.</p>
                </div>
              </div>
            </section>

            {/* Cancellation Policy Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Ban className="text-slate-900" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">Cancellations & Refunds</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 underline decoration-blue-500 underline-offset-4">Customer-Initiated</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <Clock size={16} className="mt-1 text-blue-500 shrink-0" />
                      <span><strong>24h+ Notice:</strong> Full refund minus 5% processing fee.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <Clock size={16} className="mt-1 text-red-500 shrink-0" />
                      <span><strong>Under 24h:</strong> Refund at Brnno's discretion.</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 underline decoration-blue-500 underline-offset-4">Provider-Initiated</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    If a Provider fails to appear, you will receive a <strong>full refund</strong> or the option to reschedule with another available professional.
                  </p>
                </div>
              </div>
            </section>

            {/* Dispute Process */}
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">The 24-Hour Review Window</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium mb-6">
                Once a service is marked complete, you have <span className="font-bold text-slate-900">24 hours</span> to raise a dispute. You must provide photos and written details. Brnno’s decision regarding refunds or credits is final.
              </p>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No Refunds Issued For:</p>
                <ul className="text-xs space-y-2 text-slate-500 font-bold">
                  <li>• Subjective dissatisfaction (not related to quality)</li>
                  <li>• Failure to provide vehicle access at scheduled time</li>
                  <li>• Cancellations made after the detailer has arrived on-site</li>
                </ul>
              </div>
            </section>

            {/* Legal Block */}
            <section className="pt-12 border-t border-slate-100 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 text-center">Governing Law</h2>
              <p className="text-slate-500 text-sm leading-relaxed text-center font-medium">
                This Agreement is governed by the laws of the **State of Utah**. Any disputes shall be resolved through binding arbitration in Utah, administered by the American Arbitration Association.
              </p>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">
                  Brnno, LLC • West Jordan, Utah
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