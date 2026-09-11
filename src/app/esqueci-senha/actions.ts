"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  const h = headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/esqueci-senha?error=${encodeURIComponent("Informe seu e-mail")}`);
  }

  const supabase = createClient();
  const siteUrl = getSiteUrl();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Sempre redireciona para a mesma mensagem de sucesso, exista ou não o
  // e-mail cadastrado — evita expor quais e-mails têm conta no sistema.
  redirect("/esqueci-senha?success=1");
}
