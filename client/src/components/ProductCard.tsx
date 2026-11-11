import { useState } from "react";
import { Link } from "react-router";
import type { Product } from "../types/product";
import { formatCents } from "../utils/formatPrice";
import { API_URL } from "../lib/api";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);

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

  const hasImage = Boolean(product.image_url) && !imageError;
  const hasHoverImage =
    Boolean(product.hover_image_url) &&
    product.hover_image_url !== product.image_url &&
    hasImage;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <Link to={`/products/${product.id}`} className="group block">
        <div className="relative mb-4 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
          {hasImage ? (
            <>
              <img
                src={product.image_url!}
                alt={product.name}
                width={1024}
                height={1024}
                loading="lazy"
                onError={() => setImageError(true)}
                className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-300 ${
                  hasHoverImage
                    ? "opacity-100 group-hover:opacity-0"
                    : "opacity-100"
                }`}
              />

              {hasHoverImage && (
                <img
                  src={product.hover_image_url!}
                  alt=""
                  aria-hidden="true"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <span className="text-5xl font-bold text-gray-400 dark:text-zinc-500">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold group-hover:text-blue-600">
          {product.name}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold">
            {formatCents(product.price_cents)}
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
        className="mt-4 w-full cursor-pointer rounded-lg bg-black px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-blue-400"
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
