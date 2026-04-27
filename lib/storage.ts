"use client";

import { useEffect, useState } from "react";
import { achievementSeed, attributeSeed, defaultState } from "@/lib/data";
import type { Achievement, AppState, Attribute, DailyReview, FocusSession, ReadingExercise, Task, Word } from "@/lib/types";

const KEY = "huangdi-system-mvp-v2";
const keys = {
  tasks: "huangdi.tasks",
  words: "huangdi.words",
  reviews: "huangdi.reviews",
  focusSessions: "huangdi.focusSessions",
  readings: "huangdi.readings",
  attributes: "huangdi.attributes",
  achievements: "huangdi.achievements",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

function hydrate(value: unknown): AppState {
  if (!value || typeof value !== "object") return defaultState;
  const partial = value as Partial<AppState>;
  return {
    ...defaultState,
    ...partial,
    tasks: partial.tasks ?? defaultState.tasks,
    words: partial.words ?? defaultState.words,
    reviews: partial.reviews ?? defaultState.reviews,
    readings: partial.readings ?? defaultState.readings,
    focusSessions: partial.focusSessions ?? defaultState.focusSessions,
    attributes: partial.attributes ?? attributeSeed,
    achievements: partial.achievements ?? achievementSeed,
  };
}

export function getTasks() { return read<Task[]>(keys.tasks, defaultState.tasks); }
export function saveTasks(tasks: Task[]) { write(keys.tasks, tasks); }
export function getWords() { return read<Word[]>(keys.words, defaultState.words); }
export function saveWords(words: Word[]) { write(keys.words, words); }
export function getReviews() { return read<DailyReview[]>(keys.reviews, defaultState.reviews); }
export function saveReviews(reviews: DailyReview[]) { write(keys.reviews, reviews); }
export function getFocusSessions() { return read<FocusSession[]>(keys.focusSessions, defaultState.focusSessions); }
export function saveFocusSessions(sessions: FocusSession[]) { write(keys.focusSessions, sessions); }
export function getReadings() { return read<ReadingExercise[]>(keys.readings, defaultState.readings); }
export function saveReadings(readings: ReadingExercise[]) { write(keys.readings, readings); }
export function getAttributes() { return read<Attribute[]>(keys.attributes, attributeSeed); }
export function saveAttributes(attributes: Attribute[]) { write(keys.attributes, attributes); }
export function getAchievements() { return read<Achievement[]>(keys.achievements, achievementSeed); }
export function saveAchievements(achievements: Achievement[]) { write(keys.achievements, achievements); }

export function loadState(): AppState {
  const legacy = read<AppState | null>(KEY, null);
  if (legacy) return hydrate(legacy);
  return {
    ...defaultState,
    tasks: getTasks(),
    words: getWords(),
    reviews: getReviews(),
    focusSessions: getFocusSessions(),
    readings: getReadings(),
    attributes: getAttributes(),
    achievements: getAchievements(),
  };
}

export function saveState(state: AppState) {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  saveTasks(state.tasks);
  saveWords(state.words);
  saveReviews(state.reviews);
  saveFocusSessions(state.focusSessions);
  saveReadings(state.readings);
  saveAttributes(state.attributes);
  saveAchievements(state.achievements);
}

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [ready, state]);

  return {
    state,
    setState,
    ready,
    reset: () => {
      Object.values(keys).forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(KEY);
      setState(defaultState);
    },
  };
}
