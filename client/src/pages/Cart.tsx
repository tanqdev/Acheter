import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price_cents: number;
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
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(
    null,
  );
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/cart`, {
        credentials: "include",
        cache: "no-store",
      });

      const data: CartResponse = await response.json();

      if (response.status === 401) {
        navigate("/login");
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
  }, [navigate]);

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
        navigate("/login");
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
        navigate("/login");
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
    (total, item) => total + item.price_cents * item.quantity,
    0,
  );

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">Your Cart</h1>

        {loading ? (
          <p>Loading your cart...</p>
        ) : error && items.length === 0 ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => void fetchCart()}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-white"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-lg text-gray-600">Your cart is empty.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <section className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.product_id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-semibold hover:text-blue-600"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-1 text-sm text-gray-500">
                      ₹{(item.price_cents / 100).toFixed(2)} each
                    </p>

                    <p className="mt-1 font-medium">
                      Subtotal: ₹
                      {((item.price_cents * item.quantity) / 100).toFixed(2)}
                    </p>

                    {item.quantity > item.stock && (
                      <p className="mt-1 text-sm text-red-600">
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
                      className="h-9 w-9 rounded border disabled:opacity-40"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center">{item.quantity}</span>

                    <button
                      type="button"
                      disabled={
                        item.quantity >= item.stock ||
                        updatingProductId === item.product_id
                      }
                      onClick={() =>
                        void updateQuantity(item.product_id, item.quantity + 1)
                      }
                      className="h-9 w-9 rounded border disabled:opacity-40"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      disabled={updatingProductId === item.product_id}
                      onClick={() => void removeItem(item.product_id)}
                      className="ml-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  ₹{(totalCents / 100).toFixed(2)}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Shipping and taxes are not included.
              </p>

              <button
                type="button"
                disabled
                className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-white opacity-50"
              >
                Checkout — Coming Soon
              </button>
            </aside>
          </div>
        )}

        {error && items.length > 0 && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </main>
    </>
  );
}
