"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConvitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setError("Link de convite inválido ou expirado. Solicite um novo.");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setError("Link de convite inválido ou expirado. Solicite um novo.");
        return;
      }
      router.replace("/redefinir-senha");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-evolve-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        {error ? (
          <>
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
            <a href="/login" className="text-sm text-evolve-700 hover:underline">
              Voltar para o login
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500">Validando seu convite...</p>
        )}
      </div>
    </main>
  );
}
