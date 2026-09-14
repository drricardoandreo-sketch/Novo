import type { createClient } from "@/lib/supabase/server";
import type { FinanceTransactionType } from "@/types/finance";

export const DEFAULT_FINANCE_CATEGORIES: {
  nome: string;
  tipo: FinanceTransactionType;
  cor: string;
}[] = [
  { nome: "Salário", tipo: "receita", cor: "#16a34a" },
  { nome: "Renda extra", tipo: "receita", cor: "#0ea5e9" },
  { nome: "Moradia", tipo: "despesa", cor: "#dc2626" },
  { nome: "Alimentação", tipo: "despesa", cor: "#ea580c" },
  { nome: "Transporte", tipo: "despesa", cor: "#d97706" },
  { nome: "Saúde", tipo: "despesa", cor: "#0891b2" },
  { nome: "Lazer", tipo: "despesa", cor: "#c026d3" },
  { nome: "Assinaturas", tipo: "despesa", cor: "#7c3aed" },
  { nome: "Dívidas e empréstimos", tipo: "despesa", cor: "#b91c1c" },
  { nome: "Educação", tipo: "despesa", cor: "#2563eb" },
  { nome: "Outros", tipo: "despesa", cor: "#6b7280" },
];

/**
 * Primeira visita ao módulo: cria as categorias padrão pro usuário se ele
 * ainda não tiver nenhuma. Evita tela vazia sem precisar de trigger no banco.
 */
export async function ensureDefaultFinanceCategories(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { count } = await supabase
    .from("finance_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return;

  await supabase.from("finance_categories").insert(
    DEFAULT_FINANCE_CATEGORIES.map((categoria) => ({
      ...categoria,
      user_id: userId,
    }))
  );
}
