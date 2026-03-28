export type ProductDetail = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  galleryImages: string[];
};

export type Review = {
  id: string;
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  comment: string;
  date: string;
};

export type ProductQuestion = {
  id: string;
  question: string;
  answer: string;
};

export const productCatalog: Record<string, ProductDetail> = {
  "1": {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
    category: "Brakes",
    description:
      "Premium ceramic brake pads designed for low dust, smooth braking, and reliable stopping performance for daily city and highway use.",
    galleryImages: [
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "2": {
    id: "2",
    name: "High-Performance Air Filter",
    price: 24.5,
    originalPrice: 32,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
    category: "Engine",
    description:
      "High-flow air filter that improves intake efficiency while maintaining strong filtration for better engine breathing and response.",
    galleryImages: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "3": {
    id: "3",
    name: "Premium Synthetic Motor Oil",
    price: 38,
    rating: 5,
    image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
    category: "Lubricants",
    description:
      "Advanced synthetic motor oil for improved thermal stability, wear protection, and cleaner engine performance over long intervals.",
    galleryImages: [
      "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "4": {
    id: "4",
    name: "Halogen Headlight Bulb",
    price: 15.99,
    originalPrice: 19.99,
    rating: 4,
    image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
    category: "Electrical",
    description:
      "Bright and durable halogen bulb with stable beam focus, helping improve visibility and confidence during night driving.",
    galleryImages: [
      "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "5": {
    id: "5",
    name: "Shock Absorber Front Set",
    price: 120,
    originalPrice: 150,
    rating: 5,
    image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
    category: "Suspension",
    description:
      "Front shock absorber kit engineered for improved handling, reduced vibration, and a comfortable ride across mixed road conditions.",
    galleryImages: [
      "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "6": {
    id: "6",
    name: "Universal Oil Filter",
    price: 12.99,
    rating: 4,
    image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
    category: "Engine",
    description:
      "Compact high-efficiency oil filter designed to capture contaminants and support smoother, longer-lasting engine operation.",
    galleryImages: [
      "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "7": {
    id: "7",
    name: "12V Maintenance-Free Battery",
    price: 119.99,
    originalPrice: 139.99,
    rating: 4,
    image: "https://images.unsplash.com/photo-1611250519129-8940b3184feb?q=80&w=1400&auto=format&fit=crop",
    category: "Batteries",
    description:
      "Dependable 12V battery with strong cold-cranking amps and maintenance-free design for everyday driving and short trips.",
    galleryImages: [
      "https://images.unsplash.com/photo-1611250519129-8940b3184feb?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
    ],
  },
  "8": {
    id: "8",
    name: "All-Season Radial Tyre",
    price: 94.5,
    rating: 4,
    image: "https://images.unsplash.com/photo-1558618666-f9e0969db87a?q=80&w=1400&auto=format&fit=crop",
    category: "Tyres",
    description:
      "Balanced tread for wet and dry roads, comfort-oriented construction for daily mileage and longer tread life.",
    galleryImages: [
      "https://images.unsplash.com/photo-1558618666-f9e0969db87a?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
    ],
  },
};

export const reviewsByProductId: Record<string, Review[]> = {
  "1": [
    { id: "r1", name: "Aarav K.", rating: 5, title: "Strong braking response", comment: "Installed these on my sedan and braking feels smooth and confident. Very low dust compared to my previous set.", date: "Feb 18, 2026" },
    { id: "r2", name: "Nabin S.", rating: 4, title: "Good value", comment: "Great value for daily driving. Packaging was clean and fitment was accurate.", date: "Feb 10, 2026" },
    { id: "r3", name: "Ritesh M.", rating: 5, title: "Highly recommended", comment: "No noise after one week of usage. Performance is better than expected at this price.", date: "Jan 29, 2026" },
    { id: "r4", name: "Pratik J.", rating: 3, title: "Decent but average", comment: "Works fine but I expected slightly better bite. Still okay for city use.", date: "Jan 20, 2026" },
  ],
  "2": [
    { id: "r5", name: "Suman P.", rating: 5, title: "Noticeable improvement", comment: "Engine response feels better and pickup improved after replacing old filter.", date: "Feb 16, 2026" },
    { id: "r6", name: "Ravi T.", rating: 4, title: "Easy fit", comment: "Fit perfectly and quality looks solid. Would buy again.", date: "Feb 2, 2026" },
    { id: "r7", name: "Mina R.", rating: 4, title: "Good quality", comment: "Material feels premium and airflow is clearly improved.", date: "Jan 25, 2026" },
  ],
  "3": [
    { id: "r8", name: "Deepak B.", rating: 5, title: "Engine runs smoother", comment: "After switching, my engine noise reduced and performance is more consistent.", date: "Feb 14, 2026" },
    { id: "r9", name: "Anita G.", rating: 4, title: "Worth it", comment: "Good synthetic oil. Slightly expensive but quality is there.", date: "Jan 30, 2026" },
  ],
  "4": [
    { id: "r10", name: "Karan D.", rating: 4, title: "Brighter beam", comment: "Brightness is better than stock bulbs and installation was straightforward.", date: "Feb 6, 2026" },
    { id: "r11", name: "Sailesh K.", rating: 5, title: "Great at night", comment: "Night visibility improved a lot. Good beam pattern too.", date: "Jan 24, 2026" },
  ],
  "5": [
    { id: "r12", name: "Bikash N.", rating: 5, title: "Ride feels stable", comment: "Body roll reduced and comfort improved after installation.", date: "Feb 12, 2026" },
    { id: "r13", name: "Manoj L.", rating: 4, title: "Solid set", comment: "Quality seems robust and handling is much better now.", date: "Jan 27, 2026" },
  ],
  "6": [
    { id: "r14", name: "Nimesh A.", rating: 4, title: "Good filter", comment: "Fits well and works as expected. Good product overall.", date: "Feb 8, 2026" },
    { id: "r15", name: "Hari P.", rating: 5, title: "Very satisfied", comment: "Used for a recent oil change and engine feels smoother.", date: "Jan 22, 2026" },
  ],
  "7": [
    { id: "r16", name: "Rina K.", rating: 5, title: "Starts every time", comment: "Replaced an old battery and cold starts are effortless now.", date: "Feb 11, 2026" },
    { id: "r17", name: "Om S.", rating: 4, title: "Solid buy", comment: "Holds charge well; install was straightforward.", date: "Jan 28, 2026" },
  ],
  "8": [
    { id: "r18", name: "Sita M.", rating: 5, title: "Quiet ride", comment: "Good grip in rain and less road noise than my old tyres.", date: "Feb 9, 2026" },
    { id: "r19", name: "Raj P.", rating: 4, title: "Good value", comment: "Wear looks even after a few thousand km. Happy so far.", date: "Jan 31, 2026" },
  ],
};

export const questionsByProductId: Record<string, ProductQuestion[]> = {
  "1": [
    { id: "q1", question: "Is this suitable for city driving?", answer: "Yes, these pads are tuned for low noise and smooth braking in daily city traffic." },
    { id: "q2", question: "Does this come as a pair?", answer: "Yes, this listing includes a complete set for one axle." },
  ],
  "2": [
    { id: "q3", question: "How often should I replace this filter?", answer: "For normal use, replacement every 10,000 to 15,000 km is recommended." },
    { id: "q4", question: "Is installation DIY friendly?", answer: "Yes, most users can install it in a few minutes with basic tools." },
  ],
  "3": [
    { id: "q5", question: "Can I use this in high temperatures?", answer: "Yes, this synthetic oil is designed for stable performance in high heat." },
    { id: "q6", question: "Is it compatible with turbo engines?", answer: "Yes, it is compatible with most modern turbocharged engines." },
  ],
  "4": [
    { id: "q7", question: "Will this improve night visibility?", answer: "Yes, it offers a brighter and more focused beam than standard old bulbs." },
    { id: "q8", question: "Is this plug-and-play?", answer: "Yes, it is designed for direct replacement with compatible sockets." },
  ],
  "5": [
    { id: "q9", question: "Does this help reduce body roll?", answer: "Yes, this set is designed to improve handling and reduce excessive roll." },
    { id: "q10", question: "Is wheel alignment needed after installation?", answer: "A quick alignment check is always recommended after suspension work." },
  ],
  "6": [
    { id: "q11", question: "Can this be used for long oil intervals?", answer: "Yes, it has good contaminant holding capacity for extended intervals." },
    { id: "q12", question: "Is this compatible with synthetic oils?", answer: "Yes, it works with both synthetic and conventional engine oils." },
  ],
  "7": [
    { id: "q13", question: "Is this maintenance-free?", answer: "Yes, it is a sealed maintenance-free design under normal use." },
    { id: "q14", question: "Will it fit my sedan?", answer: "Check your vehicle manual for group size and terminal layout before purchase." },
  ],
  "8": [
    { id: "q15", question: "Are these all-season?", answer: "Yes, they are intended for year-round use in typical road conditions." },
    { id: "q16", question: "Sold as a single tyre?", answer: "This listing is per tyre; order four for a full set if needed." },
  ],
};
