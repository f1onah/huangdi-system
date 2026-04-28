"use client";

import { useEffect, useState } from "react";
import type { Dispatch, ReactElement, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import { Award, BarChart3, BookOpen, Clock, Flame, LayoutDashboard, ListChecks, Moon, Plus, RotateCcw, Target, Trash2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdvancedEnglishModule } from "@/components/AdvancedEnglishModule";
import { Button, Card, Input, Progress, Select, Textarea } from "@/components/ui";
import { achievementSeed, categories } from "@/lib/data";
import { useAppState } from "@/lib/storage";
import type { Achievement, AppState, Category, DailyReview, FocusMode, FocusSession, Priority, Task, TaskStatus, Toast } from "@/lib/types";
import { addExp, categoryToAttribute, cn, percent, today, uid } from "@/lib/utils";

type Tab = "dashboard" | "tasks" | "english" | "focus" | "review" | "stats" | "achievements";

const nav: Array<{ key: Tab; href: string; label: string; sub: string; icon: LucideIcon }> = [
  { key: "dashboard", href: "/", label: "养心殿", sub: "全局态势", icon: LayoutDashboard },
  { key: "tasks", href: "/tasks", label: "勤政殿", sub: "今日事务", icon: ListChecks },
  { key: "english", href: "/english", label: "文渊阁", sub: "CET-6", icon: BookOpen },
  { key: "focus", href: "/focus", label: "静修室", sub: "番茄专注", icon: Clock },
  { key: "review", href: "/review", label: "省身殿", sub: "每日复盘", icon: Moon },
  { key: "stats", href: "/stats", label: "纪事司", sub: "成长数据", icon: BarChart3 },
  { key: "achievements", href: "/achievements", label: "功勋簿", sub: "成就记录", icon: Award },
];

const statusList: TaskStatus[] = ["未开始", "进行中", "已完成", "暂停"];
const statusCopy: Record<TaskStatus, string> = { 未开始: "待处理", 进行中: "处理中", 已完成: "已批", 暂停: "暂缓" };
const priorityList: Priority[] = ["高", "中", "低"];
const focusModes: Array<{ key: FocusMode; label: string; minutes: number }> = [
  { key: "focus", label: "25 分钟入静", minutes: 25 },
  { key: "shortBreak", label: "5 分钟调息", minutes: 5 },
  { key: "longBreak", label: "15 分钟归息", minutes: 15 },
];
const chartColors = ["#002FA7", "#00C896", "#F59E0B", "#7AA2FF", "#FF4D4F", "#94A3B8"];

function routeHref(href: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return href === "/" ? `${basePath || "/"}` : `${basePath}${href}/`;
}

export function HuangdiApp({ initialTab = "dashboard" }: { initialTab?: Tab }) {
  const { state, setState, ready, reset } = useAppState();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [toast, setToast] = useState<Toast | null>(null);

  const todayTasks = state.tasks.filter((task) => task.date === today());
  const completedTasks = todayTasks.filter((task) => task.status === "已完成").length;
  const overall = todayTasks.length ? Math.round(todayTasks.reduce((sum, task) => sum + task.progress, 0) / todayTasks.length) : 0;
  const focusToday = state.focusSessions.filter((session) => session.date === today() && session.completed);
  const reviewToday = state.reviews.find((review) => review.date === today());

  function notify(message: string, tone: Toast["tone"] = "success") {
    setToast({ id: uid("toast"), message, tone });
    window.setTimeout(() => setToast(null), 2200);
  }

  function patchState(patch: Partial<AppState>) {
    setState((current) => refreshAchievements({ ...current, ...patch }));
  }

  function updateTask(id: string, patch: Partial<Task>) {
    setState((current) => {
      const before = current.tasks.find((task) => task.id === id);
      const nextTasks = current.tasks.map((task) => (task.id === id ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task));
      const becameDone = before && before.status !== "已完成" && patch.status === "已完成";
      const attributes = becameDone ? addExp(current.attributes, categoryToAttribute(before.category), Math.max(5, Math.round(before.estimatedMinutes / 10) * 5)) : current.attributes;
      return refreshAchievements({ ...current, tasks: nextTasks, attributes });
    });
    if (patch.status === "已完成") notify("事务已批，属性经验已增长");
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-white/[0.08] bg-white/[0.04] p-6 shadow-[20px_0_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl lg:block">
        <div className="rounded-glass border border-white/[0.08] bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-klein">Huangdi</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">黄帝养成系统</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">以任务驱动行动，以反馈推动进阶。</p>
        </div>
        <nav className="mt-7 space-y-2">
          {nav.map((item) => (
            <a key={item.key} href={routeHref(item.href)} onClick={(event) => { event.preventDefault(); setTab(item.key); }} className={cn("group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-300", tab === item.key ? "border-klein/60 bg-klein/25 text-white shadow-[0_0_30px_rgba(0,47,167,0.35)]" : "border-transparent text-white/60 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white")}>
              <span className={cn("rounded-xl p-2 transition", tab === item.key ? "bg-klein text-white" : "bg-white/[0.06] text-white/55 group-hover:text-white")}><item.icon size={17} /></span>
              <span><span className="block font-medium">{item.label}</span><span className="block text-xs text-white/40">{item.sub}</span></span>
            </a>
          ))}
        </nav>
        <Button className="mt-8 w-full" variant="secondary" onClick={() => { reset(); notify("演示数据已重置"); }}><RotateCcw size={16} />重置演示数据</Button>
      </aside>

      <main className={cn("mx-auto max-w-[1440px] px-4 py-6 lg:ml-72 lg:px-8", !ready && "opacity-60")}>
        <div className="mb-6 rounded-glass border border-white/[0.08] bg-white/[0.05] p-3 shadow-lift backdrop-blur-2xl lg:hidden">
          <h1 className="mb-3 font-semibold text-white">黄帝养成系统</h1>
          <div className="flex gap-2 overflow-x-auto">{nav.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={cn("shrink-0 rounded-xl px-3 py-2 text-sm transition", tab === item.key ? "bg-klein text-white" : "bg-white/[0.06] text-white/60")}>{item.label}</button>)}</div>
        </div>
        {toast ? <div className="fixed right-4 top-4 z-50 rounded-2xl border border-white/[0.1] bg-[#0B0F1A]/90 px-5 py-4 text-sm text-white shadow-glow backdrop-blur-2xl">{toast.message}</div> : null}
        {tab === "dashboard" && <Dashboard state={state} overall={overall} completedTasks={completedTasks} focusToday={focusToday} reviewDone={Boolean(reviewToday)} setTab={setTab} />}
        {tab === "tasks" && <Tasks tasks={todayTasks} updateTask={updateTask} setState={setState} notify={notify} />}
        {tab === "english" && <AdvancedEnglishModule embedded />}
        {tab === "focus" && <Focus state={state} patchState={patchState} notify={notify} />}
        {tab === "review" && <Review reviews={state.reviews} patchState={patchState} notify={notify} />}
        {tab === "stats" && <Stats state={state} />}
        {tab === "achievements" && <Achievements achievements={state.achievements} />}
      </main>
    </div>
  );
}

function Dashboard({ state, overall, completedTasks, focusToday, reviewDone, setTab }: { state: AppState; overall: number; completedTasks: number; focusToday: FocusSession[]; reviewDone: boolean; setTab: (tab: Tab) => void }) {
  const todayTasks = state.tasks.filter((task) => task.date === today());
  const englishWords = state.words.filter((word) => word.date === today());
  const pending = todayTasks.filter((task) => task.status !== "已完成").length;
  const mastered = percent(englishWords.filter((word) => word.familiarity >= 3).length, englishWords.length);
  const expToday = completedTasks * 20 + focusToday.length * 10 + state.readings.filter((reading) => reading.date === today() && reading.completed).length * 15;
  const mood = overall < 35 ? "尚未进入修炼状态，建议先完成一项最小任务" : overall < 80 ? "进展稳定，可继续推进重点事务" : "今日修炼圆满，可适当收束";
  const weekly = last7().map((date, index) => ({ day: `D${index + 1}`, progress: date === today() ? overall : Math.max(20, overall - (6 - index) * 7), focus: date === today() ? focusToday.reduce((s, x) => s + x.durationMinutes, 0) : Math.max(0, index * 8) }));
  const categoryData = state.tasks.reduce<Array<{ name: Category; value: number }>>((list, task) => { const found = list.find((item) => item.name === task.category); if (found) found.value += 1; else list.push({ name: task.category, value: 1 }); return list; }, []);
  const recentAchievement = state.achievements.find((achievement) => achievement.unlocked);

  return <div className="animate-[fadeIn_0.5s_ease] space-y-6"><Title icon={LayoutDashboard} title="养心殿" sub="总览今日修炼、事务进度与成长反馈" /><section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(0,47,167,0.95),rgba(11,15,26,0.92)_58%,rgba(0,200,150,0.14))] p-8 text-white shadow-glow backdrop-blur-2xl"><div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]"><div><p className="text-sm text-white/60">{today()} · 当前状态：稳步进阶中</p><h2 className="mt-4 text-5xl font-semibold tracking-tight">黄帝 Lv. {Math.max(...state.attributes.map((a) => a.level))}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">今日修炼进度：{overall}% · 尚有 {pending} 项事务待处理。{mood}</p><Progress className="mt-8 bg-white/15 [&>div]:!bg-white" value={overall} /></div><div className="rounded-glass border border-white/[0.1] bg-white/[0.08] p-5 backdrop-blur-2xl"><p className="text-sm text-white/55">今日成长值</p><p className="mt-3 text-5xl font-semibold">+{expToday}</p><p className="mt-2 text-sm text-white/55">EXP</p></div></div></section><div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5"><Metric title="事务完成率" value={`${percent(completedTasks, todayTasks.length)}%`} /><Metric title="词库掌握率" value={`${mastered}%`} /><Metric title="番茄轮次" value={`${focusToday.length}`} /><Metric title="专注时长" value={`${focusToday.reduce((s, x) => s + x.durationMinutes, 0)} 分`} /><Metric title="最近功勋" value={recentAchievement?.title ?? "未达成"} /></div><AttributePanel attributes={state.attributes} /><div className="grid gap-6 xl:grid-cols-2"><ChartCard title="近期修炼曲线"><AreaChart data={weekly}><defs><linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#002FA7" stopOpacity={0.55} /><stop offset="95%" stopColor="#002FA7" stopOpacity={0.03} /></linearGradient></defs><XAxis dataKey="day" /><Tooltip /><Area type="monotone" dataKey="progress" stroke="#7AA2FF" strokeWidth={3} fill="url(#progressFill)" /></AreaChart></ChartCard><ChartCard title="事务分布"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92}>{categoryData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ChartCard></div><Card className="p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">今日重点事务</h3><Button variant="secondary" onClick={() => setTab("review")}>前往省身</Button></div><div className="grid gap-4 md:grid-cols-3">{todayTasks.length ? todayTasks.slice(0, 3).map((task) => <MiniTask key={task.id} task={task} />) : <Empty text="暂无事务。可新拟一项今日修炼。" />}</div></Card></div>;
}

function Tasks({ tasks, updateTask, setState, notify }: { tasks: Task[]; updateTask: (id: string, patch: Partial<Task>) => void; setState: Dispatch<SetStateAction<AppState>>; notify: (message: string) => void }) {
  const [draft, setDraft] = useState({ title: "", category: "学习" as Category, priority: "中" as Priority, estimatedMinutes: 45 });
  const [category, setCategory] = useState<Category | "全部">("全部");
  const filtered = tasks.filter((task) => category === "全部" || task.category === category).sort((a, b) => priorityList.indexOf(a.priority) - priorityList.indexOf(b.priority));
  function addTask() { if (!draft.title.trim()) return; const now = new Date().toISOString(); const task: Task = { id: uid("task"), title: draft.title.trim(), category: draft.category, priority: draft.priority, status: "未开始", estimatedMinutes: draft.estimatedMinutes, actualMinutes: 0, progress: 0, note: "", date: today(), createdAt: now, updatedAt: now }; setState((current) => ({ ...current, tasks: [task, ...current.tasks] })); setDraft({ title: "", category: "学习", priority: "中", estimatedMinutes: 45 }); notify("已新拟一项事务"); }
  function remove(id: string) { setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) })); notify("事务已作废"); }
  return <div className="space-y-6"><Title icon={Target} title="勤政殿" sub="处理今日事务，将行动转化为可见进度" /><Card className="p-5"><div className="grid gap-4 lg:grid-cols-[1fr_150px_120px_130px_150px_auto]"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="事务名称" /><Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>{priorityList.map((item) => <option key={item}>{item}</option>)}</Select><Input type="number" value={draft.estimatedMinutes} onChange={(e) => setDraft({ ...draft, estimatedMinutes: Number(e.target.value) })} /><Select value={category} onChange={(e) => setCategory(e.target.value as Category | "全部")}><option>全部</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select><Button onClick={addTask}><Plus size={16} />新拟事务</Button></div></Card><div className="grid gap-6 xl:grid-cols-4">{statusList.map((status) => <Card key={status} className="min-h-80 p-5"><div className="mb-5 flex items-center justify-between"><h3 className="font-semibold text-white">{statusCopy[status]}</h3><span className="rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-1 text-xs text-white/60">{filtered.filter((task) => task.status === status).length}</span></div><div className="space-y-4">{filtered.filter((task) => task.status === status).map((task) => <TaskCard key={task.id} task={task} updateTask={updateTask} remove={remove} />)}{filtered.filter((task) => task.status === status).length === 0 ? <Empty text="暂无事务" /> : null}</div></Card>)}</div></div>;
}

function TaskCard({ task, updateTask, remove }: { task: Task; updateTask: (id: string, patch: Partial<Task>) => void; remove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className={cn("rounded-glass border border-white/[0.08] bg-white/[0.045] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-klein/40 hover:shadow-glow", task.status === "已完成" && "opacity-70")}><button className="w-full text-left" onClick={() => setOpen(!open)}><div className="flex justify-between gap-3"><b className="text-white">{task.title}</b><span className="text-sm text-[#00C896]">{task.progress}%</span></div><p className="mt-2 text-xs text-white/50">{task.category} · {task.priority}优先 · {statusCopy[task.status]} · 预计 {task.estimatedMinutes} 分</p></button><Progress className="mt-4" value={task.progress} />{open ? <div className="mt-4 grid gap-3"><Input value={task.title} onChange={(e) => updateTask(task.id, { title: e.target.value })} /><Textarea value={task.note} onChange={(e) => updateTask(task.id, { note: e.target.value })} placeholder="事务备注" /><input className="accent-klein" type="range" min={0} max={100} step={5} value={task.progress} onChange={(e) => updateTask(task.id, { progress: Number(e.target.value) })} /><div className="grid grid-cols-2 gap-2">{statusList.map((next) => <Button key={next} variant={next === task.status ? "primary" : "secondary"} onClick={() => updateTask(task.id, { status: next, progress: next === "已完成" ? 100 : task.progress })}>{statusCopy[next]}</Button>)}</div><Button variant="danger" onClick={() => remove(task.id)}><Trash2 size={16} />作废</Button></div> : null}</div>;
}


function Focus({ state, patchState, notify }: { state: AppState; patchState: (patch: Partial<AppState>) => void; notify: (message: string) => void }) {
  const [mode, setMode] = useState<FocusMode>("focus");
  const minutes = focusModes.find((item) => item.key === mode)?.minutes ?? 25;
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState(state.tasks.find((task) => task.date === today())?.id ?? "");
  const [reflection, setReflection] = useState("");
  const [distraction, setDistraction] = useState("");
  useEffect(() => { setSeconds(minutes * 60); }, [minutes]);
  useEffect(() => { if (!running) return undefined; const timer = window.setInterval(() => setSeconds((value) => value <= 1 ? 0 : value - 1), 1000); return () => window.clearInterval(timer); }, [running]);
  useEffect(() => { if (seconds === 0 && running) finish(true); }, [seconds, running]);
  function finish(completed: boolean) { setRunning(false); const task = state.tasks.find((item) => item.id === taskId); const session: FocusSession = { id: uid("focus"), taskId: task?.id, taskTitle: task?.title, category: task?.category, mode, durationMinutes: minutes, completed, distractionNote: distraction, reflection, date: today(), startedAt: new Date(Date.now() - minutes * 60000).toISOString(), endedAt: new Date().toISOString() }; const attributes = completed && mode === "focus" ? addExp(state.attributes, categoryToAttribute(task?.category), Math.max(5, Math.round(minutes / 10) * 5)) : state.attributes; patchState({ focusSessions: [session, ...state.focusSessions], attributes, tasks: task ? state.tasks.map((item) => item.id === task.id ? { ...item, actualMinutes: item.actualMinutes + minutes, updatedAt: new Date().toISOString() } : item) : state.tasks }); setSeconds(minutes * 60); notify(completed ? `本轮修炼完成。专注时长：${minutes}分钟` : "本轮记录已保存"); }
  const progress = ((minutes * 60 - seconds) / (minutes * 60)) * 100;
  const todaySessions = state.focusSessions.filter((session) => session.date === today() && session.completed);
  return <div className="space-y-6"><Title icon={Clock} title="静修室" sub="入静、出定、记录专注，将执行力沉淀为经验" /><div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><Card className="p-7 text-center"><div className="mb-6 flex flex-wrap justify-center gap-2">{focusModes.map((item) => <Button key={item.key} variant={mode === item.key ? "primary" : "secondary"} onClick={() => setMode(item.key)}>{item.label}</Button>)}</div><p className="mb-4 text-sm text-white/55">当前状态：{running ? "专注中" : "待入静"} · 剩余时间：{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</p><div className="mx-auto flex h-72 w-72 items-center justify-center rounded-full shadow-[0_0_80px_rgba(0,47,167,0.28)]" style={{ background: `conic-gradient(#002FA7 ${progress * 3.6}deg,rgba(255,255,255,0.08) 0deg)` }}><div className="flex h-60 w-60 items-center justify-center rounded-full border border-white/[0.08] bg-[#0B0F1A] text-6xl font-semibold text-white">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div></div><Select className="mt-6" value={taskId} onChange={(e) => setTaskId(e.target.value)}><option value="">不绑定事务</option>{state.tasks.filter((task) => task.date === today()).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={() => setRunning(!running)}>{running ? "暂停" : "入静"}</Button><Button variant="secondary" onClick={() => setSeconds(minutes * 60)}>重新开始</Button><Button variant="secondary" onClick={() => finish(true)}>出定</Button></div></Card><Card className="p-7"><h3 className="text-lg font-semibold text-white">出定记录</h3><Textarea className="mt-4" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="本轮完成了什么？下一轮准备做什么？" /><Textarea className="mt-4" value={distraction} onChange={(e) => setDistraction(e.target.value)} placeholder="是否分心？原因是什么？" /><div className="mt-6 grid gap-4 md:grid-cols-3"><Metric title="今日入静" value={`${todaySessions.filter((s) => s.mode === "focus").length} 轮`} /><Metric title="专注时长" value={`${todaySessions.reduce((s, x) => s + x.durationMinutes, 0)} 分`} /><Metric title="累计修炼" value={`${state.focusSessions.filter((s) => s.completed).length} 轮`} /></div></Card></div></div>;
}

function Review({ reviews, patchState, notify }: { reviews: DailyReview[]; patchState: (patch: Partial<AppState>) => void; notify: (message: string) => void }) {
  const existing = reviews.find((item) => item.date === today());
  const [draft, setDraft] = useState<DailyReview>(existing ?? { id: uid("review"), date: today(), completed: "", unfinished: "", reason: "", mostValuable: "", mood: "", tomorrowTop3: ["", "", ""], energyLevel: 6, todaySentence: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  function save() { const next = { ...draft, updatedAt: new Date().toISOString() }; patchState({ reviews: [next, ...reviews.filter((item) => item.date !== today())] }); notify("今日省身已完成"); }
  return <div className="space-y-6"><Title icon={Moon} title="省身殿" sub="今日省身，记录反馈，优化明日行动" /><Card className="grid gap-4 p-7"><Textarea value={draft.completed} onChange={(e) => setDraft({ ...draft, completed: e.target.value })} placeholder="今日已完成之事" /><Textarea value={draft.unfinished} onChange={(e) => setDraft({ ...draft, unfinished: e.target.value })} placeholder="今日未尽之事" /><Textarea value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} placeholder="原因分析" /><Textarea value={draft.mostValuable} onChange={(e) => setDraft({ ...draft, mostValuable: e.target.value })} placeholder="今日最有价值之事" /><Textarea value={draft.mood} onChange={(e) => setDraft({ ...draft, mood: e.target.value })} placeholder="今日心境" /><div><p className="text-sm text-white/60">今日能量值：{draft.energyLevel}/10</p><input className="w-full accent-klein" type="range" min={1} max={10} value={draft.energyLevel} onChange={(e) => setDraft({ ...draft, energyLevel: Number(e.target.value) })} /></div>{draft.tomorrowTop3.map((item, index) => <Input key={index} value={item} onChange={(e) => { const top3 = [...draft.tomorrowTop3]; top3[index] = e.target.value; setDraft({ ...draft, tomorrowTop3: top3 }); }} placeholder={`明日三件要务 ${index + 1}`} />)}<Input value={draft.todaySentence} onChange={(e) => setDraft({ ...draft, todaySentence: e.target.value })} placeholder="今日一句" /><Button className="w-fit" onClick={save}>完成省身</Button></Card></div>;
}

function Stats({ state }: { state: AppState }) {
  const completed = state.tasks.filter((task) => task.status === "已完成").length;
  const avg = state.tasks.length ? Math.round(state.tasks.reduce((sum, task) => sum + task.progress, 0) / state.tasks.length) : 0;
  const spellingTotal = state.words.reduce((s, w) => s + w.correctCount + w.wrongCount, 0);
  const spellingCorrect = state.words.reduce((s, w) => s + w.correctCount, 0);
  const categoryData = categories.map((name) => ({ name, value: state.tasks.filter((task) => task.category === name).length })).filter((item) => item.value);
  const weekly = last7().map((date, index) => ({ day: `D${index + 1}`, progress: date === today() ? avg : Math.max(10, avg - (6 - index) * 5), focus: state.focusSessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.durationMinutes, 0) }));
  return <div className="space-y-6"><Title icon={BarChart3} title="纪事司" sub="近期修炼记录与成长趋势" /><div className="grid gap-4 md:grid-cols-4"><Metric title="本周完成事务" value={`${completed}`} /><Metric title="平均完成率" value={`${avg}%`} /><Metric title="词条总数" value={`${state.words.length}`} /><Metric title="拼写正确率" value={`${percent(spellingCorrect, spellingTotal)}%`} /><Metric title="错词记录" value={`${state.words.filter((w) => w.wrongCount > 0).length}`} /><Metric title="专注时长" value={`${state.focusSessions.reduce((s, x) => s + x.durationMinutes, 0)} 分`} /><Metric title="连续修炼天数" value={`${new Set(state.reviews.map((r) => r.date)).size} 天`} /><Metric title="阅读训练" value={`${state.readings.filter((r) => r.completed).length} 篇`} /></div><div className="grid gap-6 xl:grid-cols-2"><ChartCard title="近期修炼记录"><AreaChart data={weekly}><XAxis dataKey="day" /><Tooltip /><Area dataKey="progress" stroke="#7AA2FF" strokeWidth={3} fill="#002FA7" fillOpacity={0.15} /></AreaChart></ChartCard><ChartCard title="事务结构"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92}>{categoryData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ChartCard><ChartCard title="属性成长"><BarChart data={state.attributes.map((a) => ({ name: a.name, exp: a.level * 100 + a.exp }))}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="exp" fill="#002FA7" radius={[8, 8, 0, 0]} /></BarChart></ChartCard><ChartCard title="本周专注"><BarChart data={weekly}><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="focus" fill="#00C896" radius={[8, 8, 0, 0]} /></BarChart></ChartCard></div></div>;
}

function Achievements({ achievements }: { achievements: Achievement[] }) {
  return <div className="space-y-6"><Title icon={Award} title="功勋簿" sub="功勋记录，见证每一次进阶" /><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{achievements.map((achievement) => <Card key={achievement.id} className={cn("p-6", achievement.unlocked && "border-klein/40 bg-klein/10")}><div className="flex items-start gap-4"><div className={cn("rounded-2xl p-3", achievement.unlocked ? "bg-klein text-white shadow-[0_0_28px_rgba(0,47,167,0.45)]" : "bg-white/[0.06] text-white/35")}><Award size={22} /></div><div><h3 className="font-semibold text-white">{achievement.title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{achievement.description}</p><p className={cn("mt-4 text-xs", achievement.unlocked ? "text-[#00C896]" : "text-white/40")}>{achievement.unlocked ? `已获得「${achievement.title}」` : "未达成"}</p></div></div></Card>)}</div></div>;
}

function Tabs<T extends string>({ current, setCurrent, items }: { current: T; setCurrent: (value: T) => void; items: Array<[T, string]> }) { return <div className="flex flex-wrap gap-2">{items.map(([key, label]) => <Button key={key} variant={current === key ? "primary" : "secondary"} onClick={() => setCurrent(key)}>{label}</Button>)}</div>; }
function MiniTask({ task }: { task: Task }) { return <div className="rounded-glass border border-white/[0.08] bg-white/[0.045] p-4"><div className="flex justify-between gap-3"><b className="text-white">{task.title}</b><span className="text-sm text-[#00C896]">{task.progress}%</span></div><p className="mt-2 text-xs text-white/50">{task.category} · {task.priority} · {statusCopy[task.status]}</p><Progress className="mt-4" value={task.progress} /></div>; }
function AttributePanel({ attributes }: { attributes: AppState["attributes"] }) { return <Card className="p-6"><div className="mb-5 flex items-center gap-2"><Flame size={20} className="text-klein" /><h3 className="text-lg font-semibold text-white">六维属性</h3></div><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{attributes.map((attribute) => <div key={attribute.key}><div className="mb-2 flex justify-between text-sm"><b className="text-white">{attribute.name}</b><span className="text-white/50">Lv.{attribute.level} · 差 {attribute.nextLevelExp - attribute.exp} EXP</span></div><Progress value={(attribute.exp / attribute.nextLevelExp) * 100} /><p className="mt-2 text-xs text-white/35">当前 {attribute.exp}/{attribute.nextLevelExp} EXP</p></div>)}</div></Card>; }
function ChartCard({ title, children }: { title: string; children: ReactElement }) { return <Card className="p-6"><h3 className="mb-5 text-lg font-semibold text-white">{title}</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></Card>; }
function Metric({ title, value, dark = false }: { title: string; value: string; dark?: boolean }) { return <Card className={cn("p-5", dark && "border-white/[0.12] bg-white/[0.08] text-white")}><p className={cn("text-sm", dark ? "text-white/65" : "text-white/55")}>{title}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p></Card>; }
function Title({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub?: string }) { return <div className="flex flex-col gap-2"><div className="flex items-center gap-3"><span className="rounded-2xl border border-klein/35 bg-klein/20 p-3 text-white shadow-[0_0_24px_rgba(0,47,167,0.28)]"><Icon size={21} /></span><div><h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>{sub ? <p className="mt-1 text-sm text-white/55">{sub}</p> : null}</div></div></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-glass border border-dashed border-white/[0.12] bg-white/[0.035] p-8 text-center text-sm text-white/45">{text}</div>; }
function last7() { return Array.from({ length: 7 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - (6 - index)); return d.toISOString().slice(0, 10); }); }
function refreshAchievements(state: AppState): AppState { const todayFocus = state.focusSessions.filter((s) => s.date === today() && s.completed && s.mode === "focus").length; const completedCreative = state.tasks.filter((t) => t.status === "已完成" && t.category === "作品集").length; const readingsDone = state.readings.filter((r) => r.completed).length; const spellingCount = state.words.reduce((sum, w) => sum + w.correctCount + w.wrongCount, 0); const unlock = (achievement: Achievement) => { const conditions: Record<string, boolean> = { streak: new Set([...state.reviews.map((r) => r.date), ...state.focusSessions.map((s) => s.date)]).size >= 3, review_streak: state.reviews.length >= 7, word_count: state.words.length >= 100, spelling_count: spellingCount >= 50, reading_count: readingsDone >= 5, focus_day: todayFocus >= 4, focus_total: state.focusSessions.filter((s) => s.completed && s.mode === "focus").length >= 30, paper_streak: state.tasks.filter((t) => t.category === "毕业论文" && t.progress > 0).length >= 5, creative_count: completedCreative >= 10, progress_streak: state.tasks.length > 0 && state.tasks.reduce((sum, t) => sum + t.progress, 0) / state.tasks.length >= 80 }; const shouldUnlock = conditions[achievement.conditionType] ?? achievement.unlocked; return shouldUnlock && !achievement.unlocked ? { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() } : { ...achievement, unlocked: achievement.unlocked || shouldUnlock }; }; return { ...state, achievements: (state.achievements.length ? state.achievements : achievementSeed).map(unlock) }; }
