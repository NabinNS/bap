// app/(store)/layout.tsx
import { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FBFF" }}>
      <Navbar />

      <main className="flex-1 px-4 py-6">{children}</main>

      <Footer />
    </div>
  );
}
