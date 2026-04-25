"use client";

/* ============================================================
   CHAMBARI ACADEMY — Complete Single-Page Application
   ============================================================ */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// socket.io types only — actual import is dynamic to prevent SSR/hydration issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Socket = any;

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
  MessageCircle, Video, Book, Home, Plus, Trash2, Edit, LogOut,
  Menu, Search, Send, X, ChevronLeft, ChevronRight, ChevronDown,
  Upload, CheckCircle, Circle, Play, Eye, Download, RefreshCw,
  Globe, Mic, Volume2, FileText, PenTool, ArrowLeft, Loader2,
  Phone, Monitor, Star, Award, Clock, Target, Zap, Shield,
  Brain, Heart, Lightbulb, Library, Settings
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
  documentUrl?: string;
  documentName?: string;
  meetingUrl?: string;
  meetingRoom?: string;
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

interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  lessonId?: string;
  body: string;
  senderRole: string;
  readAt?: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
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
  return fetch(path, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData }).then(r => {
    if (!r.ok) throw new Error("Error al subir archivo");
    return r.json();
  });
}

// ── View Type ─────────────────────────────────────────────────
type View = "landing" | "login" | "register" | "teacher" | "student";
type TeacherView = "dashboard" | "modules" | "lesson-editor" | "students" | "exercises" | "progress" | "screenshots" | "chat" | "classroom" | "dictionary";
type StudentView = "dashboard" | "lesson" | "exercises" | "dictionary" | "chat" | "classroom" | "capture";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [phoneticEntries, setPhoneticEntries] = useState<PhoneticEntry[]>([]);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [activeClassroom, setActiveClassroom] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});

  // ── Refs for socket ────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const socketConnectedRef = useRef(false);
  const viewRef = useRef(view);
  const teacherViewRef = useRef(teacherView);
  const studentViewRef = useRef(studentView);

  // Keep refs in sync (must be in useEffect per React 19 rules)
  useEffect(() => {
    viewRef.current = view;
    teacherViewRef.current = teacherView;
    studentViewRef.current = studentView;
  });

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

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const otherId = messages.length > 0 ? (messages[0].senderId === user.id ? messages[0].receiverId : messages[0].senderId) : undefined;
      const params = otherId ? `?senderId=${user.id}&receiverId=${otherId}` : "";
      const data = await api<Message[]>(`/api/messages${params}`);
      setMessages(data);
    } catch { /* silent */ }
  }, [user, messages]);

  const fetchMessagesWith = useCallback(async (otherId: string) => {
    if (!user) return;
    try {
      const data = await api<Message[]>(`/api/messages?senderId=${user.id}&receiverId=${otherId}`);
      setMessages(data);
    } catch { /* silent */ }
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
    } catch { toast.error("Error al cargar diccionario"); }
  }, []);

  const fetchExercises = useCallback(async (lessonId: string) => {
    try {
      const data = await api<Exercise[]>(`/api/exercises/${lessonId}`);
      setCurrentExercises(data);
    } catch { setCurrentExercises([]); }
  }, []);

  // ── WebSocket (dynamic import to prevent hydration issues) ──
  useEffect(() => {
    if (!user || socketConnectedRef.current) return;
    let socket: Socket | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import("socket.io-client");
        if (cancelled) return;
        socket = io("/?XTransformPort=3003", { transports: ["websocket", "polling"], reconnectionAttempts: 3, timeout: 5000 });
        socketRef.current = socket;
        socketConnectedRef.current = true;
        socket.on("connect", () => {
          socket!.emit("auth", { userId: user.id, role: user.role, name: user.name });
        });
        socket.on("progress:updated", () => {
          toast.info("Progreso actualizado");
          if (viewRef.current === "teacher" && teacherViewRef.current === "progress") fetchProgress();
        });
        socket.on("screenshot:received", () => {
          toast.info("Nueva captura recibida");
          if (viewRef.current === "teacher" && teacherViewRef.current === "screenshots") fetchScreenshots();
        });
        socket.on("message:notification", () => {
          toast.info("Nuevo mensaje recibido");
          if (viewRef.current === "teacher" && teacherViewRef.current === "chat") fetchMessages();
          if (viewRef.current === "student" && studentViewRef.current === "chat") fetchMessages();
        });
        socket.on("class:started", (data: { room: string }) => {
          toast.info(`Aula virtual iniciada: ${data.room}`);
          setActiveClassroom(data.room);
        });
        socket.on("class:ended", () => {
          toast.info("Aula virtual finalizada");
          setActiveClassroom(null);
        });
        socket.on("student:online", (data: { name: string }) => {
          toast.success(`${data.name} se ha conectado`);
        });
        socket.on("student:offline", (data: { name: string }) => {
          toast.info(`${data.name} se ha desconectado`);
        });
        socket.on("connect_error", () => {
          // Silent fail — WebSocket is optional
        });
      } catch {
        // socket.io not available — continue without real-time features
      }
    })();

    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, [user, fetchProgress, fetchScreenshots, fetchMessages]);

  // Load data based on view
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (view === "teacher") {
      fetchModules();
      fetchStudents();
      fetchProgress();
      fetchPhonetic();
      fetchScreenshots();
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
    if (socketRef.current) socketRef.current.disconnect();
    toast.success("Sesión cerrada");
  };

  // ── Screenshot capture (student) ──────────────────────────
  const captureScreenshot = useCallback(() => {
    const contentEl = document.getElementById("lesson-content-area");
    if (!contentEl) { toast.error("No hay contenido para capturar"); return null; }
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
              Clases en vivo, ejercicios interactivos, diccionario fonético y seguimiento personalizado para cada estudiante.
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
              { icon: Video, title: "Aula Virtual", desc: "Clases en vivo con Jitsi Meet" },
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
              {teacherView === "lesson-editor" && <TeacherLessonEditor key="editor" module={selectedModule} lesson={selectedLesson} students={students} onSave={() => { fetchModules(); setTeacherView("modules"); }} onBack={() => setTeacherView("modules")} />}
              {teacherView === "students" && <TeacherStudents key="students" students={students} progressData={progressData} onRefresh={() => { fetchStudents(); fetchProgress(); }} />}
              {teacherView === "exercises" && <TeacherExercises key="exercises" modules={modules} />}
              {teacherView === "progress" && <TeacherProgress key="progress" students={students} progressData={progressData} onRefresh={fetchProgress} />}
              {teacherView === "screenshots" && <TeacherScreenshots key="screenshots" screenshots={screenshots} onRefresh={fetchScreenshots} />}
              {teacherView === "chat" && <TeacherChat key="tchat" user={user} students={students} messages={messages} onSendMessage={async (receiverId, body) => { try { await api("/api/messages", { method: "POST", body: JSON.stringify({ receiverId, body }) }); fetchMessagesWith(receiverId); if (socketRef.current) socketRef.current.emit("message:sent", { receiverId }); toast.success("Mensaje enviado"); } catch { toast.error("Error al enviar"); } }} onFetchMessages={fetchMessagesWith} />}
              {teacherView === "classroom" && <TeacherClassroom key="tclassroom" modules={modules} activeClassroom={activeClassroom} onStartClass={(room) => { setActiveClassroom(room); if (socketRef.current) socketRef.current.emit("class:started", { room }); }} onEndClass={() => { setActiveClassroom(null); if (socketRef.current) socketRef.current.emit("class:ended", {}); }} />}
              {teacherView === "dictionary" && <PhoneticDictionary key="tdict" entries={phoneticEntries} onRefresh={() => fetchPhonetic()} onSearch={fetchPhonetic} />}
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
            {studentView === "lesson" && selectedLesson && <StudentLesson key="slesson" user={user} lesson={selectedLesson} exercises={currentExercises} progressData={progressData} studentAnswers={studentAnswers} onAnswerChange={setStudentAnswers} onBack={() => setStudentView("dashboard")} onSubmitProgress={async (lessonId, pct, completed) => { try { await api("/api/progress", { method: "POST", body: JSON.stringify({ lessonId, progressPercent: pct, completed }) }); if (socketRef.current) socketRef.current.emit("progress:updated", { studentId: user.id, lessonId, progressPercent: pct }); toast.success("Progreso guardado"); fetchProgress(); } catch { toast.error("Error al guardar"); } }} onCapture={captureScreenshot} onRefreshExercises={() => fetchExercises(selectedLesson.id)} />}
            {studentView === "dictionary" && <PhoneticDictionary key="sdict" entries={phoneticEntries} onRefresh={() => fetchPhonetic()} onSearch={fetchPhonetic} />}
            {studentView === "chat" && <StudentChat key="schat" user={user} messages={messages} onSendMessage={async (receiverId, body) => { try { await api("/api/messages", { method: "POST", body: JSON.stringify({ receiverId, body }) }); fetchMessagesWith(receiverId); if (socketRef.current) socketRef.current.emit("message:sent", { receiverId }); } catch { toast.error("Error"); } }} onFetchMessages={fetchMessagesWith} />}
            {studentView === "classroom" && <StudentClassroom key="sclass" activeClassroom={activeClassroom} />}
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 flex justify-around items-center h-16 z-50">
          {[
            { icon: BookOpen, label: "Clases", view: "dashboard" as StudentView },
            { icon: Book, label: "Diccionario", view: "dictionary" as StudentView },
            { icon: MessageCircle, label: "Chat", view: "chat" as StudentView },
            { icon: Video, label: "Aula", view: "classroom" as StudentView },
          ].map((item) => (
            <button key={item.view} onClick={() => setStudentView(item.view)} className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${studentView === item.view ? "text-emerald-600" : "text-muted-foreground hover:text-emerald-500"}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
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
    { view: "chat", icon: MessageCircle, label: "Chat" },
    { view: "classroom", icon: Video, label: "Aula Virtual" },
    { view: "dictionary", icon: Book, label: "Diccionario Fonético" },
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

  const togglePublish = async (id: string, moduleId: string) => {
    try {
      await api(`/api/lessons/${id}/publish`, { method: "PUT" });
      toast.success("Estado actualizado");
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(lesson.id, mod.id)}>
                            {lesson.status === "PUBLISHED" ? <Eye className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
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
function TeacherLessonEditor({ module, lesson, students, onSave, onBack }: { module: Module | null; lesson: Lesson | null; students: User[]; onSave: () => void; onBack: () => void }) {
  const [title, setTitle] = useState(lesson?.title || "");
  const [description, setDescription] = useState(lesson?.description || "");
  const [content, setContent] = useState(lesson?.content || "");
  const [youtubeUrl, setYoutubeUrl] = useState(lesson?.youtubeUrl || "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [meetingUrl, setMeetingUrl] = useState(lesson?.meetingUrl || "");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState(lesson?.documentUrl || "");
  const [documentName, setDocumentName] = useState(lesson?.documentName || "");
  const [exerciseType, setExerciseType] = useState("multiple_choice");
  const [exerciseCount, setExerciseCount] = useState("5");
  const [generatedExercises, setGeneratedExercises] = useState<Exercise[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const saveLesson = async () => {
    if (!title.trim()) { toast.error("El título es obligatorio"); return; }
    if (!module && !lesson) { toast.error("No hay módulo seleccionado"); return; }
    setSaving(true);
    try {
      let docUrl = documentUrl;
      let docName = documentName;
      if (documentFile) {
        const formData = new FormData();
        formData.append("file", documentFile);
        const res = await apiUpload("/api/upload", formData);
        docUrl = res.url;
        docName = documentFile.name;
      }
      const body: Record<string, any> = {
        title, description, content, youtubeUrl, videoUrl, meetingUrl,
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
      const data = await api<Exercise[]>("/api/exercises/generate", {
        method: "POST",
        body: JSON.stringify({ lessonId: lesson.id, type: exerciseType, count: parseInt(exerciseCount) }),
      });
      setGeneratedExercises(data);
      toast.success(`${data.length} ejercicios generados`);
    } catch (e: any) { toast.error(e.message); }
    setGenerating(false);
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
                <Label>URL de YouTube</Label>
                <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>URL de Video</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://...mp4" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileUpload} className="rounded-xl" />
                  {documentName && <span className="text-sm text-emerald-600">{documentName}</span>}
                </div>
                {documentUrl && <a href={documentUrl} target="_blank" className="text-sm text-emerald-600 hover:underline flex items-center gap-1"><FileText className="h-3 w-3" /> Ver documento actual</a>}
              </div>
              <div className="space-y-2">
                <Label>URL de Reunión</Label>
                <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.jit.si/..." className="rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ejercicios" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              {lesson ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Ejercicio</Label>
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
                  <Button onClick={generateExercises} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white" disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Generar con IA
                  </Button>
                  {generatedExercises.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h3 className="font-semibold">Ejercicios Generados ({generatedExercises.length})</h3>
                      <ScrollArea className="max-h-96">
                        <div className="space-y-2 pr-4">
                          {generatedExercises.map((ex, i) => (
                            <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                              <p className="text-sm font-medium">{i + 1}. {ex.question}</p>
                              {ex.options && <p className="text-xs text-muted-foreground mt-1">{ex.options}</p>}
                              <p className="text-xs text-emerald-600 mt-1">✓ {ex.correctAnswer}</p>
                              {ex.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{ex.explanation}</p>}
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
                  <p>Guarda la lección primero para generar ejercicios</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acceso" className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Conceder Acceso a Estudiantes</h3>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay estudiantes registrados</p>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2 pr-4">
                    {students.map((s) => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50 cursor-pointer">
                        <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={(v) => {
                          if (v) setSelectedStudents([...selectedStudents, s.id]);
                          else setSelectedStudents(selectedStudents.filter((id) => id !== s.id));
                        }} />
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </label>
                    ))}
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
    setGenerating(true);
    try {
      const data = await api<Exercise[]>("/api/exercises/generate", {
        method: "POST",
        body: JSON.stringify({ lessonId: selectedLessonId, type: exerciseType, count: parseInt(exerciseCount) }),
      });
      setExercises(data);
      toast.success(`${data.length} ejercicios generados`);
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
//  TEACHER CHAT
// ════════════════════════════════════════════════════════════════
function TeacherChat({ user, students, messages, onSendMessage, onFetchMessages }: { user: User; students: User[]; messages: Message[]; onSendMessage: (receiverId: string, body: string) => void; onFetchMessages: (id: string) => void }) {
  const [activeStudent, setActiveStudent] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");

  const sendMessage = () => {
    if (!messageText.trim() || !activeStudent) return;
    onSendMessage(activeStudent.id, messageText.trim());
    setMessageText("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 max-w-5xl mx-auto h-[calc(100vh-10rem)]">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Chat</h1>
        <p className="text-muted-foreground">Mensajes con estudiantes</p>
      </div>

      <Card className="rounded-xl flex-1 overflow-hidden flex" style={{ height: "calc(100vh - 14rem)" }}>
        {/* Student list */}
        <div className="w-64 border-r border-emerald-100 hidden md:block">
          <div className="p-3 border-b border-emerald-100">
            <p className="text-sm font-semibold text-muted-foreground">Estudiantes</p>
          </div>
          <ScrollArea className="h-[calc(100%-48px)]">
            <div>
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveStudent(s); onFetchMessages(s.id); }}
                  className={`w-full p-3 text-left flex items-center gap-3 hover:bg-emerald-50 transition-colors ${activeStudent?.id === s.id ? "bg-emerald-50" : ""}`}
                >
                  <Avatar className="h-8 w-8 bg-emerald-100">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{s.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile student selector */}
        {!activeStudent && (
          <div className="flex-1 p-4 md:hidden">
            <p className="text-sm font-semibold text-muted-foreground mb-3">Selecciona un estudiante</p>
            <div className="space-y-2">
              {students.map((s) => (
                <button key={s.id} onClick={() => { setActiveStudent(s); onFetchMessages(s.id); }} className="w-full p-3 rounded-xl border border-emerald-100 flex items-center gap-3 hover:bg-emerald-50">
                  <Avatar className="h-8 w-8 bg-emerald-100">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        {activeStudent && (
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setActiveStudent(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8 bg-emerald-100">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">{activeStudent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{activeStudent.name}</span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4" ref={(el) => { if (el) { setTimeout(() => { el.querySelector("[data-radix-scroll-area-viewport]")?.scrollTo({ top: 99999 }); }, 100); } }}>
              <div className="space-y-3">
                {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No hay mensajes. ¡Escribe el primero!</p>}
                {messages.map((msg) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] p-3 rounded-xl ${isMine ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-900"}`}>
                        <p className="text-sm">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-emerald-500"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-emerald-100 flex items-center gap-2">
              <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Escribe un mensaje..." className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <Button onClick={sendMessage} size="icon" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TEACHER VIRTUAL CLASSROOM
// ════════════════════════════════════════════════════════════════
function TeacherClassroom({ modules, activeClassroom, onStartClass, onEndClass }: { modules: Module[]; activeClassroom: string | null; onStartClass: (room: string) => void; onEndClass: () => void }) {
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    const loadLessons = async () => {
      const all: Lesson[] = [];
      for (const mod of modules) {
        const data = await api<Lesson[]>(`/api/lessons?moduleId=${mod.id}`);
        all.push(...data);
      }
      setAllLessons(all);
    };
    loadLessons();
  }, [modules]);

  const startClass = () => {
    const room = roomName.trim() || `chambari-${Date.now()}`;
    setRoomName(room);
    onStartClass(room);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Aula Virtual</h1>
        <p className="text-muted-foreground">Clases en vivo con Jitsi Meet</p>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Lección Asociada</Label>
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Elige una lección..." /></SelectTrigger>
              <SelectContent>
                {allLessons.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nombre del Aula (opcional)</Label>
            <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="chambari-mi-clase" className="rounded-xl" />
          </div>

          {!activeClassroom ? (
            <Button onClick={startClass} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11">
              <Video className="h-4 w-4 mr-2" /> Iniciar Clase
            </Button>
          ) : (
            <Button onClick={onEndClass} className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-white h-11">
              <X className="h-4 w-4 mr-2" /> Finalizar Clase
            </Button>
          )}
        </CardContent>
      </Card>

      {activeClassroom && (
        <Card className="rounded-xl overflow-hidden">
          <div className="jitsi-container" style={{ height: "500px" }}>
            <iframe
              src={`https://meet.jit.si/${activeClassroom}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </Card>
      )}
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
//  STUDENT DASHBOARD
// ════════════════════════════════════════════════════════════════
function StudentDashboard({ user, modules, progressData, accessGrants, onRefresh, onSelectLesson }: { user: User; modules: Module[]; progressData: StudentProgress[]; accessGrants: StudentAccess[]; onRefresh: () => void; onSelectLesson: (l: Lesson) => void }) {
  const [accessibleLessons, setAccessibleLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccessible = useCallback(async () => {
    if (modules.length === 0) { setLoading(false); return; }
    try {
      // Fetch access grants for this student
      const grants = await api<StudentAccess[]>(`/api/access`);
      const accessMap = new Set(grants.filter((g) => g.studentId === user.id && g.active).map((g) => g.lessonId));
      
      // Fetch all lessons
      const allLessons: Lesson[] = [];
      for (const mod of modules) {
        const lessons = await api<Lesson[]>(`/api/lessons?moduleId=${mod.id}`);
        allLessons.push(...lessons.map((l) => ({ ...l, moduleId: mod.id })));
      }
      
      // Filter to accessible + published lessons, sorted by order
      const accessible = allLessons
        .filter((l) => l.status === "PUBLISHED")
        .sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Also include lessons that have progress (in case access was removed)
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

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">📚 Mi Pupitre</h1>
          <p className="text-muted-foreground text-sm">Hola, {user.name}</p>
        </div>
      </div>

      {accessibleLessons.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
            <p className="text-muted-foreground">No hay lecciones disponibles todavía</p>
            <p className="text-xs text-muted-foreground mt-1">Tu profesor te dará acceso pronto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accessibleLessons.map((lesson, index) => {
            const prog = getProgress(lesson.id);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="rounded-xl cursor-pointer hover:shadow-md transition-all border-emerald-100 overflow-hidden"
                  onClick={() => onSelectLesson(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${prog.completed ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"}`}>
                        {prog.completed ? <CheckCircle className="h-6 w-6" /> : lesson.orderIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{lesson.title}</p>
                          {prog.completed && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Completada</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{lesson.description || `Lección ${lesson.orderIndex + 1}`}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={prog.progressPercent} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground font-medium">{prog.progressPercent}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
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
//  STUDENT LESSON VIEW
// ════════════════════════════════════════════════════════════════
function StudentLesson({ user, lesson, exercises, progressData, studentAnswers, onAnswerChange, onBack, onSubmitProgress, onCapture, onRefreshExercises }: { user: User; lesson: Lesson; exercises: Exercise[]; progressData: StudentProgress[]; studentAnswers: Record<string, string>; onAnswerChange: (a: Record<string, string>) => void; onBack: () => void; onSubmitProgress: (lessonId: string, pct: number, completed: boolean) => void; onCapture: () => Promise<{ blob: Blob; url: string } | null>; onRefreshExercises: () => void }) {
  const [activeTab, setActiveTab] = useState("contenido");
  const [caption, setCaption] = useState("");
  const [sendingCapture, setSendingCapture] = useState(false);

  const currentProgress = progressData.find((p) => p.lessonId === lesson.id);
  const progressPercent = currentProgress?.progressPercent || 0;

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
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
      
      // Notify via socket
      const { io: socketIo } = await import("socket.io-client");
      const socket = socketIo("/?XTransformPort=3003");
      socket.emit("screenshot:sent", { studentId: user.id, lessonId: lesson.id });
      
      toast.success("Captura enviada al profesor");
      setCaption("");
    } catch {
      toast.error("Error al enviar captura");
    }
    setSendingCapture(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-emerald-100 p-3">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate text-emerald-900">{lesson.title}</h2>
            <p className="text-[10px] text-muted-foreground">{lesson.description}</p>
          </div>
          {currentProgress?.completed && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{progressPercent}%</span>
        </div>
      </div>

      {/* Content */}
      <div id="lesson-content-area" className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="contenido" className="text-xs">Contenido</TabsTrigger>
            <TabsTrigger value="video" className="text-xs">Video</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs">Docs</TabsTrigger>
            <TabsTrigger value="ejercicios" className="text-xs">Ejercicios</TabsTrigger>
            <TabsTrigger value="capturar" className="text-xs">Capturar</TabsTrigger>
          </TabsList>

          <TabsContent value="contenido">
            <Card className="rounded-xl">
              <CardContent className="p-4">
                {lesson.content ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                    {lesson.content}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No hay contenido disponible</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card className="rounded-xl">
              <CardContent className="p-4">
                {lesson.youtubeUrl ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                    <iframe
                      src={getYoutubeEmbedUrl(lesson.youtubeUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : lesson.videoUrl ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                    <video src={lesson.videoUrl} controls className="w-full h-full" />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                    <p>No hay video disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card className="rounded-xl">
              <CardContent className="p-4">
                {lesson.documentUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <FileText className="h-8 w-8 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.documentName || "Documento"}</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-xl" asChild>
                        <a href={lesson.documentUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" /> Abrir
                        </a>
                      </Button>
                    </div>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted border">
                      <iframe src={lesson.documentUrl} className="w-full h-full" title="Documento" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                    <p>No hay documentos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
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

// ════════════════════════════════════════════════════════════════
//  STUDENT CHAT
// ════════════════════════════════════════════════════════════════
function StudentChat({ user, messages, onSendMessage, onFetchMessages }: { user: User; messages: Message[]; onSendMessage: (receiverId: string, body: string) => void; onFetchMessages: (id: string) => void }) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [messageText, setMessageText] = useState("");

  // Derive active teacher from messages
  const activeTeacher = messages.length > 0 ? messages.find((m) => m.senderId !== user.id)?.sender : null;

  // When a student chats, they talk to their teacher (first teacher found)
  const startChat = async () => {
    if (activeTeacher) return;
    try {
      // Get teacher info from existing messages or just use a generic "teacher" id
      // We'll emit a message to any teacher
      const me = await api<User>("/api/auth/me");
      if (me) {
        // For student, just allow typing and send - teacherId will be resolved server-side
      }
    } catch { /* silent */ }
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    // Student sends to teacher - use empty receiverId (server will handle)
    onSendMessage("", messageText.trim());
    setMessageText("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="p-4 border-b border-emerald-100">
        <h1 className="text-xl font-bold text-emerald-900">Chat con Profesor</h1>
      </div>

      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 text-emerald-300" />
                <p>No hay mensajes todavía</p>
                <p className="text-xs mt-1">Escribe un mensaje para tu profesor</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${isMine ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-900"}`}>
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-emerald-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-emerald-100 flex items-center gap-2">
          <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Escribe un mensaje..." className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
          <Button onClick={sendMessage} size="icon" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
//  STUDENT VIRTUAL CLASSROOM
// ════════════════════════════════════════════════════════════════
function StudentClassroom({ activeClassroom }: { activeClassroom: string | null }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-emerald-900">Aula Virtual</h1>
        <p className="text-muted-foreground">Clases en vivo con tu profesor</p>
      </div>

      {!activeClassroom ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
            <p className="text-muted-foreground">No hay clases activas</p>
            <p className="text-xs text-muted-foreground mt-1">Espera a que tu profesor inicie una clase</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl overflow-hidden">
          <div className="jitsi-container" style={{ height: "calc(100vh - 12rem)" }}>
            <iframe
              src={`https://meet.jit.si/${activeClassroom}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </Card>
      )}
    </motion.div>
  );
}
