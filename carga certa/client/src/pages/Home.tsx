import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Flame,
  Gauge,
  History,
  ImagePlus,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

type Tab = "dashboard" | "history" | "exercises" | "settings";

type Exercise = {
  id: string;
  name: string;
  group: string;
  color: string;
};

type TrainingLog = {
  id: string;
  exerciseId: string;
  date: string;
  weight: number;
  reps: number;
  sets: number;
  note: string;
};

type Profile = {
  name: string;
  goal: string;
  avatar: string;
};

type AppState = {
  exercises: Exercise[];
  logs: TrainingLog[];
  profile: Profile;
  lightMode: boolean;
};

const STORAGE_KEY = "carga-certa-v1";

const defaultExercises: Exercise[] = [
  { id: "supino", name: "Supino reto", group: "Peito", color: "coral" },
  { id: "agachamento", name: "Agachamento livre", group: "Pernas", color: "lime" },
  { id: "remada", name: "Remada curvada", group: "Costas", color: "blue" },
  { id: "desenvolvimento", name: "Desenvolvimento", group: "Ombros", color: "violet" },
  { id: "legpress", name: "Leg press 45°", group: "Pernas", color: "amber" },
  { id: "rosca", name: "Rosca direta", group: "Braços", color: "pink" },
];

const emptyState: AppState = {
  exercises: defaultExercises,
  logs: [],
  profile: { name: "Atleta", goal: "Consistência acima de tudo", avatar: "" },
  lightMode: false,
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState;
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      exercises: parsed.exercises?.length ? parsed.exercises : defaultExercises,
      logs: parsed.logs ?? [],
      profile: { ...emptyState.profile, ...parsed.profile },
      lightMode: parsed.lightMode ?? false,
    };
  } catch {
    return emptyState;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(" de ", " ");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CC";
}

function AppAvatar({ profile, small = false }: { profile: Profile; small?: boolean }) {
  return profile.avatar ? (
    <img className={`avatar-image ${small ? "avatar-small" : ""}`} src={profile.avatar} alt={`Foto de ${profile.name}`} />
  ) : (
    <div className={`avatar ${small ? "avatar-small" : ""}`} aria-label={`Perfil de ${profile.name}`}>
      {initials(profile.name)}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Activity; label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={2.3} /></div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
      {action && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={15} /></button>}
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("supino");
  const [logForm, setLogForm] = useState({ weight: "20", reps: "10", sets: "3", note: "" });
  const [newExercise, setNewExercise] = useState({ name: "", group: "Peito" });
  const [historyFilter, setHistoryFilter] = useState("todos");
  const [profileDraft, setProfileDraft] = useState(state.profile);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.classList.toggle("light", state.lightMode);
  }, [state]);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2600);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const exerciseMap = useMemo(() => new Map(state.exercises.map((exercise) => [exercise.id, exercise])), [state.exercises]);
  const todayLogs = state.logs.filter((log) => log.date === todayIso());
  const totalVolume = state.logs.reduce((sum, log) => sum + log.weight * log.reps * log.sets, 0);
  const bestLoad = state.logs.length ? Math.max(...state.logs.map((log) => log.weight)) : 0;
  const trainedDays = new Set(state.logs.map((log) => log.date)).size;
  const lastLogs = [...state.logs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const latestByExercise = state.exercises
    .map((exercise) => ({ exercise, log: lastLogs.find((item) => item.exerciseId === exercise.id) }))
    .filter((item) => item.log);
  const filteredLogs = historyFilter === "todos" ? lastLogs : lastLogs.filter((log) => log.exerciseId === historyFilter);

  const showToast = (message: string) => setToast(message);

  function addLog() {
    const weight = Number(logForm.weight);
    const reps = Number(logForm.reps);
    const sets = Number(logForm.sets);
    if (!selectedExercise || !weight || !reps || !sets) {
      showToast("Preencha carga, repetições e séries.");
      return;
    }
    setState((current) => ({
      ...current,
      logs: [...current.logs, { id: makeId("log"), exerciseId: selectedExercise, date: todayIso(), weight, reps, sets, note: logForm.note }],
    }));
    setShowLogModal(false);
    setLogForm({ weight: "20", reps: "10", sets: "3", note: "" });
    showToast("Treino salvo no seu aparelho.");
  }

  function addExercise() {
    if (!newExercise.name.trim()) {
      showToast("Digite o nome do exercício.");
      return;
    }
    const exercise = { id: makeId("exercise"), name: newExercise.name.trim(), group: newExercise.group, color: "lime" };
    setState((current) => ({ ...current, exercises: [...current.exercises, exercise] }));
    setSelectedExercise(exercise.id);
    setNewExercise({ name: "", group: "Peito" });
    setShowExerciseModal(false);
    showToast("Exercício adicionado.");
  }

  function deleteLog(id: string) {
    setState((current) => ({ ...current, logs: current.logs.filter((log) => log.id !== id) }));
    showToast("Registro removido.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `carga-certa-backup-${todayIso()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado com sucesso.");
  }

  function importBackup(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as AppState;
        if (!imported.exercises || !imported.logs || !imported.profile) throw new Error("invalid");
        setState(imported);
        setProfileDraft(imported.profile);
        showToast("Backup restaurado.");
      } catch {
        showToast("Esse arquivo não parece ser um backup válido.");
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!window.confirm("Apagar todos os treinos e voltar ao início?")) return;
    setState(emptyState);
    setProfileDraft(emptyState.profile);
    showToast("Dados apagados deste aparelho.");
  }

  function saveProfile() {
    setState((current) => ({ ...current, profile: profileDraft }));
    showToast("Perfil atualizado.");
  }

  function onAvatarChange(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileDraft((current) => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
    { id: "history", label: "Histórico", icon: History },
    { id: "exercises", label: "Exercícios", icon: Dumbbell },
    { id: "settings", label: "Ajustes", icon: Settings2 },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-row"><div className="brand-mark"><Dumbbell size={19} /></div><span>CARGA<span className="brand-accent">CERTA</span></span><button className="icon-button mobile-close" onClick={() => setMobileMenu(false)}><X size={19} /></button></div>
        <div className="profile-mini"><AppAvatar profile={state.profile} small /><div><strong>{state.profile.name}</strong><span>{state.profile.goal}</span></div><button className="icon-button" onClick={() => setActiveTab("settings")} aria-label="Editar perfil"><MoreHorizontal size={18} /></button></div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <span className="nav-label">MENU PRINCIPAL</span>
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeTab === id ? "active" : ""}`} onClick={() => { setActiveTab(id); setMobileMenu(false); }}><Icon size={18} /><span>{label}</span>{id === "history" && state.logs.length > 0 && <em>{state.logs.length}</em>}</button>)}
        </nav>
        <div className="sidebar-note"><div className="note-icon"><Sparkles size={17} /></div><strong>Treine no seu ritmo.</strong><span>O importante é continuar aparecendo.</span></div>
        <div className="sidebar-footer"><button className="nav-item" onClick={() => setActiveTab("settings")}><CircleHelp size={18} /><span>Como funciona</span></button><span className="version">Carga Certa · v1.0</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)}><Menu size={21} /></button><div className="mobile-brand"><div className="brand-mark"><Dumbbell size={17} /></div><strong>CARGA<span className="brand-accent">CERTA</span></strong></div><div className="topbar-right"><button className="icon-button" onClick={() => setState((current) => ({ ...current, lightMode: !current.lightMode }))} aria-label="Alternar tema">{state.lightMode ? <Moon size={19} /> : <Sun size={19} />}</button><div className="topbar-divider" /><button className="profile-trigger" onClick={() => setActiveTab("settings")}><AppAvatar profile={state.profile} small /><span>{state.profile.name}</span><ChevronRight size={15} /></button></div></header>

        <div className="page-container">
          {activeTab === "dashboard" && <Dashboard state={state} todayLogs={todayLogs} latestByExercise={latestByExercise} totalVolume={totalVolume} bestLoad={bestLoad} trainedDays={trainedDays} onLog={() => setShowLogModal(true)} onNavigate={setActiveTab} onDelete={deleteLog} exerciseMap={exerciseMap} />}
          {activeTab === "history" && <HistoryPage state={state} logs={filteredLogs} filter={historyFilter} setFilter={setHistoryFilter} onDelete={deleteLog} exerciseMap={exerciseMap} />}
          {activeTab === "exercises" && <ExercisesPage state={state} onAdd={() => setShowExerciseModal(true)} onLog={(id) => { setSelectedExercise(id); setShowLogModal(true); }} />}
          {activeTab === "settings" && <SettingsPage state={state} draft={profileDraft} setDraft={setProfileDraft} onSave={saveProfile} onAvatar={onAvatarChange} onExport={exportBackup} onImport={() => importRef.current?.click()} onReset={resetData} onToggleTheme={() => setState((current) => ({ ...current, lightMode: !current.lightMode }))} />}
        </div>
      </main>

      <nav className="mobile-nav">{navItems.slice(0, 3).map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}><Icon size={19} /><span>{label === "Visão geral" ? "Início" : label}</span></button>)}<button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}><Settings2 size={19} /><span>Ajustes</span></button></nav>

      <input ref={importRef} className="hidden-input" type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} />
      {toast && <div className="toast"><div className="toast-check"><Check size={15} /></div>{toast}</div>}
      {showLogModal && <LogModal exercises={state.exercises} selected={selectedExercise} setSelected={setSelectedExercise} form={logForm} setForm={setLogForm} onClose={() => setShowLogModal(false)} onSave={addLog} onNewExercise={() => { setShowLogModal(false); setShowExerciseModal(true); }} />}
      {showExerciseModal && <ExerciseModal form={newExercise} setForm={setNewExercise} onClose={() => setShowExerciseModal(false)} onSave={addExercise} />}
    </div>
  );
}

function Dashboard({ state, todayLogs, latestByExercise, totalVolume, bestLoad, trainedDays, onLog, onNavigate, onDelete, exerciseMap }: { state: AppState; todayLogs: TrainingLog[]; latestByExercise: { exercise: Exercise; log?: TrainingLog }[]; totalVolume: number; bestLoad: number; trainedDays: number; onLog: () => void; onNavigate: (tab: Tab) => void; onDelete: (id: string) => void; exerciseMap: Map<string, Exercise> }) {
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const recent = [...state.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return <>
    <div className="welcome-row"><div><span className="eyebrow">{todayLabel}</span><h1>{greeting}, <span>{state.profile.name.split(" ")[0]}.</span></h1><p>Pronto para superar o treino anterior?</p></div><button className="primary-button" onClick={onLog}><Plus size={18} /> Registrar treino</button></div>
    <div className="stats-grid"><StatCard icon={Flame} label="Sequência atual" value={`${trainedDays} ${trainedDays === 1 ? "dia" : "dias"}`} detail="dias de treino registrados" tone="orange" /><StatCard icon={BarChart3} label="Volume total" value={`${totalVolume.toLocaleString("pt-BR")} kg`} detail="carga × reps × séries" tone="blue" /><StatCard icon={Trophy} label="Maior carga" value={`${bestLoad || 0} kg`} detail={bestLoad ? "melhor marca registrada" : "ainda sem registros"} tone="violet" /><StatCard icon={Target} label="Meta da semana" value={`${Math.min(trainedDays, 4)}/4`} detail="treinos concluídos" tone="lime" /></div>
    <div className="dashboard-grid"><section className="today-card"><div className="card-head"><div><span className="eyebrow">SEU PRÓXIMO PASSO</span><h2>Registrar e evoluir</h2></div><div className="today-status"><span className="status-dot" /> {todayLogs.length ? `${todayLogs.length} registro${todayLogs.length > 1 ? "s" : ""} hoje` : "Nenhum registro hoje"}</div></div><div className="workout-hero"><div className="hero-glow" /><div className="hero-copy"><span className="hero-kicker"><Dumbbell size={14} /> TREINO LIVRE</span><h3>Seu treino começa<br />com o primeiro registro.</h3><p>Escolha um exercício, anote sua carga e acompanhe a evolução sem complicação.</p><button className="secondary-button" onClick={onLog}>Começar agora <ArrowUpFromLine size={16} /></button></div><div className="hero-illustration"><div className="ring ring-one" /><div className="ring ring-two" /><Dumbbell size={92} strokeWidth={1.1} /></div></div><div className="quick-list"><div className="list-head"><span>Últimas cargas por exercício</span><button className="text-button" onClick={() => onNavigate("exercises")}>Ver exercícios <ChevronRight size={15} /></button></div>{latestByExercise.length ? latestByExercise.slice(0, 4).map(({ exercise, log }) => log && <div className="exercise-row" key={exercise.id}><div className={`exercise-dot ${exercise.color}`}><Dumbbell size={15} /></div><div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.group} · {formatDate(log.date)}</span></div><div className="exercise-result"><strong>{log.weight} kg</strong><span>{log.sets} × {log.reps}</span></div><button className="icon-button danger-hover" onClick={() => onDelete(log.id)} aria-label={`Apagar registro de ${exercise.name}`}><Trash2 size={16} /></button></div>) : <div className="empty-inline"><Gauge size={18} /><span>Seu histórico vai aparecer aqui depois do primeiro treino.</span></div>}</div></section><aside className="side-column"><section className="insight-card"><div className="insight-top"><div className="mini-icon"><Activity size={17} /></div><span>VISÃO RÁPIDA</span><MoreHorizontal size={17} /></div><h3>{state.logs.length ? "Você está construindo ritmo." : "Seu progresso começa hoje."}</h3><p>{state.logs.length ? "Cada registro deixa seu próximo treino mais inteligente." : "Registre uma carga para transformar esforço em evolução visível."}</p><div className="progress-line"><span style={{ width: `${Math.min(100, (trainedDays / 4) * 100)}%` }} /></div><small>{Math.min(trainedDays, 4)} de 4 treinos na meta semanal</small></section><section className="recent-card"><SectionTitle eyebrow="ATIVIDADE" title="Últimos registros" action="Ver tudo" onAction={() => onNavigate("history")} />{recent.length ? recent.map((log) => { const exercise = exerciseMap.get(log.exerciseId); return <div className="recent-item" key={log.id}><div className={`recent-date ${exercise?.color || "lime"}`}><span>{new Date(`${log.date}T12:00:00`).getDate()}</span><small>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${log.date}T12:00:00`)).replace(".", "")}</small></div><div><strong>{exercise?.name || "Exercício"}</strong><span>{log.weight} kg · {log.sets} séries de {log.reps}</span></div><ChevronRight size={15} /></div> }) : <div className="empty-side"><CalendarDays size={21} /><span>Sem atividade recente</span></div>}</section></aside></div>
  </>;
}

function HistoryPage({ state, logs, filter, setFilter, onDelete, exerciseMap }: { state: AppState; logs: TrainingLog[]; filter: string; setFilter: (value: string) => void; onDelete: (id: string) => void; exerciseMap: Map<string, Exercise> }) {
  return <div className="subpage"><div className="subpage-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h1>Histórico</h1><p>Veja tudo que você já colocou no treino.</p></div><div className="history-total"><strong>{state.logs.length}</strong><span>registros salvos</span></div></div><div className="filter-row"><button className={filter === "todos" ? "filter active" : "filter"} onClick={() => setFilter("todos")}>Todos</button>{state.exercises.map((exercise) => <button className={filter === exercise.id ? "filter active" : "filter"} onClick={() => setFilter(exercise.id)} key={exercise.id}>{exercise.name}</button>)}</div><div className="history-table"><div className="table-head"><span>EXERCÍCIO</span><span>DATA</span><span>DESEMPENHO</span><span>VOLUME</span><span /></div>{logs.length ? logs.map((log) => { const exercise = exerciseMap.get(log.exerciseId); return <div className="table-row" key={log.id}><div className="table-exercise"><div className={`exercise-dot ${exercise?.color || "lime"}`}><Dumbbell size={15} /></div><div><strong>{exercise?.name || "Exercício removido"}</strong><span>{exercise?.group || ""}</span></div></div><span>{formatDate(log.date)}</span><strong>{log.weight} kg <small>× {log.reps} reps</small></strong><span>{(log.weight * log.reps * log.sets).toLocaleString("pt-BR")} kg</span><button className="icon-button danger-hover" onClick={() => onDelete(log.id)} aria-label="Excluir registro"><Trash2 size={16} /></button></div> }) : <div className="empty-state"><History size={30} /><h3>Nenhum registro encontrado</h3><p>Comece anotando uma carga no seu próximo treino.</p></div>}</div></div>;
}

function ExercisesPage({ state, onAdd, onLog }: { state: AppState; onAdd: () => void; onLog: (id: string) => void }) {
  return <div className="subpage"><div className="subpage-heading"><div><span className="eyebrow">BIBLIOTECA</span><h1>Exercícios</h1><p>Seus movimentos favoritos, sempre à mão.</p></div><button className="primary-button" onClick={onAdd}><Plus size={18} /> Novo exercício</button></div><div className="exercise-grid">{state.exercises.map((exercise) => <div className="exercise-card" key={exercise.id}><div className={`exercise-card-icon ${exercise.color}`}><Dumbbell size={22} /></div><span className="exercise-group">{exercise.group}</span><h3>{exercise.name}</h3><p>{state.logs.filter((log) => log.exerciseId === exercise.id).length ? `${state.logs.filter((log) => log.exerciseId === exercise.id).length} registros salvos` : "Ainda sem registros"}</p><button className="card-action" onClick={() => onLog(exercise.id)}>Registrar carga <ChevronRight size={15} /></button></div>)}<button className="exercise-card add-card" onClick={onAdd}><div className="add-circle"><Plus size={22} /></div><h3>Adicionar exercício</h3><p>Crie seu próprio movimento</p></button></div></div>;
}

function SettingsPage({ state, draft, setDraft, onSave, onAvatar, onExport, onImport, onReset, onToggleTheme }: { state: AppState; draft: Profile; setDraft: Dispatch<SetStateAction<Profile>>; onSave: () => void; onAvatar: (file?: File) => void; onExport: () => void; onImport: () => void; onReset: () => void; onToggleTheme: () => void }) {
  const avatarInput = useRef<HTMLInputElement>(null);
  return <div className="subpage settings-page"><div className="subpage-heading"><div><span className="eyebrow">PERSONALIZAÇÃO</span><h1>Ajustes</h1><p>Deixe o Carga Certa com a sua cara.</p></div></div><div className="settings-grid"><section className="settings-card profile-settings"><div className="settings-card-heading"><div><h2>Seu perfil</h2><p>Essas informações ficam salvas somente neste aparelho.</p></div><UserRound size={20} /></div><div className="profile-editor"><button className="avatar-upload" onClick={() => avatarInput.current?.click()}><AppAvatar profile={draft} /><span><ImagePlus size={17} /></span></button><input ref={avatarInput} className="hidden-input" type="file" accept="image/*" onChange={(event) => onAvatar(event.target.files?.[0])} /><div><strong>{draft.name || "Seu nome"}</strong><p>Toque na foto para trocar seu avatar.</p></div></div><label>Como quer ser chamado<input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Digite seu nome" /></label><label>Frase de treino<input value={draft.goal} onChange={(event) => setDraft((current) => ({ ...current, goal: event.target.value }))} placeholder="Ex.: Foco no processo" /></label><button className="primary-button save-button" onClick={onSave}><Check size={17} /> Salvar alterações</button></section><section className="settings-card"><div className="settings-card-heading"><div><h2>Aparência</h2><p>Escolha o jeito mais confortável de usar.</p></div><Sun size={20} /></div><button className="setting-row" onClick={onToggleTheme}><div className="setting-icon">{state.lightMode ? <Moon size={18} /> : <Sun size={18} />}</div><div><strong>{state.lightMode ? "Modo escuro" : "Modo claro"}</strong><span>{state.lightMode ? "Voltar para o tema noturno" : "Mais confortável para ambientes claros"}</span></div><div className={`toggle ${state.lightMode ? "on" : ""}`}><span /></div></button></section><section className="settings-card"><div className="settings-card-heading"><div><h2>Seus dados</h2><p>Sem nuvem, sem login: você tem o controle.</p></div><ArrowDownToLine size={20} /></div><div className="data-actions"><button className="outline-button" onClick={onExport}><ArrowDownToLine size={17} /> Exportar backup</button><button className="outline-button" onClick={onImport}><ArrowUpFromLine size={17} /> Importar backup</button></div><div className="privacy-callout"><Sparkles size={17} /><span>O Carga Certa não envia seus registros para nenhum servidor. Faça backups regularmente se trocar de aparelho.</span></div><button className="reset-button" onClick={onReset}><RotateCcw size={16} /> Apagar dados deste aparelho</button></section></div></div>;
}

function LogModal({ exercises, selected, setSelected, form, setForm, onClose, onSave, onNewExercise }: { exercises: Exercise[]; selected: string; setSelected: (value: string) => void; form: { weight: string; reps: string; sets: string; note: string }; setForm: Dispatch<SetStateAction<{ weight: string; reps: string; sets: string; note: string }>>; onClose: () => void; onSave: () => void; onNewExercise: () => void }) {
  const exercise = exercises.find((item) => item.id === selected);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card"><div className="modal-heading"><div><span className="eyebrow">NOVO REGISTRO</span><h2>Como foi o treino?</h2><p>Anote enquanto ainda está fresco na memória.</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><label>Exercício<select value={selected} onChange={(event) => setSelected(event.target.value)}>{exercises.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.group}</option>)}</select></label><button className="modal-add-exercise" onClick={onNewExercise}><Plus size={15} /> Criar novo exercício</button><div className="form-grid"><label>Carga (kg)<input autoFocus type="number" min="0" step="0.5" value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} /></label><label>Repetições<input type="number" min="1" value={form.reps} onChange={(event) => setForm((current) => ({ ...current, reps: event.target.value }))} /></label><label>Séries<input type="number" min="1" value={form.sets} onChange={(event) => setForm((current) => ({ ...current, sets: event.target.value }))} /></label></div><label>Observação <span className="optional">opcional</span><textarea rows={3} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ex.: última série foi até a falha" /></label><div className="modal-preview"><div className={`exercise-dot ${exercise?.color || "lime"}`}><Dumbbell size={15} /></div><span>{exercise?.name || "Exercício"}</span><strong>{form.sets || 0} × {form.reps || 0} · {form.weight || 0} kg</strong></div><div className="modal-actions"><button className="outline-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}><Check size={17} /> Salvar registro</button></div></div></div>;
}

function ExerciseModal({ form, setForm, onClose, onSave }: { form: { name: string; group: string }; setForm: Dispatch<SetStateAction<{ name: string; group: string }>>; onClose: () => void; onSave: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-card small-modal"><div className="modal-heading"><div><span className="eyebrow">BIBLIOTECA</span><h2>Novo exercício</h2><p>Adicione um movimento à sua lista.</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><label>Nome do exercício<input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Puxada alta" /></label><label>Grupo muscular<select value={form.group} onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))}><option>Peito</option><option>Costas</option><option>Pernas</option><option>Ombros</option><option>Braços</option><option>Core</option><option>Cardio</option><option>Outro</option></select></label><div className="modal-actions"><button className="outline-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}><Plus size={17} /> Adicionar</button></div></div></div>;
}
