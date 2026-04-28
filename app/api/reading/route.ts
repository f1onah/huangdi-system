import { NextResponse } from "next/server";

const DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEFAULT_READING_MODEL = "deepseek-chat";
const DEEPSEEK_TIMEOUT_MS = 30000;

type RequestWord = {
  word?: string;
  meaning?: string;
  pos?: string;
  phrase?: string;
  sentence?: string;
};

type DeepSeekPayload = {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  response_format?: { type: "json_object" };
  temperature?: number;
  max_tokens?: number;
};

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) return "";
  const maybe = data as { choices?: Array<{ message?: { content?: string | null } }> };
  return maybe.choices?.find((choice) => typeof choice.message?.content === "string")?.message?.content || "";
}

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function normalizeModel(model?: string) {
  const clean = model?.trim();
  if (!clean || clean.toLowerCase().startsWith("gpt-")) return DEFAULT_READING_MODEL;
  return clean;
}

function summarizeDeepSeekError(data: unknown) {
  if (typeof data !== "object" || data === null) return String(data || "未知错误");
  const maybe = data as { error?: { message?: string; type?: string; code?: string | number } | string; message?: string };
  if (typeof maybe.error === "string") return maybe.error;
  if (maybe.error?.message) {
    const type = maybe.error.type ? `，类型：${maybe.error.type}` : "";
    const code = maybe.error.code ? `，代码：${maybe.error.code}` : "";
    return `${maybe.error.message}${type}${code}`;
  }
  if (maybe.message) return maybe.message;
  return JSON.stringify(data).slice(0, 800);
}

async function callDeepSeek(apiKey: string, payload: DeepSeekPayload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  return fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify(payload),
  }).finally(() => clearTimeout(timeoutId));
}

export async function GET(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const url = new URL(request.url);

  if (url.searchParams.get("test") === "1") {
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Vercel 环境变量 DEEPSEEK_API_KEY 尚未配置。" }, { status: 500 });
    }

    try {
      const response = await callDeepSeek(apiKey, {
        model: DEFAULT_READING_MODEL,
        messages: [
          { role: "system", content: "Return only a valid json object. No markdown." },
          { role: "user", content: "Return this exact json shape with a short value: {\"ok\":true,\"message\":\"ready\"}" },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 80,
      });
      const data = await readJsonSafely(response);

      return NextResponse.json({
        ok: response.ok,
        provider: "deepseek",
        status: response.status,
        statusText: response.statusText,
        message: response.ok ? "DeepSeek 最小测试通过。" : summarizeDeepSeekError(data),
        details: data,
      }, { status: response.ok ? 200 : response.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "DeepSeek 最小测试失败。";
      return NextResponse.json({ ok: false, provider: "deepseek", error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    route: "/api/reading",
    provider: "deepseek",
    hasDeepSeekKey: Boolean(apiKey),
    defaultModel: DEFAULT_READING_MODEL,
    timeoutSeconds: DEEPSEEK_TIMEOUT_MS / 1000,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Vercel 环境变量 DEEPSEEK_API_KEY 尚未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json() as { words?: RequestWord[]; model?: string };
    const words = Array.isArray(body.words) ? body.words.slice(0, 50).filter((item) => item.word) : [];
    if (!words.length) {
      return NextResponse.json({ error: "请先导入词库，再生成阅读训练。" }, { status: 400 });
    }

    const response = await callDeepSeek(apiKey, {
      model: normalizeModel(body.model),
      messages: [
        {
          role: "system",
          content: [
            "You generate CET-6 English reading practice.",
            "Return only a valid json object. No markdown, no code fences, no extra prose.",
            "The json object must contain title, passage, wordsUsed, questions, chineseExplanation, passageExplanation, and wordGlossary.",
            "questions must contain exactly 4 items. Each item must contain question, options, answer, and explanation.",
            "options must contain exactly 4 strings. answer must exactly equal one option string.",
            "wordGlossary items must contain word, meaning, and pos.",
            "Do not reveal answers inside the passage. Explanations must be Chinese.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Use the given daily vocabulary to create one CET-6 reading exercise and return a json object only.",
            schemaExample: {
              title: "string",
              passage: "string",
              wordsUsed: ["word"],
              questions: [
                { question: "string", options: ["A", "B", "C", "D"], answer: "A", explanation: "中文解析" },
              ],
              chineseExplanation: "中文整体解析",
              passageExplanation: "中文文章讲解",
              wordGlossary: [{ word: "word", meaning: "中文意思", pos: "词性" }],
            },
            requirements: [
              "Passage length 220-320 English words.",
              "Naturally include at least 12 of the provided words when possible.",
              "Create 4 multiple-choice questions with 4 options each.",
              "The answer must exactly equal one option string.",
              "Provide a Chinese explanation for each question.",
              "Provide one overall Chinese explanation and one passage structure explanation.",
              "Provide a wordGlossary for important words in the passage, including provided vocabulary and common difficult words.",
            ],
            words,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3500,
    });

    const data = await readJsonSafely(response);
    if (!response.ok) {
      return NextResponse.json({
        error: "DeepSeek 请求失败。",
        status: response.status,
        message: summarizeDeepSeekError(data),
        details: data,
      }, { status: response.status });
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      return NextResponse.json({ error: "DeepSeek 没有返回阅读内容。", details: data }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(outputText));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: `DeepSeek 请求超过 ${DEEPSEEK_TIMEOUT_MS / 1000} 秒未返回，请稍后重试。` },
        { status: 504 },
      );
    }

    const message = error instanceof Error ? error.message : "生成阅读训练失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
