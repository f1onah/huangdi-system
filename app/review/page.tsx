"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function ReviewPage() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="review" />
    </>
  );
}
