"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DiaSemana } from "@/types/database";

export async function createClassAction(formData: FormData) {
  const supabase = createClient();

  const payload = {
    dia_semana: String(formData.get("dia_semana")) as DiaSemana,
    horario: String(formData.get("horario")),
    capacidade_maxima: Number(formData.get("capacidade_maxima") ?? 10),
    instrutor_id: String(formData.get("instrutor_id") ?? "") || null,
  };

  const { error } = await supabase.from("classes").insert(payload);

  if (error) {
    redirect(`/dashboard/turmas?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/turmas");
  redirect("/dashboard/turmas");
}

export async function enrollClientAction(formData: FormData) {
  const supabase = createClient();

  const classId = String(formData.get("class_id"));
  const clientId = String(formData.get("client_id"));

  const { data: turma, error: turmaError } = await supabase
    .from("classes")
    .select("dia_semana, horario")
    .eq("id", classId)
    .single();

  if (turmaError || !turma) {
    redirect(`/dashboard/turmas?error=${encodeURIComponent("Turma não encontrada")}`);
  }

  const { error } = await supabase.from("class_schedules").insert({
    client_id: clientId,
    class_id: classId,
    dia_semana: turma!.dia_semana,
    horario: turma!.horario,
  });

  if (error) {
    redirect(`/dashboard/turmas?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/turmas");
  redirect("/dashboard/turmas");
}

export async function removeEnrollmentAction(scheduleId: string) {
  const supabase = createClient();
  await supabase.from("class_schedules").delete().eq("id", scheduleId);
  revalidatePath("/dashboard/turmas");
}
