// Import React APIs/hooks that we need for authentication state
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode, // ReactNode is a TypeScript type, it represents things that React can render as children
} from "react";

import type { user } from "../types/auth";

const API_URL = "http://localhost:5000/api";

interface AuthContextValue {
  user: user | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProvideProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProvideProps) {
  // To store current User
  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true);

  // Check The Backend Session When The App Starts
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json();
        setUser(data.user);
      } catch (e) {
        console.error("Failed to Load Session", e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);
  //Sends Login creds to backend and update React State on Successful login
  async function login(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login Failed");
    }
    setUser(data.user);
  }

  async function signup(email: string, password: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Sign Up Failed");
    }
  }

  // Ends the server-side session and clears the
  // authenticated user from React state.
  async function logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to Logout");
    }
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth Must Be Used Inside AuthProvider");
  }
  return context;
}
