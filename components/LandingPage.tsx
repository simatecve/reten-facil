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
                email: email
              }
            ]);

          if (profileError) {
             console.error("Profile creation failed", profileError);
             // Note: Account created in Auth but profile failed. 
             // in prod you might want to rollback or retry.
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
            <span className="text-xl font-bold text-gray-800">RetenFácil</span>
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
        <div className="w-full md:w-96 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">{isLoginMode ? 'Bienvenido' : 'Crear Cuenta'}</h2>
            <p className="text-sm text-gray-500 mb-6">Gestiona tus impuestos de forma inteligente.</p>

            {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                    <span className="material-icons text-sm">error</span>
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                
                {/* Extra fields for Registration */}
                {!isLoginMode && (
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input 
                            required 
                            type="text" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Juan"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input 
                            required 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Perez"
                        />
                     </div>
                  </div>
                )}

                {!isLoginMode && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input 
                            required 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0414-1234567"
                        />
                     </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input 
                        required 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="ejemplo@empresa.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input 
                        required 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="••••••••"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : (isLoginMode ? 'Iniciar Sesión' : 'Registrarse')}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
                {isLoginMode ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button 
                    onClick={() => setIsLoginMode(!isLoginMode)}
                    className="text-blue-600 font-bold hover:underline"
                >
                    {isLoginMode ? "Regístrate gratis" : "Inicia sesión"}
                </button>
            </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 RetenFácil Venezuela.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
