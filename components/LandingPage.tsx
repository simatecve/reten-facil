
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
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <span className="text-xl font-bold text-gray-800 tracking-tighter">Reten<span className="text-blue-600">Fácil</span></span>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto px-4 w-full py-12 gap-12 items-center">
        {/* Left Side: Marketing */}
        <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              Tus Retenciones de IVA <br/>
              <span className="text-blue-600">Al instante con IA</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
              Sube la foto de la factura, nuestra IA extrae los datos y genera el comprobante SENIAT automáticamente.
              Gestiona empresas 75% o 100% sin complicaciones.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <span className="material-icons text-blue-600 mb-2">document_scanner</span>
                    <div className="font-bold text-gray-800">Lectura IA</div>
                    <div className="text-xs text-gray-500">De Facturas</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <span className="material-icons text-green-600 mb-2">download</span>
                    <div className="font-bold text-gray-800">PDF Rápido</div>
                    <div className="text-xs text-gray-500">Normativa 2024</div>
                </div>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-96 bg-white p-8 rounded-[2rem] shadow-2xl shadow-blue-100/50 border border-gray-100">
            <h2 className="text-2xl font-black mb-1 text-gray-900">{isLoginMode ? 'Bienvenido' : 'Crear Cuenta'}</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Gestiona tus impuestos de forma inteligente.</p>

            {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-100 animate-shake">
                    <span className="material-icons text-sm">error</span>
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {/* Extra fields for Registration */}
                {!isLoginMode && (
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nombre</label>
                        <input 
                            required 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            placeholder="Juan"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Apellido</label>
                        <input 
                            required 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            placeholder="Perez"
                        />
                     </div>
                  </div>
                )}

                {!isLoginMode && (
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Teléfono</label>
                        <input 
                            required 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            placeholder="0414-1234567"
                        />
                     </div>
                )}

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                    <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        placeholder="ejemplo@empresa.com"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                    <div className="relative">
                        <input 
                            required 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium pr-12"
                            placeholder="••••••••"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                        >
                            <span className="material-icons text-xl">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-gray-50'}`}>
                                {rememberMe && <span className="material-icons text-white text-[14px] font-bold">check</span>}
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition-colors">Recordarme</span>
                    </label>
                    {isLoginMode && (
                        <button type="button" className="text-[10px] font-bold text-blue-600 hover:underline">
                            ¿Olvidó su clave?
                        </button>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4 active:scale-[0.98]"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                             <span>Procesando...</span>
                        </div>
                    ) : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta Gratis')}
                </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-gray-500">
                {isLoginMode ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button 
                    onClick={() => {
                        setIsLoginMode(!isLoginMode);
                        setErrorMsg('');
                    }}
                    className="text-blue-600 font-black hover:underline ml-1"
                >
                    {isLoginMode ? "Regístrate ahora" : "Inicia sesión"}
                </button>
            </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
        <p>© 2024 RetenFácil Venezuela. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
