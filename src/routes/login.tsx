import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AuthNotebook, Field, inputCls } from "@/components/melio/AuthNotebook";
import { actions } from "@/lib/mock/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in — MELIO" },
    { name: "description", content: "Open your MELIO notebook and continue your little study universe." },
    { property: "og:title", content: "Log in — MELIO" },
    { property: "og:description", content: "Open your MELIO notebook and continue your little study universe." },
  ] }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setLoading(true);
    // Prototype: no backend yet. Real login → POST /api/auth/login (password verified server-side, never stored here).
    setTimeout(() => {
      const name = r.data.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      actions.login({ name, email: r.data.email });
      toast.success(`Welcome back, ${name}!`);
      nav({ to: "/" });
    }, 500);
  }

  return (
    <AuthNotebook>
      <h1 className="font-hand text-4xl text-ink">Welcome back!</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your notebook missed you. Let's pick up where you left off.</p>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} placeholder="you@school.edu" />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <div className="relative">
            <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" className={inputCls + " pr-10"} aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-ink">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="remember" className="accent-[var(--ink)]" />Remember me</label>
          <button type="button" onClick={() => toast("Password reset needs the backend — coming with the API.")} className="font-semibold text-ink underline-offset-2 hover:underline">Forgot password?</button>
        </div>
        <button disabled={loading} className="w-full rounded-md bg-primary py-2.5 font-bold text-primary-foreground shadow-paper transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? "Opening notebook…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">New here? <Link to="/register" className="font-bold text-ink hover:underline">Create your notebook</Link></p>
      <p className="mt-4 rounded-sm bg-butter/70 px-3 py-2 text-center text-xs">Prototype mode: any valid email + 8-char password works. Nothing is sent to a server.</p>
    </AuthNotebook>
  );
}
