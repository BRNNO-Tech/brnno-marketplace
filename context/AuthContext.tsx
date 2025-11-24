'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Role = "customer" | "provider" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthContextType>({ user: null, role: null, loading: true });

  useEffect(() => {
    // Safety timeout to avoid perpetual loading if Firebase listener never resolves
    const safetyTimeout = setTimeout(() => {
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, 5000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, loading: false });
        clearTimeout(safetyTimeout);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        const role = (data?.role as Role) ?? null;
        setState({ user, role, loading: false });
        clearTimeout(safetyTimeout);
      } catch (err) {
        // If role fetch fails, still allow UI to proceed as logged-in user with no role
        console.error("Firestore error:", err);
        setState({ user, role: null, loading: false });
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsub();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

