"use client";

import type { Client, Instructor } from "@/types/database";

export function ClientForm({
  client,
  instructors,
  action,
  error,
  readOnly = false,
}: {
  client?: Client;
  instructors: Instructor[];
  action: (formData: FormData) => void;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <form
      action={action}
      className={`space-y-6 ${readOnly ? "opacity-75" : ""}`}
      encType="multipart/form-data"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">Dados pessoais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="nome_completo">
              Nome completo
            </label>
            <input
              id="nome_completo"
              name="nome_completo"
              required
              disabled={readOnly}
              defaultValue={client?.nome_completo}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="data_nascimento">
              Data de nascimento
            </label>
            <input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              required
              disabled={readOnly}
              defaultValue={client?.data_nascimento}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="data_entrada">
              Data de entrada
            </label>
            <input
              id="data_entrada"
              name="data_entrada"
              type="date"
              required
              disabled={readOnly}
              defaultValue={
                client?.data_entrada ?? new Date().toISOString().slice(0, 10)
              }
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="telefone_whatsapp">
              WhatsApp
            </label>
            <input
              id="telefone_whatsapp"
              name="telefone_whatsapp"
              required
              disabled={readOnly}
              placeholder="+55 11 91234-5678"
              defaultValue={client?.telefone_whatsapp}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              disabled={readOnly}
              defaultValue={client?.status ?? "ativo"}
              className="input"
            >
              <option value="ativo">Ativo</option>
              <option value="trancado">Trancado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {!readOnly && (
      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">Plano e pagamento</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="forma_pagamento">
              Forma de pagamento
            </label>
            <select
              id="forma_pagamento"
              name="forma_pagamento"
              defaultValue={client?.forma_pagamento ?? "particular"}
              className="input"
            >
              <option value="particular">Particular</option>
              <option value="totalpass">TotalPass</option>
              <option value="gympass">Gympass</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dia_pagamento">
              Dia de pagamento
            </label>
            <input
              id="dia_pagamento"
              name="dia_pagamento"
              type="number"
              min={1}
              max={31}
              required
              defaultValue={client?.dia_pagamento ?? 5}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="valor_plano">
              Valor do plano (R$)
            </label>
            <input
              id="valor_plano"
              name="valor_plano"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={client?.valor_plano}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="frequencia_semanal">
              Frequência semanal (aulas/semana)
            </label>
            <input
              id="frequencia_semanal"
              name="frequencia_semanal"
              type="number"
              min={1}
              max={7}
              required
              defaultValue={client?.frequencia_semanal ?? 2}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="instrutor_responsavel_id">
              Instrutor responsável
            </label>
            <select
              id="instrutor_responsavel_id"
              name="instrutor_responsavel_id"
              defaultValue={client?.instrutor_responsavel_id ?? ""}
              className="input"
            >
              <option value="">Sem instrutor definido</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      )}

      <div className="card space-y-4">
        <h2 className="font-medium text-evolve-900">Saúde e documentos</h2>
        <div>
          <label className="label" htmlFor="observacoes_saude">
            Observações de saúde (dores, restrições)
          </label>
          <textarea
            id="observacoes_saude"
            name="observacoes_saude"
            rows={3}
            disabled={readOnly}
            defaultValue={client?.observacoes_saude ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="atestado">
            Atestado médico / avaliação física (opcional)
          </label>
          <input
            id="atestado"
            name="atestado"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={readOnly}
            className="input"
          />
          {client?.atestado_url && (
            <p className="mt-1 text-xs text-gray-500">
              Arquivo atual enviado. Selecione um novo para substituir.
            </p>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-3">
          <button type="submit" className="btn-primary">
            {client ? "Salvar alterações" : "Cadastrar cliente"}
          </button>
        </div>
      )}
    </form>
  );
}
