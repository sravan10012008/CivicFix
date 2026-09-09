import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password: form.password,
        });

      if (loginError) {
        console.error("LOGIN ERROR:", loginError);
        setError(loginError.message || "Invalid email or password.");
        return;
      }

      if (!data?.user) {
        setError("Login failed. User was not found.");
        return;
      }

      const authUser = data.user;

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", authUser.id)
          .maybeSingle();

      if (profileError) {
        setError(
          "Login succeeded, but the user profile could not be loaded. Check the browser console."
        );
        return;
      }

      if (!profile) {
        setError(
          "Login succeeded, but no profile exists for this account."
        );
        return;
      }

      const returnTo = location.state?.returnTo;

      if (
        returnTo &&
        profile.role === "admin" &&
        returnTo.startsWith("/admin")
      ) {
        navigate(returnTo, { replace: true });
        return;
      }

      if (
        returnTo &&
        profile.role === "worker" &&
        returnTo.startsWith("/worker")
      ) {
        navigate(returnTo, { replace: true });
        return;
      }

      if (
        returnTo &&
        profile.role === "citizen" &&
        (
          returnTo.startsWith("/citizen") ||
          returnTo.startsWith("/report") ||
          returnTo.startsWith("/my-complaints")
        )
      ) {
        navigate(returnTo, { replace: true });
        return;
      }

      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (profile.role === "worker") {
        navigate("/worker", { replace: true });
      } else {
        navigate("/citizen", { replace: true });
      }
    } catch (err) {
      console.error("LOGIN EXCEPTION:", err);
      setError(err.message || "Unable to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          <div className="text-center mb-8">

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-4">
              <Lock className="w-7 h-7" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-slate-500">
              Login to track your complaints and report new issues.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>
            </div>

            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>

              </div>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-12 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

          </form>

          <div className="mt-7 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600"
            >
              Create an account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}