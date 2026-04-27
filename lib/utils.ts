import { clsx, type ClassValue } from "clsx";
import type { Attribute, AttributeKey, Category, ReadingExercise, Word } from "@/lib/types";

export function cn(...inputs: ClassValue[]) { return clsx(inputs); }
export function today() { return new Date().toISOString().slice(0, 10); }
export function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
export function percent(done: number, total: number) { return total ? Math.round((done / total) * 100) : 0; }
export function clamp(value: number, min = 0, max = 100) { return Math.min(max, Math.max(min, value)); }

export function categoryToAttribute(category?: Category): AttributeKey {
  if (category === "英语") return "english";
  if (category === "毕业论文") return "academic";
  if (category === "作品集") return "creative";
  if (category === "生活") return "life";
  if (category === "学习") return "academic";
  return "execution";
}

export function addExp(attributes: Attribute[], key: AttributeKey, amount: number) {
  return attributes.map((attribute) => {
    if (attribute.key !== key) return attribute;
    let level = attribute.level;
    let exp = attribute.exp + amount;
    while (exp >= attribute.nextLevelExp) {
      exp -= attribute.nextLevelExp;
      level += 1;
    }
    return { ...attribute, level, exp };
  });
}

export const readingPromptTemplate = `请根据以下六级词汇，生成一篇 300-400 词英语阅读文章。

词汇列表：
{{words}}

要求：
1. 难度接近 CET-6
2. 尽量自然地使用这些词
3. 主题偏社会、教育、科技或个人成长
4. 文章后附 3-5 道阅读理解选择题
5. 每题提供正确答案和简短解析
6. 输出 JSON 格式，包含 title、passage、questions`;

export async function generateReadingFromWords(words: Word[]): Promise<ReadingExercise> {
  const selected = words.slice(0, 8);
  const wordText = selected.map((word) => word.word).join(", ") || "sustain, fluctuate, inevitable";
  const createdAt = new Date().toISOString();
  return {
    id: uid("reading"),
    date: today(),
    title: "Small Habits and Sustainable Growth",
    wordsUsed: selected.map((word) => word.word),
    passage: `In modern education, progress rarely comes from a single dramatic decision. It is more often the result of small habits that people can sustain over a long period of time. A student's motivation may fluctuate, especially when exams, projects, and personal pressure arrive together. However, this fluctuation is not a sign of failure. It is an inevitable part of learning. The key is to design a routine that continues even when energy is low. For example, reviewing ten words, reading one short passage, or completing one focused session can protect momentum. Technology can also help learners observe their behavior. When tasks, focus time, and mistakes are recorded clearly, students can make better decisions instead of depending only on memory. Personal growth becomes visible, and visible progress encourages the next action. In this way, a simple dashboard can become more than a list of duties. It can become a quiet system that supports discipline, reflection, and confidence.`,
    questions: [
      { id: uid("q"), question: "What does the passage mainly suggest about progress?", options: ["It depends on dramatic decisions.", "It comes from sustainable small habits.", "It should ignore low-energy days.", "It is unrelated to reflection."], answer: "It comes from sustainable small habits.", explanation: "The passage emphasizes small habits that can be sustained over time." },
      { id: uid("q"), question: "What does the word fluctuation refer to in the passage?", options: ["A stable routine", "A change in motivation", "A reading question", "A completed project"], answer: "A change in motivation", explanation: "The passage says motivation may fluctuate when pressure arrives." },
      { id: uid("q"), question: "Why can a dashboard help learners?", options: ["It replaces all study plans.", "It records behavior and makes progress visible.", "It removes the need for effort.", "It makes exams easier automatically."], answer: "It records behavior and makes progress visible.", explanation: "The passage connects recording tasks and focus time with better decisions." },
    ],
    createdAt,
  };
}
