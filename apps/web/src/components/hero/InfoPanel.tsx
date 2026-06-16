import React from "react";
import { Package, Users, ShieldCheck } from "lucide-react";

const Clock24Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l.57-1.19" />
    <text
      x="12"
      y="15"
      fontSize="7.5"
      fontWeight="900"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      24
    </text>
  </svg>
);

const items = [
  {
    id: 1,
    title: "15,000+",
    description: "Products",
    icon: Package,
  },
  {
    id: 2,
    title: "5,000+",
    description: "Happy Customers",
    icon: Users,
  },
  {
    id: 3,
    title: "100%",
    description: "Genuine Products",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "24Hr",
    description: "Fast Delivery",
    icon: Clock24Icon,
  },
];

export default function InfoPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-6 px-6 md:px-8 lg:px-12 w-full">
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:divide-x lg:divide-gray-200/80 items-center justify-between gap-6 lg:gap-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 w-full justify-start sm:justify-center lg:justify-center lg:px-8 first:lg:pl-0 last:lg:pr-0"
            >
              <div className="flex-shrink-0 text-[#092d50]">
                <Icon className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-extrabold text-[#092d50] leading-tight">
                  {item.title}
                </span>
                <span className="text-xs md:text-sm text-gray-500 font-semibold mt-0.5">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
