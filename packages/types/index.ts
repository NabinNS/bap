export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount?: number;
  image: string;
  images?: string[];
  inStock?: boolean;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  logo?: string;
  slug: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}
