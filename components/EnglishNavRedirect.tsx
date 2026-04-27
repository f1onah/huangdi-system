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

  if (!active) return null;
  return (
    <main className="fixed inset-0 z-40 overflow-auto bg-mist px-4 py-6 lg:left-72 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <AdvancedEnglishModule embedded />
      </div>
    </main>
  );
}
