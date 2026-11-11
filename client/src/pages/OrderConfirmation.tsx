import { Link, useLocation } from "react-router";
import Navbar from "../components/Navbar";
import { formatCents } from "@/utils/formatPrice";

interface Order {
  id: number;
  total_cents: string;
  status: string;
  created_at: string;
}

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order as Order | undefined;

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white/65 p-8 text-gray-900 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-gray-100">
          <div className="text-5xl text-green-600 dark:text-green-400">✓</div>

          <h1 className="mt-4 text-3xl font-bold">Order Confirmed!</h1>

          {order ? (
            <>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Thank you! Your order has been created successfully.
              </p>

              <div className="mt-6 space-y-2 rounded-xl border border-gray-200/70 bg-gray-50/70 p-5 text-left dark:border-zinc-700 dark:bg-zinc-800/70">
                <p>
                  <span className="font-medium">Order ID:</span> #{order.id}
                </p>

                <p>
                  <span className="font-medium">Total:</span>{" "}
                  {formatCents(order.total_cents)}
                </p>

                <p>
                  <span className="font-medium">Status:</span> {order.status}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              No order details were provided. Please check your order history
              before attempting checkout again.
            </p>
          )}

          <Link
            to="/"
            className="mt-8 inline-block rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </>
  );
}
