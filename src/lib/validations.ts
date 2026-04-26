import { z } from 'zod'

// ── Auth Schemas ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['TEACHER', 'STUDENT'], { message: 'Rol inválido' }),
})

// ── Module Schemas ────────────────────────────────────────
export const createModuleSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(1000).optional(),
  orderIndex: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export const updateModuleSchema = createModuleSchema.partial()

// ── Lesson Schemas ────────────────────────────────────────
export const createLessonSchema = z.object({
  moduleId: z.string().min(1, 'El módulo es obligatorio'),
  title: z.string().min(1, 'El título es obligatorio').max(300),
  description: z.string().max(2000).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url('URL de video inválida').optional().or(z.literal('')),
  youtubeUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  documentName: z.string().max(300).optional(),
  orderIndex: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export const updateLessonSchema = createLessonSchema.partial().omit({ moduleId: true })

// ── Exercise Schemas ──────────────────────────────────────
export const generateExercisesSchema = z.object({
  lessonId: z.string().min(1),
  lessonTitle: z.string().optional(),
  lessonContent: z.string().optional(),
  count: z.number().int().min(1).max(20).optional(),
  type: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'matching']).optional(),
  customExercise: z.object({
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().optional(),
  }).optional(),
})

// ── Access Schemas ────────────────────────────────────────
export const createAccessSchema = z.object({
  studentId: z.string().min(1),
  lessonId: z.string().min(1),
  accessFrom: z.string().datetime().optional(),
  accessUntil: z.string().datetime().optional(),
  active: z.boolean().optional(),
})

// ── Progress Schemas ──────────────────────────────────────
export const updateProgressSchema = z.object({
  studentId: z.string().optional(),
  lessonId: z.string().min(1, 'lessonId es obligatorio'),
  completed: z.boolean().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
})

// ── Phonetic Schemas ──────────────────────────────────────
export const createPhoneticSchema = z.object({
  word: z.string().min(1).max(100),
  ipa: z.string().min(1),
  phoneticSpelling: z.string().optional(),
  audioUrl: z.string().url().optional().or(z.literal('')),
  example: z.string().optional(),
  translation: z.string().optional(),
})

// ── Helper ────────────────────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { success: false, error: firstError?.message || 'Validation error' }
  }
  return { success: true, data: result.data }
}
