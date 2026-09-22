import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Product } from "../types/product";

const API_URL = "http://localhost:5000/api";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`${API_URL}/products/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Product not found");
          }

          throw new Error("Failed to fetch product");
        }

        const data = await response.json();

        setProduct(data.product);
      } catch (error) {
        console.error(error);
        setError(
          error instanceof Error ? error.message : "Unable to load product",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Product not found"}</p>

        <Link to="/" className="rounded-lg bg-black px-4 py-2 text-white">
          Back to Products
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const currentProduct = product;

  function increaseQuantity() {
    setQuantity((current) => Math.min(current + 1, currentProduct.stock));
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(current - 1, 1));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        to="/"
        className="mb-8 inline-block text-sm text-gray-600 hover:text-black"
      >
        ← Back to Products
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex h-96 items-center justify-center rounded-xl bg-gray-100">
          <span className="text-7xl font-bold text-gray-400">
            {product.name.charAt(0)}
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold">{product.name}</h1>

          <p className="mt-4 text-2xl font-semibold">
            ₹{(product.price_cents / 100).toFixed(2)}
          </p>

          <p className="mt-6 leading-7 text-gray-600">{product.description}</p>

          <div className="mt-6">
            {outOfStock ? (
              <p className="font-medium text-red-600">Out of stock</p>
            ) : product.stock <= 2 ? (
              <p className="font-medium text-orange-600">
                Only {product.stock} left
              </p>
            ) : (
              <p className="font-medium text-green-600">In stock</p>
            )}
          </div>

          {!outOfStock && (
            <div className="mt-8">
              <p className="mb-2 text-sm font-medium">Quantity</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity === 1}
                  className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  -
                </button>

                <span className="min-w-8 text-center text-lg">{quantity}</span>

                <button
                  onClick={increaseQuantity}
                  disabled={quantity === product.stock}
                  className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <button
                disabled
                className="mt-6 w-full rounded-lg bg-black px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          )}

          {outOfStock && (
            <button
              disabled
              className="mt-8 w-full rounded-lg bg-gray-300 px-6 py-3 font-medium text-gray-600"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
