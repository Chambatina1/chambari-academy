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
  { word: 'together', ipa: '/təˈɡeðər/', phoneticSpelling: 'tuh-GETH-er', example: "Let's work together.", translation: 'juntos' },
  { word: 'morning', ipa: '/ˈmɔːrnɪŋ/', phoneticSpelling: 'MOR-ning', example: 'Good morning, class!', translation: 'mañana' },
  { word: 'evening', ipa: '/ˈiːvnɪŋ/', phoneticSpelling: 'EEV-ning', example: 'We have class in the evening.', translation: 'tarde/noche' },
  { word: 'knowledge', ipa: '/ˈnɒlɪdʒ/', phoneticSpelling: 'NOL-ij', example: 'Knowledge is power.', translation: 'conocimiento' },
  { word: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/', phoneticSpelling: 'pruh-nun-see-AY-shuhn', example: 'Good pronunciation is essential.', translation: 'pronunciación' },
  { word: 'because', ipa: '/bɪˈkɒz/', phoneticSpelling: 'bih-KAWZ', example: 'I study because I want to learn.', translation: 'porque' },
  { word: 'world', ipa: '/wɜːrld/', phoneticSpelling: 'WURLD', example: 'English is spoken around the world.', translation: 'mundo' },
]

// ═══════════════════════════════════════════════════════════
// MODULE 1: Diagnóstico y Fundamentos (10 clases)
// ═══════════════════════════════════════════════════════════

const MODULE_1 = {
  title: 'Módulo 1: Diagnóstico y Fundamentos',
  description: 'Evaluación diagnóstica inicial y fundamentos esenciales del inglés: saludos, pronunciación, vocabulario básico y primeras estructuras gramaticales.',
  lessons: [
    // ── CLASE 1: DIAGNÓSTICO DE BIENVENIDA ──
    {
      title: 'Clase 1: Diagnóstico de Bienvenida',
      description: 'Evaluación diagnóstica para determinar tu nivel actual de inglés. ¡Bienvenido/a a Chambari Academy!',
      orderIndex: 0,
      content: `# Bienvenido/a a Chambari Academy

## Sobre esta evaluación diagnóstica

Esta evaluación inicial tiene como objetivo conocer tu nivel actual de inglés para personalizar tu experiencia de aprendizaje. No te preocupes si no sabes todas las respuestas: el propósito es identificar tus fortalezas y áreas de mejora.

**Instrucciones:**
- Lee cada pregunta cuidadosamente
- Selecciona la mejor respuesta entre las opciones
- No uses traductores ni herramientas externas
- Tómate tu tiempo, no hay límite de tiempo
- Al final, revisa tu puntuación para conocer tu nivel

---

## Sección 1: Vocabulario Básico (Preguntas 1-5)

**Pregunta 1.** ¿Cuál es el significado de "goodbye"?
- a) Buenos días
- b) Adiós
- c) Buenas noches
- d) Por favor

**Pregunta 2.** Completa: "She ___ a teacher."
- a) are
- b) am
- c) is
- d) be

**Pregunta 3.** ¿Cómo se dice "libro" en inglés?
- a) Library
- b) Book
- c) Notebook
- d) Read

**Pregunta 4.** Elige la respuesta correcta: "How ___ you?"
- a) is
- b) are
- c) am
- d) do

**Pregunta 5.** ¿Qué significa "please"?
- a) Gracias
- b) De nada
- c) Por favor
- d) Perdón

---

## Sección 2: Gramática Fundamental (Preguntas 6-10)

**Pregunta 6.** Identifica el error: "He don't like coffee."
- a) "He" debería ser "They"
- b) "don't" debería ser "doesn't"
- c) "like" debería ser "likes"
- d) No hay error

**Pregunta 7.** Completa: "I ___ to school every day."
- a) go
- b) goes
- c) going
- d) went

**Pregunta 8.** ¿Cuál es el pasado de "go"?
- a) goed
- b) going
- c) gone
- d) went

**Pregunta 9.** Elige la forma correcta: "They are ___ a movie."
- a) watch
- b) watches
- c) watching
- d) watched

**Pregunta 10.** ¿Qué tipo de palabra es "beautiful"?
- a) Sustantivo
- b) Verbo
- c) Adjetivo
- d) Adverbio

---

## Sección 3: Comprensión Lectora (Preguntas 11-15)

**Lee el siguiente texto y responde:**

"My name is Sarah. I live in a small town near London. I work as a nurse at the local hospital. Every morning, I wake up at 6:00 AM and have breakfast. Then I take the bus to work. I love my job because I can help people. In my free time, I enjoy reading books and going for walks in the park. I have two brothers and one sister. My family is very important to me."

**Pregunta 11.** ¿Dónde vive Sarah?
- a) En Londres
- b) Cerca de Londres
- c) En un hospital
- d) En un parque

**Pregunta 12.** ¿A qué se dedica Sarah?
- a) Doctora
- b) Profesora
- c) Enfermera
- d) Traductora

**Pregunta 13.** ¿Cómo llega al trabajo?
- a) En coche
- b) Caminando
- c) En autobús
- d) En tren

**Pregunta 14.** ¿Qué le gusta hacer en su tiempo libre?
- a) Ver televisión y cocinar
- b) Leer libros y caminar
- c) Jugar deportes y viajar
- d) Escuchar música y bailar

**Pregunta 15.** ¿Cuántos hermanos tiene Sarah?
- a) Uno
- b) Dos
- c) Tres
- d) Cuatro

---

## Sección 4: Gramática Intermedia (Preguntas 16-18)

**Pregunta 16.** Completa: "If it rains, I ___ stay home."
- a) will
- b) would
- c) am
- d) was

**Pregunta 17.** Elige la opción correcta: "I have ___ been to Paris."
- a) never
- b) ever
- c) already
- d) yet

**Pregunta 18.** ¿Cuál es la forma pasiva de "They clean the room"?
- a) The room is cleaned by them
- b) The room was cleaned by them
- c) The room cleans by them
- d) The room has been cleaned by them

---

## Sección 5: Vocabulario Avanzado (Preguntas 19-20)

**Pregunta 19.** ¿Qué significa "accomplish"?
- a) Compañía
- b) Lograr / cumplir
- c) Acompañar
- d) Acumular

**Pregunta 20.** Completa: "She's very reliable. You can always ___ on her."
- a) depend
- b) trust
- c) believe
- d) rely

---

## Guía de Puntuación

Cuenta todas tus respuestas correctas y revisa tu nivel:

| Puntuación | Nivel | Descripción |
|---|---|---|
| **0-4 puntos** | Principiante (A1) | Estás comenzando tu camino con el inglés. Empezaremos desde lo más básico: saludos, presentaciones y vocabulario diario. |
| **5-9 puntos** | Básico (A2) | Tienes conocimientos fundamentales. Reforzaremos las bases y ampliaremos tu vocabulario y gramática. |
| **10-14 puntos** | Intermedio (B1) | ¡Buen trabajo! Puedes comunicarte en situaciones cotidianas. Trabajaremos en fluidez y estructuras más complejas. |
| **15-17 puntos** | Intermedio Alto (B2) | Tienes un buen dominio del idioma. Perfeccionaremos tu gramática, vocabulario avanzado y expresiones naturales. |
| **18-20 puntos** | Avanzado (C1) | ¡Excelente! Tu nivel es muy alto. Nos enfocaremos en matices, expresiones idiomáticas y preparación para certificaciones. |

**Respuestas correctas:**
1-b, 2-c, 3-b, 4-b, 5-c, 6-b, 7-a, 8-d, 9-c, 10-c, 11-b, 12-c, 13-c, 14-b, 15-c, 16-a, 17-a, 18-a, 19-b, 20-d

---

## ¿Qué sigue?

Ahora que conoces tu nivel, continúa con las siguientes clases del Módulo 1 donde trabajaremos los fundamentos del inglés según tu resultado. ¡Vamos a empezar!`,
    },

    // ── CLASE 2: SALUDOS Y PRESENTACIONES ──
    {
      title: 'Clase 2: Saludos y Presentaciones',
      description: 'Aprende a saludar, despedirte y presentarte en inglés en contextos formales e informales.',
      orderIndex: 1,
      content: `# Saludos y Presentaciones

## Introducción
Los saludos y las presentaciones son lo primero que aprendemos en cualquier idioma. En inglés, existen diferentes formas de saludar dependiendo de la situación y del nivel de formalidad. Dominar estas expresiones te permitirá comunicarte desde el primer momento con hablantes nativos y sentirte más seguro/a en conversaciones cotidianas.

## Saludos Formales
Los saludos formales se utilizan en situaciones profesionales, con personas mayores o en contextos donde no hay confianza. Es importante conocerlos para demostrar respeto y educación en tu comunicación.

- **Good morning** - Buenos días (se usa hasta las 12:00 PM)
- **Good afternoon** - Buenas tardes (de 12:00 PM a 6:00 PM)
- **Good evening** - Buenas tardes/noches (después de las 6:00 PM)
- **How do you do?** - ¿Cómo está usted? (muy formal, se usa en presentaciones)
- **It is a pleasure to meet you** - Es un placer conocerte/conocerlo

**Ejemplo en contexto:**
> Good morning. My name is Dr. Johnson. It is a pleasure to meet you.
> (Buenos días. Mi nombre es el Dr. Johnson. Es un placer conocerlo.)

## Saludos Informales
Los saludos informales se usan con amigos, familiares y personas de confianza. Son más relajados y espontáneos.

- **Hi! / Hello!** - ¡Hola!
- **Hey!** - ¡Ey! (muy casual)
- **What's up?** - ¿Qué tal? / ¿Qué pasa?
- **How's it going?** - ¿Cómo te va?
- **How are things?** - ¿Cómo van las cosas?
- **Long time no see!** - ¡Cuánto tiempo sin verte!

**Ejemplo en contexto:**
> Hey, Sarah! Long time no see! How's it going?
> (¡Ey, Sarah! ¡Cuánto tiempo sin verte! ¿Cómo te va?)

## Presentaciones
Presentarse correctamente es fundamental para causar una buena primera impresión. Aquí tienes las estructuras más comunes para hablar de ti mismo.

### Presentación personal:
- **My name is... / I am...** - Mi nombre es... / Yo soy...
- **Nice to meet you** - Encantado/a de conocerte
- **I'm from [país/ciudad]** - Soy de [país/ciudad]
- **I'm a student / I'm a teacher** - Soy estudiante / Soy profesor/a
- **I work as a [profesión]** - Trabajo como [profesión]
- **I'm [edad] years old** - Tengo [edad] años

### Preguntar información:
- **What is your name?** - ¿Cuál es tu nombre?
- **Where are you from?** - ¿De dónde eres?
- **What do you do?** - ¿A qué te dedicas?
- **How old are you?** - ¿Cuántos años tienes?

**Ejemplo de conversación completa:**
> A: Hello! My name is Carlos. I'm from Mexico. I'm 25 years old.
> (¡Hola! Mi nombre es Carlos. Soy de México. Tengo 25 años.)
> B: Nice to meet you, Carlos! I'm Emma. I'm from Canada. I work as a designer.
> (¡Encantada de conocerte, Carlos! Soy Emma. Soy de Canadá. Trabajo como diseñadora.)

## Despedidas
Igual que los saludos, las despedidas tienen niveles de formalidad.

### Formales:
- **Goodbye** - Adiós
- **Farewell** - Despedida (muy formal)
- **Have a good day** - Que tengas un buen día
- **It was nice meeting you** - Fue un placer conocerte

### Informales:
- **Bye! / See you later!** - ¡Adiós! / ¡Hasta luego!
- **Take care!** - ¡Cuídate!
- **Catch you later!** - ¡Te veo luego!
- **Have a good one!** - ¡Que tengas un buen día!

## Ejercicios de Práctica

### Ejercicio 1: Completa el diálogo
> A: Good ________, Mr. Smith!
> B: Good morning! How ________ you?
> A: I'm fine, ________. And you?
> B: Very well, thank ________.

### Ejercicio 2: Traduce al inglés
1. Buenos días, me llamo Ana.
2. ¿De dónde eres?
3. Encantado de conocerte.
4. ¿A qué te dedicas?
5. ¡Hasta luego!

### Ejercicio 3: Elige la opción correcta
1. "______" - ¡Qué pasa?
   a) How do you do?  b) What's up?  c) Good evening

2. "Nice to meet you" significa:
   a) Buenos días  b) ¿Cómo estás?  c) Encantado de conocerte

## Resumen
En esta clase aprendiste las formas formales e informales de saludar, presentarte y despedirte en inglés. Recuerda que el contexto es clave: usa expresiones formales en el trabajo o con personas nuevas, y expresiones informales con amigos y familia. Practica estas frases todos los días para que se vuelvan naturales.`,
    },

    // ── CLASE 3: EL ALFABETO Y PRONUNCIACIÓN BÁSICA ──
    {
      title: 'Clase 3: El Alfabeto y Pronunciación Básica',
      description: 'Domina el alfabeto inglés y los sonidos fundamentales para una buena pronunciación desde el inicio.',
      orderIndex: 2,
      content: `# El Alfabeto y Pronunciación Básica

## Introducción
El alfabeto inglés tiene 26 letras, igual que el español, pero la pronunciación de muchas de ellas es completamente diferente. Conocer la pronunciación correcta de cada letra es esencial para deletrear palabras, entender direcciones y comunicarte efectivamente. En esta clase aprenderás el alfabeto completo y los sonidos más importantes del inglés.

## El Alfabeto Inglés (The English Alphabet)

### Vocales (Vowels):
| Letra | Pronunciación | Ejemplo | Significado |
|-------|--------------|---------|-------------|
| A | /eɪ/ | Apple | Manzana |
| E | /iː/ | Elephant | Elefante |
| I | /aɪ/ | Ice | Hielo |
| O | /oʊ/ | Orange | Naranja |
| U | /juː/ | Umbrella | Paraguas |

### Consonantes (Consonants):
| Letra | Pronunciación | Ejemplo | Significado |
|-------|--------------|---------|-------------|
| B | /biː/ | Boy | Niño |
| C | /siː/ | Cat | Gato |
| D | /diː/ | Dog | Perro |
| F | /ɛf/ | Fish | Pez |
| G | /dʒiː/ | Girl | Niña |
| H | /eɪtʃ/ | House | Casa |
| J | /dʒeɪ/ | Juice | Jugo |
| K | /keɪ/ | Key | Llave |
| L | /ɛl/ | Lion | León |
| M | /ɛm/ | Moon | Luna |
| N | /ɛn/ | Night | Noche |
| P | /piː/ | Pen | Bolígrafo |
| Q | /kjuː/ | Queen | Reina |
| R | /ɑːr/ | Rain | Lluvia |
| S | /ɛs/ | Sun | Sol |
| T | /tiː/ | Tree | Árbol |
| V | /viː/ | Very | Muy |
| W | /ˈdʌbəl.juː/ | Water | Agua |
| X | /ɛks/ | Box | Caja |
| Y | /waɪ/ | Yellow | Amarillo |
| Z | /zɛd/ o /ziː/ | Zoo | Zoológico |

## Sonidos Vocálicos Importantes
El inglés tiene sonidos vocálicos que no existen en español. Prestar atención a estos sonidos te ayudará a mejorar significativamente tu pronunciación.

- **/æ/** como en **cat** (gato) - La boca se abre más que en español. No es "ca" sino algo entre "ca" y "e".
- **/ɪ/** como en **sit** (sentarse) - Un sonido corto entre "i" y "e".
- **/ʊ/** como en **book** (libro) - Un sonido corto y relajado, como una "u" suave.
- **/ə/** (schwa) como en **about** (acerca de) - El sonido más común en inglés. Es como una "a" muy suave y relajada.

**Practica estas palabras:**
> cat /kæt/ - sit /sɪt/ - book /bʊk/ - about /əˈbaʊt/

## Sonidos Consonánticos Difíciles
Algunos sonidos del inglés no existen en español y requieren práctica especial.

- **/θ/** (th suave): Pon la lengua entre los dientes y sopla.
  - **think** /θɪŋk/ (pensar), **thank** /θæŋk/ (agradecer), **three** /θriː/ (tres)

- **/ð/** (th fuerte): Igual que el anterior pero con vibración de las cuerdas vocales.
  - **this** /ðɪs/ (esto), **that** /ðæt/ (eso), **the** /ðə/ (el/la/los/las)

- **/ʃ/** (sh): Como una "ch" suave española.
  - **ship** /ʃɪp/ (barco), **she** /ʃiː/ (ella), **shoe** /ʃuː/ (zapato)

- **/tʃ/** (ch): Similar a la "ch" española.
  - **chair** /tʃeər/ (silla), **teacher** /ˈtiːtʃər/ (profesor), **chocolate** /ˈtʃɒklət/

## Deletrear (Spelling)
En inglés es muy común tener que deletrear tu nombre, correo electrónico o dirección. Aquí tienes ejemplos:

**Diálogo:**
> A: Can you spell your name, please?
> (¿Puedes deletrear tu nombre, por favor?)
> B: Sure! M-A-R-I-A.
> (¡Claro! M-A-R-I-A.)
> A: Thank you. And your email?
> (Gracias. ¿Y tu correo electrónico?)
> B: It's maria at chambari dot com.
> (Es maria arroba chambari punto com.)

## Ejercicios de Práctica

### Ejercicio 1: Escucha y repite
Practica diciendo cada letra del alfabeto en voz alta. Grábate y compárate con un hablante nativo.

### Ejercicio 2: Deletrea las siguientes palabras
1. HELLO = H-E-L-L-O
2. WORLD = W-O-R-L-D
3. ENGLISH = E-N-G-L-I-S-H
4. ACADEMY = A-C-A-D-E-M-Y
5. LANGUAGE = L-A-N-G-U-A-G-E

### Ejercicio 3: Identifica el sonido
¿Qué sonido representa la letra subrayada?
1. **a**pple = /eɪ/
2. b**oo**k = /ʊ/
3. c**a**t = /æ/
4. **i**ce = /aɪ/
5. sch**oo**l = /uː/

## Resumen
En esta clase aprendiste el alfabeto inglés completo con su pronunciación, los sonidos vocálicos y consonánticos más desafiantes para hispanohablantes, y cómo deletrear palabras. La pronunciación es una habilidad que se desarrolla con práctica constante. Recuerda escuchar atentamente a hablantes nativos y repetir en voz alta.`,
    },

    // ── CLASE 4: VOCABULARIO ESENCIAL DEL AULA ──
    {
      title: 'Clase 4: Vocabulario Esencial del Aula',
      description: 'Palabras y frases indispensables para el entorno educativo y la comunicación en clase.',
      orderIndex: 3,
      content: `# Vocabulario Esencial del Aula

## Introducción
Para aprender inglés de manera efectiva, necesitas familiarizarte con el vocabulario que se usa en el entorno educativo. Las expresiones que aprenderás en esta clase te permitirán seguir instrucciones, hacer preguntas y participar activamente en tus clases de inglés. Este vocabulario es la base sobre la cual construirás tu aprendizaje.

## Objetos del Aula (Classroom Objects)
Estas son las palabras más comunes que encontrarás en cualquier salón de clases.

- **Desk** - Escritorio: "Sit at your desk, please."
- **Chair** - Silla: "Pull up a chair."
- **Board** - Pizarra: "Look at the board."
- **Marker** - Marcador: "Pass me the red marker."
- **Eraser** - Borrador: "I need an eraser."
- **Notebook** - Cuaderno: "Write this in your notebook."
- **Pencil** - Lápiz: "Can I borrow a pencil?"
- **Pen** - Bolígrafo: "Use a pen for the final draft."
- **Book** - Libro: "Open your book to page 10."
- **Dictionary** - Diccionario: "Use a dictionary if you need help."
- **Backpack** - Mochila: "Put your backpack under the desk."
- **Folder** - Carpeta: "Keep your papers in the folder."

## Instrucciones del Profesor (Teacher Instructions)
Estas frases escucharás frecuentemente en clase. Es importante que las entiendas para seguir el ritmo de la lección.

- **Open your book** - Abre tu libro
- **Close your book** - Cierra tu libro
- **Listen carefully** - Escucha con atención
- **Repeat after me** - Repite después de mí
- **Work in pairs** - Trabajen en parejas
- **Work in groups** - Trabajen en grupos
- **Raise your hand** - Levanta la mano
- **Be quiet** - Silencio / Estate tranquilo/a
- **Pay attention** - Presta atención
- **Stand up** - Levántate
- **Sit down** - Siéntate
- **Turn to page [número]** - Ve a la página [número]
- **Take notes** - Toma apuntes
- **Hand in your homework** - Entrega tu tarea

## Preguntas Comunes en Clase
Saber hacer preguntas es fundamental para tu aprendizaje. Estas son las preguntas más útiles que puedes hacer durante una clase.

- **How do you say [palabra] in English?** - ¿Cómo se dice [palabra] en inglés?
- **What does [palabra] mean?** - ¿Qué significa [palabra]?
- **Can you repeat that, please?** - ¿Puedes repetir eso, por favor?
- **Can you speak more slowly, please?** - ¿Puedes hablar más despacio, por favor?
- **I don't understand** - No entiendo
- **I have a question** - Tengo una pregunta
- **How do you spell that?** - ¿Cómo se deletrea eso?
- **What's the difference between X and Y?** - ¿Cuál es la diferencia entre X e Y?
- **Can you give me an example?** - ¿Puedes darme un ejemplo?
- **Is this correct?** - ¿Esto es correcto?

## Acciones Comunes (Common Actions)
Verbos que usarás constantemente en el contexto de aprendizaje.

- **To read** - Leer: "Read the paragraph aloud."
- **To write** - Escribir: "Write three sentences."
- **To listen** - Escuchar: "Listen to the audio."
- **To speak** - Hablar: "Speak English in class."
- **To study** - Estudiar: "I study every evening."
- **To learn** - Aprender: "We learn new words today."
- **To practice** - Practicar: "Practice makes perfect."
- **To understand** - Entender: "I understand the lesson."
- **To explain** - Explicar: "Can you explain this word?"
- **To answer** - Responder: "Answer the questions."

## Frases Útiles para Estudiantes
Expresiones que te ayudarán a comunicarte mejor durante tus clases.

- **I'm ready** - Estoy listo/a
- **I finished** - Terminé
- **I need help** - Necesito ayuda
- **May I go to the bathroom?** - ¿Puedo ir al baño?
- **I forgot my homework** - Olvidé mi tarea
- **Can I work with a partner?** - ¿Puedo trabajar con un compañero?
- **I agree / I disagree** - Estoy de acuerdo / No estoy de acuerdo
- **In my opinion...** - En mi opinión...

## Ejercicios de Práctica

### Ejercicio 1: Relaciona
Conecta cada palabra en inglés con su traducción al español:
1. Eraser ——— ———
2. Notebook ——— ———
3. Raise your hand ——— ———
4. Take notes ——— ———
5. May I go to the bathroom? ——— ———

### Ejercicio 2: Completa la frase
1. "_____ carefully to the audio." (Escucha con atención)
2. "Can you _____ that, please?" (¿Puedes repetir?)
3. "I don't _____." (No entiendo)
4. "Work in _____." (Trabajen en parejas)
5. "_____ your book to page 5." (Abre tu libro)

### Ejercicio 3: Traducción
Traduce las siguientes frases al inglés:
1. ¿Puedes hablar más despacio?
2. ¿Cómo se dice "escritorio" en inglés?
3. Necesito un borrador.
4. Presta atención a la pizarra.
5. Levanta la mano si tienes una pregunta.

## Resumen
En esta clase aprendiste el vocabulario esencial del aula: objetos, instrucciones del profesor, preguntas comunes, verbos de acción y frases útiles. Este vocabulario te acompañará durante todo tu aprendizaje. Practícalo en cada clase para que se vuelva automático.`,
    },

    // ── CLASE 5: NÚMEROS, FECHAS Y HORAS ──
    {
      title: 'Clase 5: Números, Fechas y Horas',
      description: 'Aprende a contar, decir la fecha y la hora en inglés con confianza.',
      orderIndex: 4,
      content: `# Números, Fechas y Horas

## Introducción
Los números, las fechas y las horas son parte fundamental de la comunicación diaria. Desde decir tu edad hasta programar una reunión, necesitas dominar estos elementos básicos del inglés. En esta clase aprenderás los números del 0 al 1,000, cómo decir fechas y cómo expresar la hora en diferentes formatos.

## Números del 0 al 20
Estos son los números básicos que debes memorizar.

| Número | Inglés | Pronunciación |
|--------|--------|---------------|
| 0 | Zero | /ˈzɪəroʊ/ |
| 1 | One | /wʌn/ |
| 2 | Two | /tuː/ |
| 3 | Three | /θriː/ |
| 4 | Four | /fɔːr/ |
| 5 | Five | /faɪv/ |
| 6 | Six | /sɪks/ |
| 7 | Seven | /ˈsɛvən/ |
| 8 | Eight | /eɪt/ |
| 9 | Nine | /naɪn/ |
| 10 | Ten | /tɛn/ |
| 11 | Eleven | /ɪˈlɛvən/ |
| 12 | Twelve | /twɛlv/ |
| 13 | Thirteen | /θɜːrˈtiːn/ |
| 14 | Fourteen | /fɔːrˈtiːn/ |
| 15 | Fifteen | /fɪfˈtiːn/ |
| 16 | Sixteen | /sɪkˈstiːn/ |
| 17 | Seventeen | /sɛvənˈtiːn/ |
| 18 | Eighteen | /eɪˈtiːn/ |
| 19 | Nineteen | /naɪnˈtiːn/ |
| 20 | Twenty | /ˈtwɛnti/ |

## Decenas (Tens)
Para formar los números del 30 al 90, se añade "-ty":

- **Thirty** (30), **Forty** (40), **Fifty** (50), **Sixty** (60), **Seventy** (70), **Eighty** (80), **Ninety** (90)

**Nota importante:** "Forty" se escribe SIN "u" (no es "fourty").

### Números compuestos (21-99):
Se une la decena con el dígito con un guion:
- 21 = twenty-one
- 35 = thirty-five
- 99 = ninety-nine

### Centenas y miles:
- 100 = one hundred
- 200 = two hundred
- 500 = five hundred
- 1,000 = one thousand

**Ejemplos:**
> I am 25 years old. (Tengo 25 años.)
> The book costs 50 dollars. (El libro cuesta 50 dólares.)
> There are 365 days in a year. (Hay 365 días en un año.)

## Los Días de la Semana (Days of the Week)
Los días de la semana siempre se escriben con mayúscula inicial en inglés.

- **Monday** - Lunes
- **Tuesday** - Martes
- **Wednesday** - Miércoles (se pronuncia /ˈwɛnzdeɪ/)
- **Thursday** - Jueves
- **Friday** - Viernes
- **Saturday** - Sábado
- **Sunday** - Domingo

**Frase útil:** "Today is Monday." (Hoy es lunes.)

## Los Meses del Año (Months of the Year)
- **January** - Enero
- **February** - Febrero
- **March** - Marzo
- **April** - Abril
- **May** - Mayo
- **June** - Junio
- **July** - Julio
- **August** - Agosto
- **September** - Septiembre
- **October** - Octubre
- **November** - Noviembre
- **December** - Diciembre

## Fechas (Dates)
En inglés americano, el formato es **mes/día/año**, y se usa el ordinal.

- **January 15th** - 15 de enero
- **March 3rd** - 3 de marzo
- **July 4th** - 4 de julio
- **October 21st** - 21 de octubre

**Ejemplos:**
> My birthday is on May 5th. (Mi cumpleaños es el 5 de mayo.)
> Today is September 15th, 2024. (Hoy es 15 de septiembre de 2024.)
> The exam is on Monday, October 20th. (El examen es el lunes 20 de octubre.)

## La Hora (Time)

### Preguntar la hora:
- **What time is it?** - ¿Qué hora es?
- **What's the time?** - ¿Qué hora es?

### Decir la hora:
- **It's 3:00** - Son las 3:00 (en punto)
- **It's 3:15** - Son las 3:15 (and a quarter = y cuarto)
- **It's 3:30** - Son las 3:30 (half past = y media)
- **It's 3:45** - Son las 3:45 (a quarter to = menos cuarto para las 4)

### AM y PM:
- **AM** (Ante Meridiem) = De medianoche a mediodía (00:00 - 11:59)
- **PM** (Post Meridiem) = De mediodía a medianoche (12:00 - 23:59)

**Ejemplos:**
> I wake up at 6:00 AM. (Me despierto a las 6:00 AM.)
> The class starts at 9:30 AM. (La clase empieza a las 9:30 AM.)
> I go to bed at 10:30 PM. (Me acuesto a las 10:30 PM.)

## Ejercicios de Práctica

### Ejercicio 1: Escribe el número en inglés
1. 47 = __________
2. 123 = __________
3. 2,005 = __________
4. 88 = __________
5. 350 = __________

### Ejercicio 2: Traduce las fechas
1. 14 de febrero = __________
2. 25 de diciembre = __________
3. 1 de enero = __________
4. 16 de septiembre = __________

### Ejercicio 3: Dibuja y escribe la hora
1. 7:15 = It's _______________
2. 12:30 = It's _______________
3. 9:45 = It's _______________
4. 3:00 = It's _______________

## Resumen
En esta clase aprendiste los números en inglés, los días de la semana, los meses del año, cómo expresar fechas y cómo decir la hora. Estos elementos son esenciales para la vida diaria. Practica diciendo tu fecha de nacimiento, la hora actual y contando objetos a tu alrededor.`,
    },

    // ── CLASE 6: LA FAMILIA Y DESCRIPCIONES PERSONALES ──
    {
      title: 'Clase 6: La Familia y Descripciones Personales',
      description: 'Vocabulario familiar y cómo describir a las personas físicamente y por personalidad.',
      orderIndex: 5,
      content: `# La Familia y Descripciones Personales

## Introducción
Hablar de tu familia y saber describir a las personas son habilidades esenciales en cualquier idioma. En esta clase aprenderás el vocabulario de la familia en inglés, cómo describir el aspecto físico de alguien y cómo hablar sobre la personalidad. Estas expresiones te serán útiles en conversaciones sociales, presentaciones formales y escritos descriptivos.

## Vocabulario de la Familia (Family Vocabulary)

### Familia cercana (Immediate Family):
- **Mother / Mom** - Madre / Mamá
- **Father / Dad** - Padre / Papá
- **Brother** - Hermano
- **Sister** - Hermana
- **Son** - Hijo
- **Daughter** - Hija
- **Husband** - Esposo
- **Wife** - Esposa
- **Baby** - Bebé

### Familia extendida (Extended Family):
- **Grandfather / Grandpa** - Abuelo
- **Grandmother / Grandma** - Abuela
- **Uncle** - Tío
- **Aunt** - Tía
- **Cousin** - Primo/a
- **Nephew** - Sobrino
- **Niece** - Sobrina

### Otros términos:
- **Parents** - Padres (mamá y papá)
- **Siblings** - Hermanos (colectivo)
- **Relatives** - Parientes
- **In-laws** - Consuegros / familia política
- **Twin** - Gemelo/a
- **Only child** - Hijo único

**Ejemplo:**
> I have a big family. I have two brothers and one sister. My grandparents live in Mexico.
> (Tengo una familia grande. Tengo dos hermanos y una hermana. Mis abuelos viven en México.)

## Descripción Física (Physical Description)

### Cabello (Hair):
- **Short / Long** - Corto / Largo
- **Straight / Curly / Wavy** - Liso / Rizado / Ondulado
- **Blonde** - Rubio
- **Brown** - Castaño
- **Black** - Negro
- **Red / Ginger** - Pelirrojo
- **Bald** - Calvo

### Ojos (Eyes):
- **Blue** - Azules
- **Brown** - Marrones
- **Green** - Verdes
- **Hazel** - Avellana

### Estatura y Complexión:
- **Tall** - Alto/a
- **Short** - Bajo/a
- **Medium height** - Estatura media
- **Thin / Slim** - Delgado/a
- **Average build** - Complexión normal
- **Well-built** - Fuerte / Robusto

**Ejemplo de descripción física:**
> My brother is tall and well-built. He has short black hair and brown eyes. He is very handsome.
> (Mi hermano es alto y robusto. Él tiene el cabello negro corto y ojos marrones. Es muy guapo.)

## Personalidad (Personality Traits)

### Positivas:
- **Kind** - Amable
- **Funny** - Divertido/a
- **Smart / Intelligent** - Inteligente
- **Generous** - Generoso/a
- **Friendly** - Amigable
- **Honest** - Honesto/a
- **Creative** - Creativo/a
- **Brave** - Valiente
- **Patient** - Paciente
- **Responsible** - Responsable
- **Outgoing** - Extrovertido/a

### Negativas:
- **Shy** - Tímido/a
- **Lazy** - Perezoso/a
- **Selfish** - Egoísta
- **Impatient** - Impaciente
- **Stubborn** - Terco/a

**Ejemplo:**
> My mother is very kind and patient. She is also creative and loves cooking.
> (Mi madre es muy amable y paciente. También es creativa y le encanta cocinar.)

## Estructura para Describir a Alguien

Usa esta plantilla para describir a una persona completa:

> [Name] is my [relationship]. He/She is [age] years old. He/She is [height] and has [hair description]. His/Her eyes are [eye color]. He/She is [personality adjectives]. He/She likes [hobbies].

**Ejemplo completo:**
> Maria is my sister. She is 22 years old. She is medium height and has long curly brown hair. Her eyes are green. She is very friendly, creative and smart. She likes reading and painting.
> (María es mi hermana. Ella tiene 22 años. Es de estatura media y tiene el cabello castaño largo y rizado. Sus ojos son verdes. Ella es muy amigable, creativa e inteligente. Le gusta leer y pintar.)

## Ejercicios de Práctica

### Ejercicio 1: Completa el vocabulario
1. El hijo de mi tío es mi _______ (primo)
2. La madre de mi madre es mi _______ (abuela)
3. El hermano de mi madre es mi _______ (tío)
4. La hija de mi hermano es mi _______ (sobrina)
5. My _______ and _______ are my parents. (madre y padre)

### Ejercicio 2: Traduce al inglés
1. Mi padre es alto y tiene el cabello negro.
2. Ella es muy amable y creativa.
3. Mi hermano menor es tímido pero inteligente.
4. Tengo una hermana que es rubia y alta.

### Ejercicio 3: Describe a un familiar
Usa la plantilla para escribir una descripción de 5-6 líneas sobre un miembro de tu familia.

## Resumen
En esta clase aprendiste el vocabulario de la familia, cómo describir el aspecto físico de una persona y cómo hablar sobre rasgos de personalidad. Practica describiendo a los miembros de tu familia y a tus amigos en voz alta para ganar fluidez.`,
    },

    // ── CLASE 7: RUTINA DIARIA ──
    {
      title: 'Clase 7: Rutina Diaria',
      description: 'Describe tu día a día usando verbos en presente simple y vocabulario de actividades cotidianas.',
      orderIndex: 6,
      content: `# Rutina Diaria

## Introducción
Poder describir tu rutina diaria es una de las habilidades más prácticas del inglés. Te permite hablar sobre ti, compartir tu vida con otros y entender cuando alguien te cuenta sobre su día. En esta clase aprenderás el vocabulario de las actividades cotidianas y usarás el presente simple, que es el tiempo verbal principal para describir hábitos y rutinas.

## Verbos de Rutina Diaria (Daily Routine Verbs)

### Por la mañana:
- **To wake up** - Despertarse: "I wake up at 7:00 AM."
- **To get up** - Levantarse: "I get up immediately."
- **To take a shower** - Ducharse: "I take a shower every morning."
- **To brush my teeth** - Cepillarse los dientes: "I brush my teeth after breakfast."
- **To get dressed** - Vestirse: "I get dressed in my uniform."
- **To have/eat breakfast** - Desayunar: "I have breakfast at 7:30."

### Durante el día:
- **To go to work/school** - Ir al trabajo/escuela: "I go to school at 8:00."
- **To study** - Estudiar: "I study English for one hour."
- **To have lunch** - Almorzar: "I have lunch at 1:00 PM."
- **To work** - Trabajar: "I work from 9 to 5."
- **To exercise** - Ejercitarse: "I exercise three times a week."
- **To cook** - Cocinar: "I cook dinner every evening."

### Por la noche:
- **To have/eat dinner** - Cenar: "I have dinner at 8:00 PM."
- **To watch TV** - Ver televisión: "I watch TV after dinner."
- **To read** - Leer: "I read a book before bed."
- **To relax** - Relajarse: "I relax on the weekends."
- **To go to bed** - Irse a la cama: "I go to bed at 10:30 PM."
- **To sleep** - Dormir: "I sleep about 8 hours."

## El Presente Simple para Rutinas
El presente simple se usa para describir hábitos, rutinas y hechos generales.

### Estructura afirmativa:
**Sujeto + verbo (base form)**

| Sujeto | Verbo | Ejemplo |
|--------|-------|---------|
| I | wake up | I wake up at 7. |
| You | wake up | You wake up at 7. |
| He/She/It | wakes up** | She wakes up at 7. |
| We | wake up | We wake up at 7. |
| They | wake up | They wake up at 7. |

**Regla clave:** Se añade "-s" o "-es" al verbo con he/she/it.

### Estructura negativa:
**Sujeto + don't/doesn't + verbo (base form)**
- "I don't wake up late."
- "She doesn't drink coffee."

### Estructura interrogativa:
**Do/Does + sujeto + verbo?**
- "Do you wake up early?"
- "Does she exercise every day?"

## Adverbios de Frecuencia (Frequency Adverbs)
Estos adverbios indican con qué frecuencia realizas una acción.

| Adverbio | Frecuencia | Posición |
|----------|-----------|----------|
| Always | Siempre (100%) | Antes del verbo |
| Usually | Usualmente (90%) | Antes del verbo |
| Often | A menudo (70%) | Antes del verbo |
| Sometimes | A veces (50%) | Antes del verbo |
| Rarely | Raramente (20%) | Antes del verbo |
| Never | Nunca (0%) | Antes del verbo |

**Ejemplos:**
> I always wake up at 7:00. (Siempre me despierto a las 7:00.)
> She usually has coffee for breakfast. (Usualmente toma café en el desayuno.)
> I never go to bed late. (Nunca me acuesto tarde.)
> We sometimes eat pizza on Fridays. (A veces comemos pizza los viernes.)

## Mi Rutina - Ejemplo Completo

> My name is Carlos and this is my daily routine.
>
> I always wake up at 6:30 AM. First, I take a shower and brush my teeth. Then, I get dressed and have breakfast. I usually eat eggs, toast, and coffee.
>
> I go to work at 8:00 AM. I work in an office from 8:00 to 12:00. I have lunch at 12:30. In the afternoon, I work from 1:00 to 5:00 PM.
>
> After work, I often go to the gym. I exercise for about an hour. Then, I go home and cook dinner. I usually have dinner at 7:30 PM.
>
> In the evening, I relax. I sometimes watch TV or read a book. I rarely go out on weekdays. I always go to bed at 10:30 PM.
>
> On weekends, my routine is different. I wake up late, around 9:00 AM. I often meet my friends and we go to the park or the movies.

## Ejercicios de Práctica

### Ejercicio 1: Ordena la rutina
Pon las siguientes acciones en orden lógico:
1. a) Have breakfast
2. b) Wake up
3. c) Brush teeth
4. d) Get dressed
5. e) Take a shower

### Ejercicio 2: Completa con el verbo correcto (Presente Simple)
1. She _______ (wake up) at 6:00 AM every day.
2. They _______ (not/have) lunch at home.
3. _______ you _______ (study) English every evening?
4. He always _______ (take) a shower in the morning.
5. We usually _______ (go) to bed at 10:00 PM.

### Ejercicio 3: Escribe tu rutina
Escribe 8-10 oraciones describiendo tu rutina diaria usando presente simple y adverbios de frecuencia.

## Resumen
En esta clase aprendiste el vocabulario de actividades cotidianas, la estructura del presente simple para rutinas, los adverbios de frecuencia y cómo escribir un párrafo describiendo tu día. Practica escribiendo sobre tu rutina y leyéndola en voz alta para ganar confianza.`,
    },

    // ── CLASE 8: COMIDA Y RESTAURANTE ──
    {
      title: 'Clase 8: Comida y Restaurante',
      description: 'Vocabulario de alimentos, bebidas y frases esenciales para pedir comida en un restaurante.',
      orderIndex: 7,
      content: `# Comida y Restaurante

## Introducción
La comida es un tema central de la vida social y cultural. Saber hablar sobre alimentos y saber pedir en un restaurante en inglés son habilidades que usarás frecuentemente, ya sea de viaje, en reuniones sociales o simplemente cuando quieras ordenar comida en inglés. En esta clase aprenderás el vocabulario esencial de comida, las comidas del día y cómo desenvolverte en un restaurante.

## Las Comidas del Día (Meals of the Day)
- **Breakfast** - Desayuno: La primera comida del día, generalmente por la mañana.
- **Lunch** - Almuerzo/Comida: Se toma al mediodía.
- **Dinner** - Cena: La comida principal de la tarde/noche.
- **Snack** - Merienda: Un aperitivo ligero entre comidas.
- **Brunch** - Brunch: Combinación de breakfast y lunch, generalmente los domingos.

## Grupos de Alimentos (Food Groups)

### Frutas (Fruits):
- Apple (manzana), Banana (plátano), Orange (naranja), Strawberry (fresa), Grape (uva), Watermelon (sandía), Lemon (limón), Pineapple (piña)

### Verduras (Vegetables):
- Carrot (zanahoria), Tomato (tomate), Potato (papa/patata), Onion (cebolla), Lettuce (lechuga), Broccoli (brócoli), Corn (maíz), Pepper (pimiento)

### Carnes (Meats):
- Chicken (pollo), Beef (res/carne), Pork (cerdo), Fish (pescado), Lamb (cordero)

### Lácteos (Dairy):
- Milk (leche), Cheese (queso), Butter (mantequilla), Yogurt (yogur), Eggs (huevos)

### Granos y Cereales (Grains):
- Bread (pan), Rice (arroz), Pasta (pasta), Cereal (cereal), Oats (avena)

### Bebidas (Drinks):
- Water (agua), Coffee (café), Tea (té), Juice (jugo), Soda (refresco), Beer (cerveza), Wine (vino)

### Otros:
- Salt (sal), Pepper (pimienta), Sugar (azúcar), Oil (aceite), Flour (harina)

## En el Restaurante (At the Restaurant)

### Frases para entrar y pedir mesa:
- **Table for two, please.** - Mesa para dos, por favor.
- **I have a reservation.** - Tengo una reserva.
- **Can we see the menu, please?** - ¿Podemos ver el menú, por favor?

### Pedir comida:
- **I would like... / I'll have...** - Me gustaría... / Voy a tomar...
- **Can I have the chicken, please?** - ¿Puedo tomar el pollo, por favor?
- **What do you recommend?** - ¿Qué recomienda?
- **Is there anything vegetarian?** - ¿Hay algo vegetariano?

### Durante la comida:
- **Could I have some more water, please?** - ¿Podría traerme más agua, por favor?
- **This is delicious!** - ¡Esto está delicioso!
- **Excuse me, this is not what I ordered.** - Disculpe, esto no es lo que pedí.

### Pagar la cuenta:
- **The check, please.** - La cuenta, por favor.
- **Can I pay by card?** - ¿Puedo pagar con tarjeta?
- **Keep the change.** - Quedese con el cambio.
- **Does this include the tip?** - ¿Esto incluye la propina?

## Diálogo Completo en un Restaurante

> **Waiter:** Good evening! Welcome to The Golden Fork. Table for two?
> **Customer:** Yes, please. We have a reservation under "Martinez."
> **Waiter:** Of course. Right this way, please. Here are your menus. Can I get you something to drink?
> **Customer:** I'll have a glass of water, please. And you?
> **Friend:** I'd like an iced tea, please.
> **Waiter:** Excellent. I'll be back to take your order.
> *(Later...)*
> **Waiter:** Are you ready to order?
> **Customer:** Yes, I'll have the grilled chicken with a side salad, please.
> **Friend:** I'd like the pasta with tomato sauce.
> **Waiter:** Perfect choice. Your food will be ready in about 15 minutes.
> *(After eating...)*
> **Customer:** Excuse me, could we have the check, please?
> **Waiter:** Of course. Here you go.
> **Customer:** Can we split the bill?
> **Waiter:** No problem. I can divide it for you.

## Ejercicios de Práctica

### Ejercicio 1: Clasifica los alimentos
Separa estas palabras en las categorías correctas:
Chicken, Water, Apple, Lettuce, Cheese, Coffee, Banana, Rice, Beef, Tea

### Ejercicio 2: Completa el diálogo
> Waiter: Good evening! ________ for ________?
> You: Yes, ________. Can we see the ________, please?
> Waiter: Here you are. Can I get you something to ________?
> You: I'll ________ a glass of water.
> Waiter: And for your ________?
> You: I would ________ the grilled fish, please.

### Ejercicio 3: Traducción
Traduce al inglés:
1. Me gustaría el pollo con arroz, por favor.
2. ¿Qué recomienda usted?
3. La cuenta, por favor.
4. ¿Puedo pagar con tarjeta?
5. Esto está delicioso.

## Resumen
En esta clase aprendiste el vocabulario de alimentos y bebidas, las comidas del día y las frases esenciales para comunicarte en un restaurante. Practica estos diálogos en voz alta y la próxima vez que visites un restaurante donde hablen inglés, ¡te sentirás mucho más seguro/a!`,
    },

    // ── CLASE 9: LUGARES Y DIRECCIONES ──
    {
      title: 'Clase 9: Lugares y Direcciones',
      description: 'Aprende el vocabulario de lugares en la ciudad y cómo pedir y dar direcciones en inglés.',
      orderIndex: 8,
      content: `# Lugares y Direcciones

## Introducción
Saberte mover en una ciudad donde se habla inglés es una habilidad fundamental. Ya sea que estés de viaje, viviendo en el extranjero o simplemente necesites dar indicaciones a alguien, el vocabulario de lugares y direcciones te será indispensable. En esta clase aprenderás los nombres de los lugares más comunes en una ciudad, el vocabulario de direcciones y cómo pedir y dar indicaciones.

## Lugares en la Ciudad (Places in the City)

### Lugares esenciales:
- **Hospital** - Hospital
- **School** - Escuela
- **Bank** - Banco
- **Pharmacy / Drugstore** - Farmacia
- **Police station** - Comisaría
- **Post office** - Oficina de correos
- **Library** - Biblioteca
- **Church** - Iglesia
- **Museum** - Museo
- **Movie theater / Cinema** - Cine

### Compras y servicios:
- **Supermarket** - Supermercado
- **Shopping mall** - Centro comercial
- **Restaurant** - Restaurante
- **Cafe** - Cafetería
- **Bakery** - Panadería
- **Bookstore** - Librería
- **Gas station** - Gasolinera
- **Laundry** - Lavandería

### Transporte:
- **Bus stop** - Parada de autobús
- **Train station** - Estación de tren
- **Airport** - Aeropuerto
- **Subway / Metro station** - Estación de metro
- **Taxi stand** - Parada de taxi

### Recreación:
- **Park** - Parque
- **Gym** - Gimnasio
- **Swimming pool** - Piscina
- **Stadium** - Estadio
- **Beach** - Playa

## Vocabulario de Direcciones (Directions Vocabulary)

### Preposiciones de lugar:
- **Next to** - Al lado de: "The bank is next to the pharmacy."
- **Across from** - Enfrente de: "The park is across from the school."
- **Between** - Entre: "The cafe is between the bank and the library."
- **Behind** - Detrás de: "The parking lot is behind the building."
- **In front of** - Frente a: "There is a tree in front of the house."
- **On the corner** - En la esquina: "The supermarket is on the corner."
- **Near** - Cerca de: "My house is near the park."
- **Far from** - Lejos de: "The airport is far from here."

### Direcciones (Giving directions):
- **Go straight** - Sigue recto
- **Turn left** - Gira a la izquierda
- **Turn right** - Gira a la derecha
- **Go past** - Pasa de largo / Sigue pasando
- **Go along** - Sigue por
- **Cross the street** - Cruza la calle
- **At the traffic light** - En el semáforo
- **At the roundabout** - En la glorieta
- **Take the first/second street** - Toma la primera/segunda calle
- **It's on your left/right** - Está a tu izquierda/derecha

## Preguntar Direcciones (Asking for Directions)

- **Excuse me, where is the [place]?** - Disculpe, ¿dónde está el/la [lugar]?
- **How do I get to [place]?** - ¿Cómo llego a [lugar]?
- **Can you show me on the map?** - ¿Puede mostrarme en el mapa?
- **Is it far from here?** - ¿Está lejos de aquí?
- **How long does it take to walk there?** - ¿Cuánto tiempo se tarda caminando?
- **Am I going in the right direction?** - ¿Voy en la dirección correcta?

## Diálogo Completo: Pidiendo Direcciones

> **Tourist:** Excuse me, can you help me? I'm looking for the train station.
> **Local:** Sure! Go straight along this street for two blocks.
> **Tourist:** Two blocks. Got it.
> **Local:** Then turn left at the traffic light. You'll see a bank on the corner.
> **Tourist:** OK, turn left at the traffic light.
> **Local:** Yes. Go past the bank and the train station is right across from the park. You can't miss it.
> **Tourist:** Is it far from here?
> **Local:** No, it's about a 10-minute walk.
> **Tourist:** Thank you so much!
> **Local:** You're welcome!

## Diálogo Completo: En el Transporte

> **Passenger:** Excuse me, does this bus go to downtown?
> **Driver:** Yes, it does. That'll be two dollars.
> **Passenger:** Here you go. How many stops until downtown?
> **Driver:** About five stops. I'll call it out when we get there.
> **Passenger:** Thank you. Can you let me know when we're near Central Park?
> **Driver:** Sure thing.

## Ejercicios de Práctica

### Ejercicio 1: Traduce los lugares
1. Biblioteca = __________
2. Farmacia = __________
3. Centro comercial = __________
4. Estación de tren = __________
5. Supermercado = __________

### Ejercicio 2: Completa las direcciones
1. Go ________ (recto) for two blocks.
2. Turn ________ (a la derecha) at the corner.
3. The bank is ________ (al lado de) the hospital.
4. The park is ________ (enfrente de) the school.
5. It's ________ (a tu izquierda).

### Ejercicio 3: Escribe un diálogo
Escribe un diálogo corto donde alguien pida direcciones para llegar a un restaurante. Usa al menos 5 expresiones de direcciones.

## Resumen
En esta clase aprendiste el vocabulario de lugares en la ciudad, las preposiciones de lugar, cómo pedir direcciones y cómo dar indicaciones. La próxima vez que necesites orientarte en una ciudad donde hablen inglés, tendrás las herramientas necesarias para comunicarte con confianza.`,
    },

    // ── CLASE 10: REPASO DEL MÓDULO 1 ──
    {
      title: 'Clase 10: Repaso del Módulo 1',
      description: 'Repaso integral de todos los temas del Módulo 1 con ejercicios de práctica y autoevaluación.',
      orderIndex: 9,
      content: `# Repaso del Módulo 1: Diagnóstico y Fundamentos

## Introducción
Has llegado al final del Módulo 1. En estas 10 clases has aprendido los fundamentos esenciales del idioma inglés: desde el diagnóstico inicial hasta vocabulario de direcciones. Este repaso te ayudará a consolidar todo lo aprendido, identificar áreas que necesites reforzar y prepararte para el Módulo 2, donde profundizaremos en la gramática básica.

## Resumen de lo Aprendido

### Clase 1: Diagnóstico de Bienvenida
- Evaluaste tu nivel actual de inglés (A1-C1)
- Conociste la estructura del curso Chambari Academy
- Identificaste tus fortalezas y áreas de mejora

### Clase 2: Saludos y Presentaciones
- Saludos formales: Good morning, How do you do?
- Saludos informales: Hi, What's up?, How's it going?
- Presentaciones: My name is..., I'm from..., Nice to meet you
- Despedidas: Goodbye, See you later, Take care

### Clase 3: El Alfabeto y Pronunciación Básica
- Las 26 letras con su pronunciación
- Sonidos difíciles: /θ/, /ð/, /ʃ/, /tʃ/
- Vocales especiales: /æ/, /ɪ/, /ʊ/, /ə/

### Clase 4: Vocabulario Esencial del Aula
- Objetos del aula: desk, chair, board, notebook
- Instrucciones: Open your book, Listen carefully, Raise your hand
- Preguntas: Can you repeat that? I don't understand

### Clase 5: Números, Fechas y Horas
- Números del 0 al 1,000+
- Días de la semana y meses del año
- Formato de fechas y cómo decir la hora

### Clase 6: La Familia y Descripciones Personales
- Vocabulario familiar: mother, father, brother, cousin, etc.
- Descripción física: tall, short, blonde hair, blue eyes
- Personalidad: kind, funny, smart, shy, generous

### Clase 7: Rutina Diaria
- Presente simple para rutinas
- Adverbios de frecuencia: always, usually, often, sometimes, never
- Vocabulario: wake up, take a shower, have breakfast, go to work

### Clase 8: Comida y Restaurante
- Grupos de alimentos: fruits, vegetables, meats, dairy
- Frases para el restaurante: I'll have..., What do you recommend?, The check, please

### Clase 9: Lugares y Direcciones
- Lugares en la ciudad: hospital, bank, school, park
- Preposiciones: next to, across from, between
- Dar direcciones: Go straight, Turn left, It's on your right

---

## Ejercicios de Repaso Integral

### Sección 1: Saludos y Presentaciones

**1.** Completa el diálogo con la opción correcta:
> A: Hello! My name is Ana. I'm ________ Mexico.
> B: Nice to ________ you, Ana! I'm David.
> a) from / meet  b) at / see  c) in / know

**2.** Traduce: "¿Cómo te va?"
> a) How old are you?  b) How's it going?  c) How do you do?

### Sección 2: Vocabulario del Aula

**3.** "Raise your hand" significa:
> a) Levántate  b) Levanta la mano  c) Presta atención

**4.** Ordena la frase: book / your / to / page / open / 10
> ________________________________________________

### Sección 3: Números y Fechas

**5.** Escribe en inglés: 45 = __________
**6.** Traduce: 15 de marzo = __________
**7.** "It's half past three" significa: Son las __________

### Sección 4: Familia y Descripciones

**8.** El hijo de mi tío es mi:
> a) Nephew  b) Uncle  c) Cousin

**9.** Traduce al inglés: "Mi hermana es alta y tiene el cabello rubio."
> ________________________________________________

### Sección 5: Rutina Diaria (Presente Simple)

**10.** Completa: "She _______ (wake up) at 6:00 AM every day."
> a) wake up  b) wakes up  c) waking up

**11.** Escribe una oración con "usually":
> ________________________________________________

### Sección 6: Comida y Restaurante

**12.** Ordena la frase: have / I / the / chicken / please / would
> ________________________________________________

**13.** "The check, please" significa:
> a) El menú, por favor  b) La cuenta, por favor  c) El plato del día

### Sección 7: Direcciones

**14.** "Turn left at the traffic light" significa:
> a) Sigue recto en el semáforo  b) Gira a la izquierda en el semáforo  c) Gira a la derecha

**15.** "The bank is next to the pharmacy." La frase significa que el banco está:
> a) lejos de la farmacia  b) al lado de la farmacia  c) enfrente de la farmacia

### Sección 8: Pronunciación

**16.** ¿Cuál es la pronunciación correcta de "three"?
> a) /triː/  b) /θriː/  c) /friː/

**17.** El sonido /θ/ se encuentra en:
> a) This  b) Think  c) Ship

---

## Autoevaluación Final

Revisa tus respuestas y cuenta tus aciertos:

| Puntuación | Resultado |
|---|---|
| 13-17 aciertos | ¡Excelente! Estás listo/a para el Módulo 2 |
| 9-12 aciertos | Buen trabajo. Repasa los temas donde fallaste |
| 5-8 aciertos | Necesitas repasar. Vuelve a las clases que te cuesten |
| 0-4 aciertos | No te desanimes. Repite las clases del módulo |

**Respuestas:**
1-a, 2-b, 3-b, 4-Open your book to page 10, 5-forty-five, 6-March 15th, 7-3:30, 8-c, 9-My sister is tall and has blonde hair, 10-b, 11-(respuesta personal), 12-I would have the chicken, please, 13-b, 14-b, 15-b, 16-b, 17-b

---

## Preparación para el Módulo 2
En el Módulo 2 aprenderás:
- El verbo To Be (Ser/Estar)
- Artículos: A, An, The
- Pronombres Personales
- Presente Simple (profundización)
- Presente Continuo
- Pasado Simple
- Futuro Simple
- Y más...

¡Felicidades por completar el Módulo 1! Cada paso cuenta en tu camino hacia dominar el inglés.`,
    },
  ],
};

// ═══════════════════════════════════════════════════════════
// MODULE 2: Gramática Básica (10 clases)
// ═══════════════════════════════════════════════════════════

const MODULE_2 = {
  title: 'Módulo 2: Gramática Básica',
  description: 'Domina las estructuras gramaticales fundamentales del inglés: verbos, artículos, pronombres y tiempos verbales básicos.',
  lessons: [
    // ── CLASE 11: EL VERBO TO BE ──
    {
      title: 'Clase 11: El Verbo To Be (Ser/Estar)',
      description: 'Aprende las formas afirmativa, negativa e interrogativa del verbo To Be con ejemplos prácticos.',
      orderIndex: 0,
      content: `# El Verbo To Be (Ser/Estar)

## Introducción
El verbo "to be" es el verbo más importante del inglés. Se traduce como "ser" o "estar" en español y se usa constantemente en la conversación diaria. A diferencia del español, el inglés solo tiene un verbo para ambas funciones, por lo que el contexto determina si significa "ser" o "estar". Dominar este verbo es absolutamente esencial para construir oraciones correctas en inglés.

## Formas del Verbo To Be

### Presente (Present):
| Sujeto | Afirmativo | Negativo | Interrogativo |
|--------|-----------|----------|---------------|
| I | I am (I'm) | I am not (I'm not) | Am I...? |
| You | You are (You're) | You are not (You aren't) | Are you...? |
| He | He is (He's) | He is not (He isn't) | Is he...? |
| She | She is (She's) | She is not (She isn't) | Is she...? |
| It | It is (It's) | It is not (It isn't) | Is it...? |
| We | We are (We're) | We are not (We aren't) | Are we...? |
| They | They are (They're) | They are not (They aren't) | Are they...? |

**Ejemplos con "Ser":**
> I am a student. (Yo soy estudiante.)
> She is my sister. (Ella es mi hermana.)
> They are from Mexico. (Ellos son de México.)
> He is a doctor. (Él es doctor.)

**Ejemplos con "Estar":**
> I am happy. (Yo estoy feliz.)
> She is at home. (Ella está en casa.)
> We are tired. (Nosotros estamos cansados.)
> The book is on the table. (El libro está sobre la mesa.)

## Pasado del Verbo To Be

| Sujeto | Pasado | Negativo |
|--------|--------|----------|
| I | I was | I was not (I wasn't) |
| You | You were | You were not (You weren't) |
| He/She/It | He/She/It was | He/She/It was not (wasn't) |
| We/They | We/They were | We/They were not (weren't) |

**Ejemplos:**
> I was at the party yesterday. (Yo estuve en la fiesta ayer.)
> She was very happy last week. (Ella estuvo muy feliz la semana pasada.)
> They were in London last summer. (Ellos estuvieron en Londres el verano pasado.)

## Respuestas Cortas (Short Answers)
En inglés, es común responder preguntas con "to be" usando respuestas cortas.

**Pregunta:** Are you a student?
**Respuesta corta afirmativa:** Yes, I am.
**Respuesta corta negativa:** No, I'm not.

**Pregunta:** Is she your sister?
**Respuesta corta afirmativa:** Yes, she is.
**Respuesta corta negativa:** No, she isn't.

## Ejercicios de Práctica

### Ejercicio 1: Completa con la forma correcta de "to be"
1. I _______ a teacher. (am/is/are)
2. She _______ from Spain.
3. They _______ my friends.
4. _______ you tired? (Am/Is/Are)
5. He _______ not at home right now.
6. We _______ students at Chambari Academy.

### Ejercicio 2: Convierte a negativo
1. I am happy. → I _______ happy.
2. She is a doctor. → She _______ a doctor.
3. They are here. → They _______ here.

### Ejercicio 3: Convierte a interrogativo
1. He is tall. → _______ he tall?
2. You are from Mexico. → _______ you from Mexico?
3. It is cold today. → _______ it cold today?

### Ejercicio 4: Traduce al inglés
1. Yo soy estudiante. = _________________________
2. Ella está cansada. = _________________________
3. Ellos eran muy amables. = _________________________

## Resumen
En esta clase aprendiste el verbo "to be" en presente y pasado, sus formas afirmativas, negativas e interrogativas, y cómo usarlo para "ser" y "estar". Recuerda que la práctica constante es clave: intenta pensar en inglés usando "to be" para describir cosas a tu alrededor.`,
    },

    // ── CLASE 12: ARTÍCULOS ──
    {
      title: 'Clase 12: Artículos: A, An, The',
      description: 'Aprende cuándo usar cada artículo en inglés con reglas claras y ejemplos prácticos.',
      orderIndex: 1,
      content: `# Artículos: A, An, The

## Introducción
Los artículos en inglés son palabras pequeñas pero extremadamente importantes. Se colocan antes de los sustantivos y ayudan a especificar si nos referimos a algo en general o a algo específico. A diferencia del español, el inglés no tiene artículos que cambien según el género o el número, lo que simplifica las cosas, pero hay reglas específicas que debes conocer.

## Artículos Indefinidos: A y An

### Cuándo usar "A":
- Antes de palabras que empiezan con **sonido de consonante**.
- **I have a dog.** (Tengo un perro.)
- **She is a teacher.** (Ella es profesora.)
- **This is a book.** (Este es un libro.)

### Cuándo usar "An":
- Antes de palabras que empiezan con **sonido de vocal** (a, e, i, o, u).
- **I have an apple.** (Tengo una manzana.)
- **She is an engineer.** (Ella es ingeniera.)
- **He is an honest man.** (Él es un hombre honesto.) — "honest" empieza con sonido de vocal /ɒn/

### ¡Cuidado con las excepciones!
Algunas palabras empiezan con vocal pero tienen sonido de consonante:
- **a university** (suena /juː/ — consonante)
- **a European** (suena /jʊə/ — consonante)
- **an hour** (la "h" es muda — suena como vocal)
- **an honorable man** (la "h" es muda)

## Artículo Definido: The

### Cuándo usar "The":
1. **Cuando el sustantivo es específico o conocido:**
   - **The book on the table is mine.** (El libro sobre la mesa es mío.)
   - **The teacher explained the lesson.** (El profesor explicó la lección.)

2. **Cosas únicas en el mundo:**
   - **The sun** (el sol), **the moon** (la luna), **the earth** (la tierra)
   - **The president** (el presidente)

3. **Nombres de ríos, océanos, montañas (plural), países plurales:**
   - **The Amazon** (el Amazonas), **the Pacific Ocean** (el Océano Pacífico)
   - **The United States** (Estados Unidos), **the Philippines** (Filipinas)

4. **Instrumentos musicales:**
   - **I play the guitar.** (Toco la guitarra.)
   - **She plays the piano.** (Ella toca el piano.)

5. **Con superlativos:**
   - **She is the best student.** (Ella es la mejor estudiante.)
   - **It's the biggest house.** (Es la casa más grande.)

### Cuándo NO usar "The":
1. **Antes de comidas, días, meses:**
   - **I have breakfast at 7.** (NO: the breakfast)
   - **Monday is my favorite day.** (NO: the Monday)

2. **Antes de la mayoría de nombres de países y ciudades:**
   - **I live in Mexico.** (NO: the Mexico)
   - **Paris is beautiful.** (NO: the Paris)

3. **Antes de deportes y actividades:**
   - **I play soccer.** (NO: the soccer)
   - **She studies English.** (NO: the English)

4. **Antes de nombres abstractos en general:**
   - **Love is beautiful.** (NO: the love)
   - **Water is essential.** (NO: the water)

## Comparación: A/An vs The

| Sin artículo / A, An | The |
|---|---|
| I want **a** dog. (Cualquier perro) | I want **the** dog. (Ese perro específico) |
| **An** apple is healthy. (Las manzanas en general) | **The** apple on the table is mine. (Esa manzana específica) |
| She is **a** doctor. (Una doctora) | She is **the** doctor I told you about. (La doctora específica) |

## Ejercicios de Práctica

### Ejercicio 1: Completa con a, an o the
1. I need _______ umbrella.
2. _______ sun rises in _______ east.
3. She is _______ honest person.
4. Can you pass me _______ salt, please?
5. He plays _______ guitar in _______ band.
6. _______ students in my class are very friendly.
7. I saw _______ interesting movie last night.

### Ejercicio 2: Identifica el error
1. She is an university student. → She is _______ university student.
2. I eat the breakfast every morning. → I eat _______ breakfast every morning.
3. He is an honest person. (¿Correcto o incorrecto?)

### Ejercicio 3: Traduce al inglés
1. El libro está sobre la mesa. = _________________________
2. Tengo una manzana. = _________________________
3. Ella es la mejor profesora. = _________________________

## Resumen
En esta clase aprendiste las reglas para usar los artículos "a", "an" y "the" en inglés. Recuerda: "a" va con sonido de consonante, "an" con sonido de vocal, y "the" se usa para cosas específicas. ¡Practica identificando artículos cuando leas o escuches inglés!`,
    },

    // ── CLASE 13: PRONOMBRES PERSONALES ──
    {
      title: 'Clase 13: Pronombres Personales',
      description: 'Domina los pronombres personales: sujeto, objeto y posesivos en inglés.',
      orderIndex: 2,
      content: `# Pronombres Personales

## Introducción
Los pronombres personales son palabras que sustituyen a los nombres y nos permiten evitar repeticiones en las oraciones. Son fundamentales para hablar con fluidez y naturalidad en inglés. En esta clase aprenderás los tres tipos principales de pronombres personales: de sujeto, de objeto y posesivos.

## Pronombres de Sujeto (Subject Pronouns)
Los pronombres de sujeto realizan la acción del verbo. Siempre se colocan antes del verbo.

| Pronombre | Español | Ejemplo |
|-----------|---------|---------|
| I | Yo | **I** am a student. (Yo soy estudiante.) |
| You | Tú / Ustedes | **You** are very kind. (Tú eres muy amable.) |
| He | Él | **He** plays soccer. (Él juega fútbol.) |
| She | Ella | **She** reads books. (Ella lee libros.) |
| It | Eso / Ello | **It** is a beautiful day. (Es un día hermoso.) |
| We | Nosotros | **We** study English. (Nosotros estudiamos inglés.) |
| They | Ellos / Ellas | **They** are my friends. (Ellos son mis amigos.) |

**Nota importante:** A diferencia del español, en inglés siempre se usa el pronombre de sujeto:
- "I am tall" (NO solo "Am tall")
- "She is happy" (NO solo "Is happy")

## Pronombres de Objeto (Object Pronouns)
Los pronombres de objeto reciben la acción del verbo. Se colocan después del verbo o después de una preposición.

| Pronombre | Sujeto equiv. | Español | Ejemplo |
|-----------|--------------|---------|---------|
| Me | I | Me / A mí | She called **me**. (Ella me llamó.) |
| You | You | Te / A ti | I saw **you**. (Te vi.) |
| Him | He | Lo / A él | I met **him** yesterday. (Lo conocí ayer.) |
| Her | She | La / A ella | I like **her**. (Me gusta ella.) |
| It | It | Lo / A ello | I bought **it**. (Lo compré.) |
| Us | We | Nos / A nosotros | She invited **us**. (Nos invitó.) |
| Them | They | Los/Las / A ellos | I called **them**. (Los llamé.) |

**Ejemplos con preposiciones:**
> This is for **you**. (Esto es para ti.)
> She went with **him**. (Ella fue con él.)
> The gift is from **them**. (El regalo es de ellos.)

## Adjetivos y Pronombres Posesivos

### Adjetivos posesivos (antes del sustantivo):
| Adjetivo | Español | Ejemplo |
|----------|---------|---------|
| My | Mi(s) | **My** house is big. (Mi casa es grande.) |
| Your | Tu(s) | **Your** book is here. (Tu libro está aquí.) |
| His | Su (de él) | **His** car is red. (Su coche es rojo.) |
| Her | Su (de ella) | **Her** name is Ana. (Su nombre es Ana.) |
| Its | Su (de ello) | **Its** color is blue. (Su color es azul.) |
| Our | Nuestro/a | **Our** class starts at 9. (Nuestra clase empieza a las 9.) |
| Their | Su (de ellos) | **Their** children are young. (Sus hijos son jóvenes.) |

### Pronombres posesivos (sustituyen al sustantivo):
| Pronombre | Español | Ejemplo |
|-----------|---------|---------|
| Mine | El mío / La mía | This book is **mine**. (Este libro es mío.) |
| Yours | El tuyo / La tuya | Is this pen **yours**? (¿Es este bolígrafo tuyo?) |
| His | El suyo (de él) | The car is **his**. (El coche es suyo.) |
| Hers | El suyo (de ella) | The bag is **hers**. (El bolso es suyo.) |
| Ours | El nuestro | The house is **ours**. (La casa es nuestra.) |
| Theirs | El suyo (de ellos) | The victory is **theirs**. (La victoria es suya.) |

## Ejercicios de Práctica

### Ejercicio 1: Completa con el pronombre correcto
1. _______ is a student. (She/Her)
2. I called _______ yesterday. (he/him)
3. _______ name is Carlos. (My/Mine)
4. This book is _______. (my/mine)
5. She went to the store with _______. (we/us)

### Ejercicio 2: Reemplaza el sustantivo por un pronombre
1. Maria is happy. → _______ is happy.
2. The teacher gave the students homework. → The teacher gave _______ homework.
3. John's car is red. → _______ car is red.
4. The cat belongs to me. → The cat is _______.

### Ejercicio 3: Traduce al inglés
1. Ella me dio su libro. = _________________________
2. Nosotros somos amigos. = _________________________
3. Este es mi coche. = _________________________
4. El regalo es para ellos. = _________________________

## Resumen
En esta clase aprendiste los pronombres de sujeto (I, you, he, she...), de objeto (me, you, him, her...) y posesivos (my, mine, your, yours...). Dominar estos pronombres te permitirá construir oraciones más naturales y variadas. ¡Sigue practicando!`,
    },

    // ── CLASE 14: PRESENTE SIMPLE ──
    {
      title: 'Clase 14: Presente Simple',
      description: 'Profundiza en el presente simple: afirmativo, negativo, interrogativo, usos y excepciones.',
      orderIndex: 3,
      content: `# Presente Simple (Simple Present)

## Introducción
El presente simple es uno de los tiempos verbales más utilizados en inglés. Lo usamos para hablar de hábitos, rutinas, verdades generales y hechos permanentes. Ya lo has visto en el Módulo 1, pero ahora lo vamos a estudiar con más profundidad, incluyendo las reglas ortográficas y las excepciones más importantes.

## Usos del Presente Simple

1. **Hábitos y rutinas:**
   > I wake up at 7 every day. (Me despierto a las 7 todos los días.)
   > She exercises three times a week. (Ella se ejercita tres veces a la semana.)

2. **Verdades generales y hechos científicos:**
   > The sun rises in the east. (El sol sale por el este.)
   > Water boils at 100 degrees Celsius. (El agua hierve a 100 grados Celsius.)

3. **Horarios y programaciones:**
   > The train leaves at 9:00 AM. (El tren sale a las 9:00 AM.)
   > The class starts on Monday. (La clase empieza el lunes.)

4. **Sentimientos y estados permanentes:**
   > I live in Mexico City. (Vivo en la Ciudad de México.)
   > She loves chocolate. (A ella le encanta el chocolate.)

## Estructura Afirmativa
**Sujeto + verbo (+ s/es para he/she/it)**

| Sujeto | Verbo | Ejemplo |
|--------|-------|---------|
| I / You / We / They | verbo base | I **work** every day. |
| He / She / It | verbo + s/es | She **works** every day. |

### Reglas para añadir -s/-es:
1. **Verbo + s** (la mayoría): play → plays, read → reads, like → likes
2. **Verbo + es** (terminados en -s, -sh, -ch, -x, -o): watch → watches, go → goes, fix → fixes
3. **Consonante + y → ies**: study → studies, carry → carries, try → tries
4. **Vocal + y → s**: play → plays, enjoy → enjoys

## Estructura Negativa
**Sujeto + don't/doesn't + verbo base**

| Sujeto | Negativo | Ejemplo |
|--------|----------|---------|
| I / You / We / They | don't (do not) | I **don't like** coffee. |
| He / She / It | doesn't (does not) | She **doesn't like** coffee. |

**¡Importante!** Después de doesn't, el verbo regresa a su forma base:
- She **doesn't plays** ❌ → She **doesn't play** ✓

## Estructura Interrogativa
**Do/Does + sujeto + verbo base?**

| Pregunta | Ejemplo |
|----------|---------|
| Do I / you / we / they...? | **Do** you **speak** English? |
| Does he / she / it...? | **Does** she **speak** English? |

**Respuestas cortas:**
> Do you like pizza? — Yes, I do. / No, I don't.
> Does he work here? — Yes, he does. / No, he doesn't.

## Palabras Clave (Signal Words)
Estas palabras suelen indicar presente simple:
- **Always** (siempre), **usually** (usualmente), **often** (a menudo)
- **Sometimes** (a veces), **rarely** (raramente), **never** (nunca)
- **Every day/week/month/year** (cada día/semana/mes/año)
- **On Mondays/Tuesdays** (los lunes/martes)

## Verbos Irregulares Comunes
Algunos verbos cambian su forma en la tercera persona:

| Base | He/She/It | Español |
|------|-----------|---------|
| have | **has** | tener |
| do | **does** | hacer |
| go | **goes** | ir |
| be | **is** | ser/estar |

## Ejercicios de Práctica

### Ejercicio 1: Escribe el verbo en forma correcta (tercera persona)
1. She _______ (study) English every day.
2. He _______ (watch) TV in the evening.
3. The baby _______ (cry) when he is hungry.
4. My mother _______ (cook) delicious food.
5. It _______ (rain) a lot in spring.

### Ejercicio 2: Convierte a negativo
1. I like coffee. → I _______ coffee.
2. She plays tennis. → She _______ tennis.
3. They work here. → They _______ here.

### Ejercicio 3: Convierte a interrogativo y responde
1. He lives in Madrid. → _______ he _______ in Madrid? (Yes, _______)
2. You speak French. → _______ you _______ French? (No, _______)
3. They study math. → _______ they _______ math? (Yes, _______)

### Ejercicio 4: Traduce al inglés
1. Yo no como carne. = _________________________
2. ¿Ella trabaja en un hospital? = _________________________
3. Él siempre llega temprano. = _________________________

## Resumen
En esta clase profundizaste en el presente simple: sus usos, las reglas para la tercera persona, las formas negativas e interrogativas, y los verbos irregulares más comunes. Recuerda que después de "doesn't" el verbo siempre va en forma base. ¡Sigue practicando con tu rutina diaria!`,
    },

    // ── CLASE 15: PRESENTE CONTINUO ──
    {
      title: 'Clase 15: Presente Continuo',
      description: 'Aprende el presente progresivo para hablar de acciones que están ocurriendo ahora.',
      orderIndex: 4,
      content: `# Presente Continuo (Present Continuous)

## Introducción
El presente continuo, también llamado presente progresivo, se usa para hablar de acciones que están ocurriendo en este momento o alrededor de este momento. Es un tiempo verbal muy visual y dinámico que te permite describir lo que está pasando ahora mismo. En esta clase aprenderás su estructura, usos y las diferencias con el presente simple.

## Estructura del Presente Continuo

### Afirmativa:
**Sujeto + am/is/are + verbo-ING**

| Sujeto | Verbo auxiliar | Ejemplo |
|--------|---------------|---------|
| I | am | I **am reading** a book. (Estoy leyendo un libro.) |
| You | are | You **are studying** English. (Estás estudiando inglés.) |
| He/She/It | is | She **is working** now. (Ella está trabajando ahora.) |
| We | are | We **are eating** lunch. (Estamos almorzando.) |
| They | are | They **are playing** soccer. (Están jugando fútbol.) |

### Negativa:
**Sujeto + am/is/are + NOT + verbo-ING**

> I **am not sleeping**. (No estoy durmiendo.)
> She **isn't listening**. (No está escuchando.)
> They **aren't coming**. (No están viniendo.)

### Interrogativa:
**Am/Is/Are + sujeto + verbo-ING?**

> **Are** you **studying**? (¿Estás estudiando?)
> **Is** he **working**? (¿Está trabajando?)
> **What** are you **doing**? (¿Qué estás haciendo?)

## Reglas para Formar el Gerundio (-ING)

1. **Verbo + ing** (la mayoría): read → reading, play → playing, eat → eating
2. **Verbo terminado en -e → quitar la e + ing**: write → writing, make → making, dance → dancing
3. **Verbo terminado en -ie → cambiar a y + ing**: lie → lying, die → dying, tie → tying
4. **Consonante-vocal-consonante (CVC) → duplicar la última consonante**: run → running, swim → swimming, sit → sitting
   - **Excepción**: cuando la última sílaba no lleva acento: open → opening, listen → listening

## Usos del Presente Continuo

### 1. Acciones ocurriendo AHORA MISMO:
> I am typing on my computer right now. (Estoy escribiendo en mi computadora ahora mismo.)
> Look! It is raining. (¡Mira! Está lloviendo.)
> She is talking on the phone. (Ella está hablando por teléfono.)

### 2. Situaciones temporales:
> I am staying at a hotel this week. (Me estoy quedando en un hotel esta semana.)
> She is working on a project this month. (Ella está trabajando en un proyecto este mes.)

### 3. Planes futuros confirmados:
> I am meeting my friends tomorrow. (Me voy a reunir con mis amigos mañana.)
> We are flying to New York next week. (Vamos a volar a Nueva York la próxima semana.)

### 4. Tendencias o cambios:
> The weather is getting colder. (El clima se está poniendo más frío.)
> People are using more technology. (La gente está usando más tecnología.)

## Presente Simple vs Presente Continuo

| Presente Simple | Presente Continuo |
|---|---|
| Hábitos y rutinas | Acciones ocurriendo ahora |
| I **drink** coffee every day. | I **am drinking** coffee now. |
| She **works** in a bank. | She **is working** at the moment. |
| He **plays** guitar on weekends. | He **is playing** guitar right now. |
| Verdades generales | Situaciones temporales |
| The sun **rises** in the east. | The sun **is shining** today. |

## Palabras Clave
- **Now** (ahora), **right now** (ahora mismo)
- **At the moment** (en este momento)
- **Currently** (actualmente)
- **Today** (hoy), **This week** (esta semana)
- **Look!** (¡Mira!), **Listen!** (¡Escucha!)

## Ejercicios de Práctica

### Ejercicio 1: Forma el gerundio
1. swim → _______
2. write → _______
3. run → _______
4. make → _______
5. lie → _______
6. study → _______

### Ejercicio 2: Completa con presente continuo
1. I _______ (read) a book right now.
2. She _______ (cook) dinner at the moment.
3. They _______ (not/play) soccer today.
4. _______ you _______ (listen) to music?
5. We _______ (study) for the exam this week.

### Ejercicio 3: Elige: Presente Simple o Presente Continuo
1. She usually _______ (drinks / is drinking) coffee in the morning, but today she _______ (drinks / is drinking) tea.
2. Look! The children _______ (play / are playing) in the park.
3. I _______ (work / am working) from 9 to 5 every day.
4. He _______ (is watching / watches) TV right now.

### Ejercicio 4: Traduce al inglés
1. Estoy estudiando inglés ahora. = _________________________
2. Ellos no están trabajando hoy. = _________________________
3. ¿Qué estás haciendo? = _________________________

## Resumen
En esta clase aprendiste el presente continuo: su estructura (sujeto + am/is/are + verbo-ING), las reglas para formar el gerundio, sus usos principales y la diferencia con el presente simple. Practica describiendo lo que estás haciendo y lo que está pasando a tu alrededor.`,
    },

    // ── CLASE 16: PASADO SIMPLE ──
    {
      title: 'Clase 16: Pasado Simple',
      description: 'Aprende el pasado simple con verbos regulares e irregulares.',
      orderIndex: 5,
      content: `# Pasado Simple (Simple Past)

## Introducción
El pasado simple se usa para hablar de acciones que comenzaron y terminaron en un momento específico del pasado. Es uno de los tiempos verbales más utilizados en inglés, especialmente al contar historias, hablar de experiencias pasadas o describir eventos. En esta clase aprenderás las formas de los verbos regulares e irregulares en pasado.

## Estructura del Pasado Simple

### Afirmativa:
**Sujeto + verbo en pasado**

> I **worked** yesterday. (Trabajé ayer.)
> She **went** to the store. (Ella fue a la tienda.)
> They **played** soccer. (Jugaron fútbol.)

**Nota:** En pasado simple, la forma del verbo es la misma para todos los sujetos (I, you, he, she, we, they).

### Negativa:
**Sujeto + did not (didn't) + verbo base**

> I **didn't go** to work yesterday. (No fui al trabajo ayer.)
> She **didn't eat** breakfast. (Ella no desayunó.)
> They **didn't finish** the project. (No terminaron el proyecto.)

**¡Importante!** Después de "didn't", el verbo siempre regresa a su forma base:
- She **didn't went** ❌ → She **didn't go** ✓

### Interrogativa:
**Did + sujeto + verbo base?**

> **Did** you **go** to the party? (¿Fuiste a la fiesta?)
> **Did** she **call** you? (¿Ella te llamó?)
> **What** did you **do** yesterday? (¿Qué hiciste ayer?)

**Respuestas cortas:**
> Did you see the movie? — Yes, I did. / No, I didn't.

## Verbos Regulares (Regular Verbs)
Se forma añadiendo **-ed** al verbo base.

| Regla | Base | Pasado | Ejemplo |
|-------|------|--------|---------|
| + ed | work | worked | I worked yesterday. |
| + d (terminados en -e) | live | lived | She lived in Paris. |
| + ied (consonante + y) | study | studied | He studied math. |
| Duplicar consonante (CVC) | stop | stopped | We stopped at the store. |

**Pronunciación del -ed:**
- **/t/** después de sonidos sordos (k, p, f, s, sh, ch): worked /t/, stopped /t/
- **/d/** después de sonidos sonoros (b, g, v, z, m, n, l, r, vocales): played /d/, lived /d/
- **/ɪd/** después de t o d: wanted /ɪd/, needed /ɪd/

## Verbos Irregulares (Irregular Verbs)
Estos verbos NO siguen una regla fija. Debes memorizarlos. Aquí los más importantes:

| Base | Pasado | Pasado Participio | Español |
|------|--------|-------------------|---------|
| be | was/were | been | ser/estar |
| go | went | gone | ir |
| have | had | had | tener |
| do | did | done | hacer |
| see | saw | seen | ver |
| eat | ate | eaten | comer |
| drink | drank | drunk | beber |
| take | took | taken | tomar |
| give | gave | given | dar |
| come | came | come | venir |
| make | made | made | hacer/crear |
| get | got | gotten/got | obtener |
| say | said | said | decir |
| know | knew | known | saber |
| think | thought | thought | pensar |
| buy | bought | bought | comprar |
| bring | brought | brought | traer |
| speak | spoke | spoken | hablar |
| write | wrote | written | escribir |
| read | read | read | leer |
| begin | began | begun | comenzar |
| run | ran | run | correr |
| swim | swam | swum | nadar |

## Palabras Clave del Pasado Simple
- **Yesterday** (ayer), **last night/week/month/year** (anoche/la semana pasada/el mes pasado/el año pasado)
- **Two days ago** (hace dos días), **In 2020** (en 2020)
- **When I was young** (cuando era joven)

## Ejercicios de Práctica

### Ejercicio 1: Escribe el pasado simple
1. work → _______
2. go → _______
3. study → _______
4. eat → _______
5. see → _______
6. stop → _______
7. have → _______
8. write → _______

### Ejercicio 2: Completa con pasado simple (afirmativo/negativo)
1. I _______ (go) to the movies yesterday.
2. She _______ (not/eat) breakfast this morning.
3. They _______ (play) soccer last weekend.
4. He _______ (not/see) the message.
5. We _______ (study) for the exam last night.

### Ejercicio 3: Convierte a interrogativo
1. She went to Paris. → _______ she _______ to Paris?
2. They bought a house. → _______ they _______ a house?
3. You saw the movie. → _______ you _______ the movie?

### Ejercicio 4: Traduce al inglés
1. Ayer fui al supermercado. = _________________________
2. Ella no comió nada. = _________________________
3. ¿Viste a María la semana pasada? = _________________________

## Resumen
En esta clase aprendiste el pasado simple: verbos regulares (con -ed), verbos irregulares (que deben memorizarse), y las estructuras afirmativa, negativa e interrogativa. Recuerda que después de "didn't", el verbo siempre va en forma base. ¡Sigue practicando contando lo que hiciste ayer!`,
    },

    // ── CLASE 17: FUTURO SIMPLE ──
    {
      title: 'Clase 17: Futuro Simple (Will y Going to)',
      description: 'Aprende las dos formas principales de expresar el futuro en inglés.',
      orderIndex: 6,
      content: `# Futuro Simple (Will y Going to)

## Introducción
En inglés existen principalmente dos formas de expresar el futuro: "will" y "going to". Aunque ambas se refieren al futuro, tienen usos y matices diferentes. Dominar cuándo usar cada una es clave para comunicarte con precisión. En esta clase aprenderás las diferencias entre ambos y cómo usarlos correctamente.

## WILL

### Estructura:
**Sujeto + will + verbo base**

### Afirmativa:
> I **will help** you. (Te ayudaré.)
> She **will come** tomorrow. (Ella vendrá mañana.)
> They **win** win the game. (Ganarán el juego.)

### Negativa:
**Sujeto + will not (won't) + verbo base**

> I **won't forget** you. (No te olvidaré.)
> She **won't be** late. (No llegará tarde.)

### Interrogativa:
**Will + sujeto + verbo base?**

> **Will** you **come** to the party? (¿Vendrás a la fiesta?)
> **Will** it **rain** tomorrow? (¿Lloverá mañana?)

### Usos de WILL:

1. **Decisiones espontáneas** (hechas en el momento):
   > "The phone is ringing. I'll answer it!" (Suena el teléfono. ¡Lo contestaré!)
   > "I'm cold. I'll close the window." (Tengo frío. Cerraré la ventana.)

2. **Predicciones sin evidencia:**
   > I think it **will rain** tomorrow. (Creo que lloverá mañana.)
   > She **will be** a great doctor. (Ella será una gran doctora.)

3. **Promesas y ofertas:**
   > I **will always love** you. (Siempre te amaré.)
   > I **will help** you with your homework. (Te ayudaré con la tarea.)

4. **Solicitudes formales:**
   > **Will** you **open** the door, please? (¿Abrirías la puerta, por favor?)

## GOING TO

### Estructura:
**Sujeto + am/is/are + going to + verbo base**

### Afirmativa:
> I **am going to study** tonight. (Voy a estudiar esta noche.)
> She **is going to travel** to Paris. (Ella va a viajar a París.)
> They **are going to buy** a house. (Van a comprar una casa.)

### Negativa:
**Sujeto + am/is/are + not (n't) + going to + verbo base**

> I **am not going to go** to the party. (No voy a ir a la fiesta.)
> She **isn't going to work** tomorrow. (Ella no va a trabajar mañana.)

### Interrogativa:
**Am/Is/Are + sujeto + going to + verbo base?**

> **Are** you **going to study** tonight? (¿Vas a estudiar esta noche?)
> **Is** she **going to travel**? (¿Va a viajar ella?)

### Usos de GOING TO:

1. **Planes e intenciones** (decididos antes):
   > I **am going to start** a new diet next week. (Voy a empezar una nueva dieta la próxima semana.)
   > We **are going to visit** our grandparents. (Vamos a visitar a nuestros abuelos.)

2. **Predicciones con evidencia:**
   > Look at those dark clouds! It **is going to rain**. (¡Mira esas nubes oscuras! Va a llover.)
   > She is studying very hard. She **is going to pass** the exam. (Ella está estudiando mucho. Va a aprobar el examen.)

## Comparación: Will vs Going To

| Will | Going To |
|------|----------|
| Decisiones espontáneas | Planes previos |
| "I'll call him." (Acabo de decidirlo) | "I'm going to call him." (Ya lo había planeado) |
| Predicciones sin evidencia | Predicciones con evidencia |
| "I think it will be cold." | "Look! It's going to snow." |
| Promesas y ofertas | Intenciones |
| "I'll help you." | "I'm going to help her." |

## Palabras Clave del Futuro
- **Tomorrow** (mañana), **next week/month/year** (la próxima semana/mes/año)
- **Tonight** (esta noche), **soon** (pronto)
- **In the future** (en el futuro)
- **This weekend** (este fin de semana)

## Ejercicios de Práctica

### Ejercicio 1: Elige will o going to
1. "I'm hungry. I think I _______ order a pizza." (will / am going to)
2. "We have tickets. We _______ go to the concert on Saturday." (will / are going to)
3. "Look at that car! It _______ crash!" (will / is going to)
4. "I promise I _______ be on time." (will / am going to)
5. "She _______ study medicine next year." (will / is going to)

### Ejercicio 2: Convierte a negativo
1. I will go to the party. → I _______ to the party.
2. She is going to work late. → She _______ to work late.
3. They will come tomorrow. → They _______ tomorrow.

### Ejercicio 3: Traduce al inglés
1. Voy a estudiar esta noche. = _________________________
2. Creo que lloverá mañana. = _________________________
3. Ella no va a venir. = _________________________

## Resumen
En esta clase aprendiste las dos formas de expresar futuro en inglés: "will" para decisiones espontáneas, predicciones sin evidencia y promesas; y "going to" para planes previos y predicciones con evidencia. ¡Sigue practicando hablando sobre tus planes para el futuro!`,
    },

    // ── CLASE 18: PREPOSICIONES DE TIEMPO Y LUGAR ──
    {
      title: 'Clase 18: Preposiciones de Tiempo y Lugar',
      description: 'Domina el uso de in, on, at y otras preposiciones de tiempo y lugar en inglés.',
      orderIndex: 7,
      content: `# Preposiciones de Tiempo y Lugar

## Introducción
Las preposiciones son palabras cortas pero cruciales que indican relaciones de tiempo, lugar y dirección. En inglés, las preposiciones "in", "on" y "at" son las más utilizadas y cada una tiene reglas específicas. Usar la preposición equivocada es un error muy común, así que en esta clase aprenderás las reglas para usarlas correctamente.

## Preposiciones de Tiempo

### IN — Períodos largos
- **Meses**: in January, in March, in December
- **Años**: in 2024, in 1999
- **Estaciones**: in summer, in winter
- **Partes del día**: in the morning, in the afternoon, in the evening (PERO: at night)
- **Siglos/décadas**: in the 21st century, in the 1990s

> I was born **in** March. (Nací en marzo.)
> She works **in** the morning. (Ella trabaja por la mañana.)
> We will travel **in** summer. (Viajaremos en verano.)

### ON — Días específicos
- **Días de la semana**: on Monday, on Friday
- **Fechas**: on July 4th, on December 25th
- **Días especiales**: on my birthday, on New Year's Day, on Christmas Day
- **Fines de semana (UK)**: on the weekend

> I have class **on** Monday. (Tengo clase el lunes.)
> Her birthday is **on** May 15th. (Su cumpleaños es el 15 de mayo.)
> We met **on** a rainy day. (Nos conocimos un día lluvioso.)

### AT — Momentos específicos
- **Horas**: at 3:00, at 9:30 AM
- **Momentos del día**: at noon, at midnight, at night
- **Festivales**: at Christmas, at Easter
- **Expresiones**: at the moment, at the weekend (US), at present

> The class starts **at** 9:00 AM. (La clase empieza a las 9:00 AM.)
> I sleep **at** midnight. (Me duermo a medianoche.)
> She is busy **at** the moment. (Ella está ocupada en este momento.)

### Otras preposiciones de tiempo:
- **Before** (antes de): before class, before 5 o'clock
- **After** (después de): after work, after dinner
- **During** (durante): during the class, during the movie
- **Until / Till** (hasta): until Friday, wait until 3 o'clock
- **Since** (desde un punto en el tiempo): since 2020, since Monday
- **For** (por un período de tiempo): for two hours, for three years

## Preposiciones de Lugar

### IN — Espacios cerrados, continentes, ciudades
- **Dentro de**: in the room, in the box, in the car
- **Ciudades y países**: in Mexico, in New York, in Spain
- **Continentes**: in Europe, in America
- **Entornos**: in the park, in the mountains, in the city

> The keys are **in** my bag. (Las llaves están en mi bolso.)
> She lives **in** Madrid. (Ella vive en Madrid.)
> We walked **in** the forest. (Caminamos en el bosque.)

### ON — Superficies, líneas, pisos
- **Sobre una superficie**: on the table, on the wall, on the floor
- **Pisos**: on the first floor, on the second floor
- **Líneas**: on the border, on the coast, on the street
- **Medios de comunicación**: on TV, on the radio, on the internet

> The book is **on** the table. (El libro está sobre la mesa.)
> I saw it **on** TV. (Lo vi en televisión.)
> She lives **on** Main Street. (Ella vive en la calle Main.)

### AT — Puntos específicos, eventos
- **Direcciones específicas**: at 123 Oak Street, at the bus stop
- **Lugares/eventos**: at school, at work, at the airport, at a party
- **Distancias**: at 50 meters from here

> I'll meet you **at** the bus stop. (Nos vemos en la parada de autobús.)
> She is **at** school. (Ella está en la escuela.)
> We arrived **at** the airport. (Llegamos al aeropuerto.)

## Resumen Visual: IN / ON / AT

| | Tiempo | Lugar |
|---|---|---|
| **IN** | Meses, años, estaciones, mañanas | Ciudades, países, espacios cerrados |
| **ON** | Días, fechas, fines de semana | Superficies, pisos, medios |
| **AT** | Horas, momentos, festivales | Puntos específicos, eventos |

## Ejercicios de Práctica

### Ejercicio 1: Completa con in, on o at (tiempo)
1. I was born _______ 1995.
2. The meeting is _______ Monday.
3. We have lunch _______ noon.
4. She starts her new job _______ January.
5. I wake up _______ 7:00 AM every day.

### Ejercicio 2: Completa con in, on o at (lugar)
1. The cat is _______ the box.
2. She lives _______ Paris.
3. We met _______ the airport.
4. The painting is _______ the wall.
5. I study _______ school.

### Ejercicio 3: Completa con la preposición correcta
1. I have been waiting _______ two hours. (for/since)
2. She has lived here _______ 2019. (for/since)
3. We had dinner _______ a restaurant. (in/at/on)
4. The class is _______ the morning. (in/on/at)

## Resumen
En esta clase aprendiste las preposiciones de tiempo (in, on, at) y de lugar (in, on, at) con sus reglas específicas. Recuerda: "in" para períodos largos y espacios cerrados, "on" para días y superficies, y "at" para momentos específicos y puntos exactos. ¡Sigue practicando!`,
    },

    // ── CLASE 19: ADJETIVOS Y ADVERBIOS BÁSICOS ──
    {
      title: 'Clase 19: Adjetivos y Adverbios Básicos',
      description: 'Aprende a usar adjetivos para describir y adverbios para modificar verbos y adjetivos.',
      orderIndex: 8,
      content: `# Adjetivos y Adverbios Básicos

## Introducción
Los adjetivos y los adverbios son dos tipos de palabras que enriquecen enormemente tu comunicación. Los adjetivos describen sustantivos (personas, lugares, cosas) y los adverbios modifican verbos, adjetivos u otros adverbios. Aprender a usarlos correctamente te permitirá expresarte con más precisión y detalle.

## Adjetivos (Adjectives)

### ¿Qué son los adjetivos?
Los adjetivos describen o modifican a los sustantivos. En inglés, van ANTES del sustantivo que modifican.

> She is a **beautiful** woman. (Ella es una mujer hermosa.)
> I live in a **big** city. (Vivo en una ciudad grande.)
> He is a **tall** man. (Él es un hombre alto.)

### Adjetivos comunes por categoría:

**Personalidad:**
- Kind (amable), generous (generoso), honest (honesto), brave (valiente)
- Funny (divertido), smart (inteligente), creative (creativo), patient (paciente)
- Lazy (perezoso), selfish (egoísta), stubborn (terco)

**Apariencia física:**
- Tall (alto), short (bajo), thin (delgado), overweight (con sobrepeso)
- Beautiful (hermoso), handsome (guapo), ugly (feo), pretty (bonito)
- Young (joven), old (viejo), middle-aged (de mediana edad)

**Emociones:**
- Happy (feliz), sad (triste), angry (enojado), scared (asustado)
- Excited (emocionado), nervous (nervioso), surprised (sorprendido), bored (aburrido)
- Tired (cansado), relaxed (relajado), confused (confundido), proud (orgulloso)

**Tamaño y forma:**
- Big (grande), small (pequeño), long (largo), short (corto)
- Wide (ancho), narrow (estrecho), round (redondo), square (cuadrado)
- Thick (grueso), thin (delgado)

**Calidad:**
- Good (bueno), bad (malo), excellent (excelente), terrible (terrible)
- Important (importante), interesting (interesante), difficult (difícil), easy (fácil)
- Expensive (caro), cheap (barato), new (nuevo), old (viejo)

### Orden de los adjetivos
Cuando usas varios adjetivos antes de un sustantivo, sigue este orden:
**Opinión → Tamaño → Edad → Forma → Color → Origen → Material**

> A **beautiful small old wooden** chair.
> (Una hermosa pequeña vieja silla de madera.)

## Adverbios (Adverbs)

### ¿Qué son los adverbios?
Los adverbios modifican verbos, adjetivos u otros adverbios. Muchos se forman añadiendo **-ly** al adjetivo.

> She sings **beautifully**. (Ella canta hermosamente.)
> He runs **quickly**. (Él corre rápidamente.)
> She is **extremely** happy. (Ella está extremadamente feliz.)

### Formación de adverbios:
1. **Adjetivo + ly**: quick → quickly, slow → slowly, happy → happily
2. **Adjetivo terminado en -y → ily**: easy → easily, happy → happily
3. **Adjetivo terminado en -le → ly**: comfortable → comfortably, gentle → gently
4. **Adjetivo terminado en -ic → ically**: basic → basically, fantastic → fantastically
5. **Irregulares**: good → well, fast → fast, hard → hard, late → late

### Tipos de adverbios:

**De frecuencia (ya vistos):**
- always, usually, often, sometimes, rarely, never

**De grado (intensidad):**
- Very (muy), extremely (extremadamente), really (realmente)
- Quite (bastante), rather (algo), too (demasiado)
- A little (un poco), a lot (mucho)

**De manera:**
- Quickly (rápidamente), slowly (lentamente), carefully (cuidadosamente)
- Badly (mal), well (bien), hard (con esfuerzo)

**De tiempo:**
- Now (ahora), yesterday (ayer), today (hoy), tomorrow (mañana)
- Soon (pronto), recently (recientemente), already (ya), yet (todavía)

### Diferencia clave: Adjetivo vs Adverbio

| Adjetivo (describe sustantivo) | Adverbio (describe verbo) |
|---|---|
| She is a **good** singer. | She sings **well**. |
| He is a **slow** walker. | He walks **slowly**. |
| It was an **easy** test. | She did the test **easily**. |
| He is a **hard** worker. | He works **hard**. |

**¡Cuidado!** "Good" → "Well" (irregular)
> He plays soccer **good** ❌ → He plays soccer **well** ✓

## Ejercicios de Práctica

### Ejercicio 1: Adjetivo o adverbio
1. She sings __________. (beautiful/beautifully)
2. He is __________ at math. (good/well)
3. The food tastes __________. (good/well)
4. She speaks English __________. (fluent/fluently)
5. The movie was __________. (terrible/terribly)

### Ejercicio 2: Forma el adverbio
1. quick → _______
2. happy → _______
3. easy → _______
4. bad → _______
5. careful → _______

### Ejercicio 3: Completa con un adjetivo
1. She is very _______ (kind/funny/smart). She always helps people.
2. The exam was very _______ (difficult/easy/boring). I couldn't answer any questions.
3. He is a _______ (generous/selfish/lazy) person. He never shares anything.

### Ejercicio 4: Traduce al inglés
1. Ella corre rápidamente. = _________________________
2. Él es muy inteligente. = _________________________
3. La comida sabe bien. = _________________________

## Resumen
En esta clase aprendiste los adjetivos (para describir sustantivos) y los adverbios (para modificar verbos, adjetivos y otros adverbios). Recuerda: los adjetivos van antes del sustantivo, y muchos adverbios se forman añadiendo "-ly" al adjetivo. ¡Usa adjetivos y adverbios para hacer tu inglés más expresivo!`,
    },

    // ── CLASE 20: REPASO DEL MÓDULO 2 ──
    {
      title: 'Clase 20: Repaso del Módulo 2',
      description: 'Repaso integral del Módulo 2 con ejercicios de práctica y autoevaluación.',
      orderIndex: 9,
      content: `# Repaso del Módulo 2: Gramática Básica

## Introducción
Has completado el Módulo 2, donde aprendiste las estructuras gramaticales fundamentales del inglés. Este repaso te ayudará a consolidar todo lo aprendido, desde el verbo To Be hasta los adjetivos y adverbios. Identifica tus áreas fuertes y las que necesitas reforzar antes de pasar al Módulo 3.

## Resumen de lo Aprendido

### Clase 11: El Verbo To Be
- Formas afirmativa, negativa e interrogativa (presente y pasado)
- Respuestas cortas
- Usos como "ser" y "estar"

### Clase 12: Artículos: A, An, The
- "A" con sonido de consonante, "An" con sonido de vocal
- "The" para cosas específicas
- Cuándo NO usar artículo

### Clase 13: Pronombres Personales
- Sujeto: I, you, he, she, it, we, they
- Objeto: me, you, him, her, it, us, them
- Posesivos: my/mine, your/yours, his, her/hers, our/ours, their/theirs

### Clase 14: Presente Simple
- Tercera persona: +s, +es, +ies
- Negativo: don't/doesn't + verbo base
- Interrogativo: Do/Does + sujeto + verbo base

### Clase 15: Presente Continuo
- Estructura: am/is/are + verbo-ING
- Reglas del gerundio
- Diferencia con presente simple

### Clase 16: Pasado Simple
- Regulares: +ed, verbos irregulares
- Negativo: didn't + verbo base
- Interrogativo: Did + sujeto + verbo base

### Clase 17: Futuro Simple
- Will: decisiones espontáneas, predicciones sin evidencia, promesas
- Going to: planes previos, predicciones con evidencia

### Clase 18: Preposiciones de Tiempo y Lugar
- In: períodos largos, ciudades, espacios cerrados
- On: días específicos, superficies
- At: momentos específicos, puntos exactos

### Clase 19: Adjetivos y Adverbios
- Adjetivos describen sustantivos
- Adverbios modifican verbos, adjetivos
- Formación: adjetivo + ly → adverbio

---

## Ejercicios de Repaso Integral

### Sección 1: Verbo To Be

**1.** Completa: "They _______ very happy at the party yesterday."
> a) are  b) were  c) was

**2.** Convierte a interrogativo: "She is a teacher."
> _________________________

### Sección 2: Artículos

**3.** Completa: "She is _______ honest person. She works at _______ university."
> a) an / an  b) an / a  c) a / an

**4.** ¿Cuál es correcto?
> a) I eat the breakfast every day.  b) I eat breakfast every day.

### Sección 3: Pronombres

**5.** "I saw Maria. I gave _______ the book."
> a) she  b) her  c) hers

**6.** "This house is _______."
> a) my  b) mine  c) me

### Sección 4: Presente Simple

**7.** "She _______ English every day."
> a) study  b) studies  c) studying

**8.** Convierte a negativo: "They work here."
> _________________________

### Sección 5: Presente Continuo

**9.** "I _______ TV right now."
> a) watch  b) am watching  c) watches

**10.** "She is _______ (run) in the park at the moment."
> _________________________

### Sección 6: Pasado Simple

**11.** Escribe el pasado: go → _______ , eat → _______ , see → _______

**12.** Convierte a interrogativo: "They went to Paris."
> _________________________

### Sección 7: Futuro Simple

**13.** Elige la mejor opción: "We have tickets. We _______ go to the concert."
> a) will  b) are going to

**14.** "I think it _______ rain tomorrow." (Predicción sin evidencia)
> a) will  b) is going to

### Sección 8: Preposiciones

**15.** "I was born _______ March _______ 1995."
> a) in / in  b) on / in  c) at / in

**16.** "The keys are _______ the table. I'll meet you _______ 5 o'clock."
> a) on / at  b) in / at  c) on / in

### Sección 9: Adjetivos y Adverbios

**17.** "She sings _______."
> a) beautiful  b) beautifully  c) beauty

**18.** "He plays soccer _______."
> a) good  b) well  c) nice

---

## Autoevaluación Final

Cuenta tus aciertos:

| Puntuación | Resultado |
|---|---|
| 15-18 aciertos | ¡Excelente! Estás listo/a para el Módulo 3 |
| 10-14 aciertos | Buen trabajo. Repasa los temas donde fallaste |
| 5-9 aciertos | Necesitas repasar. Vuelve a las clases que te cuesten |

**Respuestas:**
1-b, 2-Is she a teacher?, 3-b, 4-b, 5-b, 6-b, 7-b, 8-They don't work here, 9-b, 10-running, 11-went/ate/saw, 12-Did they go to Paris?, 13-b, 14-a, 15-b, 16-a, 17-b, 18-b

---

## Preparación para el Módulo 3
En el Módulo 3 aprenderás:
- Vocabulario para situaciones reales: aeropuerto, hotel, médico
- Conversaciones prácticas en español-inglés
- Expresiones para compras, tecnología, deportes
- Y mucho más...

¡Felicidades por completar el Módulo 2! Tu gramática básica es cada vez más sólida.`,
    },
  ],
};
