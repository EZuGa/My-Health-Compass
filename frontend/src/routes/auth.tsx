import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { auth, isAuthed, type Role } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: () => {
    if (isAuthed()) throw redirect({ to: "/" });
  },
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Sign in — Zrunva Health Passport" }, { name: "robots", content: "noindex" }],
  }),
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  password: z.string().min(6, "At least 6 characters").max(128, "Too long"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      setError("Enter your full name");
      return;
    }
    if (mode === "signup" && role === "doctor" && !specialty.trim()) {
      setError("Doctors must provide a specialty");
      return;
    }
    setBusy(true);
    try {
      let user;
      if (mode === "signup") {
        user = await auth.register({
          role,
          email: parsed.data.email,
          password: parsed.data.password,
          full_name: fullName.trim(),
          specialty: role === "doctor" ? specialty.trim() : null,
          personal_number:
            role === "patient" && personalNumber.trim() ? personalNumber.trim() : null,
        });
      } else {
        user = await auth.login(parsed.data.email, parsed.data.password);
      }
      // Enforce the portal: a patient can't sign into the doctor portal.
      if (user.role !== role) {
        auth.logout();
        setError(
          `This is the ${role} portal, but that account is a ${user.role}. Switch portals above.`,
        );
        return;
      }
      // Both roles land on "/": patients see their dashboard, doctors the
      // patient search page.
      navigate({ to: "/" });
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
            Zrunva · {role === "doctor" ? "Doctor portal" : "Patient portal"}
          </div>
          <h1 className="font-serif text-2xl font-black">
            {mode === "signin"
              ? role === "doctor"
                ? "Sign in to your clinic"
                : "Sign in to your health passport"
              : role === "doctor"
                ? "Create your clinician account"
                : "Create your health passport"}
          </h1>
          <p className="text-sm">
            {role === "doctor"
              ? "Request patient consent and review records you've been granted."
              : "Your medical data is private. Only you can read it after signing in."}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2">
          {(["patient", "doctor"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setError(null);
              }}
              className={`px-3 py-2 text-[12px] uppercase tracking-wider font-extrabold border-2 border-black ${
                role === r
                  ? "bg-[color:var(--mint-deep)]"
                  : "bg-white hover:bg-[color:var(--mint-soft)]"
              }`}
            >
              {r === "patient" ? "Patient" : "Doctor"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
                Full name
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
              />
            </label>
          )}
          {mode === "signup" && role === "doctor" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
                Specialty
              </span>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="cardiology, neurology, …"
                maxLength={80}
                className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
              />
            </label>
          )}
          {mode === "signup" && role === "patient" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
                Personal number (optional)
              </span>
              <input
                type="text"
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value)}
                placeholder="so a doctor can find you"
                maxLength={40}
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
              minLength={6}
              maxLength={128}
              className="mt-1 w-full border-2 border-black p-2 text-sm bg-white"
            />
          </label>

          {error && (
            <div className="text-sm font-bold text-red-700 border border-red-700 bg-red-50 p-2">
              {error}
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
          }}
          className="text-sm font-bold underline"
        >
          {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
