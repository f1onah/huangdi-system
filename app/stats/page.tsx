"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function StatsPage() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="stats" />
    </>
  );
}
