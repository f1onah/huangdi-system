import type { Achievement, AppState, Attribute, Category } from "@/lib/types";
import { today } from "@/lib/utils";

export const categories: Category[] = ["学习", "工作", "毕业论文", "作品集", "英语", "生活"];

export const attributeSeed: Attribute[] = [
  { key: "academic", name: "学术力", level: 1, exp: 45, nextLevelExp: 100 },
  { key: "english", name: "英语力", level: 1, exp: 62, nextLevelExp: 100 },
  { key: "creative", name: "创作力", level: 1, exp: 38, nextLevelExp: 100 },
  { key: "execution", name: "执行力", level: 1, exp: 55, nextLevelExp: 100 },
  { key: "expression", name: "表达力", level: 1, exp: 42, nextLevelExp: 100 },
  { key: "life", name: "生活力", level: 1, exp: 30, nextLevelExp: 100 },
];

export const achievementSeed: Achievement[] = [
  { id: "streak-3", title: "初入山门", description: "连续记录 3 天", unlocked: false, conditionType: "streak" },
  { id: "review-7", title: "心法稳定", description: "连续复盘 7 天", unlocked: false, conditionType: "review_streak" },
  { id: "words-100", title: "词汇小成", description: "累计添加 100 个六级单词", unlocked: false, conditionType: "word_count" },
  { id: "spell-50", title: "拼写试炼者", description: "完成 50 次拼写训练", unlocked: false, conditionType: "spelling_count" },
  { id: "reading-5", title: "阅读秘境开启", description: "完成 5 篇阅读训练", unlocked: false, conditionType: "reading_count" },
  { id: "focus-day-4", title: "小闭关", description: "一天完成 4 个番茄钟", unlocked: false, conditionType: "focus_day" },
  { id: "focus-30", title: "专注修士", description: "累计完成 30 个番茄钟", unlocked: false, conditionType: "focus_total" },
  { id: "paper-5", title: "文献修士", description: "论文类任务连续推进 5 天", unlocked: false, conditionType: "paper_streak" },
  { id: "creative-10", title: "创作不息", description: "作品集 / 创作类任务完成 10 个", unlocked: false, conditionType: "creative_count" },
  { id: "progress-80-3", title: "摆烂终结者", description: "连续 3 天总进度超过 80%", unlocked: false, conditionType: "progress_streak" },
];

const now = new Date().toISOString();

export const defaultState: AppState = {
  tasks: [
    { id: "task-1", title: "六级单词 30 个", category: "英语", priority: "高", status: "进行中", estimatedMinutes: 45, actualMinutes: 20, progress: 40, note: "完成今日词库与拼写试炼", date: today(), createdAt: now, updatedAt: now },
    { id: "task-2", title: "论文第五章修改", category: "毕业论文", priority: "高", status: "未开始", estimatedMinutes: 90, actualMinutes: 0, progress: 0, note: "整理文献引用和小结", date: today(), createdAt: now, updatedAt: now },
    { id: "task-3", title: "作品集页面优化", category: "作品集", priority: "中", status: "未开始", estimatedMinutes: 60, actualMinutes: 0, progress: 0, note: "优化首屏说明和项目卡片", date: today(), createdAt: now, updatedAt: now },
  ],
  words: [
    { id: "w1", word: "sustain", meaning: "维持；支撑", example: "A steady routine can sustain long-term progress.", date: today(), familiarity: 2, wrongCount: 0, correctCount: 0, createdAt: now, updatedAt: now },
    { id: "w2", word: "fluctuate", meaning: "波动；起伏", example: "Motivation may fluctuate during exam preparation.", date: today(), familiarity: 1, wrongCount: 1, correctCount: 0, createdAt: now, updatedAt: now },
    { id: "w3", word: "inevitable", meaning: "不可避免的", example: "Setbacks are inevitable, but they can be useful.", date: today(), familiarity: 3, wrongCount: 0, correctCount: 1, createdAt: now, updatedAt: now },
  ],
  readings: [],
  focusSessions: [],
  meals: [],
  reviews: [],
  attributes: attributeSeed,
  achievements: achievementSeed,
};
