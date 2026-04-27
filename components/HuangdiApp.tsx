import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Award, BarChart3, BookOpen, CheckCircle2, Clock, LayoutDashboard, ListChecks, PenLine, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button, Card, Input, Progress, Select, Textarea } from "@/components/ui";
import { categories } from "@/lib/data";
import { useAppState } from "@/lib/storage";
import type { AppState, Category, DailyReview, Priority, Task, TaskRecord, TaskStatus, Word } from "@/lib/types";
import { cn, percent, today, uid } from "@/lib/utils";

type Tab = "dashboard" | "tasks" | "records" | "english" | "focus" | "review" | "stats";

const tabs: Array<{ key: Tab; label: string; icon: LucideIcon }> = [
  { key: "dashboard", label: "首页", icon: LayoutDashboard },
  { key: "tasks", label: "今日任务", icon: ListChecks },
  { key: "records", label: "详细记录", icon: PenLine },
  { key: "english", label: "六级英语", icon: BookOpen },
  { key: "focus", label: "专注修炼", icon: Clock },
  { key: "review", label: "每日复盘", icon: CheckCircle2 },
  { key: "stats", label: "周月统计", icon: BarChart3 },
];

const statusList: TaskStatus[] = ["未开始", "进行中", "已完成", "暂停"];
const priorityList: Priority[] = ["高", "中", "低"];
const chartColors = ["#002FA7", "#6B7280", "#93C5FD", "#111827", "#60A5FA", "#CBD5E1"];

export function HuangdiApp() {
  const { state, setState, ready, reset } = useAppState();
  const [tab, setTab] = useState<Tab>("dashboard");
  const todayTasks = state.tasks.filter((task) => task.date === today());
  const completed = todayTasks.filter((task) => task.status === "已完成").length;
  const overall = todayTasks.length ? Math.round(todayTasks.reduce((sum, task) => sum + task.progress, 0) / todayTasks.length) : 0;
  const studyTasks = todayTasks.filter((task) => ["学习", "英语", "毕业论文"].includes(task.category));
  const workTasks = todayTasks.filter((task) => ["工作", "作品集"].includes(task.category));
  const studyRate = percent(studyTasks.filter((task) => task.status === "已完成").length, studyTasks.length);
  const workRate = percent(workTasks.filter((task) => task.status === "已完成").length, workTasks.length);

  function updateTask(id: string, patch: Partial<Task>) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task)),
    }));
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white/85 p-5 backdrop-blur-xl lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-klein">Huangdi</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">黄帝养成系统</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">个人学习、工作与成长看板。</p>
        <nav className="mt-8 space-y-1">
          {tabs.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition", tab === item.key ? "bg-klein text-white" : "text-gray-600 hover:bg-gray-100")}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <Button className="mt-8 w-full" variant="secondary" onClick={reset}>
          <RotateCcw size={16} />
          重置演示数据
        </Button>
      </aside>

      <main className={cn("mx-auto max-w-7xl px-4 py-5 lg:ml-64 lg:px-8", !ready && "opacity-60")}>
        <MobileTabs tab={tab} setTab={setTab} />
        {tab === "dashboard" && <Dashboard tasks={todayTasks} completed={completed} overall={overall} studyRate={studyRate} workRate={workRate} setTab={setTab} focusCount={state.focusCount} words={state.words} />}
        {tab === "tasks" && <Tasks tasks={todayTasks} updateTask={updateTask} setState={setState} />}
        {tab === "records" && <Records tasks={state.tasks} records={state.records} setState={setState} />}
        {tab === "english" && <English words={state.words} setState={setState} />}
        {tab === "focus" && <Focus focusCount={state.focusCount} setState={setState} />}
        {tab === "review" && <Review review={state.review} setState={setState} />}
        {tab === "stats" && <Stats tasks={state.tasks} records={state.records} focusCount={state.focusCount} review={state.review} />}
      </main>
    </div>
  );
}

function MobileTabs({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-sm lg:hidden">
      <h1 className="mb-3 font-semibold">黄帝养成系统</h1>
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm", tab === item.key ? "bg-klein text-white" : "bg-gray-100 text-gray-600")}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ tasks, completed, overall, studyRate, workRate, setTab, focusCount, words }: { tasks: Task[]; completed: number; overall: number; studyRate: number; workRate: number; setTab: (tab: Tab) => void; focusCount: number; words: Word[] }) {
  const weekly = ["一", "二", "三", "四", "五", "六", "日"].map((day, index) => ({ day, progress: index === 6 ? overall : Math.max(18, overall - (6 - index) * 8) }));
  const categoryData = categories.map((name) => ({ name, value: tasks.filter((task) => task.category === name).length })).filter((item) => item.value > 0);
  const attributes = [
    ["学术力", 35 + tasks.filter((task) => task.category === "毕业论文").reduce((sum, task) => sum + task.progress, 0) / 3],
    ["英语力", 30 + words.reduce((sum, word) => sum + word.familiarity * 5 + word.correctCount * 2, 0)],
    ["创作力", 28 + tasks.filter((task) => task.category === "作品集").reduce((sum, task) => sum + task.progress, 0) / 2],
    ["执行力", 36 + completed * 12 + focusCount * 8],
    ["表达力", 32 + tasks.filter((task) => task.note).length * 8],
    ["生活力", 26 + focusCount * 5],
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-klein p-7 text-white shadow-lift">
        <p className="text-sm text-white/70">{today()}</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">黄帝 Lv. {Math.max(1, Math.floor((overall + focusCount * 8) / 40) + 1)}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">今日总进度 {overall}%，完成 {completed}/{tasks.length} 个任务。保持节奏，比爆发更可靠。</p>
        <Progress className="mt-6 bg-white/20 [&>div]:bg-white" value={overall} />
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="今日总进度" value={`${overall}%`} />
        <Stat title="学习完成率" value={`${studyRate}%`} />
        <Stat title="工作完成率" value={`${workRate}%`} />
        <Stat title="专注番茄钟" value={`${focusCount} 个`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">本周进度趋势</h3><button className="text-sm text-klein" onClick={() => setTab("stats")}>查看统计</button></div>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><XAxis dataKey="day" axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="progress" stroke="#002FA7" fill="#002FA7" fillOpacity={0.12} /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold">任务分类占比</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88}>{categoryData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">今日重点任务</h3><button className="text-sm text-klein" onClick={() => setTab("review")}>写复盘</button></div>
          <div className="space-y-3">{tasks.slice(0, 4).map((task) => <div key={task.id} className="rounded-lg bg-gray-50 p-4"><div className="flex justify-between text-sm"><span>{task.title}</span><span className="text-klein">{task.progress}%</span></div><Progress className="mt-3" value={task.progress} /></div>)}</div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold">六维属性</h3>
          <div className="space-y-4">{attributes.map(([name, raw]) => { const value = Math.min(100, Math.round(Number(raw))); return <div key={String(name)}><div className="mb-2 flex justify-between text-sm"><span>{name}</span><span>Lv.{Math.floor(value / 20) + 1} · {value} EXP</span></div><Progress value={value} /></div>; })}</div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <Card className="p-5"><p className="text-sm text-gray-500">{title}</p><p className="mt-2 text-3xl font-semibold text-ink">{value}</p></Card>;
}

function Tasks({ tasks, updateTask, setState }: { tasks: Task[]; updateTask: (id: string, patch: Partial<Task>) => void; setState: Dispatch<SetStateAction<AppState>> }) {
  const [draft, setDraft] = useState({ title: "", category: "学习" as Category, priority: "中" as Priority, estimatedMinutes: 45 });
  function addTask() {
    if (!draft.title.trim()) return;
    const now = new Date().toISOString();
    const task: Task = { id: uid("task"), title: draft.title.trim(), category: draft.category, priority: draft.priority, status: "未开始", estimatedMinutes: draft.estimatedMinutes, actualMinutes: 0, progress: 0, note: "", date: today(), createdAt: now, updatedAt: now };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    setDraft({ title: "", category: "学习", priority: "中", estimatedMinutes: 45 });
  }
  return (
    <div><Title icon={ListChecks} title="今日任务看板" />
      <Card className="mb-5 p-4"><div className="grid gap-3 lg:grid-cols-[1fr_140px_120px_130px_auto]"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="任务名称" /><Select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>{priorityList.map((item) => <option key={item}>{item}</option>)}</Select><Input type="number" value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })} /><Button onClick={addTask}><Plus size={16} />新增</Button></div></Card>
      <div className="grid gap-4 xl:grid-cols-4">{statusList.map((status) => <Card key={status} className="min-h-80 p-4"><h3 className="mb-4 font-semibold">{status}</h3><div className="space-y-3">{tasks.filter((task) => task.status === status).map((task) => <div key={task.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4"><Input className="font-medium" value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} /><div className="mt-3 grid grid-cols-2 gap-2"><Select value={task.category} onChange={(event) => updateTask(task.id, { category: event.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as Priority })}>{priorityList.map((item) => <option key={item}>{item}</option>)}</Select><Input type="number" value={task.estimatedMinutes} onChange={(event) => updateTask(task.id, { estimatedMinutes: Number(event.target.value) })} /><Input type="number" value={task.actualMinutes} onChange={(event) => updateTask(task.id, { actualMinutes: Number(event.target.value) })} /></div><Textarea className="mt-3" value={task.note} onChange={(event) => updateTask(task.id, { note: event.target.value })} placeholder="备注" /><div className="mt-3 flex items-center gap-3"><input className="w-full accent-klein" type="range" min={0} max={100} step={5} value={task.progress} onChange={(event) => updateTask(task.id, { progress: Number(event.target.value), status: Number(event.target.value) >= 100 ? "已完成" : task.status })} /><span className="w-10 text-sm text-klein">{task.progress}%</span></div><div className="mt-3 grid grid-cols-2 gap-2">{statusList.map((next) => <Button key={next} variant={next === task.status ? "primary" : "secondary"} onClick={() => updateTask(task.id, { status: next, progress: next === "已完成" ? 100 : task.progress })}>{next}</Button>)}</div><Button className="mt-3 w-full" variant="danger" onClick={() => setState((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }))}><Trash2 size={16} />删除</Button></div>)}</div></Card>)}</div>
    </div>
  );
}

function Records({ tasks, records, setState }: { tasks: Task[]; records: TaskRecord[]; setState: Dispatch<SetStateAction<AppState>> }) {
  const [draft, setDraft] = useState({ taskId: tasks[0]?.id ?? "", did: "", problem: "", solution: "", next: "", link: "" });
  function save() { if (!draft.taskId) return; const record: TaskRecord = { id: uid("record"), date: today(), createdAt: new Date().toISOString(), ...draft }; setState((current) => ({ ...current, records: [record, ...current.records] })); setDraft({ ...draft, did: "", problem: "", solution: "", next: "", link: "" }); }
  return <div><Title icon={PenLine} title="详细记录" /><Card className="mb-5 grid gap-4 p-5"><Select value={draft.taskId} onChange={(event) => setDraft({ ...draft, taskId: event.target.value })}>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select><Textarea value={draft.did} onChange={(event) => setDraft({ ...draft, did: event.target.value })} placeholder="今天做了什么" /><Textarea value={draft.problem} onChange={(event) => setDraft({ ...draft, problem: event.target.value })} placeholder="遇到的问题" /><Textarea value={draft.solution} onChange={(event) => setDraft({ ...draft, solution: event.target.value })} placeholder="解决方式" /><Textarea value={draft.next} onChange={(event) => setDraft({ ...draft, next: event.target.value })} placeholder="明天继续做什么" /><Input value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} placeholder="相关链接或备注" /><Button className="w-fit" onClick={save}>保存记录</Button></Card><div className="grid gap-4">{records.map((record) => <Card key={record.id} className="p-5"><p className="text-sm text-gray-500">{record.date} · {tasks.find((task) => task.id === record.taskId)?.title ?? "任务"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{record.did}</p>{record.problem && <p className="mt-3 text-sm text-gray-500">问题：{record.problem}</p>}{record.solution && <p className="mt-2 text-sm text-gray-500">解决：{record.solution}</p>}{record.next && <p className="mt-2 text-sm text-gray-500">下一步：{record.next}</p>}</Card>)}</div></div>;
}

function English({ words, setState }: { words: Word[]; setState: Dispatch<SetStateAction<AppState>> }) {
  const [word, setWord] = useState(""); const [meaning, setMeaning] = useState(""); const [index, setIndex] = useState(0); const [answer, setAnswer] = useState(""); const [result, setResult] = useState<string | null>(null); const current = words[index % Math.max(words.length, 1)];
  function addWord() { if (!word.trim()) return; const next: Word = { id: uid("word"), word: word.trim(), meaning: meaning.trim() || "待补充释义", familiarity: 0, wrongCount: 0, correctCount: 0 }; setState((currentState) => ({ ...currentState, words: [next, ...currentState.words] })); setWord(""); setMeaning(""); }
  function check() { if (!current) return; const ok = answer.trim().toLowerCase() === current.word.toLowerCase(); setResult(ok ? "正确，英语力 +1" : `错误，正确答案是 ${current.word}`); setState((state) => ({ ...state, words: state.words.map((item) => item.id === current.id ? { ...item, familiarity: Math.max(0, Math.min(5, item.familiarity + (ok ? 1 : -1))), correctCount: item.correctCount + (ok ? 1 : 0), wrongCount: item.wrongCount + (ok ? 0 : 1) } : item) })); }
  return <div><Title icon={BookOpen} title="六级英语模块" /><div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h3 className="mb-4 text-lg font-semibold">今日词库</h3><div className="mb-4 grid gap-3 md:grid-cols-[150px_1fr_auto]"><Input value={word} onChange={(event) => setWord(event.target.value)} placeholder="sustain" /><Input value={meaning} onChange={(event) => setMeaning(event.target.value)} placeholder="维持；支撑" /><Button onClick={addWord}>添加</Button></div><div className="space-y-3">{words.map((item) => <div key={item.id} className="rounded-lg bg-gray-50 p-4"><b>{item.word}</b><p className="text-sm text-gray-500">{item.meaning}</p><Progress className="mt-3" value={item.familiarity * 20} /></div>)}</div></Card><Card className="p-5"><h3 className="mb-4 text-lg font-semibold">拼写试炼</h3>{current ? <><div className="rounded-lg bg-klein/10 p-5 text-xl font-semibold text-klein">{current.meaning}</div><Input className="mt-4" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="输入英文单词" /><div className="mt-4 flex gap-3"><Button onClick={check}>提交</Button><Button variant="secondary" onClick={() => { setIndex(index + 1); setAnswer(""); setResult(null); }}>下一题</Button></div>{result && <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">{result}</p>}<h4 className="mt-6 font-semibold">错词记录</h4>{words.filter((item) => item.wrongCount > 0).map((item) => <p key={item.id} className="mt-2 text-sm text-red-600">{item.word} · 错 {item.wrongCount} 次</p>)}</> : <p className="text-sm text-gray-500">请先添加单词。</p>}</Card></div></div>;
}

function Focus({ focusCount, setState }: { focusCount: number; setState: Dispatch<SetStateAction<AppState>> }) {
  const [seconds, setSeconds] = useState(25 * 60); const [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => { setSeconds((value) => { if (value <= 1) { setRunning(false); setState((state) => ({ ...state, focusCount: state.focusCount + 1 })); return 25 * 60; } return value - 1; }); }, 1000); return () => window.clearInterval(timer); }, [running, setState]);
  return <div><Title icon={Clock} title="番茄钟 / 专注修炼" /><Card className="mx-auto max-w-2xl p-8 text-center"><p className="text-sm text-gray-500">闭关模式 · 25 分钟</p><p className="mt-8 text-7xl font-semibold text-klein">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</p><div className="mt-8 flex justify-center gap-3"><Button onClick={() => setRunning(!running)}>{running ? "暂停" : "开始"}</Button><Button variant="secondary" onClick={() => { setRunning(false); setSeconds(25 * 60); }}>重置</Button></div><p className="mt-6 text-sm text-gray-500">今日已完成 {focusCount} 个番茄钟，共 {focusCount * 25} 分钟。</p></Card></div>;
}

function Review({ review, setState }: { review: DailyReview; setState: Dispatch<SetStateAction<AppState>> }) {
  function patch(next: Partial<DailyReview>) { setState((state) => ({ ...state, review: { ...state.review, ...next } })); }
  return <div><Title icon={CheckCircle2} title="每日复盘" /><Card className="grid gap-4 p-5"><Textarea value={review.done} onChange={(event) => patch({ done: event.target.value })} placeholder="今日完成了什么" /><Textarea value={review.undone} onChange={(event) => patch({ undone: event.target.value })} placeholder="今日没有完成什么" /><Textarea value={review.reason} onChange={(event) => patch({ reason: event.target.value })} placeholder="原因是什么" /><Textarea value={review.value} onChange={(event) => patch({ value: event.target.value })} placeholder="今天最有价值的一件事" /><Textarea value={review.mood} onChange={(event) => patch({ mood: event.target.value })} placeholder="今天的情绪状态" /><Textarea value={review.tomorrow} onChange={(event) => patch({ tomorrow: event.target.value })} placeholder="明天最重要的三件事" /><Button className="w-fit" onClick={() => patch({ savedAt: new Date().toISOString() })}>保存复盘</Button></Card></div>;
}

function Stats({ tasks, records, focusCount, review }: { tasks: Task[]; records: TaskRecord[]; focusCount: number; review: DailyReview }) {
  const completed = tasks.filter((task) => task.status === "已完成").length; const avg = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length) : 0; const categoryData = categories.map((name) => ({ name, value: tasks.filter((task) => task.category === name).length })).filter((item) => item.value); const weekly = ["一", "二", "三", "四", "五", "六", "日"].map((day, index) => ({ day, progress: Math.max(10, avg - (6 - index) * 6) })); const reviewed = Boolean(review.savedAt);
  return <div><Title icon={BarChart3} title="周 / 月统计" /><div className="mb-5 grid gap-4 md:grid-cols-4"><Stat title="本周完成数" value={`${completed}`} /><Stat title="平均完成率" value={`${avg}%`} /><Stat title="学习总时长" value={`${tasks.filter((task) => ["学习", "英语", "毕业论文"].includes(task.category)).reduce((sum, task) => sum + task.actualMinutes, 0)} 分`} /><Stat title="连续记录天数" value={`${new Set(records.map((record) => record.date)).size} 天`} /></div><div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h3 className="mb-4 font-semibold">最近 7 天趋势</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><XAxis dataKey="day" axisLine={false} tickLine={false} /><Tooltip /><Area dataKey="progress" stroke="#002FA7" fill="#002FA7" fillOpacity={0.12} /></AreaChart></ResponsiveContainer></div></Card><Card className="p-5"><h3 className="mb-4 font-semibold">分类占比</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>{categoryData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Card></div><Card className="mt-5 p-5"><h3 className="mb-4 flex items-center gap-2 font-semibold"><Award size={18} className="text-klein" />成就系统雏形</h3><div className="grid gap-3 md:grid-cols-3"><Achievement unlocked={completed > 0} title="完成第一个任务" /><Achievement unlocked={reviewed} title="完成一次复盘" /><Achievement unlocked={focusCount > 0} title="完成一个番茄钟" /></div></Card></div>;
}

function Achievement({ unlocked, title }: { unlocked: boolean; title: string }) {
  return <div className="rounded-lg bg-gray-50 p-4 text-sm"><span className={unlocked ? "text-klein" : "text-gray-400"}>{unlocked ? "已解锁" : "待解锁"}</span> · {title}</div>;
}

function Title({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return <div className="mb-5 flex items-center gap-2"><Icon size={21} className="text-klein" /><h2 className="text-2xl font-semibold tracking-tight">{title}</h2></div>;
}
