import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { formatCents } from "@/utils/formatPrice";
import { API_URL } from "@/lib/api";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price_cents: string;
  stock: number;
}

interface CartResponse {
  success: boolean;
  cartItems: CartItem[];
  message?: string;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(
    null,
  );
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    try {
      setError("");
      setNeedsLogin(false);

      const response = await fetch(`${API_URL}/cart`, {
        credentials: "include",
        cache: "no-store",
      });

      const data: CartResponse = await response.json();

      if (response.status === 401) {
        setNeedsLogin(true);
        setItems([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load cart");
      }

      setItems(data.cartItems);
    } catch (error) {
      console.error("Failed to fetch cart", error);
      setError("Unable to load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  async function updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) return;

    setUpdatingProductId(productId);
    setError("");

    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update quantity");
      }

      await fetchCart();
    } catch (error) {
      console.error("Failed to update cart quantity", error);
      setError("Unable to update quantity. Please try again.");
    } finally {
      setUpdatingProductId(null);
    }
  }

  async function removeItem(productId: number) {
    setUpdatingProductId(productId);
    setError("");

    try {
      const response = await fetch(`${API_URL}/cart/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove item");
      }

      setItems((currentItems) =>
        currentItems.filter((item) => item.product_id !== productId),
      );
    } catch (error) {
      console.error("Failed to remove cart item", error);
      setError("Unable to remove item. Please try again.");
    } finally {
      setUpdatingProductId(null);
    }
  }

  const totalCents = items.reduce(
    (total, item) => total + BigInt(item.price_cents) * BigInt(item.quantity),
    0n,
  );

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">Your Cart</h1>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">
            Loading your cart...
          </p>
        ) : needsLogin ? (
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white/65 p-6 text-center shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sign in to view your cart
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Your cart is saved to your account.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Sign In
            </Link>
          </div>
        ) : error && items.length === 0 ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => void fetchCart()}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white/65 p-6 text-center shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your cart is empty.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_300px] md:gap-8">
            <section className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.product_id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white/65 p-4 shadow-sm backdrop-blur-md transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-zinc-700 dark:bg-zinc-900/65"
                >
                  <div>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatCents(item.price_cents)} each
                    </p>

                    <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                      Subtotal: ₹
                      {formatCents(
                        BigInt(item.price_cents) * BigInt(item.quantity),
                      )}
                    </p>

                    {item.quantity > item.stock && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Only {item.stock} currently in stock.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={
                        item.quantity <= 1 ||
                        updatingProductId === item.product_id
                      }
                      onClick={() =>
                        void updateQuantity(item.product_id, item.quantity - 1)
                      }
                      className="h-9 w-9 rounded border border-gray-300 bg-white/50 text-gray-900 transition hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center text-gray-900 dark:text-gray-100">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      disabled={
                        item.quantity >= item.stock ||
                        updatingProductId === item.product_id
                      }
                      onClick={() =>
                        void updateQuantity(item.product_id, item.quantity + 1)
                      }
                      className="h-9 w-9 rounded border border-gray-300 bg-white/50 text-gray-900 transition hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      disabled={updatingProductId === item.product_id}
                      onClick={() => void removeItem(item.product_id)}
                      className="ml-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-40 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-xl border border-gray-200 bg-white/65 p-5 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Order Summary
              </h2>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  Subtotal
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCents(totalCents)}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Shipping and taxes are not included.
              </p>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full cursor-pointer rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-80 dark:bg-white dark:text-black"
              >
                Proceed To Checkout
              </button>
            </aside>
          </div>
        )}

        {error && items.length > 0 && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </main>
    </>
  );
}
