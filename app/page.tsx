"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function Home() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="dashboard" />
    </>
  );
}
