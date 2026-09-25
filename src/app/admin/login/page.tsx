'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Box, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    // If user already has an active Supabase session, redirect to /admin
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.replace('/admin');
        }
      });
    }
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Ingresa tu correo electrónico.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setForgotError('Supabase no está configurado.');
      return;
    }

    setForgotLoading(true);

    try {
      // Determine origin cleanly (client-side)
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/admin/update-password`
        : 'http://localhost:3000/admin/update-password';

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setForgotError(`Error: ${resetError.message}`);
        setForgotLoading(false);
        return;
      }

      setForgotSuccess('Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.');
      setForgotLoading(false);
    } catch (err: any) {
      setForgotError(err?.message || 'Error al solicitar la recuperación.');
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase no está configurado. Revisa las variables en tu archivo .env.local.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu correo electrónico y contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('El correo electrónico no ha sido confirmado en Supabase.');
        } else {
          setError(`Error de autenticación: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/admin');
      } else {
        setError('No se pudo establecer la sesión. Intenta nuevamente.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mx-auto shadow-xl shadow-orange-500/25 ring-2 ring-orange-500 bg-black shrink-0">
            <Image
              src="/images/logo.png"
              alt="GIVA 3D"
              fill
              priority
              className="object-contain p-1"
              sizes="96px"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 leading-none">
              GIVA <span className="text-orange-500">3D</span>
            </h1>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 mt-1">
              Panel Administrador
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Acceso seguro con credenciales de Supabase Auth
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña..."
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span />
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotEmail(email);
                setForgotSuccess('');
                setForgotError('');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-brand hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Autenticación segura vinculada a tu cuenta de Supabase Auth
          </p>
        </div>

        {/* Modal: Recuperar Contraseña */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Recuperar Contraseña</h3>
                <p className="text-xs text-slate-400">
                  Te enviaremos un correo con un enlace seguro para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@ejemplo.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {forgotError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
                    {forgotSuccess}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-brand hover:opacity-95 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
