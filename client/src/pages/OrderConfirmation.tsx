import { Link, useLocation } from "react-router";
import Navbar from "../components/Navbar";

interface Order {
  id: number;
  total_cents: number;
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
        <div className="rounded-2xl border border-gray-200 p-8">
          <div className="text-5xl">✓</div>

          <h1 className="mt-4 text-3xl font-bold">Order Confirmed!</h1>

          {order ? (
            <>
              <p className="mt-3 text-gray-600">
                Thank you! Your order has been created successfully.
              </p>

              <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-5 text-left">
                <p>
                  <span className="font-medium">Order ID:</span> #{order.id}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ₹
                  {(order.total_cents / 100).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {order.status}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-gray-600">
              No order details were provided. Please check your order history
              before attempting checkout again.
            </p>
          )}

          <Link
            to="/"
            className="mt-8 inline-block rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </>
  );
}
