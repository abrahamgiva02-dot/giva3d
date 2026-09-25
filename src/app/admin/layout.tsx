'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Box, 
  LayoutDashboard, 
  Package, 
  Image as ImageIcon, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  ChevronRight,
  ArchiveRestore
} from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // If on login or update-password page, no need to protect with admin sidebar
    if (pathname === '/admin/login' || pathname === '/admin/update-password') {
      setIsAuthenticated(true);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false);
      router.replace('/admin/login');
      return;
    }

    // 1. Initial check of active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        router.replace('/admin/login');
      }
    });

    // 2. Subscribe to auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        if (pathname !== '/admin/login' && pathname !== '/admin/update-password') {
          router.replace('/admin/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      // Also clean any legacy keys
      if (typeof window !== 'undefined') {
        localStorage.removeItem('giva3d_admin_auth');
      }
      setIsAuthenticated(false);
      router.replace('/admin/login');
    }
  };

  // If on login or update-password page, render children without admin sidebar
  if (pathname === '/admin/login' || pathname === '/admin/update-password') {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  // Waiting for client check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Verificando sesión segura con Supabase...</span>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Productos', href: '/admin/productos', icon: <Package className="w-5 h-5" /> },
    { label: 'Banners Home', href: '/admin/banners', icon: <ImageIcon className="w-5 h-5" /> },
    { label: 'Recuperar Storage', href: '/admin/recuperar-productos', icon: <ArchiveRestore className="w-5 h-5 text-amber-400" /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-24 flex items-center justify-between px-5 border-b border-slate-800">
            <Link href="/admin" className="flex items-center gap-3 group min-w-0">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/90 bg-black shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/images/logo.png"
                  alt="GIVA 3D"
                  fill
                  priority
                  className="object-contain p-0.5"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <span className="font-black text-lg text-white font-sans flex items-center gap-1 leading-tight">
                  GIVA <span className="text-orange-500">3D</span>
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-orange-400 block truncate mt-0.5">
                  Panel Admin
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Gestión Principal
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-brand text-white shadow-md shadow-purple-900/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {userEmail && (
            <div className="px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Conectado como</span>
              <span className="text-xs font-semibold text-slate-200 truncate block" title={userEmail}>
                {userEmail}
              </span>
            </div>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              Ver tienda pública
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* Admin Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-orange-500 bg-black shrink-0 lg:hidden">
                <Image
                  src="/images/logo.png"
                  alt="GIVA 3D"
                  fill
                  className="object-contain"
                  sizes="28px"
                />
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600 hidden sm:inline" />
              <span className="text-xs font-bold text-slate-700">Modo Administrador</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Catálogo</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
