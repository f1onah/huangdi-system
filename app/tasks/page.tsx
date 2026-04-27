"use client";

import { HuangdiApp } from "@/components/HuangdiApp";
import { EnglishNavRedirect } from "@/components/EnglishNavRedirect";

export default function TasksPage() {
  return (
    <>
      <EnglishNavRedirect />
      <HuangdiApp initialTab="tasks" />
    </>
  );
}
