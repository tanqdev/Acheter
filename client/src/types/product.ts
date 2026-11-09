export interface Product {
  id: number;
  name: string;
  description: string | null;
  price_cents: string;
  stock: number;
  created_at: string;
}
