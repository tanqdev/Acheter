import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { formatCents } from "@/utils/formatPrice";
import SlideToConfirm from "@/components/kokonutui/slide-to-confirm";
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

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

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
    (total, item) => total + BigInt(item.price_cents) * BigInt(item.quantity),
    0n,
  );

  async function handleCheckout() {
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
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Checkout
        </h1>

        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Review your items before placing your order.
        </p>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">
            Loading your order...
          </p>
        ) : error ? (
          <div>
            <p role="alert" className="text-red-600 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white/65 p-8 text-center shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65">
            <p className="text-gray-600 dark:text-gray-300">
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
          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Order Items
              </h2>

              {items.map((item) => (
                <article
                  key={item.product_id}
                  className="rounded-xl border border-gray-200 bg-white/65 p-5 text-gray-900 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-gray-100"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.name}</p>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatCents(item.price_cents)} each
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCents(
                        BigInt(item.price_cents) * BigInt(item.quantity),
                      )}
                    </p>
                  </div>

                  {item.quantity > item.stock && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                      Only {item.stock} currently in stock. Update your cart
                      before checkout.
                    </p>
                  )}
                </article>
              ))}

              <Link
                to="/cart"
                className="inline-block text-sm font-medium text-gray-800 underline hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Return to cart
              </Link>

              <form
                ref={formRef}
                onSubmit={(e) => e.preventDefault()}
                className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-white/65 p-5 text-gray-900 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-gray-100"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Enter your full shipping address"
                  />
                </div>

                {submitError && (
                  <p
                    role="alert"
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {submitError}
                  </p>
                )}

                <div className="flex w-full justify-center">
                  <SlideToConfirm
                    label="Slide to place order"
                    confirmingLabel="Placing order"
                    doneLabel="Order Placed"
                    disabled={
                      submitting ||
                      items.some((item) => item.quantity > item.stock)
                    }
                    onConfirm={async () => {
                      if (!formRef.current?.reportValidity()) {
                        throw new Error("Please complete the shipping details");
                      }

                      await handleCheckout();
                    }}
                  />
                </div>
              </form>
            </section>

            <aside className="h-fit rounded-xl border border-gray-200 bg-white/65 p-5 text-gray-900 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-gray-100">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  Subtotal
                </span>

                <span className="font-semibold">{formatCents(totalCents)}</span>
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Shipping and taxes are not included.
              </p>

              <p className="mt-5 text-sm text-gray-600 dark:text-gray-300">
                To confirm your order, please fill the shipping details.
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
