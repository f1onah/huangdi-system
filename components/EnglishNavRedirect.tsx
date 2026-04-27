"use client";

import { useEffect, useState } from "react";
import { AdvancedEnglishModule } from "@/components/AdvancedEnglishModule";

export function EnglishNavRedirect() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function handleNavigation(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const link = target.closest("a");
      const button = target.closest("button");
      const href = link?.getAttribute("href") || "";
      const text = button?.textContent || link?.textContent || "";
      const isEnglishLink = href === "/english" || href === "/english/" || href.endsWith("/english/");
      const isEnglishButton = text.includes("文渊阁") || text.includes("文澜阁");

      if (isEnglishLink || isEnglishButton) {
        event.preventDefault();
        setActive(true);
        return;
      }

      const isAppNav = Boolean(link?.closest("nav")) || Boolean(button?.closest(".overflow-x-auto"));
      if (isAppNav) setActive(false);
    }

    document.addEventListener("click", handleNavigation, true);
    return () => document.removeEventListener("click", handleNavigation, true);
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [active]);

  if (!active) return null;
  return (
    <main className="fixed inset-0 z-40 min-h-screen overflow-auto bg-[#0B0F1A] px-4 py-6 lg:left-72 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <AdvancedEnglishModule embedded />
      </div>
    </main>
  );
}
