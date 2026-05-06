import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sseStore } from '@/app/api/live/sse-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Verify session exists and is active
  const session = await db.liveSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive) {
    return new Response('Sesión no encontrada o inactiva', { status: 404 });
  }

  const encoder = new TextEncoder();
  let keepAliveInterval: ReturnType<typeof setInterval>;
  let pollInterval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`));

      // Register listener for new annotations
      const unsubscribe = sseStore.addListener(sessionId, (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream closed
        }
      });

      // Keep-alive to prevent connection timeout
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Poll DB every 2 seconds for new annotations (fallback for missed SSE events)
      pollInterval = setInterval(async () => {
        try {
          const lastTimestamp = sseStore.getLastTimestamp(sessionId);
          const whereClause: Record<string, unknown> = { sessionId };
          if (lastTimestamp) {
            whereClause.createdAt = { gt: new Date(lastTimestamp) };
          }

          const annotations = await db.annotation.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' },
          });

          for (const annotation of annotations) {
            const data = JSON.stringify(annotation);
            try {
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } catch {
              break;
            }
            // Update last seen timestamp
            sseStore.setLastTimestamp(sessionId, annotation.createdAt.toISOString());
          }
        } catch {
          // polling error, ignore
        }
      }, 2000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepAliveInterval);
        clearInterval(pollInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
