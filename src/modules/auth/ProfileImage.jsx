"use client";
import { useEffect, useState } from "react";
export default function ProfileImage({ api, user, className = "" }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl("");
    if (!user?.avatarVersion || !api) return;
    let live = true,
      created;
    const controller = new AbortController();
    api
      .request(`/me/avatar/${user.avatarVersion}`, {
        blob: true,
        signal: controller.signal,
      })
      .then((blob) => {
        if (live) {
          created = URL.createObjectURL(blob);
          setUrl(created);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [api, user?.id, user?.avatarVersion]);
  return (
    <span className={`avatar ${className}`}>
      {url ? (
        <img src={url} alt="Your profile" />
      ) : (
        (user?.name || "U").slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
