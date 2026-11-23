"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { StoreBrand } from "@/components/StorefrontConfig";

type HeaderProps = { cartCount?: number | null; wishlistCount?: number | null };

export default function StorefrontHeader({ cartCount, wishlistCount }: HeaderProps = {}) {
 const [menuOpen,setMenuOpen]=useState(false);
 const pathname=usePathname();
 const links=[
  {href:"/shop",label:"Store"},
  {href:"/custom-3d-printing",label:"Custom print"},
  {href:"/account",label:"Account"},
 ];
 const active=(href:string)=>pathname===href||pathname.startsWith(`${href}/`);
 const linkClass=(href:string,extra="")=>`vxl-header__link ${active(href)?"font-bold":""} ${extra}`.trim();
 return <header className="vxl-header">
  <div className="vxl-header__inner">
   <Link href="/" aria-label="VEXAUSE LABS home" className="vxl-brand"><span className="vxl-brand__mark" aria-hidden="true">V</span><StoreBrand compact/></Link>
   <nav aria-label="Store navigation" className="vxl-header__nav vxl-header__nav--desktop">
    {links.map(link=><Link key={link.href} className={linkClass(link.href)} href={link.href} aria-current={active(link.href)?"page":undefined}>{link.label}</Link>)}
    <Link className={linkClass("/wishlist")} href="/wishlist" aria-current={active("/wishlist")?"page":undefined}><Heart size={15}/> Wishlist{wishlistCount!==undefined&&<span className="vxl-header__count">{wishlistCount??"…"}</span>}</Link>
    <Link className={linkClass("/cart","vxl-header__cart")} href="/cart" aria-current={active("/cart")?"page":undefined}><ShoppingBag size={15}/> Cart{cartCount!==undefined&&<span className="vxl-header__count">{cartCount??"…"}</span>}</Link>
   </nav>
   <button type="button" className="vxl-header__menu-button" aria-label={menuOpen?"Close navigation":"Open navigation"} aria-expanded={menuOpen} aria-controls="vxl-mobile-nav" onClick={()=>setMenuOpen(open=>!open)}>{menuOpen?<X size={19}/>:<Menu size={19}/>}</button>
  </div>
  {menuOpen&&<nav id="vxl-mobile-nav" aria-label="Mobile store navigation" className="vxl-header__mobile">
   {[...links,{href:"/wishlist",label:"Wishlist"},{href:"/cart",label:"Cart"}].map(link=><Link key={link.href} href={link.href} aria-current={active(link.href)?"page":undefined} className={linkClass(link.href)} onClick={()=>setMenuOpen(false)}>{link.label}</Link>)}
  </nav>}
 </header>;
}
