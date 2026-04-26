"use client";

/* ============================================================
   CHAMBARI ACADEMY — Complete Single-Page Application
   ============================================================ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ── shadcn/ui Components ──────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

// ── Lucide Icons ──────────────────────────────────────────────
import {
  GraduationCap, BookOpen, Users, Sparkles, BarChart3, Camera,
  Video, Book, Home, Plus, Trash2, Edit, LogOut,
  Menu, Search, X, ChevronLeft, ChevronRight, ChevronDown,
  Upload, CheckCircle, Circle, Play, Eye, EyeOff, Download, RefreshCw,
  Globe, Mic, Volume2, FileText, PenTool, ArrowLeft, Loader2,
  Star, Award, Clock, Target, Zap, Shield, Save,
  Brain, Heart, Lightbulb, Library, Settings,
  Languages, MessageCircle, Map, BookMarked, Headphones,
  ClipboardList, Trophy, Flame, Gem, Palette,
  Lock, Unlock, MonitorPlay, Music, Bot, Send, Youtube
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  name: string;
  role: "TEACHER" | "STUDENT";
  avatar?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  teacherId: string;
  status: string;
  lessons?: Lesson[];
  createdAt: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  teacherId: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  videoUrls?: string;
  documentUrl?: string;
  documentName?: string;
  documentUrls?: string;
  orderIndex: number;
  status: string;
  exercises?: Exercise[];
  createdAt: string;
}

interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  question: string;
  options?: string;
  correctAnswer: string;
  explanation?: string;
  orderIndex: number;
}

interface StudentAccess {
  id: string;
  studentId: string;
  lessonId: string;
  accessFrom?: string;
  accessUntil?: string;
  active: boolean;
  student?: User;
  lesson?: Lesson;
}

interface StudentProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  lesson?: Lesson;
  student?: User;
}

interface Screenshot {
  id: string;
  studentId: string;
  lessonId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  student?: User;
  lesson?: Lesson;
}

interface PhoneticEntry {
  id: string;
  word: string;
  ipa: string;
  phoneticSpelling?: string;
  audioUrl?: string;
  example?: string;
  translation?: string;
}

// ── API Helper ────────────────────────────────────────────────
const TOKEN_KEY = "chambari_token";
const USER_KEY = "chambari_user";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error de servidor" }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

function apiUpload(path: string, formData: FormData): Promise<{ url: string }> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(path, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData }).then(async r => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Error de conexión" }));
      throw new Error(err.error || `Error al subir archivo (${r.status})`);
    }
    return r.json();
  });
}

// ── View Type ─────────────────────────────────────────────────
type View = "landing" | "login" | "register" | "teacher" | "student";
type TeacherView = "dashboard" | "modules" | "lesson-editor" | "students" | "exercises" | "progress" | "screenshots" | "dictionary" | "classroom";
type StudentView = "dashboard" | "lesson" | "exercises" | "dictionary" | "progress";

// ── Page Component ────────────────────────────────────────────
export default function ChambariAcademy() {
  // App state
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [teacherView, setTeacherView] = useState<TeacherView>("dashboard");
  const [studentView, setStudentView] = useState<StudentView>("dashboard");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [allAccessGrants, setAllAccessGrants] = useState<StudentAccess[]>([]);
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [phoneticEntries, setPhoneticEntries] = useState<PhoneticEntry[]>([]);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});

  // ── Initialize / Auth ─────────────────────────────────────
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView(parsed.role === "TEACHER" ? "teacher" : "student");
    }
    setLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Data Fetchers ─────────────────────────────────────────
  const fetchModules = useCallback(async () => {
    try {
      const data = await api<Module[]>("/api/modules");
      setModules(data);
    } catch { toast.error("Error al cargar módulos"); }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await api<User[]>("/api/students");
      setStudents(data);
    } catch { toast.error("Error al cargar estudiantes"); }
  }, []);

  const fetchAccessGrants = useCallback(async () => {
    try {
      const data = await api<StudentAccess[]>("/api/access");
      setAllAccessGrants(data);
    } catch { /* silent */ }
  }, []);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    try {
      const params = user.role === "TEACHER" ? "" : `?studentId=${user.id}`;
      const data = await api<StudentProgress[]>(`/api/progress${params}`);
      setProgressData(data);
    } catch { toast.error("Error al cargar progreso"); }
  }, [user]);

  const fetchScreenshots = useCallback(async () => {
    if (!user) return;
    try {
      const params = user.role === "STUDENT" ? `?studentId=${user.id}` : "";
      const data = await api<Screenshot[]>(`/api/screenshots${params}`);
      setScreenshots(data);
    } catch { toast.error("Error al cargar capturas"); }
  }, [user]);

  const fetchPhonetic = useCallback(async (query?: string) => {
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const data = await api<PhoneticEntry[]>(`/api/phonetic${params}`);
      setPhoneticEntries(data);
    } catch { setPhoneticEntries([]); }
  }, []);

  const fetchExercises = useCallback(async (lessonId: string) => {
    try {
      const data = await api<Exercise[]>(`/api/exercises/${lessonId}`);
      setCurrentExercises(data);
    } catch { setCurrentExercises([]); }
  }, []);

  // Load data based on view
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (view === "teacher") {
      fetchModules();
      fetchStudents();
      fetchProgress();
      fetchPhonetic();
      fetchScreenshots();
      fetchAccessGrants();
    }
    if (view === "student" && user) {
      fetchModules();
      fetchProgress();
      fetchPhonetic();
    }
  }, [view, user, fetchModules, fetchStudents, fetchProgress, fetchPhonetic, fetchScreenshots]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Auth Handlers ─────────────────────────────────────────
  const handleLogin = async (email: string, password: string, isTeacher: boolean) => {
    try {
      const data = await api<{ user: User; token: string }>("/api/auth/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      });
      const u = data.user;
      if (isTeacher && u.role !== "TEACHER") { toast.error("Esta cuenta no es de profesor"); return; }
      if (!isTeacher && u.role !== "STUDENT") { toast.error("Esta cuenta no es de estudiante"); return; }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
      setView(u.role === "TEACHER" ? "teacher" : "student");
      toast.success(`¡Bienvenido, ${u.name}!`);
    } catch (e: any) { toast.error(e.message || "Error al iniciar sesión"); }
  };

  const handleRegister = async (name: string, email: string, password: string, role: string) => {
    try {
      const data = await api<{ user: User; token: string }>("/api/auth/register", {
        method: "POST", body: JSON.stringify({ name, email, password, role }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setView(data.user.role === "TEACHER" ? "teacher" : "student");
      toast.success("¡Cuenta creada exitosamente!");
    } catch (e: any) { toast.error(e.message || "Error al registrar"); }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setView("landing");
    setTeacherView("dashboard");
    setStudentView("dashboard");
    setSelectedModule(null);
    setSelectedLesson(null);
    toast.success("Sesión cerrada");
  };

  // ── Screenshot capture (student) ──────────────────────────
  const captureScreenshot = useCallback((): Promise<{ blob: Blob; url: string } | null> => {
    const contentEl = document.getElementById("lesson-content-area");
    if (!contentEl) { toast.error("No hay contenido para capturar"); return Promise.resolve(null); }
    // Use a simple canvas-based approach since html2canvas is not installed
    // We'll use the native approach: prompt user to share screen / take screenshot
    return new Promise<{ blob: Blob; url: string } | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) { resolve(null); return; }
        resolve({ blob: file, url: URL.createObjectURL(file) });
      };
      input.click();
    });
  }, []);

  // ════════════════════════════════════════════════════════════
  //  LOADING SCREEN
  // ════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center warm-gradient">
        <div className="flex flex-col items-center gap-4">
          <GraduationCap className="h-16 w-16 text-emerald-600 animate-bounce" />
          <p className="text-lg font-medium text-emerald-800">Cargando Chambari Academy...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  LANDING PAGE
  // ════════════════════════════════════════════════════════════
  if (view === "landing") {
    return (
      <div className="min-h-screen flex flex-col warm-gradient-hero">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-800">Chambari</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setView("login")}>Iniciar Sesión</Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("register")}>Registrarse</Button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-2xl">
            {/* Decorative elements */}
            <div className="relative mb-8 flex items-center justify-center">
              <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-amber-200/60 blur-xl" />
              <div className="absolute -bottom-4 -right-8 h-32 w-32 rounded-full bg-emerald-200/60 blur-xl" />
              <div className="relative h-28 w-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl">
                <GraduationCap className="h-14 w-14 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-900 mb-4 leading-tight">
              Chambari Academy
            </h1>
            <p className="text-xl md:text-2xl text-emerald-700/80 mb-2 font-medium">
              Aprende inglés con el método Sinapsis
            </p>
            <p className="text-base text-emerald-600/60 mb-10 max-w-lg mx-auto">
              50 clases estructuradas, ejercicios interactivos, diccionario fonético y seguimiento personalizado.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-13 text-lg" onClick={() => setView("register")}>
                Comenzar Ahora <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-emerald-300 text-emerald-700 px-8 h-13 text-lg" onClick={() => setView("login")}>
                Soy Profesor
              </Button>
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
            {[
              { icon: Target, title: "Diagnóstico", desc: "Evaluación inicial personalizada" },
              { icon: Brain, title: "Ejercicios AI", desc: "Generados automáticamente por IA" },
              { icon: BookOpen, title: "Diccionario Fonético", desc: "Aprende la pronunciación correcta" },
            ].map((f) => (
              <Card key={f.title} className="rounded-xl border-emerald-200/50 bg-white/60 backdrop-blur-sm">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <f.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-emerald-800">{f.title}</h3>
                  <p className="text-sm text-emerald-600/70">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-sm text-emerald-600/50">
          © 2024 Chambari Academy — Método Sinapsis
        </footer>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  LOGIN PAGE
  // ════════════════════════════════════════════════════════════
  if (view === "login") {
    return <LoginPage onLogin={handleLogin} onGoRegister={() => setView("register")} onGoBack={() => setView("landing")} />;
  }

  // ════════════════════════════════════════════════════════════
  //  REGISTER PAGE
  // ════════════════════════════════════════════════════════════
  if (view === "register") {
    return <RegisterPage onRegister={handleRegister} onGoLogin={() => setView("login")} onGoBack={() => setView("landing")} />;
  }

  // ════════════════════════════════════════════════════════════
  //  TEACHER APP
  // ════════════════════════════════════════════════════════════
  if (view === "teacher" && user) {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-emerald-100 p-4 gap-1">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-emerald-800">Chambari</span>
          </div>
          <TeacherSidebarNav currentView={teacherView} onNavigate={setTeacherView} />
          <div className="mt-auto">
            <Separator className="my-3" />
            <div className="px-2 flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-emerald-100">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top bar - Mobile */}
          <header className="lg:hidden flex items-center justify-between p-3 bg-white border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-emerald-600" />
                      Chambari Academy
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 flex flex-col gap-1">
                    <TeacherSidebarNav currentView={teacherView} onNavigate={(v) => { setTeacherView(v); setSidebarOpen(false); }} />
                  </div>
                  <div className="mt-auto pt-4">
                    <Separator className="mb-3" />
                    <Button variant="outline" className="w-full rounded-xl" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <span className="font-semibold text-emerald-800">Chambari</span>
            </div>
            <Avatar className="h-8 w-8 bg-emerald-100">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <AnimatePresence mode="wait">
              {teacherView === "dashboard" && <TeacherDashboard key="dashboard" modules={modules} students={students} progressData={progressData} onNavigate={setTeacherView} />}
              {teacherView === "modules" && <TeacherModules key="modules" modules={modules} students={students} onRefresh={fetchModules} onSelectModule={(m) => { setSelectedModule(m); }} onSelectLesson={(l, m) => { setSelectedLesson(l); setSelectedModule(m); setTeacherView("lesson-editor"); }} onNewLesson={(m) => { setSelectedModule(m); setSelectedLesson(null); setTeacherView("lesson-editor"); }} />}
              {teacherView === "lesson-editor" && <TeacherLessonEditor key={selectedLesson?.id || "new"} module={selectedModule} lesson={selectedLesson} students={students} accessGrants={allAccessGrants} onSave={() => { fetchModules(); fetchAccessGrants(); setTeacherView("modules"); }} onBack={() => setTeacherView("modules")} />}
              {teacherView === "students" && <TeacherStudents key="students" students={students} progressData={progressData} onRefresh={() => { fetchStudents(); fetchProgress(); }} />}
              {teacherView === "exercises" && <TeacherExercises key="exercises" modules={modules} />}
              {teacherView === "progress" && <TeacherProgress key="progress" students={students} progressData={progressData} onRefresh={fetchProgress} />}
              {teacherView === "screenshots" && <TeacherScreenshots key="screenshots" screenshots={screenshots} onRefresh={fetchScreenshots} />}
              {teacherView === "dictionary" && <PhoneticDictionary key="tdict" entries={phoneticEntries} onRefresh={() => fetchPhonetic()} onSearch={fetchPhonetic} />}
              {teacherView === "classroom" && <TeacherClassroom key="classroom" modules={modules} onBack={() => setTeacherView("modules")} />}
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  STUDENT APP
  // ════════════════════════════════════════════════════════════
  if (view === "student" && user) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-16">
        {/* Top bar */}
        <header className="flex items-center justify-between p-3 bg-white border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-emerald-800">Chambari</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-700 hidden sm:inline">{user.name}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {studentView === "dashboard" && <StudentDashboard key="sdash" user={user} modules={modules} progressData={progressData} accessGrants={allAccessGrants} onRefresh={() => { fetchModules(); fetchProgress(); fetchAccessGrants(); }} onSelectLesson={(l) => { setSelectedLesson(l); setStudentView("lesson"); setStudentAnswers({}); fetchExercises(l.id); }} />}
            {studentView === "lesson" && selectedLesson && <StudentLesson key="slesson" user={user} lesson={selectedLesson} exercises={currentExercises} progressData={progressData} studentAnswers={studentAnswers} onAnswerChange={setStudentAnswers} onBack={() => setStudentView("dashboard")} onSubmitProgress={async (lessonId, pct, completed) => { try { await api("/api/progress", { method: "POST", body: JSON.stringify({ lessonId, progressPercent: pct, completed }) }); toast.success("Progreso guardado"); fetchProgress(); } catch { toast.error("Error al guardar"); } }} onCapture={captureScreenshot} onRefreshExercises={() => fetchExercises(selectedLesson.id)} />}
            {studentView === "dictionary" && <PhoneticDictionary key="sdict" entries={phoneticEntries} onRefresh={() => fetchPhonetic()} onSearch={fetchPhonetic} />}
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 flex justify-around items-center h-16 z-50 safe-area-inset-bottom">
          {[
            { icon: BookOpen, label: "Clases", view: "dashboard" as StudentView },
            { icon: Book, label: "Diccionario", view: "dictionary" as StudentView },
            { icon: BarChart3, label: "Progreso", view: "progress" as StudentView },
          ].map((item) => (
            <button key={item.view} onClick={() => setStudentView(item.view)} className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${studentView === item.view ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground hover:text-emerald-500"}`}>
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${studentView === item.view ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : ""}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-medium transition-all ${studentView === item.view ? "text-emerald-700 font-semibold" : ""}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
//  LOGIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
function LoginPage({ onLogin, onGoRegister, onGoBack }: { onLogin: (e: string, p: string, t: boolean) => void; onGoRegister: () => void; onGoBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!password && !isTeacher)) { toast.error("Completa todos los campos"); return; }
    setSubmitting(true);
    await onLogin(email, password, isTeacher);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center warm-gradient px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="rounded-2xl border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-3">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-emerald-900">Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu cuenta de Chambari Academy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{isTeacher ? "Contraseña (opcional para profesores)" : "Contraseña"}</Label>
                <Input type="password" placeholder={isTeacher ? "Dejar vacío para entrar sin contraseña" : "••••••••"} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="teacher" checked={isTeacher} onCheckedChange={(v) => setIsTeacher(!!v)} />
                <Label htmlFor="teacher" className="text-sm cursor-pointer">Soy Profesor</Label>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Iniciar Sesión
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta? <button onClick={onGoRegister} className="text-emerald-600 font-medium hover:underline">Regístrate</button>
            </div>
            <button onClick={onGoBack} className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Volver al inicio
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  REGISTER PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
function RegisterPage({ onRegister, onGoLogin, onGoBack }: { onRegister: (n: string, e: string, p: string, r: string) => void; onGoLogin: () => void; onGoBack: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Completa todos los campos"); return; }
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setSubmitting(true);
    await onRegister(name, email, password, role);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center warm-gradient px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="rounded-2xl border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-3">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-emerald-900">Crear Cuenta</CardTitle>
            <CardDescription>Únete a Chambari Academy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="STUDENT" id="role-student" />
                    <Label htmlFor="role-student" className="cursor-pointer">Estudiante</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="TEACHER" id="role-teacher" />
                    <Label htmlFor="role-teacher" className="cursor-pointer">Profesor</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Crear Cuenta
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta? <button onClick={onGoLogin} className="text-emerald-600 font-medium hover:underline">Inicia sesión</button>
            </div>
            <button onClick={onGoBack} className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Volver al inicio
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER SIDEBAR NAV
// ════════════════════════════════════════════════════════════════
function TeacherSidebarNav({ currentView, onNavigate }: { currentView: TeacherView; onNavigate: (v: TeacherView) => void }) {
  const items: { view: TeacherView; icon: React.ElementType; label: string }[] = [
    { view: "dashboard", icon: Home, label: "Dashboard" },
    { view: "modules", icon: BookOpen, label: "Módulos" },
    { view: "students", icon: Users, label: "Estudiantes" },
    { view: "exercises", icon: Sparkles, label: "Ejercicios AI" },
    { view: "progress", icon: BarChart3, label: "Progreso" },
    { view: "screenshots", icon: Camera, label: "Capturas" },
    { view: "dictionary", icon: Book, label: "Diccionario Fonético" },
    { view: "classroom", icon: MonitorPlay, label: "Vista de Clase" },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item.view}
          onClick={() => onNavigate(item.view)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${currentView === item.view ? "bg-emerald-100 text-emerald-800" : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"}`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER DASHBOARD
// ════════════════════════════════════════════════════════════════
function TeacherDashboard({ modules, students, progressData, onNavigate }: { modules: Module[]; students: User[]; progressData: StudentProgress[]; onNavigate: (v: TeacherView) => void }) {
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const avgProgress = progressData.length > 0 ? Math.round(progressData.reduce((acc, p) => acc + p.progressPercent, 0) / progressData.length) : 0;

  const stats = [
    { icon: BookOpen, label: "Módulos", value: modules.length, color: "bg-emerald-100 text-emerald-700" },
    { icon: FileText, label: "Lecciones", value: totalLessons, color: "bg-amber-100 text-amber-700" },
    { icon: Users, label: "Estudiantes", value: students.length, color: "bg-sky-100 text-sky-700" },
    { icon: BarChart3, label: "Progreso Prom.", value: `${avgProgress}%`, color: "bg-rose-100 text-rose-700" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Panel del Profesor</h1>
        <p className="text-muted-foreground">Bienvenido a tu aula virtual</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("modules")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Crear Módulo</p>
              <p className="text-sm text-muted-foreground">Agrega un nuevo módulo de contenido</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("exercises")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Generar Ejercicios</p>
              <p className="text-sm text-muted-foreground">Crea ejercicios con Inteligencia Artificial</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent modules */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Módulos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay módulos todavía. ¡Crea el primero!</p>
          ) : (
            <div className="space-y-3">
              {modules.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.lessons?.length || 0} lecciones</p>
                    </div>
                  </div>
                  <Badge variant={m.status === "PUBLISHED" ? "default" : "secondary"} className={m.status === "PUBLISHED" ? "bg-emerald-600 text-white" : ""}>
                    {m.status === "PUBLISHED" ? "Publicado" : m.status === "DRAFT" ? "Borrador" : "Archivado"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER MODULES VIEW
// ════════════════════════════════════════════════════════════════
function TeacherModules({ modules, students, onRefresh, onSelectModule, onSelectLesson, onNewLesson }: { modules: Module[]; students: User[]; onRefresh: () => void; onSelectModule: (m: Module) => void; onSelectLesson: (l: Lesson, m: Module) => void; onNewLesson: (m: Module) => void }) {
  const [showNewModule, setShowNewModule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});

  const loadLessons = async (moduleId: string) => {
    try {
      const data = await api<Lesson[]>(`/api/lessons?moduleId=${moduleId}`);
      setModuleLessons((prev) => ({ ...prev, [moduleId]: data }));
    } catch { /* silent */ }
  };

  const toggleModule = (mod: Module) => {
    if (expandedModule === mod.id) {
      setExpandedModule(null);
    } else {
      setExpandedModule(mod.id);
      if (!moduleLessons[mod.id]) loadLessons(mod.id);
    }
  };

  const createModule = async () => {
    if (!newTitle.trim()) { toast.error("El título es obligatorio"); return; }
    try {
      await api("/api/modules", { method: "POST", body: JSON.stringify({ title: newTitle, description: newDesc || undefined }) });
      toast.success("Módulo creado");
      setShowNewModule(false);
      setNewTitle("");
      setNewDesc("");
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteModule = async (id: string) => {
    try {
      await api(`/api/modules/${id}`, { method: "DELETE" });
      toast.success("Módulo eliminado");
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteLesson = async (id: string, moduleId: string) => {
    try {
      await api(`/api/lessons/${id}`, { method: "DELETE" });
      toast.success("Lección eliminada");
      loadLessons(moduleId);
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const toggleModulePublish = async (mod: Module) => {
    setToggleLoading(mod.id);
    try {
      const newStatus = mod.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api(`/api/modules/${mod.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(newStatus === 'PUBLISHED' ? "Módulo publicado" : "Módulo ocultado");
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    setToggleLoading(null);
  };

  const togglePublish = async (id: string, moduleId: string) => {
    try {
      const currentLesson = (moduleLessons[moduleId] || []).find(l => l.id === id);
      const newStatus = currentLesson?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await api(`/api/lessons/${id}/publish`, { 
        method: "PUT", 
        body: JSON.stringify({ status: newStatus }) 
      });
      toast.success(newStatus === 'PUBLISHED' ? "Clase publicada" : "Clase desactivada");
      loadLessons(moduleId);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Módulos</h1>
          <p className="text-muted-foreground">Gestiona tus módulos y lecciones</p>
        </div>
        <Dialog open={showNewModule} onOpenChange={setShowNewModule}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Módulo</DialogTitle>
              <DialogDescription>Crea un nuevo módulo de contenido</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej: Fundamentos del Inglés" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripción del módulo..." className="rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewModule(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={createModule} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
            <p className="text-muted-foreground">No hay módulos todavía</p>
            <Button className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowNewModule(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear Primer Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <Card key={mod.id} className="rounded-xl overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
                onClick={() => toggleModule(mod)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{mod.title}</p>
                    <p className="text-sm text-muted-foreground">{mod.description || "Sin descripción"} • {mod.lessons?.length || moduleLessons[mod.id]?.length || 0} lecciones</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={mod.status === "PUBLISHED"}
                    disabled={toggleLoading === mod.id}
                    onCheckedChange={() => toggleModulePublish(mod)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Badge variant={mod.status === "PUBLISHED" ? "default" : "secondary"} className={mod.status === "PUBLISHED" ? "bg-emerald-600 text-white" : ""}>
                    {mod.status === "PUBLISHED" ? "Publicado" : mod.status === "DRAFT" ? "Borrador" : "Archivado"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedModule === mod.id ? "rotate-180" : ""}`} />
                </div>
              </div>
              {expandedModule === mod.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-emerald-100">
                  <div className="p-4 space-y-2">
                    {(moduleLessons[mod.id] || []).map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-100">
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onSelectLesson(lesson, mod)}>
                          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                            {lesson.orderIndex + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.description || "Sin descripción"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={lesson.status === "PUBLISHED" ? "default" : "secondary"} className={lesson.status === "PUBLISHED" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                            {lesson.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-7 w-7 ${lesson.status === 'PUBLISHED' ? 'text-emerald-600 hover:text-red-500' : 'text-gray-400 hover:text-emerald-500'}`} 
                            onClick={() => togglePublish(lesson.id, mod.id)}
                            title={lesson.status === 'PUBLISHED' ? 'Desactivar clase' : 'Publicar clase'}
                          >
                            {lesson.status === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectLesson(lesson, mod)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLesson(lesson.id, mod.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full rounded-xl border-dashed mt-2" onClick={() => onNewLesson(mod)}>
                      <Plus className="h-4 w-4 mr-2" /> Nueva Lección
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER LESSON EDITOR
// ════════════════════════════════════════════════════════════════
function TeacherLessonEditor({ module, lesson, students, accessGrants, onSave, onBack }: { module: Module | null; lesson: Lesson | null; students: User[]; accessGrants: StudentAccess[]; onSave: () => void; onBack: () => void }) {
  const [title, setTitle] = useState(lesson?.title || "");
  const [description, setDescription] = useState(lesson?.description || "");
  const [content, setContent] = useState(lesson?.content || "");
  const [youtubeUrl, setYoutubeUrl] = useState(lesson?.youtubeUrl || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(lesson?.tiktokUrl || "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState(lesson?.documentUrl || "");
  const [documentName, setDocumentName] = useState(lesson?.documentName || "");
  const [documentLinkInput, setDocumentLinkInput] = useState(lesson?.documentUrl || "");
  const [exerciseType, setExerciseType] = useState("multiple_choice");
  const [exerciseCount, setExerciseCount] = useState("5");
  const [generatedExercises, setGeneratedExercises] = useState<Exercise[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [existingExercises, setExistingExercises] = useState<Exercise[]>([]);
  const [showManualExercise, setShowManualExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ question: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' });

  // Pre-populate selectedStudents from existing access grants when editing a lesson
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (lesson && accessGrants.length > 0) {
      const granted = accessGrants.filter((g) => g.lessonId === lesson.id && g.active).map((g) => g.studentId);
      setSelectedStudents(granted);
    }
  }, [lesson, accessGrants]);

  useEffect(() => {
    if (lesson) {
      api<Exercise[]>(`/api/exercises/${lesson.id}`).then(setExistingExercises).catch(() => {});
    }
  }, [lesson]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleStudentAccess = async (studentId: string, grantId?: string) => {
    if (!lesson) return;
    setToggleLoading(studentId);
    try {
      if (grantId) {
        // Revoke access
        await api(`/api/access/${grantId}`, { method: "DELETE" });
        setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
        toast.success("Acceso revocado");
      } else {
        // Grant access
        await api("/api/access", { method: "POST", body: JSON.stringify({ studentId, lessonId: lesson.id }) });
        setSelectedStudents([...selectedStudents, studentId]);
        toast.success("Acceso concedido");
      }
    } catch { toast.error("Error al cambiar acceso"); }
    setToggleLoading(null);
  };

  const saveLesson = async () => {
    if (!title.trim()) { toast.error("El título es obligatorio"); return; }
    if (!module && !lesson) { toast.error("No hay módulo seleccionado"); return; }
    setSaving(true);
    try {
      let docUrl = documentUrl || documentLinkInput;
      let docName = documentName;
      if (documentFile) {
        const formData = new FormData();
        formData.append("file", documentFile);
        const res = await apiUpload("/api/upload", formData);
        docUrl = res.url;
        docName = documentFile.name;
      }
      const body: Record<string, any> = {
        title, description, content, youtubeUrl, videoUrl, tiktokUrl,
        documentUrl: docUrl, documentName: docName,
      };
      if (!lesson && module) {
        body.moduleId = module.id;
        await api("/api/lessons", { method: "POST", body: JSON.stringify(body) });
      } else if (lesson) {
        await api(`/api/lessons/${lesson.id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      // Save access grants
      for (const studentId of selectedStudents) {
        const lessonId = lesson?.id || "";
        if (lessonId) {
          await api("/api/access", { method: "POST", body: JSON.stringify({ studentId, lessonId }) });
        }
      }
      toast.success("Lección guardada");
      onSave();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const generateExercises = async () => {
    if (!lesson) { toast.error("Guarda la lección primero para generar ejercicios"); return; }
    setGenerating(true);
    try {
      const data = await api<{ exercises: Exercise[]; count: number }>("/api/exercises/generate", {
        method: "POST",
        body: JSON.stringify({
          lessonId: lesson.id,
          lessonTitle: lesson.title || '',
          lessonContent: lesson.description || '',
          type: exerciseType,
          count: parseInt(exerciseCount),
        }),
      });
      setGeneratedExercises(data.exercises || []);
      toast.success(`${data.count || 0} ejercicios generados`);
      // Refresh existing exercises
      const updated = await api<Exercise[]>(`/api/exercises/${lesson.id}`);
      setExistingExercises(updated);
    } catch (e: any) { toast.error(e.message); }
    setGenerating(false);
  };

  const addManualExercise = async () => {
    if (!lesson || !newExercise.question.trim() || !newExercise.correctAnswer.trim()) {
      toast.error('Pregunta y respuesta correcta son obligatorias');
      return;
    }
    try {
      const opts = newExercise.type === 'multiple_choice' ? JSON.stringify(newExercise.options.filter(Boolean)) : null;
      await api('/api/exercises/generate', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: lesson.id,
          type: newExercise.type,
          count: 1,
          customExercise: { question: newExercise.question, options: opts, correctAnswer: newExercise.correctAnswer, explanation: newExercise.explanation }
        })
      });
      // Refresh exercises
      const updated = await api<Exercise[]>(`/api/exercises/${lesson.id}`);
      setExistingExercises(updated);
      setNewExercise({ question: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' });
      setShowManualExercise(false);
      toast.success('Ejercicio agregado');
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!lesson) return;
    try {
      await api(`/api/exercises/${lesson.id}?single=${exerciseId}`, { method: 'DELETE' });
      setExistingExercises(existingExercises.filter(e => e.id !== exerciseId));
      toast.success('Ejercicio eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      setDocumentName(file.name);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">{lesson ? "Editar Lección" : "Nueva Lección"}</h1>
          <p className="text-muted-foreground">{module?.title || ""}</p>
        </div>
      </div>

      <Tabs defaultValue="contenido" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="multimedia">Multimedia</TabsTrigger>
          <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
          <TabsTrigger value="acceso">Acceso</TabsTrigger>
        </TabsList>

        <TabsContent value="contenido" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la lección" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción..." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenido completo de la lección..." className="rounded-xl min-h-[300px]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multimedia" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> Video de YouTube</Label>
                <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="rounded-xl" />
                {youtubeUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border">
                    <iframe 
                      src={youtubeUrl.includes('youtube.com') ? `https://www.youtube.com/embed/${new URL(youtubeUrl).searchParams.get('v') || youtubeUrl.split('/').pop()}` : youtubeUrl} 
                      className="w-full aspect-video" 
                      allowFullScreen 
                    />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Pega un enlace de YouTube. Se guardara automaticamente al guardar la leccion.</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Video className="h-4 w-4 text-blue-500" /> URL de Video Directo</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://...mp4" className="rounded-xl" />
                <p className="text-[10px] text-muted-foreground">Enlace a un archivo de video MP4/WebM</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Music className="h-4 w-4 text-pink-500" /> URL de TikTok</Label>
                <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://www.tiktok.com/@usuario/video/123456" className="rounded-xl" />
                <p className="text-[10px] text-muted-foreground">Pega el enlace de un video de TikTok para embeberlo en la clase</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><FileText className="h-4 w-4 text-amber-500" /> Documento</Label>
                <div className="space-y-2">
                  <Input value={documentLinkInput} onChange={(e) => setDocumentLinkInput(e.target.value)} placeholder="https://drive.google.com/... o https://ejemplo.com/documento.pdf" className="rounded-xl" />
                  <p className="text-[10px] text-muted-foreground">O pega un enlace a un documento (Google Drive, PDF, etc.)</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground">o sube un archivo</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setDocumentFile(file);
                      setDocumentName(file.name);
                      setDocumentLinkInput("");
                      toast.success("Archivo seleccionado: " + file.name);
                    }
                  }} className="rounded-xl" />
                </div>
                {documentUrl && (
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline flex items-center gap-1"><FileText className="h-3 w-3" /> Ver documento actual{documentName ? ": " + documentName : ""}</a>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ejercicios" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              {lesson ? (
                <>
                  {/* Existing Exercises */}
                  {existingExercises.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Ejercicios Existentes ({existingExercises.length})</h3>
                        <Button variant="destructive" size="sm" className="rounded-xl text-[11px] h-7" onClick={async () => {
                          try { await api(`/api/exercises/${lesson.id}`, { method: "DELETE" }); setExistingExercises([]); toast.success('Todos los ejercicios eliminados'); } catch { toast.error('Error'); }
                        }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Eliminar todos
                        </Button>
                      </div>
                      <ScrollArea className="max-h-60">
                        <div className="space-y-2 pr-4">
                          {existingExercises.map((ex) => (
                            <div key={ex.id} className="p-3 rounded-xl bg-white border border-emerald-100 flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{ex.question}</p>
                                {ex.options && <p className="text-xs text-muted-foreground mt-1">{ex.options}</p>}
                                <p className="text-xs text-emerald-600 mt-1">✓ {ex.correctAnswer}</p>
                                {ex.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{ex.explanation}</p>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600" onClick={() => deleteExercise(ex.id)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Manual Exercise Form */}
                  {!showManualExercise ? (
                    <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={() => setShowManualExercise(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar Ejercicio Manual
                    </Button>
                  ) : (
                    <div className="p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Nuevo Ejercicio Manual</h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowManualExercise(false)}><X className="h-3 w-3" /></Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Pregunta</Label>
                        <Input value={newExercise.question} onChange={(e) => setNewExercise({ ...newExercise, question: e.target.value })} placeholder="Escribe la pregunta..." className="rounded-xl text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Tipo</Label>
                          <Select value={newExercise.type} onValueChange={(v) => setNewExercise({ ...newExercise, type: v })}>
                            <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                              <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                              <SelectItem value="fill_blank">Completar Espacio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Respuesta Correcta</Label>
                          <Input value={newExercise.correctAnswer} onChange={(e) => setNewExercise({ ...newExercise, correctAnswer: e.target.value })} placeholder="Respuesta..." className="rounded-xl text-sm" />
                        </div>
                      </div>
                      {newExercise.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Opciones (4 opciones)</Label>
                          {newExercise.options.map((opt, i) => (
                            <Input key={i} value={opt} onChange={(e) => {
                              const updated = [...newExercise.options];
                              updated[i] = e.target.value;
                              setNewExercise({ ...newExercise, options: updated });
                            }} placeholder={`Opción ${i + 1}`} className="rounded-xl text-sm" />
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs">Explicación (opcional)</Label>
                        <Input value={newExercise.explanation} onChange={(e) => setNewExercise({ ...newExercise, explanation: e.target.value })} placeholder="¿Por qué es esta la respuesta correcta?" className="rounded-xl text-sm" />
                      </div>
                      <Button onClick={addManualExercise} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                        <Save className="h-4 w-4 mr-2" /> Guardar Ejercicio
                      </Button>
                    </div>
                  )}

                  {/* Divider */}
                  {existingExercises.length > 0 && <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">O generar con IA</span></div></div>}

                  {/* AI Generation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={exerciseType} onValueChange={setExerciseType}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                          <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                          <SelectItem value="fill_blank">Completar Espacio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cantidad</Label>
                      <Select value={exerciseCount} onValueChange={setExerciseCount}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 20].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={generateExercises} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Generar con IA
                  </Button>
                  {generatedExercises.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-amber-700">Recién Generados ({generatedExercises.length})</h3>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2 pr-4">
                          {generatedExercises.map((ex, i) => (
                            <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                              <p className="text-sm font-medium">{ex.question}</p>
                              {ex.options && <p className="text-xs text-muted-foreground mt-1">{ex.options}</p>}
                              <p className="text-xs text-emerald-600 mt-1">✓ {ex.correctAnswer}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-2 text-amber-300" />
                  <p>Guarda la lección primero para gestionar ejercicios</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acceso" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Gestionar Acceso de Estudiantes</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedStudents.length} de {students.length} estudiantes con acceso{lesson ? "" : " (guarda la leccion primero)"}</p>
                </div>
                {lesson && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={async () => {
                      if (selectedStudents.length === students.length) {
                        setSelectedStudents([]);
                        for (const s of students) {
                          const g = accessGrants.find((a) => a.lessonId === lesson.id && a.studentId === s.id);
                          if (g) try { await api(`/api/access/${g.id}`, { method: "DELETE" }); } catch {}
                        }
                        toast.success("Acceso revocado a todos");
                      } else {
                        const newSelected = students.map((s) => s.id);
                        setSelectedStudents(newSelected);
                        for (const s of students) {
                          const hasAccess = accessGrants.find((a) => a.lessonId === lesson.id && a.studentId === s.id);
                          if (!hasAccess) try { await api("/api/access", { method: "POST", body: JSON.stringify({ studentId: s.id, lessonId: lesson.id }) }); } catch {}
                        }
                        toast.success("Acceso concedido a todos");
                      }
                    }}
                  >
                    {selectedStudents.length === students.length ? <><Lock className="h-3 w-3 mr-1" /> Bloquear todos</> : <><Unlock className="h-3 w-3 mr-1" /> Liberar todos</>}
                  </Button>
                )}
              </div>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-muted-foreground">No hay estudiantes registrados</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2 pr-4">
                    {students.map((s) => {
                      const hasAccess = selectedStudents.includes(s.id);
                      const grant = lesson ? accessGrants.find((a) => a.lessonId === lesson.id && a.studentId === s.id) : undefined;
                      const isLoading = toggleLoading === s.id;
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hasAccess ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100 bg-white"}`}>
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${hasAccess ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                          </div>
                          {lesson ? (
                            <Button
                              size="sm"
                              variant={hasAccess ? "default" : "outline"}
                              className={`rounded-xl text-[11px] ${hasAccess ? "bg-emerald-600 hover:bg-red-500 text-white" : "hover:bg-emerald-50"}`}
                              disabled={isLoading}
                              onClick={() => toggleStudentAccess(s.id, grant?.id)}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : hasAccess ? <><Lock className="h-3 w-3 mr-1" /> Bloquear</> : <><Unlock className="h-3 w-3 mr-1" /> Liberar</>}
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Guarda primero</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="rounded-xl">Cancelar</Button>
        <Button onClick={saveLesson} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar Lección
        </Button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER STUDENTS VIEW
// ════════════════════════════════════════════════════════════════
function TeacherStudents({ students, progressData, onRefresh }: { students: User[]; progressData: StudentProgress[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const getStudentProgress = (studentId: string) => {
    const entries = progressData.filter((p) => p.studentId === studentId);
    if (entries.length === 0) return { avg: 0, completed: 0, total: 0 };
    const avg = Math.round(entries.reduce((a, p) => a + p.progressPercent, 0) / entries.length);
    return { avg, completed: entries.filter((p) => p.completed).length, total: entries.length };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Estudiantes</h1>
        <p className="text-muted-foreground">{students.length} estudiantes registrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar estudiante..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {/* Desktop table */}
      <Card className="rounded-xl hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Lecciones</TableHead>
                <TableHead>Completadas</TableHead>
                <TableHead>Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const prog = getStudentProgress(s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>{prog.total}</TableCell>
                    <TableCell>{prog.completed}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={prog.avg} className="h-2 w-20" />
                        <span className="text-xs">{prog.avg}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((s) => {
          const prog = getStudentProgress(s.id);
          return (
            <Card key={s.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10 bg-emerald-100">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={prog.avg} className="h-2 flex-1" />
                  <span className="text-xs font-medium">{prog.avg}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{prog.completed}/{prog.total} completadas</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
          <p>No se encontraron estudiantes</p>
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER EXERCISES VIEW
// ════════════════════════════════════════════════════════════════
function TeacherExercises({ modules }: { modules: Module[] }) {
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [exerciseType, setExerciseType] = useState("multiple_choice");
  const [exerciseCount, setExerciseCount] = useState("5");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [generating, setGenerating] = useState(false);

  const loadLessons = useCallback(async () => {
    try {
      const all: Lesson[] = [];
      for (const mod of modules) {
        const data = await api<Lesson[]>(`/api/lessons?moduleId=${mod.id}`);
        all.push(...data);
      }
      setAllLessons(all);
    } catch { /* silent */ }
  }, [modules]);

  useEffect(() => { loadLessons(); }, [loadLessons]); // eslint-disable-line react-hooks/set-state-in-effect

  const generate = async () => {
    if (!selectedLessonId) { toast.error("Selecciona una lección"); return; }
    const selectedLesson = allLessons.find((l) => l.id === selectedLessonId);
    setGenerating(true);
    try {
      const data = await api<{ exercises: Exercise[]; count: number }>("/api/exercises/generate", {
        method: "POST",
        body: JSON.stringify({
          lessonId: selectedLessonId,
          lessonTitle: selectedLesson?.title || '',
          lessonContent: selectedLesson?.description || '',
          type: exerciseType,
          count: parseInt(exerciseCount),
        }),
      });
      setExercises(data.exercises || []);
      toast.success(`${data.count || 0} ejercicios generados`);
    } catch (e: any) { toast.error(e.message); }
    setGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Ejercicios IA</h1>
        <p className="text-muted-foreground">Genera ejercicios automáticamente con Inteligencia Artificial</p>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Lección</Label>
            <Select value={selectedLessonId} onValueChange={(v) => { setSelectedLessonId(v); setExercises([]); }}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elige una lección..." /></SelectTrigger>
              <SelectContent>
                {allLessons.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={exerciseType} onValueChange={setExerciseType}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                  <SelectItem value="true_false">Verdadero / Falso</SelectItem>
                  <SelectItem value="fill_blank">Completar Espacio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Select value={exerciseCount} onValueChange={setExerciseCount}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white h-11" disabled={generating || !selectedLessonId}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generar con IA
          </Button>
        </CardContent>
      </Card>

      {exercises.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ejercicios Generados ({exercises.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-4">
                {exercises.map((ex, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border border-emerald-100">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-100 rounded-full h-6 w-6 flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ex.question}</p>
                        {ex.options && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ex.options}</p>}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ {ex.correctAnswer}</Badge>
                          <Badge variant="outline" className="text-[10px]">{ex.type}</Badge>
                        </div>
                        {ex.explanation && <p className="text-xs text-muted-foreground mt-2 italic">💡 {ex.explanation}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER PROGRESS VIEW
// ════════════════════════════════════════════════════════════════
function TeacherProgress({ students, progressData, onRefresh }: { students: User[]; progressData: StudentProgress[]; onRefresh: () => void }) {
  const getStudentProgress = (studentId: string) => {
    return progressData.filter((p) => p.studentId === studentId);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Progreso</h1>
          <p className="text-muted-foreground">Seguimiento de estudiantes</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      <div className="space-y-4">
        {students.map((s) => {
          const entries = getStudentProgress(s.id);
          const avg = entries.length > 0 ? Math.round(entries.reduce((a, p) => a + p.progressPercent, 0) / entries.length) : 0;
          return (
            <Card key={s.id} className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-emerald-100">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">{s.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{entries.length} lecciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">{avg}%</p>
                    <p className="text-xs text-muted-foreground">promedio</p>
                  </div>
                </div>
                {entries.length > 0 && (
                  <div className="space-y-2">
                    {entries.map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-32 truncate">{p.lesson?.title || "Lección"}</span>
                        <Progress value={p.progressPercent} className="h-2 flex-1" />
                        <div className="flex items-center gap-1">
                          <span className="text-xs w-8 text-right">{p.progressPercent}%</span>
                          {p.completed && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {entries.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Sin actividad aún</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
          <p>No hay estudiantes para mostrar</p>
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER SCREENSHOTS VIEW
// ════════════════════════════════════════════════════════════════
function TeacherScreenshots({ screenshots, onRefresh }: { screenshots: Screenshot[]; onRefresh: () => void }) {
  const [selected, setSelected] = useState<Screenshot | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Capturas</h1>
          <p className="text-muted-foreground">Capturas de pantalla de los estudiantes</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {screenshots.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Camera className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
            <p className="text-muted-foreground">No hay capturas recibidas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {screenshots.map((ss) => (
            <Card key={ss.id} className="rounded-xl cursor-pointer hover:shadow-md transition-shadow overflow-hidden" onClick={() => setSelected(ss)}>
              <div className="aspect-video bg-muted relative">
                <img src={ss.imageUrl} alt="Captura" className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{ss.student?.name || "Estudiante"}</p>
                <p className="text-xs text-muted-foreground truncate">{ss.lesson?.title || "Lección"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(ss.createdAt).toLocaleString("es")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full size dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.student?.name || "Estudiante"} — {selected.lesson?.title || "Lección"}</DialogTitle>
                <DialogDescription>{new Date(selected.createdAt).toLocaleString("es")}</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl overflow-hidden bg-muted">
                <img src={selected.imageUrl} alt="Captura completa" className="w-full" />
              </div>
              {selected.caption && <p className="text-sm text-muted-foreground italic">"{selected.caption}"</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  PHONETIC DICTIONARY (shared teacher + student)
// ════════════════════════════════════════════════════════════════
function PhoneticDictionary({ entries, onRefresh, onSearch }: { entries: PhoneticEntry[]; onRefresh: () => void; onSearch: (q?: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newIpa, setNewIpa] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newTranslation, setNewTranslation] = useState("");

  const search = (val: string) => {
    setSearchQuery(val);
    onSearch(val || undefined);
  };

  const addEntry = async () => {
    if (!newWord.trim() || !newIpa.trim()) { toast.error("Palabra y IPA son obligatorios"); return; }
    try {
      await api("/api/phonetic", {
        method: "POST",
        body: JSON.stringify({ word: newWord, ipa: newIpa, phoneticSpelling: newPhonetic || undefined, example: newExample || undefined, translation: newTranslation || undefined }),
      });
      toast.success("Entrada agregada");
      setShowAdd(false);
      setNewWord(""); setNewIpa(""); setNewPhonetic(""); setNewExample(""); setNewTranslation("");
      onSearch(searchQuery || undefined);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Diccionario Fonético</h1>
          <p className="text-muted-foreground">{entries.length} entradas</p>
        </div>
        <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" /> Agregar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar palabra..." value={searchQuery} onChange={(e) => search(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Volume2 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-lg font-bold text-emerald-900">{entry.word}</span>
                    <span className="text-sm text-amber-600 font-mono">/{entry.ipa}/</span>
                    {entry.phoneticSpelling && <span className="text-xs text-muted-foreground">[{entry.phoneticSpelling}]</span>}
                  </div>
                  {entry.example && <p className="text-sm text-emerald-700 mt-1 italic">"{entry.example}"</p>}
                  {entry.translation && <p className="text-sm text-muted-foreground mt-0.5">{entry.translation}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Book className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
          <p>No se encontraron entradas</p>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Entrada</DialogTitle>
            <DialogDescription>Agrega una palabra al diccionario fonético</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Palabra</Label><Input value={newWord} onChange={(e) => setNewWord(e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label>IPA</Label><Input value={newIpa} onChange={(e) => setNewIpa(e.target.value)} className="rounded-xl" placeholder="həˈloʊ" /></div>
            </div>
            <div className="space-y-1"><Label>Ortografía Fonética</Label><Input value={newPhonetic} onChange={(e) => setNewPhonetic(e.target.value)} className="rounded-xl" placeholder="juh-LOH" /></div>
            <div className="space-y-1"><Label>Ejemplo</Label><Input value={newExample} onChange={(e) => setNewExample(e.target.value)} className="rounded-xl" placeholder="Hello, how are you?" /></div>
            <div className="space-y-1"><Label>Traducción</Label><Input value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} className="rounded-xl" placeholder="Hola" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={addEntry} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER CLASSROOM VIEW — Teacher sees class like students
// ════════════════════════════════════════════════════════════════
function TeacherClassroom({ modules, onBack }: { modules: Module[]; onBack: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contenido");
  const [classroomExercises, setClassroomExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const all: Lesson[] = [];
        for (const mod of modules) {
          const ls = await api<Lesson[]>(`/api/lessons?moduleId=${mod.id}`);
          all.push(...ls.map((l) => ({ ...l, moduleId: mod.id })));
        }
        setLessons(all.filter((l) => l.status === "PUBLISHED").sort((a, b) => a.orderIndex - b.orderIndex));
      } catch { toast.error("Error al cargar lecciones"); }
      setLoading(false);
    };
    load();
  }, [modules]);

  useEffect(() => {
    if (selectedLesson) {
      setLoadingExercises(true);
      api<Exercise[]>(`/api/exercises/${selectedLesson.id}`)
        .then(setClassroomExercises)
        .catch(() => setClassroomExercises([]))
        .finally(() => setLoadingExercises(false));
    } else {
      setClassroomExercises([]);
    }
  }, [selectedLesson]);

  const getTiktokEmbedUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : "";
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const parseExtraVideos = (videoUrls: string | undefined) => {
    if (!videoUrls) return [];
    try { return JSON.parse(videoUrls); } catch { return []; }
  };

  const parseExtraDocs = (docUrls: string | undefined) => {
    if (!docUrls) return [];
    try { return JSON.parse(docUrls); } catch { return []; }
  };

  if (loading) return <div className="p-4"><Skeleton className="h-64 rounded-2xl" /></div>;

  if (selectedLesson) {
    // Teacher viewing a lesson — same as student view
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => setSelectedLesson(null)} className="rounded-xl h-8 w-8 shrink-0 hover:bg-emerald-50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate text-emerald-900">{selectedLesson.title}</h2>
              <p className="text-[10px] text-muted-foreground truncate">{selectedLesson.description}</p>
            </div>
            <Badge className="bg-emerald-600 text-white text-[10px] border-0">Modo Profesor</Badge>
          </div>
        </div>
        <div className="p-4 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 mb-4 h-11">
              <TabsTrigger value="contenido" className="text-[11px] gap-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <BookOpen className="h-3.5 w-3.5" /> Contenido
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-[11px] gap-1">
                <Play className="h-3.5 w-3.5" /> Videos
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-[11px] gap-1">
                <FileText className="h-3.5 w-3.5" /> Docs
              </TabsTrigger>
              <TabsTrigger value="ejercicios" className="text-[11px] gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Tests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contenido">
              {selectedLesson.content ? <LessonContentRenderer content={selectedLesson.content} /> : (
                <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                  <CardContent className="py-10 text-center">
                    <BookOpen className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Sin contenido</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="videos">
              <div className="space-y-4">
                {/* Main YouTube video */}
                {selectedLesson.youtubeUrl && getYoutubeEmbedUrl(selectedLesson.youtubeUrl) && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video"><iframe src={getYoutubeEmbedUrl(selectedLesson.youtubeUrl)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" /></div>
                      <div className="p-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center"><Play className="h-3 w-3 text-red-600" /></div>
                        <p className="text-xs font-medium text-muted-foreground">Video principal - YouTube</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* TikTok video */}
                {selectedLesson.tiktokUrl && getTiktokEmbedUrl(selectedLesson.tiktokUrl) && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[9/16] max-h-[500px] mx-auto"><iframe src={getTiktokEmbedUrl(selectedLesson.tiktokUrl)} className="w-full h-full" allowFullScreen /></div>
                      <div className="p-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-pink-100 flex items-center justify-center"><Music className="h-3 w-3 text-pink-600" /></div>
                        <p className="text-xs font-medium text-muted-foreground">Video - TikTok</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Direct video */}
                {selectedLesson.videoUrl && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black"><video src={selectedLesson.videoUrl} controls className="w-full h-full" /></div>
                    </CardContent>
                  </Card>
                )}
                {/* Additional videos */}
                {parseExtraVideos(selectedLesson.videoUrls).map((v: { url: string; title?: string }, i: number) => (
                  <Card key={i} className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      {getYoutubeEmbedUrl(v.url) ? (
                        <div className="aspect-video"><iframe src={getYoutubeEmbedUrl(v.url)} className="w-full h-full" allowFullScreen /></div>
                      ) : getTiktokEmbedUrl(v.url) ? (
                        <div className="aspect-[9/16] max-h-[500px] mx-auto"><iframe src={getTiktokEmbedUrl(v.url)} className="w-full h-full" allowFullScreen /></div>
                      ) : (
                        <div className="aspect-video bg-black"><video src={v.url} controls className="w-full h-full" /></div>
                      )}
                      <div className="p-3"><p className="text-xs font-medium text-muted-foreground">{v.title || `Video adicional ${i + 1}`}</p></div>
                    </CardContent>
                  </Card>
                ))}
                {!selectedLesson.youtubeUrl && !selectedLesson.tiktokUrl && !selectedLesson.videoUrl && (!selectedLesson.videoUrls || parseExtraVideos(selectedLesson.videoUrls).length === 0) && (
                  <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                    <CardContent className="py-10 text-center">
                      <Video className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No hay videos disponibles</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documentos">
              <div className="space-y-3">
                {/* Main document */}
                {selectedLesson.documentUrl && (
                  <Card className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <FileText className="h-8 w-8 text-amber-600" />
                        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{selectedLesson.documentName || "Documento principal"}</p></div>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" asChild><a href={selectedLesson.documentUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-1" /> Abrir</a></Button>
                      </div>
                      {renderDocumentViewer(selectedLesson.documentUrl, selectedLesson.documentName || "Documento")}
                    </CardContent>
                  </Card>
                )}
                {/* Additional documents */}
                {parseExtraDocs(selectedLesson.documentUrls).map((d: { url: string; name?: string }, i: number) => (
                  <Card key={i} className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <FileText className="h-7 w-7 text-blue-600" />
                        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{d.name || `Documento ${i + 1}`}</p></div>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" asChild><a href={d.url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-1" /> Abrir</a></Button>
                      </div>
                      {renderDocumentViewer(d.url, d.name || `Documento ${i + 1}`)}
                    </CardContent>
                  </Card>
                ))}
                {!selectedLesson.documentUrl && (!selectedLesson.documentUrls || parseExtraDocs(selectedLesson.documentUrls).length === 0) && (
                  <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                    <CardContent className="py-10 text-center">
                      <FileText className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No hay documentos disponibles</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ejercicios">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0">
                    <Eye className="h-3 w-3 mr-1" /> Modo Profesor — Vista Espejo
                  </Badge>
                </div>
                {loadingExercises ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : classroomExercises.length === 0 ? (
                  <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                    <CardContent className="py-10 text-center">
                      <Sparkles className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No hay ejercicios para esta leccion</p>
                      <p className="text-xs text-muted-foreground mt-1">Genera ejercicios desde la pestana Ejercicios AI</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Ejercicios ({classroomExercises.length})</h3>
                      <Badge variant="secondary" className="text-[10px]">Solo lectura</Badge>
                    </div>
                    <div className="space-y-3">
                      {classroomExercises.map((ex, i) => {
                        const options = ex.options ? ex.options.split(",").map((o) => o.trim()) : [];
                        return (
                          <Card key={ex.id} className="rounded-xl border-emerald-100">
                            <CardContent className="p-4 space-y-2">
                              <p className="font-medium text-sm">{i + 1}. {ex.question}</p>
                              {ex.type === "multiple_choice" && options.length > 0 && (
                                <div className="space-y-1.5">
                                  {options.map((opt) => (
                                    <div key={opt} className={`p-2 rounded-lg text-xs border ${opt === ex.correctAnswer ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium" : "border-gray-100 text-gray-600"}`}>
                                      {opt === ex.correctAnswer && "✓ "}{opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {ex.type === "true_false" && (
                                <div className="flex gap-2">
                                  <div className={`flex-1 p-2 rounded-lg text-xs border text-center ${ex.correctAnswer === "true" ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium" : "border-gray-100 text-gray-600"}`}>✓ Verdadero</div>
                                  <div className={`flex-1 p-2 rounded-lg text-xs border text-center ${ex.correctAnswer === "false" ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium" : "border-gray-100 text-gray-600"}`}>✓ Falso</div>
                                </div>
                              )}
                              {ex.type === "fill_blank" && (
                                <div className="p-2 rounded-lg text-xs border border-emerald-300 bg-emerald-50 text-emerald-800">
                                  ✓ Respuesta: {ex.correctAnswer}
                                </div>
                              )}
                              {ex.explanation && (
                                <p className="text-xs text-muted-foreground italic mt-1">💡 {ex.explanation}</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    );
  }

  // Lesson list (similar to student dashboard but for teacher)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-5 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <MonitorPlay className="h-4 w-4 text-amber-300" />
            <p className="text-violet-100 text-xs font-medium">Modo Presentador</p>
          </div>
          <h1 className="text-xl font-bold">Vista de Clase</h1>
          <p className="text-violet-200 text-sm mt-0.5">Selecciona una leccion para presentar en vivo</p>
        </div>
      </div>
      {lessons.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-8 w-8 text-emerald-300 mx-auto mb-3" />
            <p className="font-medium text-emerald-900">No hay lecciones publicadas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const iconData = getLessonIcon(lesson.title);
            const IconComp = iconData.icon;
            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="rounded-xl cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all border-violet-50 overflow-hidden group" onClick={() => { setSelectedLesson(lesson); setActiveTab("contenido"); }}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${iconData.bg} ${iconData.color}`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-gray-800">{lesson.title.replace(/^Clase \d+:\s*/, "")}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{lesson.description || "Leccion"}</p>
                        <div className="flex gap-1 mt-1.5">
                          {lesson.youtubeUrl && <Badge variant="secondary" className="text-[9px] h-4">YouTube</Badge>}
                          {lesson.tiktokUrl && <Badge variant="secondary" className="text-[9px] h-4 bg-pink-100 text-pink-700">TikTok</Badge>}
                          {lesson.videoUrl && <Badge variant="secondary" className="text-[9px] h-4">Video</Badge>}
                          {lesson.documentUrl && <Badge variant="secondary" className="text-[9px] h-4 bg-amber-100 text-amber-700">Doc</Badge>}
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-violet-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  STUDENT DASHBOARD
// ════════════════════════════════════════════════════════════════
// fallback icon aliases (must be before LESSON_ICONS which references them)
const School = GraduationCap;
const Hash = Target;
const Calendar = Clock;
const History = BookOpen;
const Utensils = BookOpen;

// Helper: topic-based icon and color for lesson cards
const LESSON_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "diagnóstico": { icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-100" },
  "saludo": { icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-100" },
  "alfabeto": { icon: BookMarked, color: "text-cyan-600", bg: "bg-cyan-100" },
  "pronunciación": { icon: Volume2, color: "text-pink-600", bg: "bg-pink-100" },
  "vocabulario": { icon: Languages, color: "text-orange-600", bg: "bg-orange-100" },
  "aula": { icon: School, color: "text-teal-600", bg: "bg-teal-100" },
  "número": { icon: Hash, color: "text-indigo-600", bg: "bg-indigo-100" },
  "fecha": { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-100" },
  "familia": { icon: Heart, color: "text-rose-600", bg: "bg-rose-100" },
  "rutina": { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  "comida": { icon: Utensils, color: "text-red-600", bg: "bg-red-100" },
  "restaurante": { icon: Utensils, color: "text-red-600", bg: "bg-red-100" },
  "lugar": { icon: Map, color: "text-emerald-600", bg: "bg-emerald-100" },
  "dirección": { icon: Map, color: "text-emerald-600", bg: "bg-emerald-100" },
  "verbo": { icon: PenTool, color: "text-blue-600", bg: "bg-blue-100" },
  "artículo": { icon: BookOpen, color: "text-sky-600", bg: "bg-sky-100" },
  "pronombre": { icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  "presente": { icon: Play, color: "text-green-600", bg: "bg-green-100" },
  "pasado": { icon: History, color: "text-stone-600", bg: "bg-stone-100" },
  "futuro": { icon: Zap, color: "text-yellow-600", bg: "bg-yellow-100" },
  "preposición": { icon: Target, color: "text-lime-600", bg: "bg-lime-100" },
  "adjetivo": { icon: Palette, color: "text-fuchsia-600", bg: "bg-fuchsia-100" },
  "adverbio": { icon: Sparkles, color: "text-fuchsia-600", bg: "bg-fuchsia-100" },
  "repaso": { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-100" },
  "autoevaluación": { icon: Award, color: "text-emerald-600", bg: "bg-emerald-100" },
};

function getLessonIcon(title: string) {
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(LESSON_ICONS)) {
    if (lower.includes(key)) return val;
  }
  return { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100" };
}

function StudentDashboard({ user, modules, progressData, accessGrants, onRefresh, onSelectLesson }: { user: User; modules: Module[]; progressData: StudentProgress[]; accessGrants: StudentAccess[]; onRefresh: () => void; onSelectLesson: (l: Lesson) => void }) {
  const [accessibleLessons, setAccessibleLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccessible = useCallback(async () => {
    if (modules.length === 0) { setLoading(false); return; }
    try {
      const grants = await api<StudentAccess[]>(`/api/access`);
      const accessMap = new Set(grants.filter((g) => g.studentId === user.id && g.active).map((g) => g.lessonId));
      
      const allLessons: Lesson[] = [];
      for (const mod of modules) {
        const lessons = await api<Lesson[]>(`/api/lessons?moduleId=${mod.id}`);
        allLessons.push(...lessons.map((l) => ({ ...l, moduleId: mod.id })));
      }
      
      const accessible = allLessons
        .filter((l) => l.status === "PUBLISHED")
        .sort((a, b) => a.orderIndex - b.orderIndex);
      
      const progressLessonIds = new Set(progressData.map((p) => p.lessonId));
      const final = accessible.filter((l) => accessMap.has(l.id) || progressLessonIds.has(l.id));
      setAccessibleLessons(final);
    } catch { /* silent */ }
    setLoading(false);
  }, [modules, user, progressData]);

  useEffect(() => { loadAccessible(); }, [loadAccessible]); // eslint-disable-line react-hooks/set-state-in-effect

  const getProgress = (lessonId: string) => {
    const p = progressData.find((pr) => pr.lessonId === lessonId);
    return p || { progressPercent: 0, completed: false };
  };

  // Group lessons by module
  const lessonsByModule = useMemo(() => {
    const grouped: { mod: Module; lessons: Lesson[] }[] = [];
    for (const mod of modules) {
      const modLessons = accessibleLessons.filter((l) => l.moduleId === mod.id);
      if (modLessons.length > 0) grouped.push({ mod, lessons: modLessons });
    }
    return grouped;
  }, [modules, accessibleLessons]);

  // Stats
  const totalLessons = accessibleLessons.length;
  const completedLessons = accessibleLessons.filter((l) => getProgress(l.id).completed).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-5 pb-24">
      {/* Welcome Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-5 text-white"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 right-20 w-8 h-8 bg-amber-300/20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <p className="text-emerald-100 text-xs font-medium">Chambari Academy</p>
          </div>
          <h1 className="text-xl font-bold">Hola, {user.name.split(" ")[0]}!</h1>
          <p className="text-emerald-200 text-sm mt-0.5">Continua tu aprendizaje de ingles</p>
          
          {/* Progress bar */}
          {totalLessons > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-100">Progreso general</span>
                <span className="text-xs font-bold">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full"
                />
              </div>
            </div>
          )}
          
          {/* Stats Row */}
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 flex-1">
              <BookOpen className="h-4 w-4" />
              <div>
                <p className="text-[10px] text-emerald-100">Lecciones</p>
                <p className="text-sm font-bold">{completedLessons}/{totalLessons}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 flex-1">
              <Trophy className="h-4 w-4" />
              <div>
                <p className="text-[10px] text-emerald-100">Completadas</p>
                <p className="text-sm font-bold">{completedLessons}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 flex-1">
              <Flame className="h-4 w-4 text-orange-300" />
              <div>
                <p className="text-[10px] text-emerald-100">Racha</p>
                <p className="text-sm font-bold">{completedLessons > 0 ? Math.min(completedLessons, 7) : 0} dias</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {accessibleLessons.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
              <BookOpen className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="font-medium text-emerald-900">No hay lecciones disponibles</p>
            <p className="text-xs text-muted-foreground mt-1">Tu profesor te dara acceso pronto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {lessonsByModule.map(({ mod, lessons: modLessons }, mIdx) => {
            const modCompleted = modLessons.filter((l) => getProgress(l.id).completed).length;
            const modProgress = Math.round((modCompleted / modLessons.length) * 100);
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mIdx * 0.1 }}
              >
                {/* Module Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                      {mIdx + 1}
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-emerald-900">{mod.title.replace(/^Módulo \d+:\s*/, "")}</h2>
                      <p className="text-[10px] text-muted-foreground">{modCompleted} de {modLessons.length} completadas</p>
                    </div>
                  </div>
                  <Badge variant={modProgress === 100 ? "default" : "secondary"} className={modProgress === 100 ? "bg-emerald-600 text-[10px]" : "text-[10px]"}>
                    {modProgress}%
                  </Badge>
                </div>
                <Progress value={modProgress} className="h-1 mb-3 bg-emerald-100" />

                {/* Lessons Grid */}
                <div className="space-y-2.5">
                  {modLessons.map((lesson, index) => {
                    const prog = getProgress(lesson.id);
                    const iconData = getLessonIcon(lesson.title);
                    const IconComp = iconData.icon;
                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mIdx * 0.1 + index * 0.04 }}
                      >
                        <Card
                          className="rounded-xl cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-emerald-50 overflow-hidden group"
                          onClick={() => onSelectLesson(lesson)}
                        >
                          <CardContent className="p-3.5">
                            <div className="flex items-center gap-3">
                              {/* Icon */}
                              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${prog.completed ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : iconData.bg + " " + iconData.color}`}>
                                {prog.completed ? <CheckCircle className="h-5 w-5" /> : <IconComp className="h-5 w-5" />}
                              </div>
                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`font-semibold text-sm truncate ${prog.completed ? "text-emerald-700" : "text-gray-800"}`}>{lesson.title.replace(/^Clase \d+:\s*/, "")}</p>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5 line-clamp-1">
                                  {lesson.description || `Leccion ${lesson.orderIndex + 1}`}
                                </p>
                                {/* Mini progress */}
                                {!prog.completed && prog.progressPercent > 0 && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <Progress value={prog.progressPercent} className="h-1 flex-1 bg-gray-100" />
                                    <span className="text-[9px] text-muted-foreground">{prog.progressPercent}%</span>
                                  </div>
                                )}
                              </div>
                              {/* Arrow */}
                              <div className={`shrink-0 transition-transform group-hover:translate-x-1 ${prog.completed ? "text-emerald-400" : "text-gray-300"}`}>
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  LESSON CONTENT RENDERER — Visual & Didactic
// ════════════════════════════════════════════════════════════════
function LessonContentRenderer({ content }: { content: string }) {
  const parsed = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const blocks: { type: string; content: string; items?: string[] }[] = [];
    let currentBlock: { type: string; content: string; items: string[] } | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (currentBlock) { blocks.push(currentBlock); currentBlock = null; }
        continue;
      }
      // Detect headers (## or ### or numbered like "1." at start)
      if (/^#{1,3}\s/.test(line) || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(line)) {
        if (currentBlock) { blocks.push(currentBlock); currentBlock = null; }
        const cleanLine = line.replace(/^#{1,3}\s*/, "").replace(/^\d+\.\s*/, "");
        blocks.push({ type: "header", content: cleanLine });
        continue;
      }
      // Detect bullet points (- or * or •)
      if (/^[-*•]\s/.test(line)) {
        if (!currentBlock || currentBlock.type !== "list") {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "list", content: "", items: [] };
        }
        const itemText = line.replace(/^[-*•]\s*/, "");
        // Check for bold (text between **)
        currentBlock.items!.push(itemText);
        continue;
      }
      // Detect example lines (Ejemplo:, Example:, Ej:)
      if (/^(Ejemplo|Example|Ej)\s*:/i.test(line)) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({ type: "example", content: line.replace(/^(Ejemplo|Example|Ej)\s*:\s*/i, "") });
        currentBlock = null;
        continue;
      }
      // Detect tip/note lines (Nota:, Tip:, Recuerda:, Importante:)
      if (/^(Nota|Tip|Recuerda|Importante|Ojo|Atención)\s*[:.]/i.test(line)) {
        if (currentBlock) blocks.push(currentBlock);
        blocks.push({ type: "tip", content: line.replace(/^(Nota|Tip|Recuerda|Importante|Ojo|Atención)\s*[:.]\s*/i, "") });
        currentBlock = null;
        continue;
      }
      // Detect dialog/conversation lines (A:, B:, Person 1:, etc.)
      if (new RegExp("^[A-B]:\\s", "i").test(line) || new RegExp("^(Person|Persona|Profesor|Estudiante)\\s*\\d?\\s*:", "i").test(line)) {
        if (!currentBlock || currentBlock.type !== "dialog") {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { type: "dialog", content: "", items: [] };
        }
        currentBlock.items!.push(line);
        continue;
      }
      // Regular paragraph
      if (currentBlock && currentBlock.type === "paragraph") {
        currentBlock.content += " " + line;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "paragraph", content: line, items: [] };
      }
    }
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }, [content]);

  const renderBold = (text: string) => {
    // Parse **bold** text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-emerald-800">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-4">
      {parsed.map((block, i) => {
        switch (block.type) {
          case "header":
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 mt-5 first:mt-0"
              >
                <div className="h-6 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <h3 className="font-bold text-emerald-900 text-base">{renderBold(block.content)}</h3>
              </motion.div>
            );
          case "list":
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-emerald-50 p-3 space-y-2"
              >
                {block.items!.map((item, j) => (
                  <div key={j} className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">{renderBold(item)}</p>
                  </div>
                ))}
              </motion.div>
            );
          case "example":
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 pl-10"
              >
                <MessageCircle className="absolute top-3.5 left-3 h-5 w-5 text-blue-400" />
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Ejemplo</p>
                <p className="text-sm leading-relaxed text-blue-900">{renderBold(block.content)}</p>
              </motion.div>
            );
          case "tip":
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 pl-10"
              >
                <Lightbulb className="absolute top-3.5 left-3 h-5 w-5 text-amber-500" />
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Consejo</p>
                <p className="text-sm leading-relaxed text-amber-900">{renderBold(block.content)}</p>
              </motion.div>
            );
          case "dialog":
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-4 space-y-2.5"
              >
                <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> Conversacion
                </p>
                {block.items!.map((line, j) => {
                  const match = line.match(/^([A-B]|(?:Person|Persona|Profesor|Estudiante)\s*\d?):\s*(.*)/i);
                  if (!match) return <p key={j} className="text-sm text-gray-700">{renderBold(line)}</p>;
                  const isPersonA = /^A:|Person\s*1:|Profesor:/i.test(match[1]);
                  return (
                    <div key={j} className={`flex gap-2 ${isPersonA ? "" : "pl-6"}`}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isPersonA ? "bg-violet-500 text-white" : "bg-white text-violet-600 border border-violet-200"}`}>
                        {isPersonA ? "A" : "B"}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700 pt-1">{renderBold(match[2])}</p>
                    </div>
                  );
                })}
              </motion.div>
            );
          case "paragraph":
          default:
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="text-sm leading-relaxed text-gray-700"
              >
                {renderBold(block.content)}
              </motion.p>
            );
        }
      })}
    </div>
  );
}

// ── Document Viewer Helper ──────────────────────────────────
// Handles PDFs, Google Docs, Google Drive, and any URL
function renderDocumentViewer(url: string, title: string) {
  if (!url) return null;
  
  // Convert Google Drive links to embeddable format
  let embedUrl = url;
  if (url.includes('drive.google.com') && url.includes('/file/d/')) {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
    if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  } else if (url.includes('drive.google.com') && url.includes('/open?id=')) {
    const fileId = new URL(url).searchParams.get('id');
    if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  } else if (url.includes('docs.google.com/document') || url.includes('docs.google.com/spreadsheets') || url.includes('docs.google.com/presentation')) {
    // Google Docs/Sheets/Slides - use /preview
    embedUrl = url.replace(/\/edit.*$/, '/preview');
  } else if (url.endsWith('.pdf') || url.includes('.pdf?')) {
    // PDFs - use Google Docs Viewer
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    embedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  } else if (!url.startsWith('http')) {
    // Local file - use Google Docs Viewer with full URL
    const fullUrl = `${window.location.origin}${url}`;
    embedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  }

  return (
    <div className="mt-3 aspect-[3/4] rounded-xl overflow-hidden bg-muted border relative">
      <iframe 
        src={embedUrl} 
        className="w-full h-full" 
        title={title}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  STUDENT LESSON VIEW
// ════════════════════════════════════════════════════════════════
function StudentLesson({ user, lesson, exercises, progressData, studentAnswers, onAnswerChange, onBack, onSubmitProgress, onCapture, onRefreshExercises }: { user: User; lesson: Lesson; exercises: Exercise[]; progressData: StudentProgress[]; studentAnswers: Record<string, string>; onAnswerChange: (a: Record<string, string>) => void; onBack: () => void; onSubmitProgress: (lessonId: string, pct: number, completed: boolean) => void; onCapture: () => Promise<{ blob: Blob; url: string } | null>; onRefreshExercises: () => void }) {
  const [activeTab, setActiveTab] = useState("contenido");
  const [caption, setCaption] = useState("");
  const [sendingCapture, setSendingCapture] = useState(false);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const currentProgress = progressData.find((p) => p.lessonId === lesson.id);
  const progressPercent = currentProgress?.progressPercent || 0;

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
  };

  const getTiktokEmbedUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : "";
  };

  const parseExtraVideos = (videoUrls: string | undefined) => {
    if (!videoUrls) return [];
    try { return JSON.parse(videoUrls); } catch { return []; }
  };

  const parseExtraDocs = (docUrls: string | undefined) => {
    if (!docUrls) return [];
    try { return JSON.parse(docUrls); } catch { return []; }
  };

  const checkAnswer = (ex: Exercise) => {
    const answer = studentAnswers[ex.id];
    return answer === ex.correctAnswer;
  };

  const exerciseScore = exercises.length > 0 ? exercises.filter((ex) => checkAnswer(ex)).length : 0;

  const markComplete = () => {
    const pct = exercises.length > 0 ? Math.round((exerciseScore / exercises.length) * 100) : 100;
    onSubmitProgress(lesson.id, Math.max(pct, 100), true);
  };

  const sendScreenshot = async () => {
    const result = await onCapture();
    if (!result) return;
    setSendingCapture(true);
    try {
      // Upload the screenshot
      const formData = new FormData();
      formData.append("file", result.blob, "screenshot.png");
      const uploadRes = await apiUpload("/api/upload", formData);
      
      // Save screenshot record
      await api("/api/screenshots", {
        method: "POST",
        body: JSON.stringify({
          lessonId: lesson.id,
          imageUrl: uploadRes.url,
          caption: caption || undefined,
        }),
      });

      toast.success("Captura enviada al profesor");
      setCaption("");
    } catch {
      toast.error("Error al enviar captura");
    }
    setSendingCapture(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);
    try {
      const data = await api<{ message: string }>("/api/ai-chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          lessonContext: lesson.title + (lesson.description ? " — " + lesson.description : ""),
        }),
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (e: any) {
      const errMsg = e?.message || 'Error desconocido';
      const friendlyMsg = errMsg.includes('401')
        ? 'Tu sesión expiró. Vuelve a iniciar sesión para usar el asistente IA.'
        : 'Lo siento, tuve un problema de conexión. Intenta de nuevo.';
      setChatMessages((prev) => [...prev, { role: "assistant", content: friendlyMsg }]);
    }
    setChatLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 pt-3 pb-2.5">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-8 w-8 shrink-0 hover:bg-emerald-50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate text-emerald-900">{lesson.title}</h2>
            <p className="text-[10px] text-muted-foreground truncate">{lesson.description}</p>
          </div>
          {currentProgress?.completed && (
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] shrink-0 border-0">
              <CheckCircle className="h-3 w-3 mr-1" /> Completada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-medium w-7 text-right">{progressPercent}%</span>
        </div>
      </div>

      {/* Content */}
      <div id="lesson-content-area" className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-6 mb-4 h-11">
            <TabsTrigger value="contenido" className="text-[11px] gap-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BookOpen className="h-3.5 w-3.5" /> Contenido
            </TabsTrigger>
            <TabsTrigger value="video" className="text-[11px] gap-1">
              <Play className="h-3.5 w-3.5" /> Video
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-[11px] gap-1">
              <FileText className="h-3.5 w-3.5" /> Docs
            </TabsTrigger>
            <TabsTrigger value="ejercicios" className="text-[11px] gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Tests
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-[11px] gap-1">
              <Bot className="h-3.5 w-3.5" /> IA
            </TabsTrigger>
            <TabsTrigger value="capturar" className="text-[11px] gap-1">
              <Camera className="h-3.5 w-3.5" /> Foto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contenido">
            {lesson.content ? (
              <LessonContentRenderer content={lesson.content} />
            ) : (
              <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                <CardContent className="py-10 text-center">
                  <div className="h-14 w-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                    <BookOpen className="h-7 w-7 text-emerald-300" />
                  </div>
                  <p className="text-muted-foreground font-medium">Contenido en preparacion</p>
                  <p className="text-xs text-muted-foreground mt-1">Tu profesor lo publicara pronto</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="video">
              <div className="space-y-4">
                {/* Main YouTube video */}
                {lesson.youtubeUrl && getYoutubeEmbedUrl(lesson.youtubeUrl) && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video"><iframe src={getYoutubeEmbedUrl(lesson.youtubeUrl)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" /></div>
                      <div className="p-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center"><Play className="h-3 w-3 text-red-600" /></div>
                        <p className="text-xs font-medium text-muted-foreground">Video principal - YouTube</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* TikTok video */}
                {lesson.tiktokUrl && getTiktokEmbedUrl(lesson.tiktokUrl) && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[9/16] max-h-[500px] mx-auto"><iframe src={getTiktokEmbedUrl(lesson.tiktokUrl)} className="w-full h-full" allowFullScreen /></div>
                      <div className="p-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-pink-100 flex items-center justify-center"><Music className="h-3 w-3 text-pink-600" /></div>
                        <p className="text-xs font-medium text-muted-foreground">Video - TikTok</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Direct video */}
                {lesson.videoUrl && (
                  <Card className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black"><video src={lesson.videoUrl} controls className="w-full h-full" /></div>
                    </CardContent>
                  </Card>
                )}
                {/* Additional videos */}
                {parseExtraVideos(lesson.videoUrls).map((v: { url: string; title?: string }, i: number) => (
                  <Card key={i} className="rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      {getYoutubeEmbedUrl(v.url) ? (
                        <div className="aspect-video"><iframe src={getYoutubeEmbedUrl(v.url)} className="w-full h-full" allowFullScreen /></div>
                      ) : getTiktokEmbedUrl(v.url) ? (
                        <div className="aspect-[9/16] max-h-[500px] mx-auto"><iframe src={getTiktokEmbedUrl(v.url)} className="w-full h-full" allowFullScreen /></div>
                      ) : (
                        <div className="aspect-video bg-black"><video src={v.url} controls className="w-full h-full" /></div>
                      )}
                      <div className="p-3"><p className="text-xs font-medium text-muted-foreground">{v.title || `Video adicional ${i + 1}`}</p></div>
                    </CardContent>
                  </Card>
                ))}
                {!lesson.youtubeUrl && !lesson.tiktokUrl && !lesson.videoUrl && (!lesson.videoUrls || parseExtraVideos(lesson.videoUrls).length === 0) && (
                  <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                    <CardContent className="py-10 text-center">
                      <Video className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No hay videos disponibles</p>
                    </CardContent>
                  </Card>
                )}
              </div>
          </TabsContent>

          <TabsContent value="documentos">
              <div className="space-y-3">
                {/* Main document */}
                {lesson.documentUrl && (
                  <Card className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <FileText className="h-8 w-8 text-amber-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lesson.documentName || "Documento principal"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{lesson.documentUrl}</p>
                        </div>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                          <a href={lesson.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" /> Abrir
                          </a>
                        </Button>
                      </div>
                      {/* Embedded document viewer */}
                      {renderDocumentViewer(lesson.documentUrl, lesson.documentName || "Documento principal")}
                    </CardContent>
                  </Card>
                )}
                {/* Additional documents */}
                {parseExtraDocs(lesson.documentUrls).map((d: { url: string; name?: string }, i: number) => (
                  <Card key={i} className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <FileText className="h-7 w-7 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{d.name || `Documento ${i + 1}`}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{d.url}</p>
                        </div>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" asChild><a href={d.url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-1" /> Abrir</a></Button>
                      </div>
                      {renderDocumentViewer(d.url, d.name || `Documento ${i + 1}`)}
                    </CardContent>
                  </Card>
                ))}
                {!lesson.documentUrl && (!lesson.documentUrls || parseExtraDocs(lesson.documentUrls).length === 0) && (
                  <Card className="rounded-2xl border-dashed border-2 border-emerald-200">
                    <CardContent className="py-10 text-center">
                      <FileText className="h-7 w-7 text-emerald-300 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No hay documentos disponibles</p>
                    </CardContent>
                  </Card>
                )}
              </div>
          </TabsContent>

          <TabsContent value="ejercicios">
            <Card className="rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Ejercicios</h3>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={onRefreshExercises}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Recargar
                  </Button>
                </div>

                {exercises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-2 text-amber-300" />
                    <p>No hay ejercicios disponibles</p>
                    <p className="text-xs mt-1">Tu profesor los generará pronto</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {exercises.map((ex, i) => {
                        const answered = !!studentAnswers[ex.id];
                        const correct = answered && checkAnswer(ex);
                        const options = ex.options ? ex.options.split(",").map((o) => o.trim()) : [];
                        
                        return (
                          <div key={ex.id} className={`p-4 rounded-xl border ${correct ? "border-emerald-300 bg-emerald-50" : answered && !correct ? "border-red-300 bg-red-50" : "border-emerald-100 bg-white"}`}>
                            <p className="font-medium text-sm mb-3">{i + 1}. {ex.question}</p>
                            
                            {ex.type === "true_false" && (
                              <div className="flex gap-2">
                                {[["true", "Verdadero"], ["false", "Falso"]].map(([val, label]) => (
                                  <Button
                                    key={val}
                                    variant={studentAnswers[ex.id] === val ? "default" : "outline"}
                                    className={`rounded-xl flex-1 ${studentAnswers[ex.id] === val ? (correct ? "bg-emerald-600" : "bg-red-500") : ""}`}
                                    onClick={() => onAnswerChange({ ...studentAnswers, [ex.id]: val })}
                                  >
                                    {label}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {ex.type === "multiple_choice" && options.length > 0 && (
                              <div className="space-y-2">
                                {options.map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => onAnswerChange({ ...studentAnswers, [ex.id]: opt })}
                                    className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
                                      studentAnswers[ex.id] === opt
                                        ? correct ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-red-400 bg-red-100 text-red-800"
                                        : "border-emerald-100 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}

                            {ex.type === "fill_blank" && (
                              <Input
                                value={studentAnswers[ex.id] || ""}
                                onChange={(e) => onAnswerChange({ ...studentAnswers, [ex.id]: e.target.value })}
                                placeholder="Tu respuesta..."
                                className={`rounded-xl ${answered && !correct ? "border-red-400" : answered && correct ? "border-emerald-400" : ""}`}
                              />
                            )}

                            {answered && !correct && (
                              <p className="text-xs text-emerald-600 mt-2">✓ Respuesta correcta: <strong>{ex.correctAnswer}</strong></p>
                            )}
                            {ex.explanation && answered && (
                              <p className="text-xs text-muted-foreground mt-2 italic">💡 {ex.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-sm font-medium">Puntuación: {exerciseScore}/{exercises.length}</span>
                      <Button onClick={markComplete} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" disabled={exerciseScore === 0}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Marcar Completada
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="rounded-xl flex flex-col" style={{ height: "500px" }}>
              <CardContent className="p-4 flex flex-col flex-1 gap-3 min-h-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Asistente Chambari</p>
                    <p className="text-[10px] text-muted-foreground">Tu tutor de ingles con IA</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-0">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                      <p className="text-sm font-medium">Hola, soy tu asistente</p>
                      <p className="text-xs mt-1">Preguntame sobre la leccion o cualquier tema de ingles</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {[
                          "Explica el presente simple",
                          "Como uso 'much' y 'many'?",
                          "Dame ejemplos con esta leccion",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => { setChatInput(suggestion); }}
                            className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-md"
                          : "bg-white border border-emerald-100 text-gray-700 rounded-bl-md"
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-emerald-100 p-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2 pt-2 border-t border-emerald-100">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Pregunta algo..."
                    className="rounded-xl flex-1 text-sm"
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10 p-0"
                  >
                    {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capturar">
            <Card className="rounded-xl">
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <Camera className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="font-semibold">Captura de Pantalla</h3>
                  <p className="text-sm text-muted-foreground mt-1">Toma una foto o captura de tu trabajo</p>
                </div>
                <div className="space-y-2">
                  <Label>Nota (opcional)</Label>
                  <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Añade una nota para tu profesor..." className="rounded-xl" />
                </div>
                <Button onClick={sendScreenshot} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white h-11" disabled={sendingCapture}>
                  {sendingCapture ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  Tomar y Enviar Captura
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
