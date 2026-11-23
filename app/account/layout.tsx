import StorefrontHeader from "@/components/StorefrontHeader";
import AccountShell from "@/components/AccountShell";
import { StoreContactFooter } from "@/components/StorefrontConfig";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vx-account">
      <StorefrontHeader />
      <AccountShell>{children}</AccountShell>
      <StoreContactFooter />
    </div>
  );
}
