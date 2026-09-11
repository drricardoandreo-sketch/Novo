"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const novaSenha = String(formData.get("nova_senha") ?? "");
  const confirmarSenha = String(formData.get("confirmar_senha") ?? "");

  if (novaSenha.length < 8) {
    redirect(
      `/dashboard/conta?error=${encodeURIComponent("A senha deve ter pelo menos 8 caracteres")}`
    );
  }

  if (novaSenha !== confirmarSenha) {
    redirect(
      `/dashboard/conta?error=${encodeURIComponent("As senhas não coincidem")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    redirect(`/dashboard/conta?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/conta?success=1");
}
