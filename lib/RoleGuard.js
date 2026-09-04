"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, clearRole } from "./auth";

export default function RoleGuard({ requiredRole, children }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = getRole();
    if (role !== requiredRole) {
      router.replace("/");
    } else {
      setReady(true);
    }
  }, [requiredRole, router]);

  if (!ready) return null;

  return children;
}

export function LogoutLink() {
  const router = useRouter();
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        clearRole();
        router.replace("/");
      }}
    >
      Abmelden
    </a>
  );
}
