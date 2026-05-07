'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen, GraduationCap, Eye, Trash2,
  CheckCircle2, XCircle, Clock,
  Trophy, ArrowLeft, Send, Loader2,
  BookMarked, Brain, Target, Zap, Upload, FileText,
  Video, MonitorPlay, PenTool, Plus, X, ExternalLink,
  Users, PlayCircle, FileUp, Sparkles, Lock, LogOut
} from 'lucide-react';

// ============== TYPES ==============
type View = 'teacher-dashboard' | 'student-dashboard' | 'class-view';

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
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
  // Match standard YouTube URLs: watch, embed, v/, youtu.be, shorts
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  // Match YouTube search URLs and convert to embeddable search playlist
  const searchMatch = url.match(/search_query=(.+)/);
  if (searchMatch) return `https://www.youtube.com/embed?listType=search&list=${searchMatch[1]}`;
  return '';
};

const isYoutubeUrl = (url: string) => {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/.test(url);
};

const getYoutubeThumbnail = (url: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
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
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [view, setView] = useState<View>('teacher-dashboard');

  // Teacher state
  const [teacherClasses, setTeacherClasses] = useState<ClassItem[]>([]);
  const [creatingClass, setCreatingClass] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newLevel, setNewLevel] = useState('intermediate');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  // Student state
  const [studentClasses, setStudentClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [studentProgress, setStudentProgress] = useState<Record<string, { score: number; totalQuestions: number; completed: boolean; percentage: number }>>({});
  const [showResults, setShowResults] = useState(false);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [isMirrorMode, setIsMirrorMode] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('chambari_teacher_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    if (passwordInput === 'chambari2024') {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
      sessionStorage.setItem('chambari_teacher_auth', 'true');
    } else {
      setPasswordError('Contrasena incorrecta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('chambari_teacher_auth');
    setRole('STUDENT');
    setView('student-dashboard');
  };

  const handleGoToTeacher = () => {
    if (isAuthenticated) {
      setRole('TEACHER');
      setView('teacher-dashboard');
    } else {
      setRole('TEACHER');
      setView('teacher-dashboard');
    }
  };

  // Load data based on view
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (view === 'teacher-dashboard') {
        const res = await api('/api/classes?all=true');
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

  // ============== FILE UPLOAD (direct to class via FormData) ==============
  const uploadDocumentToClass = async (classId: string, file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/classes/${classId}/upload-document`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Documento subido exitosamente');
        return true;
      } else {
        toast.error(data.error || 'Error al subir el documento');
        return false;
      }
    } catch { toast.error('Error de conexion'); return false; }
    finally { setUploadingFile(false); }
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
          videoUrl: newVideoUrl || '',
          customInstructions: customInstructions || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Clase creada exitosamente');
        // Upload document separately after class is created
        if (pendingFile) {
          const uploadOk = await uploadDocumentToClass(data.class.id, pendingFile);
          if (!uploadOk) {
            toast.error('La clase se creó pero el documento no se pudo subir. Intenta subirlo desde el botón Media.');
          }
          setPendingFile(null);
        }
        setNewTopic('');
        setNewVideoUrl('');
        setCustomInstructions('');
        setView('teacher-dashboard');
      } else { toast.error(data.error || 'Error al crear la clase'); }
    } catch { toast.error('Error de conexion'); }
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
    if (!editClassId) return;
    setEditUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/classes/${editClassId}/upload-document`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Documento actualizado');
        setEditClassId(null);
        setView('teacher-dashboard');
      } else {
        toast.error(data.error || 'Error al subir documento');
      }
    } catch { toast.error('Error de conexion'); }
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
    } catch { toast.error('Error de conexion'); }
    setSubmittingAnswers(false);
  };

  const getExerciseOptions = (exercise: Exercise): string[] => {
    try { return JSON.parse(exercise.options || '[]'); } catch { return []; }
  };

  // ============== RENDER: LOGIN SCREEN ==============
  const renderLoginScreen = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="w-full max-w-md shadow-xl border-slate-200/60">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-8 rounded-t-xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Acceso Profesor</h1>
                <p className="text-blue-100 text-sm mt-1">Ingresa la contrasena para continuar</p>
              </div>
            </div>
            <CardContent className="p-8 space-y-5">
              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium">Contrasena</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contrasena del profesor"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                    className="pl-10 border-slate-200 focus:border-blue-400 h-12 text-base"
                    autoFocus
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />{passwordError}
                  </p>
                )}
              </div>
              <Button
                onClick={handleLogin}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium text-base shadow-md shadow-blue-500/20"
              >
                Ingresar
              </Button>
              <button
                onClick={() => { setRole('STUDENT'); setView('student-dashboard'); }}
                className="w-full text-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
              >
                Entrar como alumno
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

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
                <span className="text-sm font-medium text-slate-700">Profesor</span>
                <Badge className="bg-blue-100 text-blue-700 border-0">Profesor</Badge>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-sm transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
              <button onClick={() => { setRole('STUDENT'); setView('student-dashboard'); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 text-sm text-slate-600 hover:text-cyan-600 transition-colors">
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Ver como Alumno</span>
              </button>
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
                  <p className="text-blue-100 text-sm">La IA genera todo el contenido automaticamente</p>
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

                {/* Custom Instructions for AI */}
                <div>
                  <Label htmlFor="instructions" className="text-slate-700 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Instrucciones para la IA (opcional)
                  </Label>
                  <Textarea id="instructions"
                    placeholder="Ej: Enfocarse en conversacion practica, incluir vocabulario de negocios, agregar ejercicios de pronunciacion..."
                    value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)}
                    className="mt-1.5 min-h-[60px] resize-none border-slate-200 focus:border-amber-400 text-sm" />
                  <p className="text-xs text-slate-400 mt-1">Dile a la IA como quieres que prepare tu clase</p>
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-slate-700 font-medium">Documento (opcional)</Label>
                  <div className="mt-1.5">
                    {pendingFile ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-slate-700 flex-1 truncate">{pendingFile.name}</span>
                        <button onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">
                          {uploadingFile ? 'Subiendo...' : 'Haz click para subir un documento'}
                        </span>
                        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingFile(f); }} disabled={uploadingFile} />
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
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Creando clase con IA...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />Crear Clase con IA</>
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
                  <p className="text-slate-500 font-medium">Aun no has creado ninguna clase</p>
                  <p className="text-sm text-slate-400 mt-1">Usa el formulario de arriba para crear tu primera clase</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {teacherClasses.map((cls, index) => {
                  const classNumber = teacherClasses.length - index;
                  return (
                  <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                            <span className="text-lg font-bold text-blue-600">{classNumber}</span>
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
                  );
                })}
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
                <span className="text-sm font-medium text-slate-700">Alumno</span>
              </div>
              <button onClick={() => { setRole('TEACHER'); setView('teacher-dashboard'); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Profesor</span>
              </button>
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
                  <h2 className="text-2xl font-bold">Hola, Alumno!</h2>
                  <p className="text-blue-100 mt-0.5">Sigue aprendiendo hoy</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <p className="text-4xl font-bold">{overallPercentage}%</p>
                  <p className="text-blue-200 text-sm">Progreso</p>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-blue-100">Progreso general</span>
                  <span className="text-sm font-medium">{completedClasses} / {totalAvailable} clases</span>
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
              <BookOpen className="w-5 h-5" /> Clases Disponibles
            </h2>
            {studentClasses.length === 0 ? (
              <Card className="border-slate-200/60 shadow-sm">
                <CardContent className="p-10 text-center">
                  <BookMarked className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No hay clases disponibles aun</p>
                  <p className="text-sm text-slate-400 mt-1">Tu profesor publicara clases pronto</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {studentClasses.map((cls, index) => {
                  const progress = studentProgress[cls.id];
                  const classNumber = studentClasses.length - index;
                  return (
                    <motion.div key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <Card className="border-slate-200/60 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                        onClick={() => handleOpenClass(cls.id)}>
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                              <span className="text-lg font-bold text-white">{classNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {cls.title}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">por {cls.teacher?.name}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs bg-white border-slate-200 text-slate-500">
                                  <Target className="w-3 h-3 mr-1" />{cls._count?.exercises || 0} ejercicios
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

  // ============== RENDER: CLASS VIEW ==============
  const renderClassView = () => {
    if (!selectedClass) return null;

    const answeredCount = Object.keys(studentAnswers).filter(id => studentAnswers[id] !== '').length;
    const totalExercises = selectedClass.exercises?.length || 0;
    const youtubeEmbed = getYoutubeEmbedUrl(selectedClass.videoUrl);
    const ytIsVideo = isYoutubeUrl(selectedClass.videoUrl);
    const ytThumbnail = getYoutubeThumbnail(selectedClass.videoUrl);
    const isPdf = selectedClass.documentName?.toLowerCase().endsWith('.pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => selectedClass.documentName?.toLowerCase().endsWith(`.${ext}`));

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => {
              setSelectedClass(null);
              setIsMirrorMode(false);
              setView(role === 'TEACHER' ? 'teacher-dashboard' : 'student-dashboard');
            }} className="text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-slate-900 truncate">{selectedClass.title}</h1>
              <p className="text-xs text-slate-400">por {selectedClass.teacher?.name}</p>
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
            <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 rounded-xl">
              <TabsTrigger value="content" className="gap-1.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Contenido</span>
                {(selectedClass.documentName || selectedClass.videoUrl) && (
                  <Badge className="ml-1 text-xs bg-red-100 text-red-600 border-0 h-5">+Media</Badge>
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
                          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{totalExercises} ejercicios</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Video inline - show directly in content tab */}
                {selectedClass.videoUrl && (
                  <Card className="border-slate-200/60 shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      {youtubeEmbed ? (
                        <div className="bg-slate-900 p-1">
                          <div className="relative w-full pt-[56.25%]">
                            <iframe
                              src={youtubeEmbed}
                              className="absolute inset-0 w-full h-full rounded-t-lg"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            />
                          </div>
                        </div>
                      ) : (
                        <video
                          src={selectedClass.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          poster={ytThumbnail || undefined}
                          className="w-full rounded-t-lg max-h-[500px] bg-black"
                        />
                      )}
                      <div className="p-3 flex items-center gap-2 border-t border-slate-100">
                        <PlayCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-slate-700">Video de la clase</span>
                        <a href={selectedClass.videoUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <ExternalLink className="w-3 h-3" /> YouTube
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Document inline - show directly in content tab */}
                {selectedClass.documentName && selectedClass.documentUrl && (() => {
                  const isDataUrl = selectedClass.documentUrl.startsWith('data:');
                  const docApiUrl = `/api/classes/${selectedClass.id}/document`;

                  // Old file path that no longer exists
                  if (!isDataUrl) {
                    return (
                      <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="text-3xl">{getFileIcon(selectedClass.documentName)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 truncate">{selectedClass.documentName}</p>
                            <p className="text-sm text-amber-600">Documento no disponible. Sube de nuevo desde el panel del profesor.</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card className="border-slate-200/60 shadow-md overflow-hidden">
                      <CardContent className="p-0">
                        {isPdf ? (
                          <div className="relative w-full bg-slate-100">
                            <object
                              data={docApiUrl}
                              type="application/pdf"
                              className="w-full h-[600px]"
                              aria-label={selectedClass.documentName}
                            >
                              <div className="flex flex-col items-center justify-center h-[400px] p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                                  <span className="text-4xl">📄</span>
                                </div>
                                <p className="font-medium text-slate-700 mb-1">{selectedClass.documentName}</p>
                                <p className="text-sm text-slate-400 mb-4">Tu navegador no puede mostrar el PDF aqui</p>
                                <div className="flex gap-3">
                                  <a href={docApiUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                    Abrir PDF
                                  </a>
                                  <a href={docApiUrl} download={selectedClass.documentName}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">
                                    Descargar
                                  </a>
                                </div>
                              </div>
                            </object>
                          </div>
                        ) : isImage ? (
                          <div className="p-3 bg-slate-50">
                            <img src={selectedClass.documentUrl} alt={selectedClass.documentName} className="w-full rounded-lg max-h-[500px] object-contain mx-auto" />
                          </div>
                        ) : (
                          <div className="p-5 flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                              <span className="text-3xl">{getFileIcon(selectedClass.documentName)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-700 truncate">{selectedClass.documentName}</p>
                              <p className="text-sm text-slate-400">Documento adjunto de la clase</p>
                            </div>
                            <a href={docApiUrl} download={selectedClass.documentName}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0">
                              Descargar
                            </a>
                          </div>
                        )}
                        <div className="p-3 flex items-center justify-between border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">{selectedClass.documentName}</span>
                          </div>
                          <div className="flex gap-2">
                            {isPdf && (
                              <a href={docApiUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                Abrir
                              </a>
                            )}
                            <a href={docApiUrl} download={selectedClass.documentName}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                              Descargar
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-5 sm:p-8">
                    <div className="markdown-content">
                      <ReactMarkdown>{selectedClass.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Exercises Tab */}
            <TabsContent value="exercises">
              <div className="space-y-4">
                <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Progreso</span>
                      <span className="text-sm text-slate-500">{answeredCount} de {totalExercises} respondidas</span>
                    </div>
                    <Progress value={totalExercises > 0 ? (answeredCount / totalExercises) * 100 : 0} className="h-2" />
                  </CardContent>
                </Card>

                {totalExercises === 0 ? (
                  <Card className="border-slate-200/60 shadow-sm">
                    <CardContent className="p-10 text-center">
                      <Target className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No hay ejercicios disponibles</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {(selectedClass.exercises || []).map((exercise, index) => {
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
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {exercise.type === 'multiple_choice' ? 'Seleccion Multiple' :
                                       exercise.type === 'true_false' ? 'Verdadero / Falso' : 'Completar'}
                                    </Badge>
                                  </div>
                                  <p className="font-medium text-slate-800">{exercise.question}</p>

                                  {(exercise.type === 'multiple_choice' || exercise.type === 'true_false') && (
                                    <div className="grid gap-2">
                                      {options.map((option: string) => {
                                        const isSelected = studentAnswers[exercise.id] === option;
                                        const isCorrectOption = showResults && option === exercise.correctAnswer;
                                        return (
                                          <button key={option} disabled={showResults}
                                            onClick={() => { if (!showResults) setStudentAnswers(prev => ({ ...prev, [exercise.id]: option })); }}
                                            className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${
                                              isCorrectOption ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
                                              isSelected && !isCorrect ? 'border-red-500 bg-red-50 text-red-800' :
                                              isSelected ? 'border-blue-500 bg-blue-50 text-blue-800' :
                                              'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
                                            }`}>
                                            {option}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {exercise.type === 'fill_blank' && (
                                    <Input
                                      placeholder="Escribe tu respuesta..."
                                      value={studentAnswers[exercise.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                                      disabled={showResults}
                                      className={`border-2 ${isCorrect ? 'border-emerald-500 bg-emerald-50' : isAnswered && !isCorrect ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                                    />
                                  )}

                                  {isAnswered && exercise.explanation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                      <p className="text-sm text-blue-800">
                                        <span className="font-semibold">Explicacion: </span>{exercise.explanation}
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}

                    {!showResults ? (
                      <Button onClick={handleSubmitAnswers} disabled={submittingAnswers || answeredCount === 0 || isMirrorMode}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium text-base shadow-md shadow-blue-500/20"
                        size="lg">
                        {submittingAnswers ? (
                          <><Loader2 className="w-5 h-5 animate-spin mr-2" />Enviando...</>
                        ) : (
                          <><Send className="w-5 h-5 mr-2" />Enviar Respuestas ({answeredCount}/{totalExercises})</>
                        )}
                      </Button>
                    ) : (
                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className={`p-6 text-white text-center ${lastScore && lastScore.percentage >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : lastScore && lastScore.percentage >= 50 ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
                          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-90" />
                          <h3 className="text-2xl font-bold">
                            {lastScore && lastScore.percentage >= 90 ? 'Excelente!' :
                             lastScore && lastScore.percentage >= 70 ? 'Muy bien!' :
                             lastScore && lastScore.percentage >= 50 ? 'Buen intento!' : 'Sigue practicando!'}
                          </h3>
                          <p className="text-lg mt-1 opacity-90">
                            {lastScore?.score} / {lastScore?.total} correctas ({lastScore?.percentage}%)
                          </p>
                          <div className="mt-4 flex items-center justify-center gap-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-xl font-bold">{lastScore?.score}</span>
                              </div>
                              <p className="text-sm opacity-80">Correctas</p>
                            </div>
                            <div className="w-px h-10 bg-white/30" />
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <XCircle className="w-5 h-5" />
                                <span className="text-xl font-bold">{lastScore ? lastScore.total - lastScore.score : 0}</span>
                              </div>
                              <p className="text-sm opacity-80">Incorrectas</p>
                            </div>
                          </div>
                          <Button onClick={() => { setShowResults(false); setStudentAnswers({}); }}
                            className="mt-5 bg-white/20 hover:bg-white/30 text-white border border-white/30">
                            Intentar de nuevo
                          </Button>
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  };

  // ============== MAIN RENDER ==============
  return (
    <>
      {view === 'teacher-dashboard' && (isAuthenticated ? renderTeacherDashboard() : renderLoginScreen())}
      {view === 'student-dashboard' && renderStudentDashboard()}
      {view === 'class-view' && renderClassView()}
    </>
  );
}
