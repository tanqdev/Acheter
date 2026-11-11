import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { formatCents } from "@/utils/formatPrice";
import { API_URL } from "@/lib/api";

interface OrderItem {
  productId: number;
  productName: string;
  priceCents: string;
  quantity: number;
}

interface Order {
  id: number;
  total_cents: string;
  status: string;
  created_at: string;
  shipping_name: string;
  shipping_address: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`${API_URL}/orders`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch orders");
        }

        setOrders(data.orders);
      } catch (error) {
        console.error("Failed to fetch orders", error);
        setError(
          error instanceof Error ? error.message : "Unable to load orders",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
          My Orders
        </h1>

        <p className="mb-8 text-gray-600 dark:text-gray-400">
          View your previous purchases and order details.
        </p>

        {loading && (
          <p className="py-10 text-center text-gray-700 dark:text-gray-300">
            Loading your orders...
          </p>
        )}

        {error && (
          <p className="py-10 text-center text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white/65 p-8 text-center shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              No orders yet
            </h2>

            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your completed purchases will appear here.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-white/50 bg-white/65 p-4 text-gray-900 shadow-sm backdrop-blur-md transition-all hover:bg-white/75 sm:p-6 dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-gray-100 dark:hover:bg-zinc-900/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-300/50 pb-4 dark:border-zinc-700">
                  <div>
                    <h2 className="text-lg font-semibold">Order #{order.id}</h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex flex-wrap justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.productName}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCents(
                          BigInt(item.priceCents) * BigInt(item.quantity),
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-gray-300/50 pt-4 dark:border-zinc-700">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Total: {formatCents(order.total_cents)}
                  </p>

                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <p>Shipping to: {order.shipping_name}</p>
                    <p>{order.shipping_address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
