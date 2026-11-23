import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function AuditLogsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");
  return <>{children}</>;
}
