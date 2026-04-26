import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, lessonContext } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Servicio de IA no disponible en este momento' },
        { status: 500 }
      )
    }

    const systemPrompt = `Eres un tutor de inglés paciente y amigable de Chambari Academy. Ayudas a los estudiantes a entender conceptos de inglés. Responde siempre en español.

Reglas importantes:
- Sé amable, paciente y motivador
- Explica conceptos gramaticales de forma simple con ejemplos claros
- Si el estudiante pregunta sobre vocabulario, incluye pronunciación aproximada
- Da ejemplos prácticos y útiles
- Si la pregunta está fuera de tema, redirige amablemente al aprendizaje de inglés
- Usa un tono conversacional y cercano
${lessonContext ? `\nContexto de la lección actual: "${lessonContext}"` : ''}`

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('DeepSeek Chat API error:', response.status, errText)
      return NextResponse.json(
        { error: 'Error al comunicarse con el asistente IA. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta. Intenta de nuevo.'

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
