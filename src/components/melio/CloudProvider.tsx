import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { studyCommand } from "@/lib/study.functions";
import { connectCloud, hydrateCloud, clearCloud } from "@/lib/mock/store";

const CloudContext = createContext({ ready: false, signedIn: false, loading: false, error: false, retry: () => {} });
export const useCloud = () => useContext(CloudContext);

export function CloudProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const command = useServerFn(studyCommand);
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    const apply = (u: User | null) => { if (!alive) return; clearCloud(); setUser(u); setReady(true); };
    void supabase.auth.getUser().then(({ data }) => apply(data.user));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      apply(session?.user ?? null);
      void router.invalidate();
      if (event !== "SIGNED_OUT") void client.invalidateQueries();
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [client, router]);
  const query = useQuery({ queryKey: ["cloud-study", user?.id], enabled: ready && !!user, queryFn: async () => {
    const result = await command({ data: { command: "read", payload: {} } });
    const profile = await supabase.from("profiles").select("display_name").eq("user_id", user?.id ?? "").maybeSingle();
    return { result, name: profile.data?.display_name || String(user?.user_metadata?.['name'] ?? user?.email?.split("@")[0] ?? "Student") };
  }, refetchOnWindowFocus: true, retry: 1 });
  useEffect(() => {
    if (!user || !query.data) return;
    hydrateCloud(query.data.result.state, { name: query.data.name, email: user.email ?? "" });
    connectCloud(async (input) => {
      const result = await command({ data: input });
      hydrateCloud(result.state, { name: query.data.name, email: user.email ?? "" });
      client.setQueryData(["cloud-study", user.id], { result, name: query.data.name });
      return result;
    });
    return () => connectCloud(null);
  }, [user, query.data, command, client]);
  return <CloudContext.Provider value={{ ready, signedIn: !!user, loading: !!user && query.isPending, error: query.isError, retry: () => { void query.refetch(); } }}>{children}</CloudContext.Provider>;
}