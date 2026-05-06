'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen, GraduationCap, LogOut, Eye, Trash2,
  CheckCircle2, XCircle, Clock,
  BarChart3, Trophy, ArrowLeft, Send, Loader2,
  BookMarked, Brain, Target, Zap, Upload, FileText,
  Video, MonitorPlay, PenTool, Plus, X, ExternalLink,
  Users, PlayCircle, FileUp
} from 'lucide-react';

// ============== TYPES ==============
type UserRole = 'TEACHER' | 'STUDENT';
type View = 'auth' | 'teacher-dashboard' | 'student-dashboard' | 'class-view';
type AuthView = 'login' | 'register';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface Exercise {
  id: string;
  type: string;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
  orderIndex: number;
}

interface ClassItem {
  id: string;
  title: string;
  topic: string;
  content: string;
  documentUrl: string;
  documentName: string;
  videoUrl: string;
  published: boolean;
  createdAt: string;
  teacher?: { name: string };
  exercises?: Exercise[];
  progress?: Array<{ id: string; score: number; totalQuestions: number; completed: boolean; answers: string }>;
  _count?: { exercises: number; progress: number };
}

// ============== HELPERS ==============
const api = (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chambari_token') : null;
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
};

const isYoutubeSearchUrl = (url: string) => {
  return url.includes('youtube.com/results');
};

const getYoutubeSearchUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/search_query=(.+)/);
  return match ? `https://www.youtube.com/results?search_query=${match[1]}` : url;
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['ppt', 'pptx'].includes(ext)) return '📊';
  if (['xls', 'xlsx'].includes(ext)) return '📈';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['mp4', 'mov'].includes(ext)) return '🎬';
  if (['mp3', 'wav'].includes(ext)) return '🎵';
  return '📎';
};

// ============== MAIN APP ==============
export default function Home() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chambari_user');
        return saved ? JSON.parse(saved) : null;
      } catch { return null; }
    }
    return null;
  });
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chambari_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.role === 'TEACHER' ? 'teacher-dashboard' : 'student-dashboard';
        }
      } catch {}
    }
    return 'auth';
  });
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authLoading, setAuthLoading] = useState(false);

  // Teacher state
  const [teacherClasses, setTeacherClasses] = useState<ClassItem[]>([]);
  const [creatingClass, setCreatingClass] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newLevel, setNewLevel] = useState('intermediate');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editUploading, setEditUploading] = useState(false);

  // Student state
  const [studentClasses, setStudentClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [studentProgress, setStudentProgress] = useState<Record<string, { score: number; totalQuestions: number; completed: boolean; percentage: number }>>({});
  const [showResults, setShowResults] = useState(false);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [isMirrorMode, setIsMirrorMode] = useState(false);

  // Load data based on view
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (view === 'teacher-dashboard') {
        const res = await api('/api/classes');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTeacherClasses(data.classes || []);
        }
      }
      if (view === 'student-dashboard') {
        const [classesRes, progressRes] = await Promise.all([
          api('/api/classes'),
          api('/api/progress'),
        ]);
        if (!cancelled) {
          if (classesRes.ok) {
            const data = await classesRes.json();
            setStudentClasses(data.classes || []);
          }
          if (progressRes.ok) {
            const pData = await progressRes.json();
            const progressMap: Record<string, { score: number; totalQuestions: number; completed: boolean; percentage: number }> = {};
            (pData.progress || []).forEach((p: { classId: string; score: number; totalQuestions: number; completed: boolean }) => {
              progressMap[p.classId] = {
                score: p.score, totalQuestions: p.totalQuestions, completed: p.completed,
                percentage: p.totalQuestions > 0 ? Math.round((p.score / p.totalQuestions) * 100) : 0,
              };
            });
            setStudentProgress(progressMap);
          }
        }
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [view]);

  // ============== AUTH ==============
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    setAuthLoading(true);
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('chambari_token', data.token);
        localStorage.setItem('chambari_user', JSON.stringify(data.user));
        setUser(data.user);
        setView(data.user.role === 'TEACHER' ? 'teacher-dashboard' : 'student-dashboard');
        toast.success(`Bienvenido/a, ${data.user.name}`);
      } else {
        toast.error(data.error || 'Error al iniciar sesión');
      }
    } catch { toast.error('Error de conexión'); }
    setAuthLoading(false);
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    setAuthLoading(true);
    try {
      const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('chambari_token', data.token);
        localStorage.setItem('chambari_user', JSON.stringify(data.user));
        setUser(data.user);
        setView(data.user.role === 'TEACHER' ? 'teacher-dashboard' : 'student-dashboard');
        toast.success(`Cuenta creada. Bienvenido/a, ${data.user.name}`);
      } else { toast.error(data.error || 'Error al registrar'); }
    } catch { toast.error('Error de conexión'); }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('chambari_token');
    localStorage.removeItem('chambari_user');
    setUser(null);
    setView('auth');
    setSelectedClass(null);
    setTeacherClasses([]);
    setStudentClasses([]);
    setIsMirrorMode(false);
    toast.success('Sesión cerrada');
  };

  // ============== FILE UPLOAD ==============
  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('chambari_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedFile({ url: data.url, name: data.originalName });
        toast.success('Documento subido');
      } else {
        toast.error(data.error || 'Error al subir');
      }
    } catch { toast.error('Error de conexión'); }
    setUploadingFile(false);
  };

  // ============== TEACHER ACTIONS ==============
  const handleCreateClass = async () => {
    if (!newTopic.trim()) { toast.error('Escribe el tema de la clase'); return; }
    setCreatingClass(true);
    try {
      const res = await api('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          topic: newTopic,
          level: newLevel,
          documentUrl: uploadedFile?.url || '',
          documentName: uploadedFile?.name || '',
          videoUrl: newVideoUrl || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Clase creada exitosamente');
        setNewTopic('');
        setUploadedFile(null);
        setNewVideoUrl('');
        setView('teacher-dashboard');
      } else { toast.error(data.error || 'Error al crear la clase'); }
    } catch { toast.error('Error de conexión'); }
    setCreatingClass(false);
  };

  const handlePublishClass = async (classId: string, currentPublished: boolean) => {
    try {
      const res = await api(`/api/classes/${classId}/publish`, { method: 'PUT', body: JSON.stringify({ published: !currentPublished }) });
      if (res.ok) {
        toast.success(currentPublished ? 'Clase despublicada' : 'Clase publicada para los alumnos');
        setView('teacher-dashboard');
      }
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const res = await api(`/api/classes/${classId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Clase eliminada'); setView('teacher-dashboard'); }
    } catch { toast.error('Error al eliminar'); }
  };

  const handleMirrorView = async (classId: string) => {
    try {
      const res = await api(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClass(data.class);
        setStudentAnswers({});
        setShowResults(false);
        setLastScore(null);
        setIsMirrorMode(true);
        setView('class-view');
      }
    } catch { toast.error('Error al cargar la clase'); }
  };

  const handleEditMedia = async () => {
    if (!editClassId) return;
    setEditUploading(true);
    try {
      const res = await api(`/api/classes/${editClassId}`, {
        method: 'PUT',
        body: JSON.stringify({ videoUrl: editVideoUrl }),
      });
      if (res.ok) {
        toast.success('Clase actualizada');
        setEditClassId(null);
        setEditVideoUrl('');
        setView('teacher-dashboard');
      }
    } catch { toast.error('Error al actualizar'); }
    setEditUploading(false);
  };

  const handleEditUpload = async (file: File) => {
    setEditUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('chambari_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && editClassId) {
        const updateRes = await api(`/api/classes/${editClassId}`, {
          method: 'PUT',
          body: JSON.stringify({ documentUrl: data.url, documentName: data.originalName }),
        });
        if (updateRes.ok) {
          toast.success('Documento actualizado');
          setEditClassId(null);
          setView('teacher-dashboard');
        }
      }
    } catch { toast.error('Error al subir documento'); }
    setEditUploading(false);
  };

  // ============== STUDENT ACTIONS ==============
  const handleOpenClass = async (classId: string) => {
    try {
      const res = await api(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClass(data.class);
        setShowResults(false);
        setLastScore(null);
        setIsMirrorMode(false);
        if (data.class.progress && data.class.progress.length > 0) {
          try { setStudentAnswers(JSON.parse(data.class.progress[0].answers || '{}')); } catch { setStudentAnswers({}); }
        } else { setStudentAnswers({}); }
        setView('class-view');
      }
    } catch { toast.error('Error al cargar la clase'); }
  };

  const handleSubmitAnswers = async () => {
    if (!selectedClass || isMirrorMode) return;
    setSubmittingAnswers(true);
    try {
      const res = await api(`/api/classes/${selectedClass.id}/submit`, { method: 'POST', body: JSON.stringify({ answers: studentAnswers }) });
      const data = await res.json();
      if (res.ok) {
        setLastScore({ score: data.score, total: data.totalQuestions, percentage: data.percentage });
        setShowResults(true);
        setView('class-view');
        toast.success(`Resultado: ${data.score}/${data.totalQuestions} (${data.percentage}%)`);
      } else { toast.error(data.error || 'Error al enviar'); }
    } catch { toast.error('Error de conexión'); }
    setSubmittingAnswers(false);
  };

  const getExerciseOptions = (exercise: Exercise): string[] => {
    try { return JSON.parse(exercise.options || '[]'); } catch { return []; }
  };

  // ============== RENDER: AUTH PAGE ==============
  const renderAuthPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Chambari Academy</h1>
          <p className="text-blue-200 mt-2">English Learning Platform</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setAuthView('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${authView === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                Iniciar Sesión
              </button>
              <button onClick={() => setAuthView('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${authView === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                Registrarse
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {authView === 'login' ? (
                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input id="login-email" name="email" type="email" placeholder="tu@correo.com" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" name="password" type="password" placeholder="••••••••" required className="h-11" />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium" disabled={authLoading}>
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Iniciar Sesión
                  </Button>
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nombre completo</Label>
                    <Input id="reg-name" name="name" placeholder="Tu nombre" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Correo electrónico</Label>
                    <Input id="reg-email" name="email" type="email" placeholder="tu@correo.com" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Contraseña</Label>
                    <Input id="reg-password" name="password" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Soy...</Label>
                    <RadioGroup name="role" defaultValue="STUDENT" className="grid grid-cols-2 gap-3">
                      <label className="flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <RadioGroupItem value="STUDENT" />
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm font-medium">Alumno</span>
                      </label>
                      <label className="flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-cyan-300 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50">
                        <RadioGroupItem value="TEACHER" />
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">Profesor</span>
                      </label>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium" disabled={authLoading}>
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Crear Cuenta
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // ============== RENDER: TEACHER DASHBOARD ==============
  const renderTeacherDashboard = () => {
    const totalClasses = teacherClasses.length;
    const publishedClasses = teacherClasses.filter(c => c.published).length;
    const totalExercises = teacherClasses.reduce((sum, c) => sum + (c._count?.exercises || 0), 0);

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg hidden sm:block text-slate-900">Chambari Academy</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                <Badge className="bg-blue-100 text-blue-700 border-0">Profesor</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Clases', value: totalClasses, icon: BookMarked, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
              { label: 'Publicadas', value: publishedClasses, icon: Eye, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Ejercicios', value: totalExercises, icon: Target, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50' },
              { label: 'Pendientes', value: totalClasses - publishedClasses, icon: Clock, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-200/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Class */}
          <Card className="border-slate-200/60 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Crear Nueva Clase</h2>
                  <p className="text-blue-100 text-sm">Escribe el tema y prepara tu clase de inglés</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="topic" className="text-slate-700 font-medium">Tema de la clase</Label>
                  <Textarea id="topic" placeholder="Ej: Present Simple Tense, Daily Routines, Food and Drinks, At the Restaurant..."
                    value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                    className="mt-1.5 min-h-[80px] resize-none border-slate-200 focus:border-blue-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 font-medium">Nivel</Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="mt-1.5 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-slate-700 font-medium">Documento (opcional)</Label>
                  <div className="mt-1.5">
                    {uploadedFile ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-slate-700 flex-1 truncate">{uploadedFile.name}</span>
                        <button onClick={() => setUploadedFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">
                          {uploadingFile ? 'Subiendo...' : 'Haz click para subir un documento'}
                        </span>
                        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} disabled={uploadingFile} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <Label htmlFor="video" className="text-slate-700 font-medium">Video (opcional)</Label>
                  <div className="relative mt-1.5">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="video" placeholder="Pega un enlace de YouTube o video..."
                      value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-400" />
                  </div>
                </div>

                <Button onClick={handleCreateClass} disabled={creatingClass || !newTopic.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium text-base shadow-md shadow-blue-500/20"
                  size="lg">
                  {creatingClass ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Creando clase...</>
                  ) : (
                    <><Plus className="w-5 h-5 mr-2" />Crear Clase</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classes List */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5" /> Mis Clases ({totalClasses})
            </h2>
            {teacherClasses.length === 0 ? (
              <Card className="border-slate-200/60 shadow-sm">
                <CardContent className="p-10 text-center">
                  <BookMarked className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Aún no has creado ninguna clase</p>
                  <p className="text-sm text-slate-400 mt-1">Usa el formulario de arriba para crear tu primera clase</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {teacherClasses.map((cls, index) => (
                  <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900">{cls.title}</h3>
                              <Badge variant={cls.published ? 'default' : 'secondary'} className={cls.published ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                                {cls.published ? 'Publicada' : 'Borrador'}
                              </Badge>
                              {cls.documentName && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-xs gap-1">
                                  <FileText className="w-3 h-3" /> Doc
                                </Badge>
                              )}
                              {cls.videoUrl && (
                                <Badge variant="secondary" className="bg-red-50 text-red-600 border-0 text-xs gap-1">
                                  <Video className="w-3 h-3" /> Video
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{cls._count?.exercises || 0} ejercicios</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls._count?.progress || 0} alumnos</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(cls.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                  onClick={() => { setEditClassId(cls.id); setEditVideoUrl(cls.videoUrl); }}>
                                  <FileUp className="w-3.5 h-3.5" /> Media
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Documento y Video</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                  <div>
                                    <Label>Subir Documento</Label>
                                    <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all mt-1.5">
                                      <Upload className="w-5 h-5 text-slate-400" />
                                      <span className="text-sm text-slate-500">{editUploading ? 'Subiendo...' : 'Seleccionar documento'}</span>
                                      <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditUpload(f); }} disabled={editUploading} />
                                    </label>
                                  </div>
                                  <div>
                                    <Label>URL del Video</Label>
                                    <Input placeholder="YouTube o enlace de video..." value={editVideoUrl}
                                      onChange={(e) => setEditVideoUrl(e.target.value)} className="mt-1.5" />
                                  </div>
                                  <Button onClick={handleEditMedia} className="w-full bg-blue-600 hover:bg-blue-700" disabled={editUploading}>
                                    {editUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Guardar
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200"
                              onClick={() => handleMirrorView(cls.id)}>
                              <MonitorPlay className="w-3.5 h-3.5" /> Espejo
                            </Button>
                            <Button variant={cls.published ? 'outline' : 'default'} size="sm"
                              onClick={() => handlePublishClass(cls.id, cls.published)}
                              className={cls.published ? 'gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'}>
                              {cls.published ? <><Eye className="w-3.5 h-3.5" /> Publicada</> : <><Send className="w-3.5 h-3.5" /> Publicar</>}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteClass(cls.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  // ============== RENDER: STUDENT DASHBOARD ==============
  const renderStudentDashboard = () => {
    const completedClasses = Object.values(studentProgress).filter(p => p.completed).length;
    const totalAvailable = studentClasses.length;
    const overallPercentage = totalAvailable > 0 ? Math.round((completedClasses / totalAvailable) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg hidden sm:block text-slate-900">Chambari Academy</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome Banner */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 sm:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur shrink-0">
                  <Brain className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}!</h2>
                  <p className="text-blue-100 mt-0.5">Keep learning English today</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <p className="text-4xl font-bold">{overallPercentage}%</p>
                  <p className="text-blue-200 text-sm">Progress</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-blue-100">Overall progress</span>
                  <span className="text-sm font-medium">{completedClasses} / {totalAvailable} classes</span>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${overallPercentage}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-white rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* Classes Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5" /> Available Classes
            </h2>
            {studentClasses.length === 0 ? (
              <Card className="border-slate-200/60 shadow-sm">
                <CardContent className="p-10 text-center">
                  <BookMarked className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No classes available yet</p>
                  <p className="text-sm text-slate-400 mt-1">Your teacher will publish classes soon</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {studentClasses.map((cls, index) => {
                  const progress = studentProgress[cls.id];
                  const hasMedia = cls.documentName || cls.videoUrl;
                  return (
                    <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="border-slate-200/60 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                        onClick={() => handleOpenClass(cls.id)}>
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {cls.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">by {cls.teacher?.name}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs bg-white border-slate-200 text-slate-500">
                                  <Target className="w-3 h-3 mr-1" />{cls._count?.exercises || 0} exercises
                                </Badge>
                                {cls.documentName && (
                                  <Badge variant="secondary" className="text-xs bg-white border-slate-200 text-slate-500">
                                    <FileText className="w-3 h-3 mr-1" />Doc
                                  </Badge>
                                )}
                                {cls.videoUrl && (
                                  <Badge variant="secondary" className="text-xs bg-white border-slate-200 text-slate-500">
                                    <PlayCircle className="w-3 h-3 mr-1" />Video
                                  </Badge>
                                )}
                              </div>
                              {progress?.completed && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Progress value={progress.percentage} className="h-1.5 flex-1 bg-slate-200" />
                                  <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">{progress.score}/{progress.totalQuestions}</Badge>
                                </div>
                              )}
                            </div>
                            {progress?.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                            ) : (
                              <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  // ============== RENDER: CLASS VIEW (SHARED - Student + Teacher Mirror) ==============
  const renderClassView = () => {
    if (!selectedClass) return null;

    const answeredCount = Object.keys(studentAnswers).filter(id => studentAnswers[id] !== '').length;
    const totalExercises = selectedClass.exercises?.length || 0;
    const youtubeEmbed = getYoutubeEmbedUrl(selectedClass.videoUrl);
    const isYtSearch = isYoutubeSearchUrl(selectedClass.videoUrl);
    const isPdf = selectedClass.documentName?.toLowerCase().endsWith('.pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => selectedClass.documentName?.toLowerCase().endsWith(`.${ext}`));

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => {
              setSelectedClass(null);
              setIsMirrorMode(false);
              setView(user?.role === 'TEACHER' ? 'teacher-dashboard' : 'student-dashboard');
            }} className="text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-slate-900 truncate">{selectedClass.title}</h1>
              <p className="text-xs text-slate-400">by {selectedClass.teacher?.name}</p>
            </div>
            {isMirrorMode && (
              <Badge className="bg-cyan-100 text-cyan-700 border-0 gap-1">
                <MonitorPlay className="w-3 h-3" /> Modo Espejo
              </Badge>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-xl">
              <TabsTrigger value="content" className="gap-1.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Contenido</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Media</span>
                {(selectedClass.documentName || selectedClass.videoUrl) && (
                  <Badge className="ml-1 text-xs bg-blue-100 text-blue-600 border-0 h-5">New</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="exercises" className="gap-1.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Ejercicios</span>
                {totalExercises > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-slate-100">{answeredCount}/{totalExercises}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content">
              <div className="space-y-4">
                {/* Class header banner */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-5 sm:p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">{selectedClass.title}</h2>
                        <div className="flex items-center gap-3 mt-1 text-blue-100 text-sm">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(selectedClass.createdAt)}</span>
                          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{totalExercises} exercises</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Lesson content */}
                <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-5 sm:p-8">
                    <div className="markdown-content">
                      <ReactMarkdown>{selectedClass.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              <div className="space-y-4">
                {/* Video */}
                {selectedClass.videoUrl && (
                  <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      {youtubeEmbed ? (
                        <div className="bg-slate-900 p-1">
                          <div className="relative w-full pt-[56.25%]">
                            <iframe src={youtubeEmbed} className="absolute inset-0 w-full h-full rounded-t-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                          </div>
                        </div>
                      ) : isYtSearch ? (
                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-8 text-center">
                          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          </div>
                          <p className="font-semibold text-slate-800 text-lg">Recommended Videos</p>
                          <p className="text-sm text-slate-500 mt-1 mb-4">Watch related videos on YouTube about this topic</p>
                          <a href={getYoutubeSearchUrl(selectedClass.videoUrl)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-md shadow-red-200">
                            <PlayCircle className="w-5 h-5" /> Watch on YouTube
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <video src={selectedClass.videoUrl} controls className="w-full rounded-t-lg max-h-[500px]" />
                      )}
                      <div className="p-4 flex items-center gap-2 border-t border-slate-100">
                        <PlayCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Video Lesson</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Document */}
                {selectedClass.documentName && selectedClass.documentUrl && (
                  <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      {isPdf ? (
                        <div className="relative w-full h-[600px] bg-slate-100">
                          <iframe src={selectedClass.documentUrl} className="absolute inset-0 w-full h-full" title="Document" />
                        </div>
                      ) : isImage ? (
                        <div className="p-4">
                          <img src={selectedClass.documentUrl} alt={selectedClass.documentName} className="w-full rounded-lg max-h-[500px] object-contain bg-slate-50 p-2" />
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl">{getFileIcon(selectedClass.documentName)}</span>
                          </div>
                          <p className="font-medium text-slate-700">{selectedClass.documentName}</p>
                          <p className="text-sm text-slate-400 mt-1">Preview not available. Download to view.</p>
                          <a href={selectedClass.documentUrl} download className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            <ExternalLink className="w-4 h-4" /> Download
                          </a>
                        </div>
                      )}
                      <div className="p-4 flex items-center gap-2 border-t border-slate-100">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">{selectedClass.documentName}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedClass.videoUrl && !selectedClass.documentName && (
                  <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-10 text-center">
                      <Video className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No hay material multimedia</p>
                      <p className="text-sm text-slate-400 mt-1">El profesor aún no ha subido documentos o videos</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Exercises Tab */}
            <TabsContent value="exercises">
              <div className="space-y-4">
                {/* Progress bar */}
                <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Progress</span>
                      <span className="text-sm text-slate-500">{answeredCount} of {totalExercises} answered</span>
                    </div>
                    <Progress value={totalExercises > 0 ? (answeredCount / totalExercises) * 100 : 0} className="h-2" />
                  </CardContent>
                </Card>

                {totalExercises === 0 ? (
                  <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-10 text-center">
                      <Target className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No exercises available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {selectedClass.exercises.map((exercise, index) => {
                      const options = getExerciseOptions(exercise);
                      const isAnswered = showResults && studentAnswers[exercise.id];
                      const isCorrect = isAnswered && studentAnswers[exercise.id] === exercise.correctAnswer;

                      return (
                        <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                          <Card className={`border shadow-sm ${isAnswered ? (isCorrect ? 'border-emerald-300 bg-emerald-50/30' : 'border-red-300 bg-red-50/30') : 'border-slate-200/60'}`}>
                            <CardContent className="p-5">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                                  isAnswered
                                    ? isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                }`}>
                                  {isAnswered ? (
                                    isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <p className="font-medium text-slate-800">{exercise.question}</p>

                                  {exercise.type === 'fill_blank' ? (
                                    <Input value={studentAnswers[exercise.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                                      placeholder="Type your answer..."
                                      disabled={showResults || isMirrorMode}
                                      className={isAnswered ? (isCorrect ? 'border-emerald-300 bg-white' : 'border-red-300 bg-white') : 'border-slate-200'} />
                                  ) : (
                                    <RadioGroup value={studentAnswers[exercise.id] || ''}
                                      onValueChange={(value) => !showResults && !isMirrorMode && setStudentAnswers(prev => ({ ...prev, [exercise.id]: value }))}
                                      disabled={showResults || isMirrorMode}>
                                      <div className="space-y-2">
                                        {options.map((option: string, optIdx: number) => {
                                          const isSelected = studentAnswers[exercise.id] === option;
                                          const isCorrectOption = showResults && option === exercise.correctAnswer;
                                          const isWrongSelected = showResults && isSelected && option !== exercise.correctAnswer;

                                          return (
                                            <label key={optIdx}
                                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                                isCorrectOption ? 'border-emerald-400 bg-emerald-50'
                                                  : isWrongSelected ? 'border-red-400 bg-red-50'
                                                    : isSelected ? 'border-blue-400 bg-blue-50'
                                                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                              } ${showResults || isMirrorMode ? 'pointer-events-none' : ''}`}>
                                              <RadioGroupItem value={option} />
                                              <span className="text-sm text-slate-700">{option}</span>
                                              {isCorrectOption && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                              {isWrongSelected && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </RadioGroup>
                                  )}

                                  {showResults && exercise.explanation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                      className={`p-3 rounded-xl text-sm ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                      <p className="font-semibold mb-0.5">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                                      <p>{exercise.explanation}</p>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}

                    {/* Submit / Results */}
                    {!showResults && !isMirrorMode && (
                      <Button onClick={handleSubmitAnswers} disabled={submittingAnswers || answeredCount < totalExercises}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium shadow-md shadow-blue-500/20"
                        size="lg">
                        {submittingAnswers ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Submit Answers ({answeredCount}/{totalExercises})</>}
                      </Button>
                    )}

                    {showResults && lastScore && (
                      <div className="space-y-4">
                        <Card className="border-0 shadow-lg overflow-hidden">
                          <div className={`p-8 text-center text-white ${lastScore.percentage >= 70 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : lastScore.percentage >= 50 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur">
                              <Trophy className="w-10 h-10" />
                            </motion.div>
                            <p className="text-5xl font-bold">{lastScore.percentage}%</p>
                            <p className="text-white/80 mt-1">{lastScore.score} of {lastScore.total} correct</p>
                            <p className="mt-3 text-lg font-medium">
                              {lastScore.percentage >= 90 ? 'Excellent work!' : lastScore.percentage >= 70 ? 'Great job!' : lastScore.percentage >= 50 ? 'Good effort, keep practicing!' : 'Review the lesson and try again'}
                            </p>
                          </div>
                        </Card>
                        {!isMirrorMode && (
                          <div className="flex gap-3">
                            <Button onClick={() => { setStudentAnswers({}); setShowResults(false); }} variant="outline" className="flex-1 border-slate-200">Reintentar</Button>
                            <Button onClick={() => { setSelectedClass(null); setIsMirrorMode(false); setView('student-dashboard'); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Back to Classes</Button>
                          </div>
                        )}
                      </div>
                    )}

                    {isMirrorMode && (
                      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl text-center">
                        <MonitorPlay className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-cyan-700">Vista Espejo</p>
                        <p className="text-xs text-cyan-600">Así es como los alumnos ven esta clase</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Results Tab (always last, hidden until submitted) */}
            {showResults && lastScore && (
              <TabsContent value="results">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className={`p-8 text-center text-white ${lastScore.percentage >= 70 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : lastScore.percentage >= 50 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur">
                      <Trophy className="w-10 h-10" />
                    </motion.div>
                    <p className="text-5xl font-bold">{lastScore.percentage}%</p>
                    <p className="text-white/80 mt-1">{lastScore.score} of {lastScore.total} correct</p>
                    <p className="mt-3 text-lg font-medium">
                      {lastScore.percentage >= 90 ? 'Excellent work!' : lastScore.percentage >= 70 ? 'Great job!' : lastScore.percentage >= 50 ? 'Good effort, keep practicing!' : 'Review the lesson and try again'}
                    </p>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    );
  };

  // ============== MAIN RENDER ==============
  return (
    <>
      {view === 'auth' && renderAuthPage()}
      {view === 'teacher-dashboard' && renderTeacherDashboard()}
      {view === 'student-dashboard' && renderStudentDashboard()}
      {view === 'class-view' && renderClassView()}
    </>
  );
}
