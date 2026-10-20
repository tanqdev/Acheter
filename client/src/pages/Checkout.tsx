import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
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

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCart() {
      try {
        const response = await fetch(`${API_URL}/cart`, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          navigate("/login");
          return;
        }
        const data: CartResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load cart");
        }

        setItems(data.cartItems);
      } catch (e) {
        console.error("Failed to load checkout cart", e);
        setError("Unable to load your order. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    void fetchCart();
  }, [navigate]);

  const totalCents = items.reduce(
    (total, item) => total + item.price_cents * item.quantity,
    0,
  );

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingName,
          shippingAddress,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Checkout failed");
      }

      navigate("/order-confirmation", {
        state: { order: data.order },
      });
    } catch (error) {
      console.error("Checkout failed", error);
      setSubmitError(
        error instanceof Error ? error.message : "Checkout failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
        <p className="mb-8 text-gray-600">
          Review your items before placing your order.
        </p>

        {loading ? (
          <p>Loading your order...</p>
        ) : error ? (
          <div>
            <p role="alert" className="text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-white"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Your cart is empty.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Order Items</h2>

              {items.map((item) => (
                <article
                  key={item.product_id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        ₹{(item.price_cents / 100).toFixed(2)} each
                      </p>
                    </div>

                    <p className="font-semibold">
                      ₹{((item.price_cents * item.quantity) / 100).toFixed(2)}
                    </p>
                  </div>

                  {item.quantity > item.stock && (
                    <p className="mt-3 text-sm text-red-600">
                      Only {item.stock} currently in stock. Update your cart
                      before checkout.
                    </p>
                  )}
                </article>
              ))}

              <Link
                to="/cart"
                className="inline-block text-sm font-medium underline"
              >
                Return to cart
              </Link>

              <form
                onSubmit={handleCheckout}
                className="mt-8 space-y-4 rounded-xl border border-gray-200 p-5"
              >
                <h2 className="text-xl font-semibold">Shipping Details</h2>

                <div>
                  <label
                    htmlFor="shippingName"
                    className="mb-1 block text-sm font-medium"
                  >
                    Full name
                  </label>
                  <input
                    id="shippingName"
                    type="text"
                    value={shippingName}
                    onChange={(event) => setShippingName(event.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shippingAddress"
                    className="mb-1 block text-sm font-medium"
                  >
                    Shipping address
                  </label>
                  <textarea
                    id="shippingAddress"
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter your full shipping address"
                  />
                </div>

                {submitError && (
                  <p role="alert" className="text-sm text-red-600">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    items.some((item) => item.quantity > item.stock)
                  }
                  className="w-full rounded-lg bg-black px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Continue"}
                </button>
              </form>
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

              <p className="mt-5 text-sm text-gray-600">
                Shipping details and order confirmation will be added next.
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
