import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============ AI HELPER ============
// Uses DeepSeek API (compatible with OpenAI format)
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

async function aiChat(messages: Array<{ role: string; content: string }>, options?: { temperature?: number; max_tokens?: number }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY no configurada. Agrega la variable de entorno en Render.');
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ============ ROUTES ============
export async function GET(request: NextRequest) {
  try {
    const classes = await db.class.findMany({
      where: { published: true },
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
    const { topic, level, documentUrl, documentName, videoUrl, customInstructions } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'El tema es obligatorio' }, { status: 400 });
    }

    const levelLabel = level === 'beginner' ? 'beginner (A1-A2)' : level === 'advanced' ? 'advanced (C1-C2)' : 'intermediate (B1-B2)';

    // ============ GENERATE CLASS CONTENT ============
    let classContent = '';
    try {
      classContent = await aiChat([
        {
          role: 'system',
          content: `You are an expert English teacher who creates visually stunning and highly engaging lesson content.

RULES FOR THE CONTENT:
1. Write EVERYTHING in English (the lesson content, vocabulary, examples - all in English)
2. Use markdown formatting extensively to make it visually rich
3. Include relevant emojis at the start of section headings to make it fun and visual
4. Create tables for vocabulary lists, comparisons, and grammar rules
5. Include at least one realistic dialogue between two people using the topic
6. Add pronunciation tips in parentheses where helpful: word /wɜːrd/
7. Include fun facts, cultural notes, or tips in blockquotes
8. Number important lists and use bold for key terms
9. Make it feel like a premium textbook, not a boring lecture

STRUCTURE (follow this exact order):

## 📚 Learning Objectives
- List 3-4 clear objectives starting with action verbs

## 🧠 Key Vocabulary
| Word | Meaning | Example Sentence |
|------|---------|-----------------|
| ... | ... | ... |

Include 8-12 vocabulary words related to the topic in a table.

## 📖 Lesson Content
Write 4-6 detailed subsections about the topic. Each subsection should have:
- A clear heading with emoji
- Detailed explanations with examples
- Grammar rules if applicable
- Usage tips

## 💬 Real-Life Dialogue
Create a natural conversation between two people (Anna and Ben) using the vocabulary and concepts from the lesson. Format as dialogue lines with character names in bold.

## 🔑 Grammar Focus (if applicable)
Explain the grammar rule clearly with:
- Formula/pattern
- 5+ example sentences
- Common mistakes to avoid

## 📝 Practice Tips
Give 4-5 practical tips for students to practice outside class.

## ⭐ Did You Know?
Include 2-3 interesting cultural facts or fun trivia related to the topic in blockquotes.

## 📋 Summary
A brief recap of what was learned.

Level: ${levelLabel}
Topic: "${topic}"
${customInstructions ? `\nADDITIONAL TEACHER INSTRUCTIONS:\n${customInstructions}\n` : ''}
IMPORTANT: Respond ONLY with the markdown content. No introduction, no "here is your lesson", just the content starting with ## 📚`
        },
        {
          role: 'user',
          content: `Create a complete, beautiful English lesson about: "${topic}"`
        }
      ], { temperature: 0.75, max_tokens: 4096 });
    } catch (error) {
      console.error('Content generation error:', error);
      return NextResponse.json({
        error: 'Error al generar el contenido con IA. Verifica la API key de DeepSeek.',
        detail: String(error),
      }, { status: 503 });
    }

    // ============ GENERATE EXERCISES ============
    let exercises: Array<Record<string, unknown>> = [];
    try {
      const rawExercises = await aiChat([
        {
          role: 'system',
          content: `You are an expert English teacher creating exercises. Generate exactly 10 varied exercises about the topic.

Distribute them as follows:
- 4 multiple_choice questions
- 3 true_false questions  
- 3 fill_blank questions

RULES:
- Write ALL questions and explanations in English
- Questions must test understanding of the topic, not just memorization
- Use realistic sentences and contexts
- Make options plausible (no obviously wrong answers)
- Explanations should teach something, not just state the answer

RESPOND ONLY WITH VALID JSON in this exact format:
[
  {
    "type": "multiple_choice",
    "question": "Complete the sentence: 'She _____ to school every day.'",
    "options": ["go", "goes", "going", "gone"],
    "correctAnswer": "goes",
    "explanation": "With third person singular (she/he/it), we add -es to the base verb in Present Simple."
  }
]

For true_false: options must be ["True", "False"]
For fill_blank: options must be ["the correct answer"] and the question must contain _____ where the answer goes. Use interesting sentences, not boring ones.

IMPORTANT: Return ONLY the JSON array. No markdown, no code blocks, no extra text.`
        },
        {
          role: 'user',
          content: `Generate 10 exercises about: "${topic}" (${levelLabel})${customInstructions ? `\nTeacher notes: ${customInstructions}` : ''}`
        }
      ], { temperature: 0.7, max_tokens: 4096 });

      const jsonMatch = rawExercises.match(/\[[\s\S]*\]/);
      exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('Exercise generation error (continuing without exercises):', error);
    }

    // ============ GENERATE VIDEO SUGGESTION ============
    let finalVideoUrl = videoUrl || '';
    if (!finalVideoUrl) {
      try {
        const suggestedUrl = await aiChat([
          {
            role: 'system',
            content: `You find the best educational YouTube video for English learning topics.
Given a topic, respond with ONLY a YouTube search URL that would find relevant educational content.
Format: https://www.youtube.com/results?search_query=SEARCH_TERMS
Replace spaces with + in the search query. Use keywords like: "English lesson" + topic name.
Respond with ONLY the URL, nothing else.`
          },
          {
            role: 'user',
            content: topic
          }
        ], { temperature: 0.3, max_tokens: 200 });

        if (suggestedUrl.includes('youtube.com')) {
          finalVideoUrl = suggestedUrl.trim();
        }
      } catch {
        // If video suggestion fails, continue without it
      }
    }

    // ============ CREATE THE CLASS ============
    const newClass = await db.class.create({
      data: {
        teacherId: 'default-teacher',
        title: topic,
        topic: topic,
        content: classContent,
        documentUrl: documentUrl || '',
        documentName: documentName || '',
        videoUrl: finalVideoUrl,
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
    return NextResponse.json({ error: 'Error al crear la clase', detail: String(error) }, { status: 500 });
  }
}
