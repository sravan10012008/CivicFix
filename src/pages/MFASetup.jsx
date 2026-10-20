import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function MFASetup() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  async function startEnrollment() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        throw new Error("Please sign in to CivicFix first.");
      }

      const { data, error: enrollError } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "CivicFix Authenticator",
        });

      if (enrollError) throw enrollError;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setMessage("Scan the QR code with your authenticator app.");
    } catch (err) {
      setError(err.message || "Unable to start MFA enrollment.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEnrollment(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code: code.trim(),
        });

      if (verifyError) throw verifyError;

      setEnrolled(true);
      setQrCode("");
      setSecret("");
      setCode("");
      setMessage("Authenticator verified. MFA enrollment is complete.");
    } catch (err) {
      setError(err.message || "Verification failed. Check your code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">
        CivicFix Multi-Factor Authentication
      </h1>

      <p>Add an authenticator app to protect your CivicFix account.</p>

      {!factorId && !enrolled && (
        <button
          type="button"
          onClick={startEnrollment}
          disabled={loading}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Preparing..." : "Set up authenticator"}
        </button>
      )}

      {qrCode && (
        <section className="space-y-3 rounded border p-4">
          <h2 className="font-semibold">1. Scan this QR code</h2>

          <div
            className="max-w-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />

          <p className="text-sm">
            If scanning is unavailable, enter this setup secret manually
            in your authenticator app:
          </p>

          <code className="block break-all rounded bg-gray-100 p-3 text-black">
            {secret}
          </code>

          <h2 className="font-semibold">2. Verify your authenticator</h2>

          <form onSubmit={verifyEnrollment} className="space-y-3">
            <label htmlFor="totp-code" className="block">
              Six-digit authenticator code
            </label>

            <input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded border p-3"
              placeholder="123456"
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify and enable MFA"}
            </button>
          </form>
        </section>
      )}

      {enrolled && (
        <p className="rounded border p-3">
          MFA is enrolled for this account. Keep access to your authenticator
          app so you can complete future verification challenges.
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <Link to="/citizen" className="text-blue-700 underline">
        Return to CivicFix
      </Link>
    </main>
  );
}
