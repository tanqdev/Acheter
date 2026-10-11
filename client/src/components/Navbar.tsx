import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          Acheter
        </Link>

        <div className="flex items-center gap-5">
          <Link to="/" className="text-sm hover:text-blue-600">
            Products
          </Link>

          <Link to="/cart" className="text-sm hover:text-blue-600">
            Cart
          </Link>

          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium hover:text-blue-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm hover:text-blue-600">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
