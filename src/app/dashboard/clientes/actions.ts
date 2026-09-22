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

const MAX_ATESTADO_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_SIGNATURES: { mime: string; ext: string; magic: number[] }[] = [
  { mime: "application/pdf", ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  {
    mime: "image/png",
    ext: "png",
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
];

/**
 * Detecta o tipo real do arquivo pelos primeiros bytes (assinatura), em vez
 * de confiar na extensão do nome ou no `file.type` informado pelo
 * navegador — ambos podem ser forjados facilmente.
 */
function detectFileType(bytes: Uint8Array) {
  return ALLOWED_SIGNATURES.find((sig) =>
    sig.magic.every((byte, i) => bytes[i] === byte)
  );
}

async function uploadAtestadoIfPresent(
  supabase: ReturnType<typeof createClient>,
  clientId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("atestado") as File | null;
  if (!file || file.size === 0) return null;

  if (file.size > MAX_ATESTADO_BYTES) {
    throw new Error("Arquivo muito grande (máximo 8 MB)");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const detected = detectFileType(buffer);

  if (!detected) {
    throw new Error(
      "Formato de arquivo não suportado. Envie um PDF, JPG ou PNG."
    );
  }

  const path = `${clientId}/${Date.now()}.${detected.ext}`;

  const { error } = await supabase.storage
    .from("atestados")
    .upload(path, buffer, { upsert: true, contentType: detected.mime });

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

  let atestadoPath: string | null = null;
  try {
    atestadoPath = await uploadAtestadoIfPresent(supabase, data!.id, formData);
  } catch (uploadError) {
    redirect(
      `/dashboard/clientes/${data!.id}?error=${encodeURIComponent(
        (uploadError as Error).message
      )}`
    );
  }

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

  let atestadoPath: string | null = null;
  try {
    atestadoPath = await uploadAtestadoIfPresent(supabase, clientId, formData);
  } catch (uploadError) {
    redirect(
      `/dashboard/clientes/${clientId}?error=${encodeURIComponent(
        (uploadError as Error).message
      )}`
    );
  }

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
