import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";
export default function AccountLayout({children}:{children:React.ReactNode}){
 return <div className="vxl-account-shell"><StorefrontHeader/><div className="min-h-[65vh]">{children}</div><StoreContactFooter/></div>;
}
