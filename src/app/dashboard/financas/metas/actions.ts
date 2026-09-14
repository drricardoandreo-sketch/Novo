"use server";

import { revalidatePath } from "next/cache";
import { requireFinanceContext } from "@/lib/finance/guard";

export async function createGoalAction(formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const { error } = await supabase.from("finance_savings_goals").insert({
    user_id: userId,
    nome: String(formData.get("nome") ?? "").trim(),
    valor_meta: Number(formData.get("valor_meta") ?? 0),
    valor_atual: Number(formData.get("valor_atual") ?? 0),
    data_meta: String(formData.get("data_meta") ?? "") || null,
  });

  if (error) {
    throw new Error(`Falha ao criar meta: ${error.message}`);
  }

  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/metas");
}

export async function contributeToGoalAction(goalId: string, formData: FormData) {
  const { supabase, userId } = await requireFinanceContext();

  const { error } = await supabase.from("finance_savings_contributions").insert({
    goal_id: goalId,
    user_id: userId,
    valor: Number(formData.get("valor") ?? 0),
    data: String(formData.get("data") ?? new Date().toISOString().slice(0, 10)),
    observacao: String(formData.get("observacao") ?? "").trim() || null,
  });

  if (error) {
    throw new Error(`Falha ao registrar aporte: ${error.message}`);
  }

  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/metas");
}

export async function deleteGoalAction(goalId: string) {
  const { supabase } = await requireFinanceContext();
  await supabase.from("finance_savings_goals").delete().eq("id", goalId);
  revalidatePath("/dashboard/financas");
  revalidatePath("/dashboard/financas/metas");
}
