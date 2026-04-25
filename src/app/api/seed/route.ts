import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const PHONETIC_ENTRIES = [
  { word: 'hello', ipa: '/həˈloʊ/', phoneticSpelling: 'huh-LOH', example: 'Hello, how are you?', translation: 'hola' },
  { word: 'goodbye', ipa: '/ɡʊdˈbaɪ/', phoneticSpelling: 'good-BYE', example: 'Goodbye, see you tomorrow!', translation: 'adiós' },
  { word: 'thank', ipa: '/θæŋk/', phoneticSpelling: 'THANK', example: 'Thank you very much.', translation: 'agradecer' },
  { word: 'please', ipa: '/pliːz/', phoneticSpelling: 'PLEEZ', example: 'Please sit down.', translation: 'por favor' },
  { word: 'sorry', ipa: '/ˈsɒri/', phoneticSpelling: 'SAH-ree', example: "I'm sorry for being late.", translation: 'lo siento' },
  { word: 'water', ipa: '/ˈwɔːtər/', phoneticSpelling: 'WAW-ter', example: 'Can I have some water?', translation: 'agua' },
  { word: 'school', ipa: '/skuːl/', phoneticSpelling: 'SKOOL', example: 'I go to school every day.', translation: 'escuela' },
  { word: 'teacher', ipa: '/ˈtiːtʃər/', phoneticSpelling: 'TEE-chur', example: 'The teacher explained the lesson.', translation: 'profesor' },
  { word: 'student', ipa: '/ˈstjuːdənt/', phoneticSpelling: 'STOO-duhnt', example: 'Every student must study.', translation: 'estudiante' },
  { word: 'computer', ipa: '/kəmˈpjuːtər/', phoneticSpelling: 'kuhm-PYOO-ter', example: 'She uses a computer at work.', translation: 'computadora' },
  { word: 'family', ipa: '/ˈfæməli/', phoneticSpelling: 'FAM-uh-lee', example: 'My family is very important.', translation: 'familia' },
  { word: 'friend', ipa: '/frend/', phoneticSpelling: 'FREND', example: 'She is my best friend.', translation: 'amigo' },
  { word: 'language', ipa: '/ˈlæŋɡwɪdʒ/', phoneticSpelling: 'LANG-gwij', example: 'English is a beautiful language.', translation: 'idioma' },
  { word: 'beautiful', ipa: '/ˈbjuːtɪfəl/', phoneticSpelling: 'BYOO-tih-fuhl', example: 'What a beautiful day!', translation: 'hermoso' },
  { word: 'important', ipa: '/ɪmˈpɔːrtənt/', phoneticSpelling: 'im-POR-tuhnt', example: 'This is very important.', translation: 'importante' },
  { word: 'different', ipa: '/ˈdɪfərənt/', phoneticSpelling: 'DIF-er-uhnt', example: 'We have different opinions.', translation: 'diferente' },
  { word: 'together', ipa: '/təˈɡeðər/', phoneticSpelling: 'tuh-GETH-er', example: 'Let\'s work together.', translation: 'juntos' },
  { word: 'morning', ipa: '/ˈmɔːrnɪŋ/', phoneticSpelling: 'MOR-ning', example: 'Good morning, class!', translation: 'mañana' },
  { word: 'evening', ipa: '/ˈiːvnɪŋ/', phoneticSpelling: 'EEV-ning', example: 'We have class in the evening.', translation: 'tarde/noche' },
  { word: 'knowledge', ipa: '/ˈnɒlɪdʒ/', phoneticSpelling: 'NOL-ij', example: 'Knowledge is power.', translation: 'conocimiento' },
  { word: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/', phoneticSpelling: 'pruh-nun-see-AY-shuhn', example: 'Good pronunciation is essential.', translation: 'pronunciación' },
  { word: 'because', ipa: '/bɪˈkɒz/', phoneticSpelling: 'bih-KAWZ', example: 'I study because I want to learn.', translation: 'porque' },
  { word: 'world', ipa: '/wɜːrld/', phoneticSpelling: 'WURLD', example: 'English is spoken around the world.', translation: 'mundo' },
]

export async function POST() {
  try {
    // Create default teacher
    const existingTeacher = await db.user.findUnique({ where: { email: 'profesor@chambari.com' } })
    let teacher
    if (existingTeacher) {
      teacher = existingTeacher
    } else {
      teacher = await db.user.create({
        data: {
          email: 'profesor@chambari.com',
          password: hashPassword('chambari2024'),
          name: 'Profesor Chambari',
          role: 'TEACHER',
        },
      })
    }

    // Seed phonetic entries
    let phoneticCount = 0
    for (const entry of PHONETIC_ENTRIES) {
      await db.phoneticEntry.upsert({
        where: { word: entry.word },
        create: entry,
        update: {},
      })
      phoneticCount++
    }

    // Create sample module
    let moduleData = await db.module.findFirst({ where: { title: 'Fundamentos del Inglés' } })
    if (!moduleData) {
      moduleData = await db.module.create({
        data: {
          title: 'Fundamentos del Inglés',
          description: 'Aprende los fundamentos del idioma inglés: pronunciación, vocabulario básico y estructuras gramaticales esenciales.',
          orderIndex: 0,
          status: 'PUBLISHED',
          teacherId: teacher.id,
        },
      })
    }

    // Create sample lessons
    const lessonsData = [
      {
        title: 'Saludos y Presentaciones',
        description: 'Aprende a saludar y presentarte en inglés.',
        content: `# Saludos y Presentaciones

## Saludos formales e informales

### Formales:
- **Good morning** - Buenos días
- **Good afternoon** - Buenas tardes
- **Good evening** - Buenas noches
- **How do you do?** - ¿Cómo está usted?

### Informales:
- **Hi! / Hello!** - ¡Hola!
- **Hey!** - ¡Ey!
- **What's up?** - ¿Qué tal?
- **How's it going?** - ¿Cómo te va?

## Presentaciones
- **My name is...** - Mi nombre es...
- **Nice to meet you** - Encantado de conocerte
- **I'm from...** - Soy de...
- **I'm a student/teacher** - Soy estudiante/profesor`,
        orderIndex: 0,
        status: 'PUBLISHED' as const,
      },
      {
        title: 'El Alfabeto y Pronunciación Básica',
        description: 'Domina el alfabeto inglés y los sonidos fundamentales.',
        content: `# El Alfabeto y Pronunciación Básica

## El Alfabeto Inglés (The English Alphabet)

| Letra | Pronunciación | Ejemplo |
|-------|--------------|---------|
| A | /eɪ/ | Apple |
| B | /biː/ | Boy |
| C | /siː/ | Cat |
| D | /diː/ | Dog |
| E | /iː/ | Elephant |
| F | /ɛf/ | Fish |
| G | /dʒiː/ | Girl |
| H | /eɪtʃ/ | House |

## Sonidos Vocálicos Importantes
- /æ/ como en **cat** (gato)
- /ɪ/ como en **sit** (sentarse)
- /ʊ/ como en **book** (libro)
- /ə/ (schwa) como en **about** (acerca de)

## Sonidos Consonánticos Difíciles
- /θ/ (th suave): **think**, **thank**
- /ð/ (th fuerte): **this**, **that**
- /ʃ/ (sh): **ship**, **she**
- /tʃ/ (ch): **chair**, **teacher**`,
        orderIndex: 1,
        status: 'PUBLISHED' as const,
      },
      {
        title: 'Vocabulario Esencial del Aula',
        description: 'Palabras y frases indispensables para el entorno educativo.',
        content: `# Vocabulario Esencial del Aula

## En el Aula (In the Classroom)
- **Desk** - Escritorio
- **Chair** - Silla
- **Board** - Pizarra
- **Marker** - Marcador
- **Eraser** - Borrador
- **Notebook** - Cuaderno
- **Pencil** - Lápiz
- **Pen** - Bolígrafo
- **Book** - Libro
- **Dictionary** - Diccionario

## Instrucciones del Profesor
- **Open your book** - Abre tu libro
- **Listen carefully** - Escucha con atención
- **Repeat after me** - Repite después de mí
- **Work in pairs** - Trabajen en parejas
- **Raise your hand** - Levanta la mano
- **Be quiet** - Estate tranquilo/silencio

## Preguntas Comunes
- **How do you say...?** - ¿Cómo se dice...?
- **What does... mean?** - ¿Qué significa...?
- **Can you repeat that?** - ¿Puedes repetir eso?
- **I don't understand** - No entiendo`,
        orderIndex: 2,
        status: 'PUBLISHED' as const,
      },
    ]

    let lessonsCount = 0
    for (const lesson of lessonsData) {
      const existingLesson = await db.lesson.findFirst({
        where: { moduleId: moduleData.id, title: lesson.title },
      })
      if (!existingLesson) {
        await db.lesson.create({
          data: {
            moduleId: moduleData.id,
            teacherId: teacher.id,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            orderIndex: lesson.orderIndex,
            status: lesson.status,
          },
        })
        lessonsCount++
      } else {
        lessonsCount++
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      data: {
        teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
        phoneticEntries: phoneticCount,
        module: { id: moduleData.id, title: moduleData.title },
        lessons: lessonsCount,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
