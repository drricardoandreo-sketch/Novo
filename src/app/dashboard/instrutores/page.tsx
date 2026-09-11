import { createClient } from "@/lib/supabase/server";
import {
  createInstructorAction,
  toggleInstructorActiveAction,
  updateInstructorAction,
} from "./actions";

export default async function InstrutoresPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .order("ativo", { ascending: false })
    .order("nome");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Instrutores</h1>
        <p className="text-sm text-gray-500">
          Cadastre os instrutores para vincular a turmas e clientes.
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="card">
        <h2 className="mb-4 font-medium text-evolve-900">Novo instrutor</h2>
        <form action={createInstructorAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="nome">
              Nome
            </label>
            <input id="nome" name="nome" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="telefone">
              Telefone
            </label>
            <input id="telefone" name="telefone" className="input" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary">
              Cadastrar instrutor
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {(instructors ?? []).map((instructor) => {
          const boundUpdate = updateInstructorAction.bind(null, instructor.id);

          return (
            <div key={instructor.id} className="card space-y-3">
              <form
                action={boundUpdate}
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <div className="sm:col-span-2">
                  <label className="label">Nome</label>
                  <input
                    name="nome"
                    defaultValue={instructor.nome}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input
                    name="telefone"
                    defaultValue={instructor.telefone ?? ""}
                    className="input"
                  />
                </div>
                <div className="flex items-center gap-3 sm:col-span-3">
                  <button type="submit" className="btn-secondary text-sm">
                    Salvar
                  </button>
                  <span
                    className={`badge ${
                      instructor.ativo
                        ? "bg-evolve-100 text-evolve-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {instructor.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </form>
              <form
                action={async () => {
                  "use server";
                  await toggleInstructorActiveAction(
                    instructor.id,
                    !instructor.ativo
                  );
                }}
              >
                <button
                  type="submit"
                  className="text-xs font-medium text-evolve-700 hover:underline"
                >
                  {instructor.ativo ? "Desativar" : "Reativar"}
                </button>
              </form>
            </div>
          );
        })}
        {(!instructors || instructors.length === 0) && (
          <p className="text-center text-sm text-gray-400">
            Nenhum instrutor cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
