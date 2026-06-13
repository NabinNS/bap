import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className=" bg-primary text-primary-foreground">
      <div className="px-4 md:px-8 lg:px-12 py-10 border-t border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Summary */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2 text-white text-xl font-bold">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-primary font-bold">
                B
              </div>
              <span>BAP</span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Genuine auto parts, fast delivery, and trusted service to keep your vehicle running at its best.
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
              Shop
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/categories" className="hover:text-white transition-colors">
                  Browse by Category
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-white transition-colors">
                  Deals &amp; Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns &amp; Warranty
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Information
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-white/70" />
                <span>+977-9812345678</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-white/70" />
                <span>support@bap.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-white/70" />
                <span>Kathmandu, Nepal</span>
              </li>
            </ul>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                aria-label="Visit Facebook"
                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-white hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Visit Instagram"
                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-white hover:text-primary transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Visit Twitter"
                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-white hover:text-primary transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} BAP. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
