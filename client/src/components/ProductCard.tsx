import { Link } from "react-router";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 2;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gray-100">
        <span className="text-5xl font-bold text-gray-400">
          {product.name.charAt(0)}
        </span>
      </div>

      <h2 className="text-lg font-semibold group-hover:text-blue-600">
        {product.name}
      </h2>

      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
        {product.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold">
          ₹{(product.price_cents / 100).toFixed(2)}
        </span>

        {outOfStock && (
          <span className="text-sm font-medium text-red-600">Out of stock</span>
        )}

        {lowStock && (
          <span className="text-sm font-medium text-orange-600">
            Only {product.stock} left
          </span>
        )}

        {!outOfStock && !lowStock && (
          <span className="text-sm text-green-600">In stock</span>
        )}
      </div>
    </Link>
  );
}
