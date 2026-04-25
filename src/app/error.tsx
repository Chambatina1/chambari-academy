"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="h-20 w-20 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
            <path d="M22 10v6" />
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 mb-2">
          Chambari Academy
        </h2>
        <p className="text-emerald-700 mb-2">Ha ocurrido un error inesperado</p>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "Por favor, recarga la página para continuar."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="px-6 py-3 rounded-xl border border-emerald-300 text-emerald-700 font-medium hover:bg-emerald-50 transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
