"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerPaymentAction(paymentId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("payments")
    .update({ data_pagamento: today })
    .eq("id", paymentId);

  revalidatePath("/dashboard/pagamentos");
}

export async function generateMonthlyPaymentsAction() {
  const supabase = createClient();
  await supabase.rpc("generate_monthly_payments");
  revalidatePath("/dashboard/pagamentos");
}

export async function markOverdueAction() {
  const supabase = createClient();
  await supabase.rpc("mark_overdue_payments");
  revalidatePath("/dashboard/pagamentos");
}
