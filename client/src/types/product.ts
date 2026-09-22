export interface Product {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  stock: number;
  created_at: string;
}
