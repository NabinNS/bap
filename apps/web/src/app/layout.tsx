import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";
import "@/styles/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600"],
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
        <QueryProvider>
          {children}
        </QueryProvider>
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
