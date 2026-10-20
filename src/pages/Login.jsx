import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
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

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Load the profile and navigate only after login/MFA succeeds.
  const finishLogin = async () => {
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      throw new Error("Unable to verify your signed-in account.");
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", authUser.id)
        .maybeSingle();

    if (profileError) {
      throw new Error(
        "Login succeeded, but the user profile could not be loaded."
      );
    }

    if (!profile) {
      throw new Error(
        "Login succeeded, but no profile exists for this account."
      );
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

      // Check the authenticated user's role.
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        throw new Error("Unable to load your account permissions.");
      }

      if (!profile) {
        throw new Error("No profile exists for this account.");
      }

      // Check the session's current MFA assurance level.
      const {
        data: assurance,
        error: assuranceError,
      } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) {
        throw assuranceError;
      }

      console.log("MFA assurance after login:", {
        currentLevel: assurance?.currentLevel,
        nextLevel: assurance?.nextLevel,
        role: profile.role,
      });

      // Workers must complete MFA before accessing protected work actions.
      if (
        profile.role === "worker" &&
        assurance?.currentLevel !== "aal2"
      ) {
        const {
          data: factors,
          error: factorsError,
        } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
          throw factorsError;
        }

        const verifiedFactor = factors?.totp?.find(
          (factor) => factor.status === "verified"
        );

        if (!verifiedFactor) {
          setError(
            "MFA is required for worker accounts, but no verified authenticator was found. Please sign in and enroll an authenticator first."
          );
          return;
        }

        // Challenge the verified authenticator.
        const {
          data: challenge,
          error: challengeError,
        } = await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });

        if (challengeError) {
          throw challengeError;
        }

        setFactorId(verifiedFactor.id);
        setChallengeId(challenge.id);
        setMfaCode("");
        setMfaRequired(true);
        setError("");
        return;
      }

      await finishLogin();
    } catch (err) {
      console.error("LOGIN EXCEPTION:", err);
      setError(err.message || "Unable to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setError("");

    const code = mfaCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });

      if (verifyError) {
        setError(
          "The authenticator code is invalid or expired. Check the code and try again."
        );
        return;
      }

      // Confirm that Supabase upgraded the session to AAL2.
      const {
        data: assurance,
        error: assuranceError,
      } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) {
        throw assuranceError;
      }

      console.log("MFA assurance after verification:", {
        currentLevel: assurance?.currentLevel,
        nextLevel: assurance?.nextLevel,
      });

      if (assurance?.currentLevel !== "aal2") {
        throw new Error(
          "MFA verification did not reach AAL2. Please sign in and try again."
        );
      }

      setMfaRequired(false);
      await finishLogin();
    } catch (err) {
      console.error("MFA VERIFICATION ERROR:", err);
      setError(err.message || "Unable to verify the authenticator code.");
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
              {mfaRequired ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              {mfaRequired ? "Verify your identity" : "Welcome back"}
            </h1>

            <p className="mt-2 text-slate-500">
              {mfaRequired
                ? "Enter the six-digit code from your authenticator app."
                : "Login to track your complaints and report new issues."}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!mfaRequired ? (
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
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
          ) : (
            <form onSubmit={handleVerifyMFA} className="space-y-5">
              <div>
                <label
                  htmlFor="mfaCode"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Authenticator code
                </label>

                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-xl tracking-[0.35em] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full rounded-lg bg-blue-600 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? "Verifying..." : "Verify and continue"}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setError("");
                  setMfaRequired(false);
                  setMfaCode("");
                  setFactorId("");
                  setChallengeId("");
                  await supabase.auth.signOut();
                }}
                className="w-full rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel and sign out
              </button>
            </form>
          )}

          {!mfaRequired && (
            <div className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600"
              >
                Create an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
