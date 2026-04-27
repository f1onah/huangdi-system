"use client";

import { useEffect, useState } from "react";
import { defaultState } from "@/lib/data";
import type { AppState } from "@/lib/types";

const KEY = "huangdi-system-mvp-v1";

function hydrate(value: unknown): AppState {
  if (!value || typeof value !== "object") return defaultState;
  const partial = value as Partial<AppState>;
  return {
    ...defaultState,
    ...partial,
    review: {
      ...defaultState.review,
      ...(partial.review ?? {}),
    },
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(hydrate(JSON.parse(raw)));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [ready, state]);

  return {
    state,
    setState,
    ready,
    reset: () => {
      localStorage.removeItem(KEY);
      setState(defaultState);
    },
  };
}
