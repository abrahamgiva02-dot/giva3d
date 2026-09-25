'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, MessageCircle, ArrowRight, CheckCircle2, UploadCloud, Cpu } from 'lucide-react';
import { buildWhatsAppCustomQuoteUrl } from '@/lib/config';

export default function CustomServiceBanner() {
  const quoteUrl = buildWhatsAppCustomQuoteUrl();

  return (
    <section className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-900/50 shadow-2xl p-6 sm:p-8 md:p-10 text-white">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-500/20 text-cyan-300 border border-purple-500/30">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Servicio Exclusivo — Fabricamos tu Pieza</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              ¿Se rompió una pieza de tu auto, moto, electrodoméstico o herramienta?
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Si no encuentras el repuesto en el mercado o necesitas una pieza adaptada, nosotros la modelamos y fabricamos en filamentos de alta resistencia como PLA+, PETG o ABS.
            </p>

            {/* Steps bullet points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Envíanos fotos o la muestra rota</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Evaluamos medidas y tolerancias</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Impresión 3D precisa y funcional</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <a
                href={quoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-brand text-white font-black text-sm sm:text-base hover:opacity-95 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>SOLICITAR COTIZACIÓN</span>
              </a>

              <Link
                href="/categoria/diseno-a-medida"
                className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-colors border border-white/10"
              >
                <span>Conocer más del servicio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual illustration card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-cyan-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">¿Qué puedes enviarnos?</h4>
                  <p className="text-xs text-slate-400">Canal directo por WhatsApp</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Fotografías con regla o cinta métrica.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Dibujo con dimensiones en papel.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Archivos 3D (.STL, .STEP, .OBJ si ya los tienes).
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Entrega de pieza rota física para escaneo/reproducción.
                </li>
              </ul>

              <div className="pt-2">
                <a
                  href={quoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Enviar fotos a WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
