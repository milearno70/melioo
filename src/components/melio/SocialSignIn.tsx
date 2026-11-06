import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";

export function SocialSignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function signIn(provider: "google" | "lovable") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Sign-in could not be completed. Please try again."); return; }
      if (!result.redirected) await navigate({ to: "/" });
    } catch { toast.error("Sign-in could not be completed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mt-5 space-y-2 border-t border-dashed pt-4">
    <Button variant="outline" className="w-full" disabled={busy} onClick={() => signIn("google")}>Continue with Google</Button>
    <Button className="lovable-auth-button w-full" disabled={busy} onClick={() => signIn("lovable")}>Continue with Lovable</Button>
  </div>;
}