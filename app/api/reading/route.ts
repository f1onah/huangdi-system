import { NextResponse } from "next/server";

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_READING_MODEL = "gpt-4.1-mini";

type RequestWord = {
  word?: string;
  meaning?: string;
  pos?: string;
  phrase?: string;
  sentence?: string;
};

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) return "";
  const maybe = data as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (typeof maybe.output_text === "string") return maybe.output_text;
  return maybe.output?.flatMap((item) => item.content || []).find((item) => typeof item.text === "string")?.text || "";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Vercel 环境变量 OPENAI_API_KEY 尚未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json() as { words?: RequestWord[]; model?: string };
    const words = Array.isArray(body.words) ? body.words.slice(0, 50).filter((item) => item.word) : [];
    if (!words.length) {
      return NextResponse.json({ error: "请先导入词库，再生成阅读训练。" }, { status: 400 });
    }

    const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model?.trim() || DEFAULT_READING_MODEL,
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
              words,
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
      return NextResponse.json({ error: data }, { status: response.status });
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      return NextResponse.json({ error: "OpenAI 没有返回阅读内容。" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(outputText));
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成阅读训练失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
