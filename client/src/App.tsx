import { Routes, Route } from "react-router";
import Products from "./pages/Products";
import ProductsDetail from "./pages/ProductsDetail";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import ShapeGrid from "@/components/ShapeGrid.jsx";
import { useTheme } from "./context/ThemeContext";

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
      </div>
    </>
  );
}
