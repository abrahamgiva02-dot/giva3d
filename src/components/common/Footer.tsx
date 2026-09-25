import React from 'react';
import Link from 'next/link';
import { Box, MessageCircle, MapPin, Mail, ShieldCheck, Truck, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-10 sm:mt-14">
      {/* Advantage feature badges */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Envíos a todo el Perú</h4>
                <p className="text-xs text-slate-400">Lima y provincias con entrega rápida</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Materiales de Alta Resistencia</h4>
                <p className="text-xs text-slate-400">PLA+, PETG y ABS de calidad garantizada</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Precios Mayoristas</h4>
                <p className="text-xs text-slate-400">Escala de descuentos desde 6 unidades</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Servicio de Fabricación</h4>
                <p className="text-xs text-slate-400">Piezas rotas, repuestos o diseños a medida</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Slogan */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-brand p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Box className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                GIVA <span className="text-cyan-400">3D</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Catálogo profesional especializado en impresión 3D, regalos personalizados, figuras articuladas y fabricación de piezas a medida.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Contactar por WhatsApp
              </a>
            </div>
          </div>

          {/* Col 2: Categorías destacadas */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Categorías
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/categoria/juguetes-figuras" className="hover:text-purple-400 transition-colors">
                  Juguetes y figuras articuladas
                </Link>
              </li>
              <li>
                <Link href="/categoria/parejas-regalos" className="hover:text-purple-400 transition-colors">
                  Parejas y regalos personalizados
                </Link>
              </li>
              <li>
                <Link href="/categoria/logos-personalizados" className="hover:text-purple-400 transition-colors">
                  Logos y placas para negocios
                </Link>
              </li>
              <li>
                <Link href="/categoria/hogar-decoracion" className="hover:text-purple-400 transition-colors">
                  Hogar, soportes y decoración
                </Link>
              </li>
              <li>
                <Link href="/categoria/industrial-repuestos" className="hover:text-purple-400 transition-colors">
                  Industrial y repuestos técnicos
                </Link>
              </li>
              <li>
                <Link href="/categoria/diseno-a-medida" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                  Fabricamos tu pieza (A medida)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Enlaces rápidos */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Información
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalogo" className="hover:text-purple-400 transition-colors">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/categoria/diseno-a-medida" className="hover:text-purple-400 transition-colors">
                  Cotizar pieza especial
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-purple-400 transition-colors">
                  Ver mi carrito
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                  Acceso Administrador
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacto */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Atención al Cliente
            </h4>
            <p className="text-xs text-slate-400">
              Coordinación y pedidos directos vía WhatsApp:
            </p>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{SITE_CONFIG.whatsappDisplay}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{SITE_CONFIG.location}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>{SITE_CONFIG.email}</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} GIVA 3D. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2">
            <span>Tecnología e Impresión 3D Profesional</span>
            <span>•</span>
            <Link href="/admin" className="hover:text-purple-400">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
