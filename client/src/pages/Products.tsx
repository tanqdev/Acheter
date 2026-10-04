import { useState, useEffect } from "react";
import type { Product } from "../types/product";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

const API_URL = "http://localhost:5000/api";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <main className="mx-auto max-w-7xl px-6 py-10">
      {user && (
        <div className="flex w-full justify-end gap-10">
          <span>{user.email}</span>
          <button
            onClick={async () => {
              try {
                await logout();
                navigate("/login");
              } catch (e) {
                console.error(e);
              }
            }}
            className="cursor-pointer hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      )}
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
