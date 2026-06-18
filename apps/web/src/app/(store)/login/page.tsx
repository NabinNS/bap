import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Headset,
  Package,
  Users,
  Shield,
  ArrowLeft
} from "lucide-react";
import LoginForm from "@/features/auth/components/LoginForm";

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
    <div className="flex flex-1 items-center justify-center bg-[#EEF2F6] px-4 py-6 lg:px-8 lg:py-12">
      <div
        className="flex w-full max-w-[1400px] min-h-[78vh] overflow-hidden rounded-[2rem] shadow-2xl border border-white/60 bg-white"
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
                <h1 className="text-display font-extrabold leading-tight ">
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
        <div className="flex w-full lg:w-1/2 flex-col bg-white px-10 xl:px-10 pt-12 pb-12 relative">

          {/* Back button at the top right */}
          <div className="absolute top-6 right-10 z-20">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all px-4 py-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
          </div>

          {/* Top content wrapper to match Left Panel layout */}
          <div className="space-y-6 mt-10">
            {/* Heading aligned with Left Panel's heading */}
            <div className="space-y-3">
              <h2 className="text-h1 font-extrabold  text-text-default">
                Welcome back!
              </h2>
              <p className="text-text-body text-sm max-w-md leading-relaxed">
                Sign in to continue to your account
              </p>
            </div>

            {/* Form starting at the same level as the Left Panel's info/stats card */}
            <LoginForm />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold text-text-subtle tracking-wider">OR</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-text-body hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Register Link */}
            <p className="text-center text-sm text-text-body">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
