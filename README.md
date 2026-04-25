# Chambari Academy — Aula Virtual

Plataforma educativa para aprender inglés con el método Sinapsis. Aula virtual completa con clases en vivo, ejercicios generados por IA, diccionario fonético integrado y seguimiento en tiempo real.

## Características

- **Panel del Profesor**: CRUD de módulos y clases, subir documentos/videos, gestión de estudiantes, generación de ejercicios con IA, aula virtual, diccionario fonético
- **Panel del Estudiante**: Clases en orden consecutivo (una a la vez), diccionario fonético, captura de pantalla para enviar al profesor, chat, aula virtual
- **Tiempo Real**: WebSocket para progreso, capturas, mensajes y aula virtual
- **Ejercicios IA**: Generación automática de ejercicios con DeepSeek
- **Mobile-First**: Optimizado para que el teléfono del estudiante sea su pupitre

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Prisma ORM + SQLite
- **UI**: shadcn/ui + Tailwind CSS 4 + Framer Motion
- **Realtime**: Socket.io
- **AI**: z-ai-web-dev-sdk (DeepSeek)
- **Video**: Jitsi Meet

## Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/Chambatina1/chambari-academy.git
cd chambari-academy

# Instalar dependencias
bun install

# Configurar base de datos
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Crear tablas
bun run db:push

# (Opcional) Sembrar datos iniciales
# Iniciar el servidor y visitar /api/seed

# Iniciar el servicio de tiempo real
cd mini-services/realtime-service
bun install
bun run dev &

# Iniciar el servidor principal
cd ../..
bun run dev
```

## Variables de Entorno

```env
DATABASE_URL=file:./db/custom.db
```

## Despliegue en Render

1. Crear un nuevo **Web Service** en Render
2. Conectar el repositorio de GitHub
3. Configurar:
   - **Build Command**: `bun install && bun run db:push`
   - **Start Command**: `bun run start`
   - **Environment**: `NODE_ENV=production`
4. Agregar variable: `DATABASE_URL` ( Render disk path o PostgreSQL )
5. Deploy

## Cuentas Predefinidas

Después de hacer seed (`POST /api/seed`):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Profesor | profesor@chambari.com | chambari2024 |

## Estructura del Proyecto

```
├── prisma/             # Schema de base de datos
├── src/
│   ├── app/
│   │   ├── api/        # API Routes (20 endpoints)
│   │   ├── globals.css # Estilos globales
│   │   ├── layout.tsx  # Layout principal
│   │   └── page.tsx    # SPA completa (todas las vistas)
│   ├── components/ui/  # Componentes shadcn/ui
│   ├── hooks/          # Hooks personalizados
│   └── lib/            # Utilidades y auth
├── mini-services/
│   └── realtime-service/ # WebSocket (Socket.io)
└── public/uploads/     # Archivos subidos
```
