import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { formatCents } from "@/utils/formatPrice";

const API_URL = "http://localhost:5000/api";

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

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-2 text-3xl font-bold">My Orders</h1>
        <p className="mb-8 text-gray-600">
          View your previous purchases and order details.
        </p>

        {loading && <p className="py-10 text-center">Loading your orders...</p>}

        {error && <p className="py-10 text-center text-red-600">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-xl border border-gray-200 p-10 text-center">
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-gray-600">
              Your completed purchases will appear here.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Order #{order.id}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
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
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-medium">
                        {formatCents(
                          BigInt(item.priceCents) * BigInt(item.quantity),
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="font-semibold">
                    Total: {formatCents(order.total_cents)}
                  </p>

                  <div className="mt-3 text-sm text-gray-500">
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
