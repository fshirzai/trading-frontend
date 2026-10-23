"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApi } from "../../shared/api.js";
export const defaultBranding = {
  name: "Shirzai Trading",
  tagline: "Agricultural products. Wholesale supply.",
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
        "موږ د کرنیزو محصولاتو د عمده پېر او پلور چارې اسانه کوو. تاسو کولای شئ د محصولاتو مشخصات او انځورونه وګورئ، د خپلې اړتیا اندازه وټاکئ او د بیې غوښتنه وکړئ. د فرمایش تر تایید مخکې به بیه، د تادیې شرایط او د سپارلو ځای درسره روښانه شي.",
    },
    fa: {
      aboutTitle: "دربارهٔ ما",
      aboutBody:
        "ما خرید و فروش عمدهٔ محصولات زراعتی را آسان می‌سازیم. شما می‌توانید مشخصات و تصاویر محصولات را ببینید، مقدار مورد نیاز خود را انتخاب کنید و نرخ بخواهید. پیش از تأیید سفارش، قیمت، شرایط پرداخت و محل تحویل با شما مشخص می‌شود.",
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
