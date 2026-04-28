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

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/reading",
    provider: "deepseek",
    hasDeepSeekKey: Boolean(process.env.DEEPSEEK_API_KEY),
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

    const response = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: normalizeModel(body.model),
        messages: [
          {
            role: "system",
            content: [
              "You generate CET-6 English reading practice.",
              "Return only valid JSON. No markdown, no code fences, no extra prose.",
              "The JSON object must contain title, passage, wordsUsed, questions, chineseExplanation, passageExplanation, and wordGlossary.",
              "questions must contain exactly 4 items. Each item must contain question, options, answer, and explanation.",
              "options must contain exactly 4 strings. answer must exactly equal one option string.",
              "wordGlossary items must contain word, meaning, and pos.",
              "Do not reveal answers inside the passage. Explanations must be Chinese.",
            ].join(" "),
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
              words,
            }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 3500,
      }),
    }).finally(() => clearTimeout(timeoutId));

    const data = await readJsonSafely(response);
    if (!response.ok) {
      return NextResponse.json({ error: "DeepSeek 请求失败。", details: data }, { status: response.status });
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
