import { createClient } from "@/lib/supabase/server";
import { DIA_SEMANA_LABEL, type DiaSemana } from "@/types/database";
import {
  createClassAction,
  enrollClientAction,
  removeEnrollmentAction,
} from "./actions";

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const [{ data: classes }, { data: instructors }, { data: activeClients }, { data: schedules }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("*, instructors(nome)")
        .order("dia_semana")
        .order("horario"),
      supabase.from("instructors").select("*").eq("ativo", true).order("nome"),
      supabase
        .from("clients")
        .select("id, nome_completo")
        .eq("status", "ativo")
        .order("nome_completo"),
      supabase
        .from("class_schedules")
        .select("id, class_id, clients(id, nome_completo)"),
    ]);

  const schedulesByClass = new Map<string, typeof schedules>();
  (schedules ?? []).forEach((s) => {
    if (!s.class_id) return;
    const list = schedulesByClass.get(s.class_id) ?? [];
    list.push(s);
    schedulesByClass.set(s.class_id, list);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Turmas</h1>
        <p className="text-sm text-gray-500">
          Cadastre horários de aula e matricule clientes respeitando a
          capacidade máxima e a frequência semanal contratada.
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="card">
        <h2 className="mb-4 font-medium text-evolve-900">Nova turma</h2>
        <form action={createClassAction} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="dia_semana">
              Dia da semana
            </label>
            <select id="dia_semana" name="dia_semana" required className="input">
              {Object.entries(DIA_SEMANA_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="horario">
              Horário
            </label>
            <input id="horario" name="horario" type="time" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="capacidade_maxima">
              Capacidade máxima
            </label>
            <input
              id="capacidade_maxima"
              name="capacidade_maxima"
              type="number"
              min={1}
              defaultValue={10}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="instrutor_id">
              Instrutor
            </label>
            <select id="instrutor_id" name="instrutor_id" className="input">
              <option value="">A definir</option>
              {(instructors ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <button type="submit" className="btn-primary">
              Criar turma
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {(classes ?? []).map((turma) => {
          const enrolled = schedulesByClass.get(turma.id) ?? [];
          const vagas = turma.capacidade_maxima - enrolled.length;

          return (
            <div key={turma.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-evolve-900">
                    {DIA_SEMANA_LABEL[turma.dia_semana as DiaSemana]} às{" "}
                    {turma.horario?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Instrutor: {turma.instructors?.nome ?? "a definir"} ·{" "}
                    {enrolled.length}/{turma.capacidade_maxima} matriculados
                  </p>
                </div>
                <span
                  className={`badge ${vagas > 0 ? "bg-evolve-100 text-evolve-800" : "bg-red-100 text-red-700"}`}
                >
                  {vagas > 0 ? `${vagas} vaga(s)` : "Lotada"}
                </span>
              </div>

              <ul className="space-y-1 text-sm">
                {enrolled.map((s: any) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-evolve-50/60 px-3 py-1.5"
                  >
                    {s.clients?.nome_completo}
                    <form
                      action={async () => {
                        "use server";
                        await removeEnrollmentAction(s.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        remover
                      </button>
                    </form>
                  </li>
                ))}
                {enrolled.length === 0 && (
                  <li className="text-xs text-gray-400">
                    Nenhum aluno matriculado.
                  </li>
                )}
              </ul>

              {vagas > 0 && (
                <form action={enrollClientAction} className="flex gap-2">
                  <input type="hidden" name="class_id" value={turma.id} />
                  <select name="client_id" required className="input">
                    <option value="">Selecione um cliente</option>
                    {(activeClients ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome_completo}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-secondary whitespace-nowrap">
                    Matricular
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(!classes || classes.length === 0) && (
          <p className="text-center text-sm text-gray-400">
            Nenhuma turma cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
