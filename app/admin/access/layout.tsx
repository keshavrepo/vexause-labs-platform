import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
export default async function AccessLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");
  return <>{children}</>;
}
