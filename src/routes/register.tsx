import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthNotebook, Field, inputCls } from "@/components/melio/AuthNotebook";
import { actions } from "@/lib/mock/store";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [
    { title: "Create your notebook — MELIO" },
    { name: "description", content: "Join MELIO: study timer, virtual pet and cozy planning in one little study universe." },
    { property: "og:title", content: "Create your notebook — MELIO" },
    { property: "og:description", content: "Join MELIO: study timer, virtual pet and cozy planning in one little study universe." },
  ] }),
  component: Register,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128).regex(/[0-9]/, "Include at least one number"),
  confirm: z.string(),
  terms: z.literal("on", { message: "Please accept the terms" }),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

function Register() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password" | "confirm" | "terms", string>>>({});

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = schema.safeParse(Object.fromEntries(fd));
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({});
    // Prototype: real signup → POST /api/auth/register (server hashes the password). Password is NOT stored here.
    actions.login({ name: r.data.name, email: r.data.email });
    toast.success("Notebook created! Meet your new study buddy.");
    nav({ to: "/" });
  }

  const pw = (id: "password" | "confirm", label: string) => (
    <Field id={id} label={label} error={errors[id]}>
      <div className="relative">
        <input id={id} name={id} type={show ? "text" : "password"} autoComplete="new-password" className={inputCls + " pr-10"} aria-invalid={!!errors[id]} />
        {id === "password" && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-ink">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  );

  return (
    <AuthNotebook>
      <h1 className="font-hand text-4xl text-ink">Start a new notebook</h1>
      <p className="mb-5 text-sm text-muted-foreground">A cozy little space for everything you're learning.</p>
      <form onSubmit={submit} noValidate className="space-y-3.5">
        <Field id="name" label="Full name" error={errors.name}><input id="name" name="name" autoComplete="name" className={inputCls} aria-invalid={!!errors.name} /></Field>
        <Field id="email" label="Email" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} /></Field>
        {pw("password", "Password")}
        {pw("confirm", "Confirm password")}
        <div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="terms" className="mt-1 accent-[var(--ink)]" />I agree to the Terms and Privacy Policy</label>
          {errors.terms && <p role="alert" className="mt-1 text-xs font-semibold text-destructive">{errors.terms}</p>}
        </div>
        <button className="w-full rounded-md bg-primary py-2.5 font-bold text-primary-foreground shadow-paper transition-transform hover:-translate-y-0.5">Create account</button>
      </form>
      <p className="mt-5 text-center text-sm">Already have one? <Link to="/login" className="font-bold text-ink hover:underline">Log in</Link></p>
    </AuthNotebook>
  );
}
