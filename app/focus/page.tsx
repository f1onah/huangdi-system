"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function FocusPage() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="focus" />
    </>
  );
}
