"use client";

import { useEffect } from "react";

export function EnglishNavRedirect() {
  useEffect(() => {
    function openAdvancedEnglish(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const link = target.closest("a");
      const button = target.closest("button");
      const href = link?.getAttribute("href") || "";
      const text = button?.textContent || link?.textContent || "";
      const isEnglishLink = href === "/english" || href === "/english/" || href.endsWith("/english/");
      const isEnglishButton = text.includes("文渊阁") || text.includes("文澜阁");
      if (!isEnglishLink && !isEnglishButton) return;

      event.preventDefault();
      event.stopPropagation();

      const prefix = window.location.pathname.startsWith("/huangdi-system") ? "/huangdi-system" : "";
      window.location.assign(`${window.location.origin}${prefix}/english/`);
    }

    document.addEventListener("click", openAdvancedEnglish, true);
    return () => document.removeEventListener("click", openAdvancedEnglish, true);
  }, []);

  return null;
}
