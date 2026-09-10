import { createClient } from "@/lib/supabase/server";
import { DIA_SEMANA_LABEL, type DiaSemana } from "@/types/database";
import { checkinAction } from "./actions";

export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: { class_id?: string; data?: string };
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = searchParams.data ?? today;

  const { data: classes } = await supabase
    .from("classes")
    .select("id, dia_semana, horario")
    .order("dia_semana")
    .order("horario");

  const selectedClassId = searchParams.class_id ?? classes?.[0]?.id ?? "";

  const [{ data: enrolled }, { data: existingAttendance }, { data: risco }] =
    await Promise.all([
      selectedClassId
        ? supabase
            .from("class_schedules")
            .select("client_id, clients(id, nome_completo)")
            .eq("class_id", selectedClassId)
        : Promise.resolve({ data: [] as any[] }),
      selectedClassId
        ? supabase
            .from("attendance")
            .select("client_id, presente, reposicao")
            .eq("class_id", selectedClassId)
            .eq("data", selectedDate)
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from("v_clients_risco_faltas")
        .select("*")
        .eq("risco_cancelamento", true),
    ]);

  const attendanceMap = new Map(
    (existingAttendance ?? []).map((a) => [a.client_id, a])
  );

  const clientIds = (enrolled ?? []).map((e) => e.client_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Frequência</h1>
        <p className="text-sm text-gray-500">
          Marque a presença dos alunos por turma e acompanhe risco de
          cancelamento.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="class_id">
            Turma
          </label>
          <select
            id="class_id"
            name="class_id"
            defaultValue={selectedClassId}
            className="input"
          >
            {(classes ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {DIA_SEMANA_LABEL[c.dia_semana as DiaSemana]} às{" "}
                {c.horario?.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="data">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            defaultValue={selectedDate}
            className="input"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Ver turma
        </button>
      </form>

      {selectedClassId ? (
        <form action={checkinAction} className="card space-y-4">
          <input type="hidden" name="class_id" value={selectedClassId} />
          <input type="hidden" name="data" value={selectedDate} />
          <input
            type="hidden"
            name="client_ids"
            value={JSON.stringify(clientIds)}
          />

          <table className="w-full text-left text-sm">
            <thead className="border-b border-evolve-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Aluno</th>
                <th className="py-2">Presente</th>
                <th className="py-2">Reposição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(enrolled ?? []).map((e: any) => {
                const existing = attendanceMap.get(e.client_id);
                return (
                  <tr key={e.client_id}>
                    <td className="py-2">{e.clients?.nome_completo}</td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        name={`presente_${e.client_id}`}
                        defaultChecked={existing?.presente ?? false}
                        className="h-4 w-4 rounded border-gray-300 text-evolve-600"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        name={`reposicao_${e.client_id}`}
                        defaultChecked={existing?.reposicao ?? false}
                        className="h-4 w-4 rounded border-gray-300 text-evolve-600"
                      />
                    </td>
                  </tr>
                );
              })}
              {(!enrolled || enrolled.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    Nenhum aluno matriculado nessa turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <button type="submit" className="btn-primary">
            Salvar check-in
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-400">Cadastre uma turma primeiro.</p>
      )}

      <div className="card">
        <h2 className="mb-3 font-medium text-evolve-900">
          Clientes com risco de cancelamento (2+ faltas seguidas)
        </h2>
        <ul className="space-y-1 text-sm">
          {(risco ?? []).map((r) => (
            <li
              key={r.client_id}
              className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-red-700"
            >
              {r.nome_completo}
              <span className="badge bg-red-100 text-red-700">Em risco</span>
            </li>
          ))}
          {(!risco || risco.length === 0) && (
            <li className="text-xs text-gray-400">
              Nenhum cliente em risco no momento.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
