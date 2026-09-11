"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const currentRole = await getCurrentUserRole();
  if (currentRole !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/dashboard/usuarios");
}
