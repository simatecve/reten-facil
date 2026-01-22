
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const LandingPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginMode) {
        // Login Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Note: In a real app, 'rememberMe' would affect session persistence settings
        // but Supabase handles basic persistence by default in the browser.
      } else {
        // Registration Logic
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Insert extra data into profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                email: email,
                role: 'admin' // First user is usually admin
              }
            ]);

          if (profileError) {
            console.error("Profile creation failed", profileError);
          }
        }

        alert("Registro exitoso! Por favor inicia sesión.");
        setIsLoginMode(true);
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white overflow-hidden">
      {/* LEFT COLUMN: Visual & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Image/Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=2000"
            alt="Financial Background"
            className="w-full h-full object-cover opacity-30 scale-110 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-transparent to-slate-900/90 z-10"></div>
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-lg space-y-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-blue-600 font-black text-2xl">R</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Reten<span className="text-blue-400">Fácil</span>
            </h1>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Automatiza tu Gestión de <span className="text-blue-400">IVA</span> con Inteligencia Artificial.
            </h2>
            <p className="text-xl text-slate-300 font-medium leading-relaxed">
              La plataforma líder en Venezuela para la generación de comprobantes de retención. Simple, rápida y 100% legal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] transition-all hover:bg-white/10">
              <span className="material-icons text-blue-400 text-3xl mb-3">document_scanner</span>
              <h3 className="text-white font-bold mb-1">Lectura IA</h3>
              <p className="text-slate-400 text-sm">Escanea facturas en segundos con precisión máxima.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] transition-all hover:bg-white/10">
              <span className="material-icons text-green-400 text-3xl mb-3">verified</span>
              <h3 className="text-white font-bold mb-1">Normativa SENIAT</h3>
              <p className="text-slate-400 text-sm">Genera archivos TXT y comprobantes legales 2024.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative bg-white">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <span className="text-xl font-bold text-slate-800 tracking-tighter uppercase">Reten<span className="text-blue-600">Fácil</span></span>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900">
              {isLoginMode ? 'Inicia Sesión' : 'Crea tu Cuenta'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {isLoginMode ? 'Bienvenido de nuevo a la gestión inteligente.' : 'Unete a miles de empresas que ya automatizan su fiscalidad.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
              <span className="material-icons">error_outline</span>
              <p className="text-sm font-bold">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre</label>
                  <input
                    required
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ej. Juan" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Apellido</label>
                  <input
                    required
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ej. Perez" />
                </div>
              </div>
            )}

            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</label>
                <input
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412-1234567" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
              <input
                required
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative">
                <input
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-icons">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                  {rememberMe && <span className="material-icons text-white text-[14px]">check</span>}
                </div>
                <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Recordarme</span>
              </label>
              {isLoginMode && <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Olvide mi clave</button>}
            </div>

            <button disabled={loading} className="w-full bg-slate-900 text-white rounded-[2rem] py-5 font-black text-lg shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all transform active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Procesando...' : (isLoginMode ? 'Acceder al Panel' : 'Crear Cuenta')}
            </button>
          </form>

          <p className="text-center text-slate-400 font-bold text-sm">
            {isLoginMode ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro?'} {' '}
            <button onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }} className="text-blue-600 hover:underline">
              {isLoginMode ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {/* Simple Footer */}
        <div className="absolute bottom-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
          © 2025 RetenFácil · Venezuela
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
