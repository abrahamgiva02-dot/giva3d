'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  MessageCircle, 
  Menu, 
  X, 
  Box, 
  Layers, 
  ChevronDown,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { SITE_CONFIG } from '@/lib/config';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdown, setCategoriesDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { getTotalItems, setIsOpen: setCartOpen } = useCartStore();
  const { categories } = useCatalogStore();
  const [cartCount, setCartCount] = useState(0);

  // Avoid hydration mismatch for cart badge
  useEffect(() => {
    setCartCount(getTotalItems());
    const unsubscribe = useCartStore.subscribe((state) => {
      setCartCount(state.items.reduce((acc, item) => acc + item.quantity, 0));
    });
    return () => unsubscribe();
  }, [getTotalItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-white border-b border-slate-100'
    }`}>
      {/* Top micro-bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-6 lg:px-8 xl:px-10 text-center font-medium flex justify-between items-center max-w-[1720px] mx-auto">
        <span className="hidden sm:inline flex-1 text-left">
          🚀 Envíos a todo el Perú • Diseños en 3D de alta precisión
        </span>
        <span className="text-center sm:text-right flex-1 flex items-center justify-center sm:justify-end gap-3">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Precios por mayor desde 6, 12 y 24 unids
          </span>
          <Link href="/admin" className="text-slate-400 hover:text-white transition-colors text-[11px] hidden md:inline">
            Panel Admin
          </Link>
        </span>
      </div>

      {/* Main Header */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-6">
          
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full overflow-hidden shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/90 bg-black shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logo.png"
                alt="GIVA 3D - Ideas que se hacen realidad"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 72px"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 font-sans flex items-center gap-1 leading-none">
                GIVA <span className="text-orange-500">3D</span>
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-[11px] tracking-widest uppercase font-extrabold text-orange-600 mt-1 hidden sm:block">
                IDEAS QUE SE HACEN REALIDAD
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex flex-1 max-w-xl xl:max-w-2xl relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos, figuras articuladas, repuestos..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Actions: Categories, WhatsApp, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Categories Dropdown trigger - Desktop */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setCategoriesDropdown(!categoriesDropdown)}
                onBlur={() => setTimeout(() => setCategoriesDropdown(false), 200)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Categorías</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {categoriesDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Explorar Catálogo
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categoria/${cat.slug}`}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
                      >
                        <span className="font-medium group-hover:translate-x-0.5 transition-transform">{cat.name}</span>
                        {cat.slug === 'diseno-a-medida' && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                            Servicio
                          </span>
                        )}
                      </Link>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <Link
                        href="/catalogo"
                        className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        Ver todo el catálogo →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Contact Button */}
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hola GIVA 3D, quisiera hacer una consulta.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
              title="Atención inmediata por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-slate-900 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-slate-900/10 transition-all hover:scale-105 active:scale-95"
              aria-label="Ver carrito"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="hidden md:inline ml-1.5">Carrito</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:ml-2 bg-gradient-brand text-white font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en GIVA 3D..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-4/5 max-w-xs h-full bg-white shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-md ring-2 ring-orange-500 bg-black shrink-0">
                    <Image
                      src="/images/logo.png"
                      alt="GIVA 3D"
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-lg leading-tight">
                      GIVA <span className="text-orange-500">3D</span>
                    </span>
                    <span className="text-[9px] font-bold text-orange-600 tracking-wider uppercase -mt-0.5">
                      IDEAS QUE SE HACEN REALIDAD
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="mt-4 space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-semibold text-sm"
                >
                  Inicio
                </Link>
                <Link
                  href="/catalogo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-semibold text-sm"
                >
                  Catálogo Completo
                </Link>
                <Link
                  href="/categoria/diseno-a-medida"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Fabricamos tu pieza
                  </span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                    A MEDIDA
                  </span>
                </Link>
              </div>

              {/* Categories list */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                  Categorías
                </div>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categoria/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-purple-700 hover:bg-slate-50 font-medium"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                Acceso Administrador (/admin)
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
