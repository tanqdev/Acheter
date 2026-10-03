import { Routes, Route } from "react-router";
import Products from "./pages/Products";
import ProductsDetail from "./pages/ProductsDetail";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Products />} />
      <Route path="/products/:id" element={<ProductsDetail />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
