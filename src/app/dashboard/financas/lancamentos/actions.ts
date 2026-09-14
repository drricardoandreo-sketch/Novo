"use server";

import { revalidatePath } from "next/cache";
import { requireFinanceContext } from "@/lib/finance/guard";
import type { FinancePaymentMethod, FinanceTransactionType } from "@/types/finance";

export async function createTransactionAction(formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const categoriaId = String(formData.get("categoria_id") ?? "") || null;

  const { error } = await supabase.from("finance_transactions").insert({
    user_id: userId,
    data: String(formData.get("data") ?? new Date().toISOString().slice(0, 10)),
    tipo: String(formData.get("tipo") ?? "despesa") as FinanceTransactionType,
    valor: Number(formData.get("valor") ?? 0),
    categoria_id: categoriaId,
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    forma_pagamento: String(
      formData.get("forma_pagamento") ?? "pix"
    ) as FinancePaymentMethod,
    fixo: formData.get("fixo") === "on",
  });

  if (error) {
    throw new Error(`Falha ao lançar: ${error.message}`);
  }

  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/lancamentos");
}

export async function deleteTransactionAction(id: string) {
  const { supabase } = await requireFinanceContext();
  await supabase.from("finance_transactions").delete().eq("id", id);
  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/lancamentos");
}

export async function createCategoryAction(formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  await supabase.from("finance_categories").insert({
    user_id: userId,
    nome,
    tipo: String(formData.get("tipo") ?? "despesa") as FinanceTransactionType,
    cor: String(formData.get("cor") ?? "#6b7280"),
  });

  revalidatePath("/dashboard/financas/lancamentos");
}
