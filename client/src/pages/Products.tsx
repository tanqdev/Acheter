import { useState, useEffect } from "react";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";
import Navbar from "@/components/Navbar";
import ShopHero from "./SuperHero";
import { API_URL } from "@/lib/api";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
          throw new Error("Failed to Fetch Products");
        }
        const data = await response.json();
        console.log(data);
        setProducts(data.products);
      } catch (error) {
        console.error(error);
        setError("Unable to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading Products...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">No products available</p>
      </div>
    );
  }
  return (
    <>
      <Navbar />
      <ShopHero />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">Products</h1>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </>
  );
}
