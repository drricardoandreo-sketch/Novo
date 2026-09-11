import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import { updateUserRoleAction } from "./actions";

export default async function UsuariosPage() {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  const serviceClient = createServiceRoleClient();
  const {
    data: { users },
  } = await serviceClient.auth.admin.listUsers();

  const emailById = new Map(users.map((u: any) => [u.id, u.email]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-evolve-900">Usuários</h1>
        <p className="text-sm text-gray-500">
          Defina quem tem acesso de administrador (financeiro completo) e
          quem acessa como instrutor (turmas, frequência e clientes, sem
          dados financeiros).
        </p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-evolve-100 bg-evolve-50/60 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(profiles ?? []).map((profile) => (
              <tr key={profile.id}>
                <td className="px-4 py-3">
                  {emailById.get(profile.id) ?? profile.id}
                  {profile.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-gray-400">(você)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const newRole = String(formData.get("role"));
                      await updateUserRoleAction(
                        profile.id,
                        newRole as "admin" | "instrutor"
                      );
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="role"
                      defaultValue={profile.role}
                      disabled={profile.id === currentUser?.id}
                      className="input"
                    >
                      <option value="admin">Admin</option>
                      <option value="instrutor">Instrutor</option>
                    </select>
                    {profile.id !== currentUser?.id && (
                      <button type="submit" className="btn-secondary text-xs">
                        Salvar
                      </button>
                    )}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
