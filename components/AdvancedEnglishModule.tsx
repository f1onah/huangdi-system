"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { BookOpen, Brain, CheckCircle2, Library, PenLine, Upload, X, XCircle } from "lucide-react";
import { Button, Card, Input, Progress, Textarea } from "@/components/ui";
import { useAppState } from "@/lib/storage";
import type { AppState, ReadingExercise, Word } from "@/lib/types";
import { addExp, cn, today, uid } from "@/lib/utils";

type Mode = "memory" | "wrong" | "spelling" | "reading";
type ImportWord = Partial<Word> & {
  id?: string;
  word?: string;
  phonetic?: string;
  pos?: string;
  rawMeaning?: string;
  phrase?: string;
  sentence?: string;
  note?: string;
  tags?: string[];
  sourceOrder?: number;
};
type StudyWord = Word & {
  phonetic?: string;
  pos?: string;
  rawMeaning?: string;
  phrase?: string;
  sentence?: string;
  note?: string;
  tags?: string[];
  sourceOrder?: number;
};
type NoteIntent = { word: StudyWord; type: "模糊" | "忘记" } | null;
type SpellingModal = { word: StudyWord } | null;
type WordPopup = { word: string; meaning: string; pos: string } | null;
type ImportResult = { total: number; added: number; updated: number; skipped: number };
type GeneratedReading = Pick<ReadingExercise, "title" | "passage" | "wordsUsed" | "questions" | "chineseExplanation" | "passageExplanation" | "wordGlossary">;

const DAILY_WORD_COUNT = 50;
const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const READING_API_KEY_STORAGE = "huangdi.reading.apiKey";
const READING_MODEL_STORAGE = "huangdi.reading.model";
const DEFAULT_READING_MODEL = "gpt-4.1-mini";

const dictionary: Record<string, { meaning: string; pos: string }> = {
  progress: { meaning: "进步；进展", pos: "n./v." },
  sustain: { meaning: "维持；支撑", pos: "v." },
  fluctuate: { meaning: "波动；起伏", pos: "v." },
  inevitable: { meaning: "不可避免的", pos: "adj." },
  motivation: { meaning: "动机；动力", pos: "n." },
  routine: { meaning: "常规；惯例", pos: "n." },
  momentum: { meaning: "势头；动力", pos: "n." },
  confidence: { meaning: "信心", pos: "n." },
  reflection: { meaning: "反思", pos: "n." },
  discipline: { meaning: "自律；纪律", pos: "n." },
};

function normalizeWord(word: Word | ImportWord, index = 0): StudyWord | null {
  const cleanWord = word.word?.trim();
  if (!cleanWord) return null;

  const now = new Date().toISOString();
  const meaning = (word.meaning || word.rawMeaning || "").trim();
  return {
    id: word.id || uid("word"),
    word: cleanWord,
    meaning: meaning || "待补充释义",
    phonetic: word.phonetic || "",
    pos: word.pos || "",
    rawMeaning: word.rawMeaning || word.meaning || "",
    phrase: word.phrase || word.example || "",
    sentence: word.sentence || word.example || "",
    example: word.example || word.sentence || "",
    date: word.date || today(),
    familiarity: Number(word.familiarity || 0),
    wrongCount: Number(word.wrongCount || 0),
    correctCount: Number(word.correctCount || 0),
    note: word.note || "",
    hidden: word.hidden || false,
    tags: Array.isArray(word.tags) && word.tags.length ? word.tags : ["CET-6"],
    sourceOrder: word.sourceOrder ?? index + 1,
    createdAt: word.createdAt || now,
    updatedAt: word.updatedAt || now,
  };
}

function mergeImportedWords(currentWords: StudyWord[], imported: ImportWord[]): { words: StudyWord[]; result: ImportResult } {
  const existing = new Map(currentWords.map((word, index) => [word.word.toLowerCase(), { word, index }]));
  const merged = [...currentWords];
  const result: ImportResult = { total: imported.length, added: 0, updated: 0, skipped: 0 };

  imported.forEach((item, index) => {
    const incoming = normalizeWord(item, index);
    if (!incoming) {
      result.skipped += 1;
      return;
    }

    const key = incoming.word.toLowerCase();
    const old = existing.get(key);
    if (old) {
      merged[old.index] = {
        ...old.word,
        ...incoming,
        id: old.word.id,
        wrongCount: Math.max(old.word.wrongCount, incoming.wrongCount),
        correctCount: Math.max(old.word.correctCount, incoming.correctCount),
        familiarity: Math.max(old.word.familiarity, incoming.familiarity),
        note: old.word.note || incoming.note || "",
        hidden: old.word.hidden && !incoming.hidden ? old.word.hidden : incoming.hidden,
        createdAt: old.word.createdAt,
        updatedAt: new Date().toISOString(),
      };
      result.updated += 1;
      return;
    }

    existing.set(key, { word: incoming, index: merged.length });
    merged.push(incoming);
    result.added += 1;
  });

  return { words: merged, result };
}

function formatImportResult(result: ImportResult, totalWords: number) {
  return `处理 ${result.total} 条，新增 ${result.added} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条；当前词库 ${totalWords} 条`;
}

function getDailyWords(words: StudyWord[]) {
  if (!words.length) return [];
  const sorted = [...words].sort((a, b) => (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0));
  const seed = today().split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const start = seed % sorted.length;
  const rotated = [...sorted.slice(start), ...sorted.slice(0, start)];
  return rotated.slice(0, Math.min(DAILY_WORD_COUNT, rotated.length));
}

function readLocalSetting(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) return "";
  const maybe = data as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof maybe.output_text === "string") return maybe.output_text;
  return maybe.output?.flatMap((item) => item.content || []).find((item) => typeof item.text === "string")?.text || "";
}

function normalizeGeneratedReading(generated: GeneratedReading, sourceWords: StudyWord[]): ReadingExercise {
  const fallbackWords = sourceWords.slice(0, DAILY_WORD_COUNT).map((word) => word.word);
  const glossary = Array.isArray(generated.wordGlossary) ? generated.wordGlossary.map((item) => ({
    word: String(item.word || "").toLowerCase().trim(),
    meaning: String(item.meaning || "暂无释义"),
    pos: String(item.pos || "unknown"),
  })).filter((item) => item.word) : [];

  return {
    id: uid("reading"),
    date: today(),
    title: String(generated.title || "CET-6 Reading Practice"),
    passage: String(generated.passage || ""),
    wordsUsed: Array.isArray(generated.wordsUsed) && generated.wordsUsed.length ? generated.wordsUsed.map(String) : fallbackWords,
    questions: (Array.isArray(generated.questions) ? generated.questions : []).slice(0, 6).map((question) => ({
      id: uid("q"),
      question: String(question.question || ""),
      options: Array.isArray(question.options) ? question.options.map(String).slice(0, 4) : [],
      answer: String(question.answer || ""),
      explanation: String(question.explanation || ""),
    })).filter((question) => question.question && question.options.length >= 2 && question.answer),
    chineseExplanation: String(generated.chineseExplanation || ""),
    passageExplanation: String(generated.passageExplanation || ""),
    wordGlossary: glossary,
    createdAt: new Date().toISOString(),
  };
}

async function generateReadingWithApi(words: StudyWord[], apiKey: string, model: string): Promise<ReadingExercise> {
  const studyWords = words.slice(0, DAILY_WORD_COUNT).map((word) => ({
    word: word.word,
    meaning: word.meaning,
    pos: word.pos || "",
    phrase: word.phrase || "",
    sentence: word.sentence || "",
  }));

  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.trim() || DEFAULT_READING_MODEL,
      input: [
        {
          role: "system",
          content: "You generate CET-6 English reading practice. Return only valid JSON matching the schema. Do not reveal answers inside the passage. Explanations must be Chinese.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Use the given daily vocabulary to create one CET-6 reading exercise.",
            requirements: [
              "Passage length 220-320 English words.",
              "Naturally include at least 12 of the provided words when possible.",
              "Create 4 multiple-choice questions with 4 options each.",
              "The answer must exactly equal one option string.",
              "Provide a Chinese explanation for each question.",
              "Provide one overall Chinese explanation and one passage structure explanation.",
              "Provide a wordGlossary for important words in the passage, including provided vocabulary and common difficult words.",
            ],
            words: studyWords,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cet6_reading_exercise",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "passage", "wordsUsed", "questions", "chineseExplanation", "passageExplanation", "wordGlossary"],
            properties: {
              title: { type: "string" },
              passage: { type: "string" },
              wordsUsed: { type: "array", items: { type: "string" } },
              questions: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["question", "options", "answer", "explanation"],
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                    answer: { type: "string" },
                    explanation: { type: "string" },
                  },
                },
              },
              chineseExplanation: { type: "string" },
              passageExplanation: { type: "string" },
              wordGlossary: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["word", "meaning", "pos"],
                  properties: {
                    word: { type: "string" },
                    meaning: { type: "string" },
                    pos: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  const data = await response.json() as unknown;
  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data ? JSON.stringify((data as { error: unknown }).error) : response.statusText;
    throw new Error(message);
  }

  const outputText = extractOutputText(data);
  if (!outputText) throw new Error("API 没有返回阅读内容");
  const generated = JSON.parse(outputText) as GeneratedReading;
  const reading = normalizeGeneratedReading(generated, words);
  if (!reading.passage || !reading.questions.length) throw new Error("API 返回内容不完整");
  return reading;
}

export function AdvancedEnglishModule({ embedded = false }: { embedded?: boolean }) {
  const { state, setState, ready } = useAppState();
  const words = useMemo(() => state.words.map((word, index) => normalizeWord(word, index)).filter(Boolean) as StudyWord[], [state.words]);
  const visibleWords = useMemo(() => words.filter((word) => !word.hidden), [words]);
  const dailyWords = useMemo(() => getDailyWords(visibleWords), [visibleWords]);

  const [mode, setMode] = useState<Mode>("memory");
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [reviewWordId, setReviewWordId] = useState<string | null>(null);
  const [noteIntent, setNoteIntent] = useState<NoteIntent>(null);
  const [note, setNote] = useState("");
  const [spellingIndex, setSpellingIndex] = useState(0);
  const [spellingAnswer, setSpellingAnswer] = useState("");
  const [spellingStatus, setSpellingStatus] = useState("");
  const [spellingModal, setSpellingModal] = useState<SpellingModal>(null);
  const [reading, setReading] = useState<ReadingExercise | null>(state.readings[0] ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [wordPopup, setWordPopup] = useState<WordPopup>(null);
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [readingApiKey, setReadingApiKey] = useState(() => readLocalSetting(READING_API_KEY_STORAGE));
  const [readingModel, setReadingModel] = useState(() => readLocalSetting(READING_MODEL_STORAGE, DEFAULT_READING_MODEL));
  const [readingStatus, setReadingStatus] = useState("");
  const [isGeneratingReading, setIsGeneratingReading] = useState(false);

  const reviewWord = reviewWordId ? visibleWords.find((word) => word.id === reviewWordId) : undefined;
  const currentMemory = reviewWord || dailyWords[memoryIndex % Math.max(dailyWords.length, 1)];
  const currentSpelling = dailyWords[spellingIndex % Math.max(dailyWords.length, 1)];
  const wrongWords = visibleWords.filter((word) => word.wrongCount > 0);
  const masteredRate = visibleWords.length ? Math.round((visibleWords.filter((word) => word.familiarity >= 3).length / visibleWords.length) * 100) : 0;

  function saveWords(nextWords: StudyWord[], patch: Partial<AppState> = {}) {
    setState((current) => ({ ...current, ...patch, words: nextWords as Word[] }));
  }

  function patchWord(id: string, patch: Partial<StudyWord>, extra?: Partial<AppState>) {
    const next = words.map((word) => word.id === id ? { ...word, ...patch, updatedAt: new Date().toISOString() } : word);
    saveWords(next, extra);
  }

  function moveToNextMemoryWord() {
    setReviewWordId(null);
    setMemoryIndex((index) => (index + 1) % Math.max(dailyWords.length, 1));
  }

  function importWords(imported: ImportWord[]) {
    const { words: merged, result } = mergeImportedWords(words, imported);
    saveWords(merged);
    setImportMessage(formatImportResult(result, merged.length));
    setReviewWordId(null);
    setMemoryIndex(0);
    setSpellingIndex(0);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setIsImporting(true);
      const parsedParts = await Promise.all(files.map(async (file) => {
        const raw = await file.text();
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) throw new Error(`${file.name} 不是 JSON 数组`);
        return parsed as ImportWord[];
      }));
      importWords(parsedParts.flat());
    } catch (error) {
      setImportMessage(error instanceof Error ? `导入失败：${error.message}` : "导入失败：请检查 JSON 文件格式");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  function rememberWord() {
    if (!currentMemory) return;
    patchWord(currentMemory.id, { familiarity: currentMemory.familiarity + 1 }, { attributes: addExp(state.attributes, "english", 1) });
    moveToNextMemoryWord();
  }

  function openNote(type: "模糊" | "忘记") {
    if (!currentMemory) return;
    setNoteIntent({ word: currentMemory, type });
    setNote(currentMemory.note || "");
  }

  function saveWrongNote() {
    if (!noteIntent) return;
    patchWord(noteIntent.word.id, { wrongCount: noteIntent.word.wrongCount + 1, familiarity: Math.max(0, noteIntent.word.familiarity - 1), note });
    setNoteIntent(null);
    setNote("");
    moveToNextMemoryWord();
  }

  function checkSpelling() {
    if (!currentSpelling) return;
    const correct = spellingAnswer.trim().toLowerCase() === currentSpelling.word.toLowerCase();
    if (correct) {
      patchWord(currentSpelling.id, { familiarity: currentSpelling.familiarity + 1, correctCount: currentSpelling.correctCount + 1 }, { attributes: addExp(state.attributes, "english", 2) });
      setSpellingStatus("正确");
      window.setTimeout(() => {
        setSpellingAnswer("");
        setSpellingStatus("");
        setSpellingIndex((index) => (index + 1) % Math.max(dailyWords.length, 1));
      }, 650);
      return;
    }

    patchWord(currentSpelling.id, { wrongCount: currentSpelling.wrongCount + 1, note: currentSpelling.note || "拼写试炼错误，需再次复习。" });
    setSpellingModal({ word: currentSpelling });
    setSpellingStatus("请重试，正确后才会进入下一题");
  }

  async function generateReading() {
    const sourceWords = dailyWords.length ? dailyWords : visibleWords.slice(0, DAILY_WORD_COUNT);
    if (!sourceWords.length) {
      setReadingStatus("请先导入词库，再生成阅读训练。");
      return;
    }
    if (!readingApiKey.trim()) {
      setReadingStatus("请先填写 API Key。Key 只会保存在你的浏览器本地。");
      return;
    }

    try {
      setIsGeneratingReading(true);
      setReadingStatus("正在调用 API 生成阅读训练...");
      window.localStorage.setItem(READING_API_KEY_STORAGE, readingApiKey.trim());
      window.localStorage.setItem(READING_MODEL_STORAGE, readingModel.trim() || DEFAULT_READING_MODEL);
      const next = await generateReadingWithApi(sourceWords, readingApiKey.trim(), readingModel);
      setReading(next);
      setAnswers({});
      setSubmitted(false);
      setReadingStatus("阅读训练已生成。");
      setState((current) => ({ ...current, readings: [next, ...current.readings] }));
    } catch (error) {
      setReadingStatus(error instanceof Error ? `生成失败：${error.message}` : "生成失败：请稍后重试。");
    } finally {
      setIsGeneratingReading(false);
    }
  }

  function submitReading() {
    if (!reading) return;
    setSubmitted(true);
    setState((current) => ({ ...current, readings: current.readings.map((item) => item.id === reading.id ? { ...item, userAnswers: answers, completed: true } : item), attributes: addExp(current.attributes, "english", 15) }));
  }

  function lookupWord(raw: string) {
    const clean = raw.toLowerCase().replace(/[^a-z'-]/g, "");
    if (!clean || !submitted) return;
    const known = words.find((word) => word.word.toLowerCase() === clean);
    const glossary = reading?.wordGlossary?.find((item) => item.word.toLowerCase() === clean);
    const fallback = dictionary[clean];
    setWordPopup({ word: clean, meaning: known?.meaning || glossary?.meaning || fallback?.meaning || "暂无释义，可先加入错词本后补充。", pos: known?.pos || glossary?.pos || fallback?.pos || "unknown" });
  }

  function addPopupWordToWrongBook() {
    if (!wordPopup) return;
    const existing = words.find((word) => word.word.toLowerCase() === wordPopup.word.toLowerCase());
    if (existing) {
      patchWord(existing.id, { wrongCount: existing.wrongCount + 1, note: existing.note || "阅读点击加入错词本。" });
    } else {
      const now = new Date().toISOString();
      saveWords([{ id: uid("word"), word: wordPopup.word, meaning: wordPopup.meaning, pos: wordPopup.pos, phrase: wordPopup.word, sentence: "Added from reading mode.", date: today(), familiarity: 0, wrongCount: 1, correctCount: 0, note: "阅读点击加入错词本。", createdAt: now, updatedAt: now } as StudyWord, ...words]);
    }
    setWordPopup(null);
  }

  const shell = embedded ? "space-y-6" : "min-h-screen bg-mist px-4 py-6 text-white lg:px-8";

  return (
    <div className={cn(shell, !ready && "opacity-60")}>
      <div className={embedded ? "space-y-6" : "mx-auto max-w-[1440px] space-y-6"}>
        <Hero
          words={visibleWords.length}
          todayWords={dailyWords.length}
          wrong={wrongWords.length}
          mastered={masteredRate}
          importJson={importJson}
          importMessage={importMessage}
          isImporting={isImporting}
        />
        <Tabs mode={mode} setMode={setMode} />
        {mode === "memory" && <MemoryMode word={currentMemory} rememberWord={rememberWord} openNote={openNote} />}
        {mode === "wrong" && <WrongBook words={wrongWords} review={(word) => { setMode("memory"); setReviewWordId(word.id); }} remove={(word) => patchWord(word.id, { hidden: true })} master={(word) => patchWord(word.id, { familiarity: 5, hidden: true })} />}
        {mode === "spelling" && <Spelling word={currentSpelling} answer={spellingAnswer} setAnswer={setSpellingAnswer} status={spellingStatus} check={checkSpelling} />}
        {mode === "reading" && <Reading reading={reading} answers={answers} setAnswers={setAnswers} submitted={submitted} generateReading={generateReading} submitReading={submitReading} lookupWord={lookupWord} apiKey={readingApiKey} setApiKey={setReadingApiKey} model={readingModel} setModel={setReadingModel} status={readingStatus} isGenerating={isGeneratingReading} />}
      </div>

      {noteIntent && <Modal title={`${noteIntent.type}：写下记忆线索`} onClose={() => setNoteIntent(null)}><p className="text-sm text-white/60">{noteIntent.word.word} 会进入错词本，请保存一条复习备注。</p><Textarea className="mt-4" value={note} onChange={(event) => setNote(event.target.value)} /><Button className="mt-4" onClick={saveWrongNote}>保存笔记</Button></Modal>}
      {spellingModal && <Modal title="拼写错误" onClose={() => setSpellingModal(null)}><p className="text-sm text-white/60">正确答案：</p><p className="mt-2 text-3xl font-semibold text-white">{spellingModal.word.word}</p><p className="mt-4 text-sm text-[#F59E0B]">必须重试直到正确，才会进入下一题。</p><Button className="mt-5" onClick={() => setSpellingModal(null)}>继续重试</Button></Modal>}
      {wordPopup && <Modal title={wordPopup.word} onClose={() => setWordPopup(null)}><p className="text-sm text-white/60">{wordPopup.pos}</p><p className="mt-2 text-xl text-white">{wordPopup.meaning}</p><p className="mt-5 text-sm text-white/60">是否加入错词本？</p><div className="mt-4 flex gap-3"><Button onClick={addPopupWordToWrongBook}>加入错词本</Button><Button variant="secondary" onClick={() => setWordPopup(null)}>不加入</Button></div></Modal>}
    </div>
  );
}

function Hero({ words, todayWords, wrong, mastered, importJson, importMessage, isImporting }: { words: number; todayWords: number; wrong: number; mastered: number; importJson: (event: ChangeEvent<HTMLInputElement>) => void; importMessage: string; isImporting: boolean }) {
  return (
    <header className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(0,47,167,0.92),rgba(11,15,26,0.94)_62%,rgba(0,200,150,0.12))] p-8 shadow-glow backdrop-blur-2xl">
      <p className="text-sm uppercase tracking-[0.35em] text-white/55">Wenyuan Pavilion</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">文渊阁</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">CET-6 训练系统：上传完整词库或 6 个分块 JSON，完成记忆判断、错词沉淀、拼写重试、阅读反馈与词义点击。</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 text-sm text-white/80 transition hover:border-klein/50 hover:bg-klein/20">
              <Upload size={16} />导入词库
              <input className="hidden" type="file" accept="application/json,.json" multiple onChange={importJson} disabled={isImporting} />
            </label>
          </div>
          {importMessage ? <p className={cn("mt-3 text-sm", importMessage.startsWith("导入失败") ? "text-[#FF8A8B]" : "text-[#00C896]")}>{importMessage}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <MetricPill label="词条" value={`${words}`} />
          <MetricPill label="今日" value={`${todayWords}`} />
          <MetricPill label="错词" value={`${wrong}`} />
          <MetricPill label="掌握" value={`${mastered}%`} />
        </div>
      </div>
    </header>
  );
}

function Tabs({ mode, setMode }: { mode: Mode; setMode: (mode: Mode) => void }) {
  const items: Array<[Mode, string, ReactNode]> = [["memory", "记忆模式", <Brain key="i" size={16} />], ["wrong", "错词本", <Library key="i" size={16} />], ["spelling", "拼写试炼", <PenLine key="i" size={16} />], ["reading", "阅读秘境", <BookOpen key="i" size={16} />]];
  return <nav className="flex flex-wrap gap-2">{items.map(([key, label, icon]) => <Button key={key} variant={mode === key ? "primary" : "secondary"} onClick={() => setMode(key)}>{icon}{label}</Button>)}</nav>;
}

function MemoryMode({ word, rememberWord, openNote }: { word?: StudyWord; rememberWord: () => void; openNote: (type: "模糊" | "忘记") => void }) {
  if (!word) return <Card className="p-8"><Empty text="暂无词条，请先导入 CET-6 词库。" /></Card>;
  return <Card className="grid gap-8 p-8 lg:grid-cols-[1fr_0.8fr]"><div><p className="text-sm text-white/55">只显示英文，先判断记忆状态</p><h2 className="mt-8 break-words text-6xl font-semibold tracking-tight text-white md:text-7xl">{word.word}</h2><div className="mt-8 flex flex-wrap gap-3"><Button onClick={rememberWord}><CheckCircle2 size={16} />记得</Button><Button variant="secondary" onClick={() => openNote("模糊")}>模糊</Button><Button variant="danger" onClick={() => openNote("忘记")}><XCircle size={16} />忘记</Button></div></div><div className="rounded-glass border border-white/[0.08] bg-white/[0.04] p-6"><p className="text-sm text-white/55">熟悉度</p><Progress className="mt-4" value={(word.familiarity / 5) * 100} /><p className="mt-4 text-sm text-white/50">模糊或忘记时会要求填写笔记，并加入错词本。</p></div></Card>;
}

function WrongBook({ words, review, remove, master }: { words: StudyWord[]; review: (word: StudyWord) => void; remove: (word: StudyWord) => void; master: (word: StudyWord) => void }) {
  return <Card className="p-6"><h2 className="text-2xl font-semibold text-white">错词本</h2><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{words.length ? words.map((word) => <div key={word.id} className="rounded-glass border border-white/[0.08] bg-white/[0.045] p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="break-words text-2xl font-semibold text-white">{word.word}</h3><p className="mt-1 text-sm text-white/55">{word.phonetic || "无音标"} · {word.pos || "无词性"}</p></div><span className="rounded-full bg-[#FF4D4F]/15 px-3 py-1 text-xs text-[#FF8A8B]">错 {word.wrongCount}</span></div><p className="mt-4 text-white">{word.meaning}</p><p className="mt-3 text-sm text-white/55">笔记：{word.note || "暂无笔记"}</p><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => review(word)}>复习</Button><Button onClick={() => master(word)}>标记已掌握</Button><Button variant="danger" onClick={() => remove(word)}>移除</Button></div></div>) : <Empty text="暂无错词。模糊、忘记或拼写错误的词会自动进入这里。" />}</div></Card>;
}

function Spelling({ word, answer, setAnswer, status, check }: { word?: StudyWord; answer: string; setAnswer: (value: string) => void; status: string; check: () => void }) {
  if (!word) return <Card className="p-8"><Empty text="暂无词条，无法开始拼写试炼。" /></Card>;
  return <Card className="p-8"><p className="text-sm text-white/55">根据中文释义输入英文单词</p><div className="mt-5 rounded-glass border border-klein/30 bg-klein/15 p-7 text-2xl font-semibold leading-relaxed text-white md:text-3xl">{word.meaning}</div><Input className="mt-6" value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") check(); }} placeholder="请输入英文单词" /><div className="mt-5 flex items-center gap-3"><Button onClick={check}>提交</Button>{status ? <span className={cn("text-sm", status === "正确" ? "text-[#00C896]" : "text-[#F59E0B]")}>{status}</span> : null}</div></Card>;
}

function Reading({ reading, answers, setAnswers, submitted, generateReading, submitReading, lookupWord, apiKey, setApiKey, model, setModel, status, isGenerating }: { reading: ReadingExercise | null; answers: Record<string, string>; setAnswers: (answers: Record<string, string>) => void; submitted: boolean; generateReading: () => Promise<void>; submitReading: () => void; lookupWord: (word: string) => void; apiKey: string; setApiKey: (value: string) => void; model: string; setModel: (value: string) => void; status: string; isGenerating: boolean }) {
  const settings = (
    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_auto]">
      <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="OpenAI API Key" />
      <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder={DEFAULT_READING_MODEL} />
      <Button onClick={generateReading} disabled={isGenerating}>{isGenerating ? "生成中..." : reading ? "换一篇" : "生成阅读训练"}</Button>
    </div>
  );

  if (!reading) {
    return <Card className="p-8"><h2 className="text-2xl font-semibold text-white">阅读秘境</h2><p className="mt-3 text-white/55">点击生成时会把今日 50 个词传给 API，返回文章、题目、答案、中文解析和词义表。提交前不会显示答案。</p>{settings}{status ? <p className={cn("mt-3 text-sm", status.startsWith("生成失败") || status.includes("请先") ? "text-[#FF8A8B]" : "text-[#00C896]")}>{status}</p> : null}</Card>;
  }

  return <Card className="p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="text-2xl font-semibold text-white">{reading.title}</h2><p className="mt-2 text-sm text-white/55">提交后可点击文章任意单词查看 API 返回的中文释义和词性。</p></div></div>{settings}{status ? <p className={cn("mt-3 text-sm", status.startsWith("生成失败") || status.includes("请先") ? "text-[#FF8A8B]" : "text-[#00C896]")}>{status}</p> : null}<div className="mt-6 rounded-glass border border-white/[0.08] bg-white/[0.04] p-6 text-sm leading-8 text-white/75">{reading.passage.split(/(\s+)/).map((part, index) => part.trim() ? <button key={index} className={cn("rounded px-1 transition", submitted ? "hover:bg-klein/30 hover:text-white" : "cursor-text")} onClick={() => lookupWord(part)}>{part}</button> : part)}</div><div className="mt-6 space-y-5">{reading.questions.map((question, index) => <div key={question.id} className="rounded-glass border border-white/[0.08] bg-white/[0.04] p-5"><h3 className="font-semibold text-white">{index + 1}. {question.question}</h3><div className="mt-4 grid gap-2">{question.options.map((option) => { const selected = answers[question.id] === option; const correct = submitted && option === question.answer; const wrong = submitted && selected && option !== question.answer; return <button key={option} onClick={() => !submitted && setAnswers({ ...answers, [question.id]: option })} className={cn("rounded-xl border px-4 py-3 text-left text-sm transition", selected ? "border-klein bg-klein/20 text-white" : "border-white/[0.08] bg-white/[0.04] text-white/65", correct && "border-[#00C896] bg-[#00C896]/15 text-white", wrong && "border-[#FF4D4F] bg-[#FF4D4F]/15 text-white")}>{option}</button>; })}</div>{submitted ? <div className="mt-3 space-y-2 text-sm"><p className={cn(answers[question.id] === question.answer ? "text-[#00C896]" : "text-[#FF8A8B]")}>{answers[question.id] === question.answer ? "正确" : "错误"} · 正确答案：{question.answer}</p><p className="text-white/60">解析：{question.explanation}</p></div> : null}</div>)}</div>{submitted ? <div className="mt-6 rounded-glass border border-[#00C896]/25 bg-[#00C896]/10 p-5"><h3 className="font-semibold text-white">中文解析</h3><p className="mt-2 text-sm leading-7 text-white/70">{reading.chineseExplanation || "本篇文章围绕可持续学习、反馈和自律展开，强调将努力转化为可见证据。"}</p><h3 className="mt-5 font-semibold text-white">文章讲解</h3><p className="mt-2 text-sm leading-7 text-white/70">{reading.passageExplanation || "请重点关注文章的主旨句、转折关系和关键词复现。"}</p></div> : <Button className="mt-6" onClick={submitReading}>提交</Button>}</Card>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[24px] border border-white/[0.1] bg-[#0B0F1A]/95 p-6 shadow-glow"><div className="flex items-center justify-between"><h3 className="text-xl font-semibold text-white">{title}</h3><button className="rounded-full bg-white/[0.06] p-2 text-white/60 hover:text-white" onClick={onClose}><X size={18} /></button></div><div className="mt-5">{children}</div></div></div>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-glass border border-white/[0.08] bg-white/[0.07] p-4"><p className="text-xs text-white/50">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-glass border border-dashed border-white/[0.12] bg-white/[0.035] p-8 text-center text-sm text-white/45">{text}</div>;
}
