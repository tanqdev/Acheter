import { useState } from "react";
import { Link } from "react-router";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

const API_URL = "http://localhost:5000/api";

export default function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 2;

  async function handleAddToCart() {
    setAdding(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Please log in to add items.");
        } else {
          setMessage(data.message || "Could not add item.");
        }
        return;
      }

      setMessage("Added to cart!");
    } catch (error) {
      console.error("Failed to add product to cart", error);
      setMessage("Unable to reach the server.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/products/${product.id}`} className="group block">
        <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
          <span className="text-5xl font-bold text-gray-400">
            {product.name.charAt(0)}
          </span>
        </div>

        <h2 className="text-lg font-semibold group-hover:text-blue-600">
          {product.name}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold">
            ₹{(product.price_cents / 100).toFixed(2)}
          </span>

          {outOfStock && (
            <span className="text-sm font-medium text-red-600">
              Out of stock
            </span>
          )}

          {lowStock && (
            <span className="text-sm font-medium text-orange-600">
              Only {product.stock} left
            </span>
          )}

          {!outOfStock && !lowStock && (
            <span className="text-sm text-green-600">In stock</span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock || adding}
        className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {outOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${
            message === "Added to cart!" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </article>
  );
}
