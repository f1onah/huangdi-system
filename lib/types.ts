export type Category = "学习" | "工作" | "毕业论文" | "作品集" | "英语" | "生活";
export type Priority = "高" | "中" | "低";
export type TaskStatus = "未开始" | "进行中" | "已完成" | "暂停";
export type AttributeKey = "academic" | "english" | "creative" | "execution" | "expression" | "life";
export type FocusMode = "focus" | "shortBreak" | "longBreak";

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

export type Word = {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  pos?: string;
  rawMeaning?: string;
  phrase?: string;
  sentence?: string;
  example?: string;
  date: string;
  familiarity: number;
  wrongCount: number;
  correctCount: number;
  note?: string;
  tags?: string[];
  sourceOrder?: number;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReadingQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type ReadingExercise = {
  id: string;
  date: string;
  title: string;
  passage: string;
  wordsUsed: string[];
  questions: ReadingQuestion[];
  wordGlossary?: Array<{
    word: string;
    meaning: string;
    pos: string;
  }>;
  userAnswers?: Record<string, string>;
  completed?: boolean;
  chineseExplanation?: string;
  passageExplanation?: string;
  createdAt: string;
};

export type FocusSession = {
  id: string;
  taskId?: string;
  taskTitle?: string;
  category?: Category;
  mode: FocusMode;
  durationMinutes: number;
  completed: boolean;
  distractionNote?: string;
  reflection?: string;
  date: string;
  startedAt: string;
  endedAt?: string;
};

export type DailyReview = {
  id: string;
  date: string;
  completed: string;
  unfinished: string;
  reason: string;
  mostValuable: string;
  mood: string;
  tomorrowTop3: string[];
  energyLevel: number;
  todaySentence: string;
  createdAt: string;
  updatedAt: string;
};

export type MealRecord = {
  id: string;
  date: string;
  food: string;
  drink: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Attribute = {
  key: AttributeKey;
  name: string;
  level: number;
  exp: number;
  nextLevelExp: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  conditionType: string;
};

export type Toast = {
  id: string;
  message: string;
  tone?: "success" | "warning" | "error";
};

export type AppState = {
  tasks: Task[];
  words: Word[];
  readings: ReadingExercise[];
  focusSessions: FocusSession[];
  meals: MealRecord[];
  reviews: DailyReview[];
  attributes: Attribute[];
  achievements: Achievement[];
};
