"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type Mode = "login" | "signup" | "reset";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a confirmation link!");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a password reset link!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-8">
        <h2 className="mb-6 text-2xl font-bold text-center">
          {mode === "login" && "Sign In"}
          {mode === "signup" && "Sign Up"}
          {mode === "reset" && "Reset Password"}
        </h2>
        {message && <div className="text-green-600 text-sm mb-2">{message}</div>}
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="text-black placeholder:text-gray-500"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="text-black placeholder:text-gray-500"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="flex justify-between mt-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode("signup")}
                className="p-0 h-auto"
              >
                Sign Up
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => setMode("reset")}
                className="p-0 h-auto"
              >
                Forgot Password?
              </Button>
            </div>
          </form>
        )}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="text-black placeholder:text-gray-500"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="text-black placeholder:text-gray-500"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            <div className="flex justify-between mt-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode("login")}
                className="p-0 h-auto"
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        )}
        {mode === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="text-black placeholder:text-gray-500"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <div className="flex justify-between mt-2">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode("login")}
                className="p-0 h-auto"
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
} 