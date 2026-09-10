import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/dashboard/client-form";
import { createClientAction } from "../actions";

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">
          Novo cliente
        </h1>
        <p className="text-sm text-gray-500">
          Cadastre um novo aluno do estúdio.
        </p>
      </div>

      <ClientForm
        instructors={instructors ?? []}
        action={createClientAction}
        error={searchParams.error}
      />
    </div>
  );
}
