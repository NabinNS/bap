// app/(store)/layout.tsx
import { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F7FA" }}>
      <Navbar />

      <main className="flex flex-1 min-h-0 flex-col">{children}</main>

      <Footer />
    </div>
  );
}
