"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClientStatus, FormaPagamento } from "@/types/database";

function parseClientForm(formData: FormData) {
  return {
    nome_completo: String(formData.get("nome_completo") ?? "").trim(),
    data_nascimento: String(formData.get("data_nascimento") ?? ""),
    data_entrada: String(formData.get("data_entrada") ?? ""),
    telefone_whatsapp: String(formData.get("telefone_whatsapp") ?? "").trim(),
    status: String(formData.get("status") ?? "ativo") as ClientStatus,
    forma_pagamento: String(
      formData.get("forma_pagamento") ?? "particular"
    ) as FormaPagamento,
    dia_pagamento: Number(formData.get("dia_pagamento") ?? 1),
    valor_plano: Number(formData.get("valor_plano") ?? 0),
    frequencia_semanal: Number(formData.get("frequencia_semanal") ?? 1),
    instrutor_responsavel_id:
      String(formData.get("instrutor_responsavel_id") ?? "") || null,
    observacoes_saude: String(formData.get("observacoes_saude") ?? "") || null,
  };
}

async function uploadAtestadoIfPresent(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("atestado") as File | null;
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop() ?? "pdf";
  const path = `${clientId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("atestados")
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Falha ao enviar arquivo: ${error.message}`);
  }

  return path;
}

export async function createClientAction(formData: FormData) {
  const supabase = createClient();
  const payload = parseClientForm(formData);

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    redirect(
      `/dashboard/clientes/novo?error=${encodeURIComponent(error.message)}`
    );
  }

  const atestadoPath = await uploadAtestadoIfPresent(
    supabase,
    data!.id,
    formData
  );

  if (atestadoPath) {
    await supabase
      .from("clients")
      .update({ atestado_url: atestadoPath })
      .eq("id", data!.id);
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = createClient();
  const payload = parseClientForm(formData);

  const atestadoPath = await uploadAtestadoIfPresent(
    supabase,
    clientId,
    formData
  );

  const { error } = await supabase
    .from("clients")
    .update({
      ...payload,
      ...(atestadoPath ? { atestado_url: atestadoPath } : {}),
    })
    .eq("id", clientId);

  if (error) {
    redirect(
      `/dashboard/clientes/${clientId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}`);
  redirect(`/dashboard/clientes/${clientId}`);
}

export async function updateClientStatusAction(
  clientId: string,
  status: ClientStatus
) {
  const supabase = createClient();
  await supabase.from("clients").update({ status }).eq("id", clientId);
  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clientId}`);
}
