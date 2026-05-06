import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const { answers } = await request.json(); // { exerciseId: selectedAnswer }

    // Get exercises and correct answers
    const exercises = await db.exercise.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });

    let score = 0;
    const totalQuestions = exercises.length;

    for (const exercise of exercises) {
      const userAnswer = answers[exercise.id];
      if (userAnswer && userAnswer === exercise.correctAnswer) {
        score++;
      }
    }

    // Upsert progress
    const progress = await db.progress.upsert({
      where: {
        studentId_classId: {
          studentId: 'default-student',
          classId,
        },
      },
      create: {
        studentId: 'default-student',
        classId,
        score,
        totalQuestions,
        completed: true,
        answers: JSON.stringify(answers),
      },
      update: {
        score,
        totalQuestions,
        completed: true,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({
      progress,
      score,
      totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Error al enviar respuestas' }, { status: 500 });
  }
}
