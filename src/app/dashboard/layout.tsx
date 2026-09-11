import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/roles";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    role,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentUserRole()]);

  return (
    <DashboardShell userEmail={user?.email} role={role}>
      {children}
    </DashboardShell>
  );
}
