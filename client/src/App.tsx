import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import ShapeGrid from "@/components/ShapeGrid.jsx";
import { useTheme } from "./context/ThemeContext";

const Products = lazy(() => import("./pages/Products"));
const ProductsDetail = lazy(() => import("./pages/ProductsDetail"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Orders = lazy(() => import("./pages/Orders"));

export default function App() {
  const { theme } = useTheme();

  return (
    <>
      <ShapeGrid
        className="fixed inset-0 z-0 pointer-events-none"
        shape="square"
        cellSize={45}
        lineWidth={0.8}
        direction="none"
        speed={1}
        lineColor={theme === "dark" ? "#27272a" : "#d4d4d8"}
        hoverColor="#3b82f6"
        fillOpacity={0.3}
        radius={2}
        trail={0.3}
        glow={0.1}
        fade={0}
        clickCascade
        intro
      />

      <div className="relative z-10 min-h-screen w-full">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <p>Loading...</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/products/:id" element={<ProductsDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}
