import type { AppState, Category } from "@/lib/types";
import { today } from "@/lib/utils";

export const categories: Category[] = ["学习", "工作", "毕业论文", "作品集", "英语", "生活"];

const now = new Date().toISOString();

export const defaultState: AppState = {
  tasks: [
    {
      id: "task-1",
      title: "六级单词 30 个",
      category: "英语",
      priority: "高",
      status: "进行中",
      estimatedMinutes: 45,
      actualMinutes: 20,
      progress: 40,
      note: "完成今日词库与拼写试炼",
      date: today(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-2",
      title: "论文第五章修改",
      category: "毕业论文",
      priority: "高",
      status: "未开始",
      estimatedMinutes: 90,
      actualMinutes: 0,
      progress: 0,
      note: "",
      date: today(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-3",
      title: "作品集页面优化",
      category: "作品集",
      priority: "中",
      status: "未开始",
      estimatedMinutes: 60,
      actualMinutes: 0,
      progress: 0,
      note: "",
      date: today(),
      createdAt: now,
      updatedAt: now,
    },
  ],
  records: [],
  review: {
    done: "",
    undone: "",
    reason: "",
    value: "",
    mood: "",
    tomorrow: "",
  },
  words: [
    { id: "w1", word: "sustain", meaning: "维持；支撑", familiarity: 2, wrongCount: 0, correctCount: 0 },
    { id: "w2", word: "fluctuate", meaning: "波动；起伏", familiarity: 1, wrongCount: 1, correctCount: 0 },
    { id: "w3", word: "inevitable", meaning: "不可避免的", familiarity: 3, wrongCount: 0, correctCount: 1 },
  ],
  focusCount: 0,
};
