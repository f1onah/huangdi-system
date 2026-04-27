"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function AchievementsPage() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="achievements" />
    </>
  );
}
