import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function GET(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const where = userData.role === 'TEACHER'
      ? { teacherId: userData.userId }
      : { published: true };

    const classes = await db.class.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { exercises: true, progress: true } },
        teacher: { select: { name: true } },
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Classes GET error:', error);
    return NextResponse.json({ error: 'Error al obtener clases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = getUserFromRequest(request);
    if (!userData || userData.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Solo profesores pueden crear clases' }, { status: 403 });
    }

    const { topic, level, language, documentUrl, documentName, videoUrl } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'El tema es obligatorio' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Generate class content
    const contentCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un experto educador que crea contenido de clase de alta calidad.
Genera contenido educativo completo en inglés sobre el tema indicado.
El contenido debe ser claro, estructurado y fácil de entender.
Usa formato markdown con encabezados, listas, ejemplos, y tablas cuando sea apropiado.
Incluye secciones de: Introduction, Key Concepts, Detailed Explanation, Practical Examples, y Summary.
Nivel: ${level || 'intermedio'}.
Responde SOLO con el contenido markdown de la clase, sin texto adicional.`
        },
        {
          role: 'user',
          content: `Create a complete English lesson about: "${topic}"`
        }
      ],
      temperature: 0.7,
    });

    const classContent = contentCompletion.choices[0]?.message?.content || '';

    // Generate exercises
    const exerciseCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert in creating educational exercises for English language learning.
Generate exactly 8 varied exercises about the given topic.
Types: multiple_choice, true_false, fill_blank.
Respond ONLY with valid JSON in this exact format, no additional text:
[
  {
    "type": "multiple_choice",
    "question": "Question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explanation of why this is correct"
  }
]
For true_false: options must be ["True", "False"]
For fill_blank: options must be ["correct answer"] and the question must have _____ where the answer goes.
Write questions and explanations in English.`
        },
        {
          role: 'user',
          content: `Generate 8 exercises about: "${topic}" (${level || 'intermediate'})`
        }
      ],
      temperature: 0.7,
    });

    let exercises = [];
    try {
      const rawExercises = exerciseCompletion.choices[0]?.message?.content || '[]';
      const jsonMatch = rawExercises.match(/\[[\s\S]*\]/);
      exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      exercises = [];
    }

    // Create the class
    const newClass = await db.class.create({
      data: {
        teacherId: userData.userId,
        title: topic,
        topic: topic,
        content: classContent,
        documentUrl: documentUrl || '',
        documentName: documentName || '',
        videoUrl: videoUrl || '',
      },
    });

    // Create exercises
    if (exercises.length > 0) {
      await db.exercise.createMany({
        data: exercises.map((ex: Record<string, unknown>, index: number) => ({
          classId: newClass.id,
          type: (ex.type as string) || 'multiple_choice',
          question: ex.question as string,
          options: JSON.stringify(ex.options || []),
          correctAnswer: ex.correctAnswer as string,
          explanation: (ex.explanation as string) || '',
          orderIndex: index,
        })),
      });
    }

    const createdClass = await db.class.findUnique({
      where: { id: newClass.id },
      include: { exercises: { orderBy: { orderIndex: 'asc' } } },
    });

    return NextResponse.json({ class: createdClass });
  } catch (error) {
    console.error('Class creation error:', error);
    return NextResponse.json({ error: 'Error al crear la clase' }, { status: 500 });
  }
}
