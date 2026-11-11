import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  ShoppingBag,
  ShoppingCart,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  Sun,
  MoonIcon,
  X,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <nav className="sticky top-2 z-50 mx-auto w-[calc(100%-1rem)] max-w-7xl rounded-2xl border border-gray-200/70 bg-white/75 text-gray-900 shadow-lg shadow-black/5 backdrop-blur-xl transition-colors sm:top-3 sm:w-[calc(100%-2rem)] dark:border-zinc-700/70 dark:bg-zinc-950/75 dark:text-white">
      {" "}
      <div className="flex h-14 items-center justify-between px-3 sm:h-16 sm:px-6">
        {" "}
        {/* Logo */}
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight sm:text-2xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-blue-100 dark:bg-zinc-800 dark:group-hover:bg-blue-950">
            <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-110" />
          </span>
          <span>Acheter</span>
        </Link>
        {/* Navigation */}
        <div className="flex items-center gap-1 sm:gap-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-gray-200/80 bg-white/50 p-2 transition-all hover:scale-105 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-700"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
          <NavigationMenu className="hidden sm:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Shop
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <ul className="grid w-[220px] gap-2 p-3">
                    <li>
                      <Link
                        to="/"
                        className="flex items-center gap-3 rounded-md p-3 hover:bg-accent"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">Products</p>
                          <p className="text-xs text-muted-foreground">
                            Explore our collection
                          </p>
                        </div>
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="/cart"
                        className="flex items-center gap-3 rounded-md p-3 hover:bg-accent"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">Cart</p>
                          <p className="text-xs text-muted-foreground">
                            View your shopping cart
                          </p>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {user ? (
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                to="/orders"
                className="flex items-center gap-2 text-sm font-medium text-black transition-colors hover:text-blue-700 dark:text-white dark:hover:text-blue-400"
              >
                Orders
              </Link>

              <span className="hidden max-w-[180px] truncate text-sm text-gray-500 dark:text-gray-400 lg:block">
                {user.email}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-blue-600 hover:text-white dark:border-gray-700 dark:hover:bg-blue-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:text-white hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>

              <Link
                to="/signup"
                className="hidden items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:flex"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-xl border border-gray-200/80 bg-white/50 p-2 transition-colors hover:bg-gray-100 sm:hidden dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-700"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <p className="border-t border-gray-200/70 px-3 py-1.5 text-center text-[11px] font-medium text-gray-500 dark:border-zinc-700/70 dark:text-gray-400">
        Demo storefront — orders are not processed or fulfilled.
      </p>

      {mobileMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-950 sm:hidden">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <ShoppingBag className="h-5 w-5" />
            Products
          </Link>
          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <ShoppingCart className="h-5 w-5" />
            Cart
          </Link>

          <div className="my-1 border-t border-gray-200 dark:border-zinc-800" />

          {user ? (
            <>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <ShoppingBag className="h-5 w-5" />
                Orders
              </Link>
              <p className="truncate px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <LogIn className="h-5 w-5" />
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <UserPlus className="h-5 w-5" />
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
