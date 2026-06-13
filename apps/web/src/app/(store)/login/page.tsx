import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Headset,
  Mail,
  Star,
  Package,
  Users,
  Shield,
  RefreshCw,
  ThumbsUp
} from "lucide-react";
import PasswordInput from "./PasswordInput";

const stats = [
  { icon: Package, count: "50,000+", label: "Products" },
  { icon: Users, count: "10,000+", label: "Happy Customers" },
  { icon: Shield, count: "500+", label: "Trusted Brands" },
  { icon: Truck, count: "24/7", label: "Support" },
];

const features = [
  {
    icon: ShieldCheck,
    label: "100% Genuine Parts",
    desc: "Every part verified and certified",
  },
  {
    icon: Truck,
    label: "Fast Delivery",
    desc: "Same day delivery in Kathmandu valley",
  },
  {
    icon: Headset,
    label: "Expert Support",
    desc: "Our team helps you find the right part",
  },
];

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#EEF2F6] px-4 py-8 lg:px-8 lg:py-12">
      <div
        className="flex w-full max-w-[1400px] min-h-[82vh] overflow-hidden rounded-[2rem] shadow-2xl border border-white/60 bg-white"
        style={{ boxShadow: "0 20px 50px -12px rgba(15,23,42,0.12)" }}
      >
        {/* ── LEFT PANEL ── */}
        <div className="relative hidden lg:flex flex-col w-1/2 overflow-hidden">
          {/* Background image — warehouse & auto parts */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/login_left_panel_bg.png')",
            }}
          />
          {/* Navy/slate dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(10,25,47,0.92) 0%, rgba(15,23,42,0.75) 50%, rgba(15,23,42,0.2) 100%)",
            }}
          />

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            {/* Top: Headline & Subtitle */}
            <div className="space-y-6 mt-16">
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
                  Nepal&apos;s #1 <br />
                  Auto Parts Marketplace
                </h1>
                <p className="text-white/70 text-sm max-w-md leading-relaxed">
                  Find genuine parts for any vehicle. Fast delivery across Nepal.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/20 bg-white/12 backdrop-blur-md p-4 mt-16">
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

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex w-full lg:w-1/2 flex-col justify-center bg-[#F1F5F9] px-6 py-8 lg:p-12">
          <div className="w-full max-w-[460px] mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Card Content */}
            <div className="p-8 lg:p-10 pb-0">
              {/* Heading */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Welcome back! <span className="animate-bounce">👋</span>
                </h2>
                <p className="text-slate-500 text-sm">
                  Sign in to continue to your account
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4 mt-6" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-700 tracking-wide"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#94A3B8]"
                      strokeWidth={1.8}
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 py-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-slate-700 tracking-wide"
                  >
                    Password
                  </label>
                  <PasswordInput />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 transition-all"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign in Button */}
                <button
                  type="submit"
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white bg-[#0f46b3] hover:bg-[#0c3993] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Sign in
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 py-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">OR</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Register Link */}
              <p className="text-center text-sm text-slate-500 py-6">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* Bottom trust footer within the card */}
            <div className="bg-[#F8FAFC] border-t border-slate-100 px-6 py-5 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-800 leading-none">Secure & Safe</span>
                <span className="text-[8px] text-slate-500 leading-none mt-0.5">Your data is protected</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-slate-100">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-800 leading-none">Easy Returns</span>
                <span className="text-[8px] text-slate-500 leading-none mt-0.5">Hassle free returns</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ThumbsUp className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-800 leading-none">100% Satisfaction</span>
                <span className="text-[8px] text-slate-500 leading-none mt-0.5">We guarantee quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
