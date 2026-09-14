"use server";

import { revalidatePath } from "next/cache";
import { requireFinanceContext } from "@/lib/finance/guard";

export async function createDebtAction(formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const valorOriginal = Number(formData.get("valor_original") ?? 0);

  const { error } = await supabase.from("finance_debts").insert({
    user_id: userId,
    nome: String(formData.get("nome") ?? "").trim(),
    valor_original: valorOriginal,
    saldo_devedor: Number(formData.get("saldo_devedor") ?? valorOriginal),
    taxa_juros_mensal: Number(formData.get("taxa_juros_mensal") ?? 0),
    dia_vencimento: formData.get("dia_vencimento")
      ? Number(formData.get("dia_vencimento"))
      : null,
    pagamento_minimo: Number(formData.get("pagamento_minimo") ?? 0),
  });

  if (error) {
    throw new Error(`Falha ao cadastrar dívida: ${error.message}`);
  }

  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/dividas");
}

export async function registerDebtPaymentAction(debtId: string, formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const { error } = await supabase.from("finance_debt_payments").insert({
    debt_id: debtId,
    user_id: userId,
    valor: Number(formData.get("valor") ?? 0),
    data_pagamento: String(
      formData.get("data_pagamento") ?? new Date().toISOString().slice(0, 10)
    ),
    observacao: String(formData.get("observacao") ?? "").trim() || null,
  });

  if (error) {
    throw new Error(`Falha ao registrar pagamento: ${error.message}`);
  }

  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/dividas");
}

export async function deleteDebtAction(debtId: string) {
  const { supabase } = await requireFinanceContext();
  await supabase.from("finance_debts").delete().eq("id", debtId);
  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/dividas");
}
