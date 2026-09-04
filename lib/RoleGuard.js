"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";
import { fetchRole, signOutUser } from "./supabaseAuth";

export default function RoleGuard({ requiredRole, children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "ok"
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        if (active) router.replace("/");
        return;
      }
      const role = await fetchRole(session.user.id);
      if (!active) return;
      if (role !== requiredRole) {
        router.replace("/");
      } else {
        setStatus("ok");
      }
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [requiredRole, router]);

  if (status !== "ok") return null;

  return children;
}

export function LogoutLink() {
  const router = useRouter();
  return (
    <a
      href="#"
      onClick={async (e) => {
        e.preventDefault();
        await signOutUser();
        router.replace("/");
      }}
    >
      Abmelden
    </a>
  );
}
