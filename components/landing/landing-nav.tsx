"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold">
            BRNNO
          </Link>

          {/* CTA Button */}
          <div>
            <Link href="/signup" className="block">
              <Button className="w-full justify-center min-h-[44px]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
