import Link from "next/link";
import { Mail, Phone, User, ShieldCheck, Truck, Headset, Package, Users, Shield, ArrowLeft } from "lucide-react";
import PasswordInput from "./PasswordInput";

const stats = [
  { icon: Package, count: "50,000+", label: "Products" },
  { icon: Users, count: "10,000+", label: "Happy Customers" },
  { icon: Shield, count: "500+", label: "Trusted Brands" },
  { icon: Truck, count: "24/7", label: "Support" },
];

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#EEF2F6] px-4 py-8 lg:px-8 lg:py-12">
      <div
        className="flex w-full max-w-[1400px] min-h-[82vh] overflow-hidden rounded-[2rem] shadow-2xl border border-white/60 bg-white"
        style={{ boxShadow: "0 20px 50px -12px rgba(15,23,42,0.12)" }}
      >
        {/* ── LEFT PANEL ── */}
        <div className="relative hidden lg:flex flex-col w-1/2 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85')",
              filter: "grayscale(50%) brightness(0.35)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(10,25,47,0.95) 0%, rgba(15,23,42,0.80) 50%, rgba(15,23,42,0.3) 100%)",
            }}
          />

          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            <div className="space-y-6 mt-10">
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
                  Join Nepal&apos;s #1 <br />
                  Auto Parts Marketplace
                </h1>
                <p className="text-white/70 text-sm max-w-md leading-relaxed">
                  Create your account and get access to 50,000+ genuine parts with fast delivery across Nepal.
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-4 pt-2">
                {[
                  { icon: ShieldCheck, label: "100% Genuine Parts", desc: "Every part verified and certified" },
                  { icon: Truck, label: "Fast Delivery", desc: "Same day delivery in Kathmandu valley" },
                  { icon: Headset, label: "Expert Support", desc: "Our team helps you find the right part" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 mt-0.5">
                      <Icon className="h-4 w-4 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md p-4 mt-4">
                {stats.map(({ icon: Icon, count, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white leading-none">{count}</p>
                      <p className="text-[9px] text-white/60 font-semibold mt-1 leading-none tracking-wide">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6 border-t border-white/10">
              <p className="text-white/40 text-xs">
                Already have an account?{" "}
                <Link href="/login" className="text-white/70 font-semibold hover:text-white transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex w-full lg:w-1/2 flex-col bg-white px-10 xl:px-10 pt-12 pb-6 relative">

          {/* Back button */}
          <div className="absolute top-6 right-10 z-20">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
          </div>

          <div className="space-y-3 mt-10">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
              Create account
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Fill in your details to get started
            </p>
          </div>

          <form className="flex flex-col mt-8 space-y-4 flex-1" noValidate>

            {/* First name + Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="first-name" className="block text-xs font-bold text-slate-700 tracking-wide">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="first-name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="last-name" className="block text-xs font-bold text-slate-700 tracking-wide">
                  Last name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
                  <input
                    id="last-name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 tracking-wide">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 tracking-wide">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+977 98XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide">
                Password
              </label>
              <PasswordInput />
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer shrink-0" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer"
            >
              Create account
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">OR</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-slate-500 pb-2">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
