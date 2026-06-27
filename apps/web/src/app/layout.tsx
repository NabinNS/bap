import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { Toaster } from "sonner";
import "@/styles/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Auto Parts Nepal",
  description: "Auto Parts Nepal is a platform for buying and selling auto parts in Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${notoDevanagari.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          visibleToasts={5}
          duration={4000}
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-plus-jakarta)",
            },
          }}
        />
      </body>
    </html>
  );
}
