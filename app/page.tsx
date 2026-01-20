'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  MapPin, 
  Phone, 
  Mail,
  ShieldCheck,
  Zap,
  DollarSign,
  Star,
  Truck,
  Clock 
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!loading && user) {
      router.push('/profile');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center p-6 min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 text-white">
        <div className="max-w-4xl text-center z-10">
          <h1 className="text-5xl text-zinc-200 md:text-7xl font-bold mb-6 tracking-tight">
            Brnno Marketplace
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 font-light">
            Pro Auto Detailing, Uber-Fast Booking. <br className="hidden md:block" />
            Fair Prices, Secure Payments.
          </p>
          <Link
            href="/quiz"
            className="inline-block bg-zinc-200 hover:bg-zinc-600 text-black font-bold py-4 px-10 rounded-full text-lg transition transform hover:scale-105 shadow-2xl"
          >
            Book Your Perfect Detail
          </Link>
          <p className="mt-6 text-sm opacity-60 uppercase tracking-widest">Mobile detailing made easy</p>
        </div>
      </section>

      {/* Why Choose Brnno Section */}
      <section className="bg-white text-gray-900 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Brnno?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Feature 
              icon={<ShieldCheck className="w-8 h-8 text-blue-600" />} 
              title="Vetted Professionals" 
              desc="All detailers are verified, licensed, and insured. We check backgrounds so you don't have to." 
            />
            <Feature 
              icon={<Zap className="w-8 h-8 text-blue-600" />} 
              title="Instant Booking" 
              desc="Book your detailer in minutes. No calls, no waiting—just pick a time that works for you." 
            />
            <Feature 
              icon={<DollarSign className="w-8 h-8 text-blue-600" />} 
              title="Transparent Pricing" 
              desc="See exact prices upfront. No surprises, no hidden fees—just fair, transparent pricing." 
            />
            <Feature 
              icon={<Star className="w-8 h-8 text-blue-600" />} 
              title="Real Reviews" 
              desc="Read honest reviews from verified customers. See ratings, photos, and service history." 
            />
            <Feature 
              icon={<Truck className="w-8 h-8 text-blue-600" />} 
              title="Mobile Service" 
              desc="Detailers come to you. Book service at home, work, or anywhere convenient." 
            />
            <Feature 
              icon={<Clock className="w-8 h-8 text-blue-600" />} 
              title="24/7 Support" 
              desc="Questions or issues? Our support team is here to help, whenever you need us." 
            />
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-zinc-50 border-t border-zinc-200 pt-16 pb-8 px-6 text-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tighter text-blue-900">BRNNO</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                The all-in-one marketplace and business management platform for pro detailers and service-based businesses.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-zinc-600">
                  <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                  <span>7533 S Center View CT # 4801<br />West Jordan, UT 84084</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <Phone className="h-5 w-5 text-blue-600 shrink-0" />
                  <a href="tel:+18016137887" className="hover:text-blue-600 transition">(801) 613-7887</a>
                </div>
                <div className="flex items-center gap-3 text-zinc-600">
                  <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                  <a href="mailto:support@brnno.com" className="hover:text-blue-600 transition">support@brnno.com</a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-zinc-400">Company</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="/about" className="text-zinc-600 hover:text-blue-600 transition">About Us</Link></li>
                <li><Link href="/contact" className="text-zinc-600 hover:text-blue-600 transition">Contact</Link></li>
                <li>
                  <a href="https://g.page/r/CVPJkZDVH3EgEAE/review" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-blue-600 transition">
                    Google Business
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-zinc-400">Legal</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="/legal/privacy-policy/" className="text-zinc-600 hover:text-blue-600 transition">Privacy Policy</Link></li>
                <li><Link href="/legal/provider-agreement/" className="text-zinc-600 hover:text-blue-600 transition">Provider Agreement</Link></li>
                <li><Link href="/legal/customer-agreement/" className="text-zinc-600 hover:text-blue-600 transition">Customer Agreement</Link></li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-zinc-400">Follow Us</h4>
              <div className="flex gap-5">
                <SocialLink href="https://www.facebook.com/share/17dT73gNAu/?mibextid=wwXIfr" icon={<Facebook className="h-5 w-5" />} />
                <SocialLink href="https://www.instagram.com/getbrnno" icon={<Instagram className="h-5 w-5" />} />
                <SocialLink href="https://x.com/JohnJake228812" icon={<Twitter className="h-5 w-5" />} />
                <SocialLink href="https://linkedin.com/company/brnno" icon={<Linkedin className="h-5 w-5" />} />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            <p>&copy; {currentYear} BRNNO. All rights reserved.</p>
            <p>Made with pride in Utah</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Helper Components to keep code clean */
function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 transform transition hover:rotate-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-sm"
    >
      {icon}
    </a>
  );
}