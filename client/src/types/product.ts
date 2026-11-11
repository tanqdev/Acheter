export interface Product {
  id: number;
  name: string;
  description: string | null;
  price_cents: string;
  stock: number;
  image_url: string | null;
  hover_image_url: string | null;
  created_at: string;
}
