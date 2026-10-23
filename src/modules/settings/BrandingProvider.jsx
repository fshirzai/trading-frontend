"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApi } from "../../shared/api.js";
export const defaultBranding = {
  name: "Shirzai Trading",
  tagline: "Good origins. Clear agreements. Connected trade.",
  aboutTitle: "About our company",
  aboutBody: "",
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
