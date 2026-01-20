'use client'; // Layouts can be client components if needed for hooks

import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isLandingPage = pathname === "/";

  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {!isLandingPage && <NavBar />}
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}