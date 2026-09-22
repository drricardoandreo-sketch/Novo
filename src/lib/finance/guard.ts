import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPersonalFinanceOwner } from "@/lib/finance/access";

/**
 * Finanças pessoais são só do dono da conta, nunca da equipe do estúdio
 * nem de outros admins. Restrito por e-mail, não por role, porque é dado
 * pessoal — não faz sentido outro admin do estúdio enxergar isso.
 */
export async function requireFinanceContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isPersonalFinanceOwner(user!.email)) {
    redirect("/dashboard");
  }

  return { supabase, userId: user!.id };
}
