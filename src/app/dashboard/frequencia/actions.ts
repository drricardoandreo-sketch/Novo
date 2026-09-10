"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkinAction(formData: FormData) {
  const supabase = createClient();

  const classId = String(formData.get("class_id"));
  const data = String(formData.get("data"));
  const clientIds = JSON.parse(String(formData.get("client_ids") ?? "[]")) as string[];

  const rows = clientIds.map((clientId) => ({
    client_id: clientId,
    class_id: classId,
    data,
    presente: formData.get(`presente_${clientId}`) === "on",
    reposicao: formData.get(`reposicao_${clientId}`) === "on",
  }));

  if (rows.length > 0) {
    await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "client_id,class_id,data" });
  }

  revalidatePath("/dashboard/frequencia");
}
