import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AuthNotebook, Field, inputCls } from "@/components/melio/AuthNotebook";
import { supabase } from "@/integrations/supabase/client";
import { SocialSignIn } from "@/components/melio/SocialSignIn";
import { Button } from "@/components/ui/button";
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
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(r.data);
      if (error) { toast.error("Check your email and password, and confirm your email before signing in."); return; }
      toast.success("Welcome back!");
      await nav({ to: "/" });
    } catch { toast.error("Sign-in could not be completed. Please try again."); }
    finally { setLoading(false); }
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
          <Button asChild variant="link" className="px-0"><Link to="/reset-password">Forgot password?</Link></Button>
        </div>
        <Button disabled={loading} className="w-full">
          {loading ? "Opening notebook…" : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">New here? <Link to="/register" className="font-bold text-ink hover:underline">Create your notebook</Link></p>
      <SocialSignIn />
    </AuthNotebook>
  );
}
