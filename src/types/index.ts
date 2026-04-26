// ── Chambari Academy Shared Types ───────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: 'TEACHER' | 'STUDENT'
  avatar?: string
  createdAt?: string
}

export interface Module {
  id: string
  title: string
  description?: string
  orderIndex: number
  teacherId: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  lessons?: Lesson[]
  teacher?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
  createdAt: string
  updatedAt?: string
}

export interface Lesson {
  id: string
  moduleId: string
  teacherId: string
  title: string
  description?: string
  content?: string
  videoUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  videoUrls?: string
  documentUrl?: string
  documentName?: string
  documentUrls?: string
  orderIndex: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  exercises?: Exercise[]
  module?: Pick<Module, 'id' | 'title'>
  teacher?: Pick<User, 'id' | 'name' | 'avatar'>
  createdAt: string
  updatedAt?: string
}

export interface Exercise {
  id: string
  lessonId: string
  type: string
  question: string
  options?: string
  correctAnswer: string
  explanation?: string
  orderIndex: number
  createdAt?: string
}

export interface StudentAccess {
  id: string
  studentId: string
  lessonId: string
  accessFrom?: string
  accessUntil?: string
  active: boolean
  student?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
  lesson?: Pick<Lesson, 'id' | 'title'>
  createdAt: string
}

export interface StudentProgress {
  id: string
  studentId: string
  lessonId: string
  completed: boolean
  progressPercent: number
  lesson?: Lesson & { module?: { id: string; title: string } }
  student?: Pick<User, 'id' | 'name' | 'email'>
  updatedAt?: string
}

export interface Screenshot {
  id: string
  studentId: string
  lessonId: string
  imageUrl: string
  caption?: string
  createdAt: string
  student?: Pick<User, 'id' | 'name' | 'email'>
  lesson?: Pick<Lesson, 'id' | 'title'>
}

export interface PhoneticEntry {
  id: string
  word: string
  ipa: string
  phoneticSpelling?: string
  audioUrl?: string
  example?: string
  translation?: string
  createdAt?: string
}

// ── View Types ─────────────────────────────────────────────
export type View = 'landing' | 'login' | 'register' | 'teacher' | 'student'
export type TeacherView = 'dashboard' | 'modules' | 'lesson-editor' | 'students' | 'exercises' | 'progress' | 'screenshots' | 'dictionary' | 'classroom'
export type StudentView = 'dashboard' | 'lesson' | 'exercises' | 'dictionary' | 'progress'

// ── API Response Types ─────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'TEACHER' | 'STUDENT'
}
