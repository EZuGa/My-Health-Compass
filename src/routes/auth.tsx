import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Zrunva Health Passport" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(128, "Too long"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/" });
      }
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || undefined },
          },
        });
        if (error) throw error;
        setNotice(
          "Account created. Check your inbox to confirm your email, then sign in.",
        );
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        // navigation handled by onAuthStateChange
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md cloud-panel p-6 space-y-5">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] font-extrabold text-[color:var(--mint-deep)]">
            Zrunva
          </div>
          <h1 className="font-serif text-2xl font-black">
            {mode === "signin" ? "Sign in to your health passport" : "Create your health passport"}
          </h1>
          <p className="text-sm">
            Your medical data is private. Only you can read it after signing in.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
                Display name (optional)
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">Password</span>
            <input
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
            />
            {mode === "signup" && (
              <span className="text-[11px] block mt-1 opacity-70">
                At least 8 characters. Avoid passwords reused on other sites.
              </span>
            )}
          </label>

          {error && (
            <div className="text-sm font-bold text-red-700 border border-red-700 bg-red-50 p-2">
              {error}
            </div>
          )}
          {notice && (
            <div className="text-sm font-bold text-green-800 border border-green-700 bg-green-50 p-2">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-3 py-2 text-[12px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="text-sm font-bold underline"
        >
          {mode === "signin"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
