"use client";

import { useEffect } from "react";

export function EnglishNavRedirect() {
  useEffect(() => {
    function openAdvancedEnglish(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const link = target.closest("a");
      const button = target.closest("button");
      const isEnglishLink = link?.getAttribute("href") === "/english";
      const isEnglishButton = button?.textContent?.includes("文渊阁");
      if (!isEnglishLink && !isEnglishButton) return;

      event.preventDefault();
      event.stopPropagation();

      const prefix = window.location.pathname.startsWith("/huangdi-system") ? "/huangdi-system" : "";
      window.location.assign(`${prefix}/english/`);
    }

    document.addEventListener("click", openAdvancedEnglish, true);
    return () => document.removeEventListener("click", openAdvancedEnglish, true);
  }, []);

  return null;
}
