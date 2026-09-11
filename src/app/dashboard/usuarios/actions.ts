"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { getSiteUrl } from "@/lib/site-url";

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/dashboard/usuarios");
}

export async function inviteInstructorAction(formData: FormData) {
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    redirect("/dashboard");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefone = String(formData.get("telefone") ?? "").trim();

  if (!email) {
    redirect(`/dashboard/usuarios?error=${encodeURIComponent("Informe o e-mail")}`);
  }

  const serviceClient = createServiceRoleClient();

  const { error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: nome ? { nome_completo: nome } : undefined,
  });

  if (createError && !/already|existe/i.test(createError.message)) {
    redirect(
      `/dashboard/usuarios?error=${encodeURIComponent(createError.message)}`
    );
  }

  const siteUrl = getSiteUrl();
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/convite` },
    });

  const actionLink = linkData?.properties?.action_link;

  if (linkError || !actionLink) {
    redirect(
      `/dashboard/usuarios?error=${encodeURIComponent(
        "Não foi possível gerar o convite: " + (linkError?.message ?? "erro desconhecido")
      )}`
    );
  }

  const mensagem = `Você foi convidado(a) para acessar o painel do Evolve. Acesse este link para criar sua senha e entrar:\n${actionLink}`;
  const telefoneDigits = telefone.replace(/\D/g, "");
  const waLink = telefoneDigits
    ? `https://wa.me/${telefoneDigits}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

  revalidatePath("/dashboard/usuarios");
  redirect(
    `/dashboard/usuarios?invite_link=${encodeURIComponent(actionLink)}&invite_wa=${encodeURIComponent(waLink)}`
  );
}
