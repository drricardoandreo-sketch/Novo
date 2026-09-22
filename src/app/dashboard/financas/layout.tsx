import { FinanceTabs } from "@/components/dashboard/finance/finance-tabs";

export default function FinancasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <FinanceTabs />
      {children}
    </div>
  );
}
