export type Category = "学习" | "工作" | "毕业论文" | "作品集" | "英语" | "生活";
export type Priority = "高" | "中" | "低";
export type TaskStatus = "未开始" | "进行中" | "已完成" | "暂停";

export type Task = {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes: number;
  progress: number;
  note: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskRecord = {
  id: string;
  taskId: string;
  date: string;
  did: string;
  problem: string;
  solution: string;
  next: string;
  link: string;
  createdAt: string;
};

export type DailyReview = {
  done: string;
  undone: string;
  reason: string;
  value: string;
  mood: string;
  tomorrow: string;
  savedAt?: string;
};

export type Word = {
  id: string;
  word: string;
  meaning: string;
  familiarity: number;
  wrongCount: number;
  correctCount: number;
};

export type AppState = {
  tasks: Task[];
  records: TaskRecord[];
  review: DailyReview;
  words: Word[];
  focusCount: number;
};
