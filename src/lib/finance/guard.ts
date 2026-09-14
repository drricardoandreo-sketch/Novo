import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";

/**
 * Finanças pessoais são só do dono da conta (admin), nunca da equipe do
 * estúdio. Redireciona quem não for admin e garante um user_id pra RLS.
 */
export async function requireFinanceContext() {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user!.id };
}
