import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Product } from "../types/product";
import { formatCents } from "@/utils/formatPrice";
import { API_URL } from "@/lib/api";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<"primary" | "hover">(
    "primary",
  );
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setImageError(false);
      setSelectedImage("primary");
      setIsImageHovered(false);

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
  const hasImage = Boolean(product.image_url) && !imageError;
  const hasHoverImage =
    Boolean(product.hover_image_url) &&
    product.hover_image_url !== product.image_url &&
    hasImage;
  const showHoverImage =
    hasHoverImage && (selectedImage === "hover" || isImageHovered);
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
          productId: currentProduct.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Please log in to add items");
        } else {
          setMessage(data.message || "Could not add item");
        }
        return;
      }
      setMessage("Added to cart");
    } catch (e) {
      console.error("Failed to add to cart", e);
      setMessage("Unable to reach the server");
    } finally {
      setAdding(false);
    }
  }

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
        <div>
          <div
            className="relative flex h-96 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800"
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            {hasImage ? (
              <>
                <img
                  src={product.image_url!}
                  alt={showHoverImage ? "" : product.name}
                  aria-hidden={showHoverImage}
                  width={1024}
                  height={1024}
                  onError={() => setImageError(true)}
                  className={`absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-300 ${
                    showHoverImage ? "opacity-0" : "opacity-100"
                  }`}
                />

                {hasHoverImage && (
                  <img
                    src={product.hover_image_url!}
                    alt={showHoverImage ? `${product.name} alternate view` : ""}
                    aria-hidden={!showHoverImage}
                    width={1024}
                    height={1024}
                    onError={() => setImageError(true)}
                    className={`absolute inset-0 h-full w-full object-contain p-6 transition-opacity duration-300 ${
                      showHoverImage ? "opacity-100" : "opacity-0"
                    }`}
                  />
                )}
              </>
            ) : (
              <span className="text-7xl font-bold text-gray-400">
                {product.name.charAt(0)}
              </span>
            )}
          </div>

          {hasHoverImage && (
            <div className="mt-3 flex gap-3" aria-label="Product image views">
              <button
                type="button"
                onClick={() => setSelectedImage("primary")}
                aria-pressed={selectedImage === "primary"}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-gray-100 p-1 dark:bg-zinc-800 ${
                  selectedImage === "primary"
                    ? "border-blue-600"
                    : "border-transparent"
                }`}
              >
                <img
                  src={product.image_url!}
                  alt="Primary product view"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-contain"
                />
              </button>

              <button
                type="button"
                onClick={() => setSelectedImage("hover")}
                aria-pressed={selectedImage === "hover"}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-gray-100 p-1 dark:bg-zinc-800 ${
                  selectedImage === "hover"
                    ? "border-blue-600"
                    : "border-transparent"
                }`}
              >
                <img
                  src={product.hover_image_url!}
                  alt="Alternate product view"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-contain"
                />
              </button>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold">{product.name}</h1>

          <p className="mt-4 text-2xl font-semibold">
            {formatCents(product.price_cents)}
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
                  disabled={quantity === 1 || adding}
                  className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  -
                </button>

                <span className="min-w-8 text-center text-lg">{quantity}</span>

                <button
                  onClick={increaseQuantity}
                  disabled={quantity === product.stock || adding}
                  className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="mt-6 w-full rounded-lg bg-black px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>

              {message && (
                <p
                  role="status"
                  className={`mt-2 text-sm ${
                    message === "Added to cart"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
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
