import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-6 bg-neutral-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md  p-9 shadow-sm bg-neutral-900 border border-[#333333] rounded-[9px]"
      >
        <h1 className="text-3xl font-bold">Login</h1>
        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 px-3 py-2 bg-neutral-800"
          />
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 px-3 py-2 bg-neutral-800"
          />
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-white">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
