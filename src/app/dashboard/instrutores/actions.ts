"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInstructorAction(formData: FormData) {
  const supabase = createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim() || null;

  if (!nome) {
    redirect(`/dashboard/instrutores?error=${encodeURIComponent("Informe o nome")}`);
  }

  const { error } = await supabase.from("instructors").insert({ nome, telefone });

  if (error) {
    redirect(`/dashboard/instrutores?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/instrutores");
  redirect("/dashboard/instrutores");
}

export async function updateInstructorAction(
  instructorId: string,
  formData: FormData
) {
  const supabase = createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim() || null;

  if (!nome) {
    redirect(`/dashboard/instrutores?error=${encodeURIComponent("Informe o nome")}`);
  }

  const { error } = await supabase
    .from("instructors")
    .update({ nome, telefone })
    .eq("id", instructorId);

  if (error) {
    redirect(`/dashboard/instrutores?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/instrutores");
  redirect("/dashboard/instrutores");
}

export async function toggleInstructorActiveAction(
  instructorId: string,
  ativo: boolean
) {
  const supabase = createClient();
  await supabase.from("instructors").update({ ativo }).eq("id", instructorId);
  revalidatePath("/dashboard/instrutores");
}
