import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthNotebook, Field, inputCls } from "@/components/melio/AuthNotebook";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — MELIO" }, { name: "description", content: "Recover access to your MELIO study notebook." },
    { property: "og:title", content: "Reset password — MELIO" }, { property: "og:description", content: "Recover access to your MELIO study notebook." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"); }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      if (recovery) {
        const password = String(form.get("password"));
        if (password !== form.get("confirm")) { setMessage("Passwords do not match."); return; }
        const { error } = await supabase.auth.updateUser({ password });
        setMessage(error ? "The reset link may have expired. Request a new one." : "Password updated. You can now log in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")), { redirectTo: `${window.location.origin}/reset-password` });
        setMessage(error ? "The email could not be sent. Please try again." : "If an account exists, a reset link will arrive by email.");
      }
    } catch { setMessage("Please try again in a moment."); } finally { setBusy(false); }
  }
  return <AuthNotebook><h1 className="mb-5 font-hand text-3xl text-ink">{recovery ? "Choose a new password" : "Reset your password"}</h1><form onSubmit={submit} className="space-y-4">{recovery ? <><Field id="new-password" label="New password"><input id="new-password" name="password" type="password" minLength={8} required autoComplete="new-password" className={inputCls} /></Field><Field id="confirm-reset" label="Confirm password"><input id="confirm-reset" name="confirm" type="password" minLength={8} required className={inputCls} /></Field></> : <Field id="reset-email" label="Email"><input id="reset-email" name="email" type="email" required className={inputCls} /></Field>}<Button disabled={busy} className="w-full">{recovery ? "Save password" : "Send reset link"}</Button></form>{message && <p role="status" className="mt-4 text-sm">{message}</p>}<Button asChild variant="link" className="mt-4"><Link to="/login">Back to login</Link></Button></AuthNotebook>;
}