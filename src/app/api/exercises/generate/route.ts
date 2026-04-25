import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

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
    const { lessonId, lessonTitle, lessonContent, count = 5, type = 'multiple_choice' } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    const topic = lessonTitle || 'general knowledge'
    const content = lessonContent || ''

    const zai = await ZAI.create()

    const prompt = `You are an expert English language teacher. Generate exactly ${count} ${type} exercises about the topic: "${topic}".

${content ? `Lesson content context:\n${content}\n\n` : ''}Important rules:
- Return ONLY a valid JSON array, no markdown, no explanation, no code blocks.
- Each exercise must have: "question" (string), "options" (array of strings for multiple_choice, null for other types), "correctAnswer" (string), "explanation" (string).
- Questions should be clear, educational, and appropriate for English learners.
- Options should be plausible but only one correct answer.
- Explanations should be helpful and educational.

Example format:
[{"question":"What is...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]

Generate the exercises now:`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert exercise generator. Always respond with valid JSON arrays only.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const responseText = completion.choices?.[0]?.message?.content || '[]'
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
        { error: 'Failed to parse generated exercises. Please try again.' },
        { status: 500 }
      )
    }

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json({ error: 'No exercises were generated' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
