import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // HANDLE INPUT
  // --------------------------------------------------

  const set = (key) => (e) => {
    let value = e.target.value;

    // PHONE
    // Remove everything except digits.
    // Keep only the first 10 digits.
    if (key === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    // EMAIL
    if (key === "email") {
      value = value.replace(/\s/g, "");
    }

    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------------------------
    // NAME
    // -----------------------------------------------

    const name = form.name.trim();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    // -----------------------------------------------
    // EMAIL
    // -----------------------------------------------

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    const gmailRegex =
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email)) {
      setError(
        "Please enter a valid Gmail address ending with @gmail.com."
      );
      return;
    }

    // -----------------------------------------------
    // PHONE
    // -----------------------------------------------

    const phone = form.phone.trim();

    if (phone.length !== 10) {
      setError(
        "Phone number must be exactly 10 digits."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Phone number must contain only digits."
      );
      return;
    }

    // -----------------------------------------------
    // PASSWORD
    // -----------------------------------------------

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    // -----------------------------------------------
    // CONFIRM PASSWORD
    // -----------------------------------------------

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    // -----------------------------------------------
    // START SUPABASE REGISTRATION
    // -----------------------------------------------

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password: form.password,

          options: {
            data: {
              full_name: name,
              phone: phone,
              role: "citizen",
            },
          },
        });

      // ---------------------------------------------
      // SIGNUP ERROR
      // ---------------------------------------------

      if (signUpError) {
        console.error(
          "Supabase registration error:",
          signUpError
        );

        setError(
          signUpError.message ||
            "Registration failed. Please try again."
        );

        return;
      }

      // ---------------------------------------------
      // USER CHECK
      // ---------------------------------------------

      if (!data?.user) {
        setError(
          "Registration failed. Please try again."
        );

        return;
      }

      // ---------------------------------------------
      // CREATE PROFILE
      // ---------------------------------------------

      const { error: profileError } =
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
            email: email,
            phone: phone,
            role: "citizen",
          });

      if (profileError) {
        console.error(
          "Profile creation error:",
          profileError
        );

        setError(
          "Account was created, but your profile could not be saved."
        );

        return;
      }

      // ---------------------------------------------
      // REMOVE OLD LOCAL AUTH
      // ---------------------------------------------

      localStorage.removeItem(
        "civicfix_logged_in_user"
      );

      localStorage.removeItem(
        "civicfix_user"
      );

      localStorage.setItem(
        "civicfix_registered",
        "true"
      );

      // ---------------------------------------------
      // SIGN OUT AUTOMATIC SESSION
      // ---------------------------------------------

      if (data.session) {
        await supabase.auth.signOut();
      }

      // ---------------------------------------------
      // GO TO LOGIN
      // ---------------------------------------------

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
          email: email,
        },
      });
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // INPUT STYLE
  // --------------------------------------------------

  const inputBase =
    "w-full rounded-xl border border-input bg-card py-3 pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/30";

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AuthLayout
      title="Create your CivicFix account"
      subtitle="Citizens can register here. Authority and worker accounts are created by an admin."
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
        {/* FULL NAME */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full Name
          </label>

          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              className={inputBase}
              placeholder="Alex"
              autoComplete="name"
            />
          </div>
        </div>

        {/* EMAIL */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              required
              value={form.email}
              onChange={set("email")}
              className={inputBase}
              placeholder="you@gmail.com"
              autoComplete="email"
            />
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Only Gmail addresses ending in @gmail.com are accepted.
          </p>
        </div>

        {/* PHONE */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>

          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="tel"
              required
              value={form.phone}
              onChange={set("phone")}
              className={inputBase}
              placeholder="9876543210"
              inputMode="numeric"
              autoComplete="tel"
            />
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Enter exactly 10 digits.
          </p>
        </div>

        {/* PASSWORDS */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type={show ? "text" : "password"}
                required
                value={form.password}
                onChange={set("password")}
                className={inputBase}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm
            </label>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type={show ? "text" : "password"}
                required
                value={form.confirm}
                onChange={set("confirm")}
                className={inputBase}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        {/* SHOW PASSWORD */}

        <button
          type="button"
          onClick={() =>
            setShow((current) => !current)
          }
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {show ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}

          {show ? "Hide" : "Show"} passwords
        </button>

        {/* ERROR */}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* CREATE ACCOUNT */}

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Creating account..."
            : "Create Account"}

          {!loading && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        {/* LOGIN */}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}

          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}