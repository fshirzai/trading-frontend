"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApi } from "../../shared/api.js";
export const defaultBranding = {
  name: "Shirzai Trading",
  tagline: "Good origins. Clear agreements. Connected trade.",
  aboutTitle: "About our company",
  aboutBody:
    "We connect agricultural products with businesses that value clear specifications, careful handling and reliable communication. Explore our catalog, request a quotation, and review the agreed price, payment and handover details before accepting your order.",
  aboutImages: [
    { id: "starter-field", alt: "Agricultural fields" },
    { id: "starter-grain", alt: "Harvested grain" },
  ],
  translations: {
    ps: {
      aboutTitle: "زموږ په اړه",
      aboutBody:
        "موږ کرنیز محصولات له هغو سوداګرو سره نښلوو چې روښانه مشخصات، سم ساتنه او باوري اړیکې ورته ارزښت لري. زموږ محصولات وګورئ، د نرخ غوښتنه وکړئ او د فرمایش تر منلو مخکې پر بیه، تادیې او سپارلو ځای هوکړه وکړئ.",
    },
    fa: {
      aboutTitle: "دربارهٔ ما",
      aboutBody:
        "ما محصولات زراعتی را به کسب‌وکارهایی پیوند می‌دهیم که مشخصات روشن، نگهداری مناسب و ارتباط قابل اعتماد برایشان اهمیت دارد. محصولات ما را ببینید، درخواست نرخ بدهید و پیش از پذیرش سفارش، قیمت، روش پرداخت و محل تحویل را بررسی کنید.",
    },
  },
  termsBody: "",
  privacyBody: "",
  deliveryBody: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  workingHours: "",
  website: "",
  logoVersion: "",
  revision: 0,
};
const Context = createContext({
  branding: defaultBranding,
  updateBranding: () => {},
});
export const useBranding = () => useContext(Context);
export const publicAsset = (path) =>
  (process.env.NEXT_PUBLIC_API_URL || "/api") + path;
export default function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding);
  const api = useMemo(
    () => createApi({ base: process.env.NEXT_PUBLIC_API_URL || "/api" }),
    [],
  );
  useEffect(() => {
    let live = true;
    api
      .request("/settings/public")
      .then((s) => {
        if (live) setBranding({ ...defaultBranding, ...s });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [api]);
  useEffect(() => {
    document.title = branding.name;
  }, [branding.name]);
  return (
    <Context.Provider
      value={{
        branding,
        updateBranding: (s) => setBranding({ ...defaultBranding, ...s }),
      }}
    >
      {children}
    </Context.Provider>
  );
}
