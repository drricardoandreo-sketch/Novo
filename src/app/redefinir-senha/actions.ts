"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAfterResetAction(formData: FormData) {
  const novaSenha = String(formData.get("nova_senha") ?? "");
  const confirmarSenha = String(formData.get("confirmar_senha") ?? "");

  if (novaSenha.length < 8) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent("A senha deve ter pelo menos 8 caracteres")}`
    );
  }

  if (novaSenha !== confirmarSenha) {
    redirect(
      `/redefinir-senha?error=${encodeURIComponent("As senhas não coincidem")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
