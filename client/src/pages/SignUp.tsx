import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { FormEvent } from "react";

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signup(email, password);
      navigate("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign Up failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-6 bg-neutral-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-9 shadow-sm bg-neutral-900 border border-[#333333] rounded-[9px]"
      >
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <div className="mt-6 ">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 py-2 px-3 bg-neutral-800 "
          />
        </div>
        <div className="mt-4 ">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 py-2 px-3 bg-neutral-800 "
          />
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 mt-6 bg-white text-black rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
        <p className="mt-6 text-sm text-gray-400 text-center">
          Already Registered?
          <Link to="/login" className="text-white font-medium">
            {" "}
            Login{" "}
          </Link>
        </p>
      </form>
    </main>
  );
}
