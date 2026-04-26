import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { lessonId, lessonTitle, lessonContent, count = 5, type = 'multiple_choice', customExercise } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // ── Handle custom (manual) exercise ─────────────────────────
    if (customExercise) {
      const { question, options, correctAnswer, explanation } = customExercise
      if (!question || !correctAnswer) {
        return NextResponse.json({ error: 'Pregunta y respuesta correcta son obligatorias' }, { status: 400 })
      }

      const saved = await db.exercise.create({
        data: {
          lessonId,
          type: type || 'multiple_choice',
          question,
          options: options || null,
          correctAnswer,
          explanation: explanation || null,
          orderIndex: 0,
        },
      })

      return NextResponse.json({ exercises: [saved], count: 1 }, { status: 201 })
    }

    // ── AI-generated exercises via DeepSeek ─────────────────────
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY no está configurada. Agrégala a tu archivo .env' },
        { status: 500 }
      )
    }

    const topic = lessonTitle || 'conocimiento general'
    const content = lessonContent || ''

    const prompt = `Eres un profesor experto de inglés. Genera exactamente ${count} ejercicios de tipo "${type}" sobre el tema: "${topic}".

${content ? `Contexto del contenido de la lección:\n${content}\n\n` : ''}Reglas importantes:
- Responde SOLO con un array JSON válido, sin markdown, sin explicaciones, sin bloques de código.
- Cada ejercicio debe tener: "question" (string en español), "options" (array de strings para multiple_choice, null para otros tipos), "correctAnswer" (string), "explanation" (string en español).
- Las preguntas deben ser claras, educativas y apropiadas para estudiantes de inglés.
- Las opciones deben ser plausibles pero solo una respuesta correcta.
- Las explicaciones deben ser útiles y educativas en español.
- Los ejercicios deben estar en español sobre el aprendizaje del inglés.

Ejemplo de formato:
[{"question":"¿Cuál es el pasado de 'go'?","options":["goed","went","gone","going"],"correctAnswer":"went","explanation":"El pasado irregular de 'go' es 'went'."}]

Genera los ejercicios ahora:`

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un generador experto de ejercicios educativos. Siempre responde únicamente con arrays JSON válidos.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('DeepSeek API error:', response.status, errText)
      return NextResponse.json(
        { error: `Error al generar ejercicios con IA (${response.status}). Intenta de nuevo.` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || '[]'

    // Clean up response - remove markdown code blocks if present
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let exercises: Array<{
      question: string
      options: string[] | null
      correctAnswer: string
      explanation: string
    }>

    try {
      exercises = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'No se pudo parsear los ejercicios generados. Por favor intenta de nuevo.' },
        { status: 500 }
      )
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'No se generaron ejercicios' }, { status: 500 })
    }

    // Save exercises to DB
    const savedExercises = await Promise.all(
      exercises.map((ex, index) =>
        db.exercise.create({
          data: {
            lessonId,
            type,
            question: ex.question,
            options: ex.options ? JSON.stringify(ex.options) : null,
            correctAnswer: ex.correctAnswer,
            explanation: ex.explanation || null,
            orderIndex: index,
          },
        })
      )
    )

    return NextResponse.json({ exercises: savedExercises, count: savedExercises.length }, { status: 201 })
  } catch (error) {
    console.error('Generate exercises error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
