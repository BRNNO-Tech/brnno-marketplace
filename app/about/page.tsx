'use client';

import { ShieldCheck, Zap, Lightbulb, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
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

      <main className="pt-20">
        {/* --- HERO SECTION --- */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent -z-10" />
          
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-blue-900">
              About BRNNO
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Streamlining the mobile detailing industry, one booking at a time.
            </p>
          </div>
        </section>

        {/* --- MISSION SECTION --- */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Our Mission</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                At BRNNO, we believe that the discovery process, scheduling, and payments should be seamless for both customers and service professionals. Our mission is to empower the mobile detailing industry with cutting-edge technology that simplifies operations, enhances customer experiences, and drives growth.
              </p>

            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-white rounded-2xl aspect-video flex items-center justify-center border border-slate-100 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                <span className="relative z-10 font-bold text-slate-400 uppercase tracking-widest text-sm">Team Image</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- VALUES SECTION --- */}
        <section className="bg-white border-y border-slate-100 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Our Core Values</h2>
              <div className="h-1.5 w-16 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <ValueCard 
                icon={<Zap className="w-8 h-8 text-blue-600" />}
                title="Simplicity"
                desc="Powerful tools shouldn't be complicated. We build interfaces that work as fast as you do."
              />
              <ValueCard 
                icon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
                title="Reliability"
                desc="Your business depends on us. We provide a stable, secure platform you can trust 24/7."
              />
              <ValueCard 
                icon={<Lightbulb className="w-8 h-8 text-blue-600" />}
                title="Innovation"
                desc="We're constantly evolving our lead recovery and automation tools based on your feedback."
              />
            </div>
          </div>
        </section>

        {/* --- TEAM SECTION --- */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-20 tracking-tight text-slate-900">The Founders</h2>
          <div className="grid md:grid-cols-3 gap-16">
            <TeamMember 
              name="Adrian Smithee"
              role="Co-founder & CEO"
              desc="Nearly 20 years of sales leadership with a deep focus on helping service businesses win more work."
            />
            <TeamMember 
              name="Johnathan Jake"
              role="Co-founder & CTO"
              desc="Leads our technical team, ensuring BRNNO stays ahead with cutting-edge lead recovery tech."
            />
            <TeamMember 
              name="Sam Christmas"
              role="Co-founder & CFO"
              desc="Dedicated to ensuring every customer has the financial support and strategy to succeed."
            />
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-[#4461F2] rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight relative z-10">
              Ready?
            </h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium relative z-10">
              Join us and experience the future of mobile detailing.
            </p>
            <Link
              href="/quiz"
              className="inline-block bg-white text-[#4461F2] px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition shadow-lg relative z-10"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

/* --- REUSABLE COMPONENTS --- */

function ValueCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-3xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    </div>
  )
}

function TeamMember({ name, role, desc }: { name: string, role: string, desc: string }) {
  return (
    <div className="text-center group">
      <div className="bg-slate-100 rounded-full w-40 h-40 mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition duration-500" />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Photo</span>
      </div>
      <h3 className="text-xl font-bold mb-1 text-slate-900">{name}</h3>
      <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-4">{role}</p>
      <p className="text-slate-500 text-sm leading-relaxed max-w-[250px] mx-auto font-medium">
        {desc}
      </p>
    </div>
  )
}