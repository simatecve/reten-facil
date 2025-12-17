
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import RetentionVoucher from './components/RetentionVoucher';
import { Company, InvoiceItem, AppRoute, RetentionVoucher as VoucherType, UserProfile, UserRole } from './types';
import { analyzeInvoiceImage } from './lib/gemini';

// --- Componentes de Interfaz ---

const Sidebar = ({ 
  currentRoute, 
  setRoute, 
  handleLogout,
  resetStates,
  isCollapsed,
  toggleSidebar,
  role,
  userProfile
}: { 
  currentRoute: AppRoute, 
  setRoute: (r: AppRoute) => void, 
  handleLogout: () => void,
  resetStates: () => void,
  isCollapsed: boolean,
  toggleSidebar: () => void,
  role: UserRole,
  userProfile: UserProfile | null
}) => {
  const isAdmin = role === 'admin';
  
  const menuItems = [
    { route: AppRoute.DASHBOARD, icon: 'grid_view', label: 'Dashboard', show: isAdmin },
    { route: AppRoute.CREATE_RETENTION, icon: 'add_circle', label: 'Nueva Retención', show: true },
    { route: AppRoute.HISTORY, icon: 'history', label: 'Historial', show: true },
    { route: AppRoute.CREATE_COMPANY, icon: 'business', label: 'Empresas', show: isAdmin },
    { route: AppRoute.USER_MANAGEMENT, icon: 'group_add', label: 'Equipo', show: isAdmin }
  ].filter(item => item.show);

  return (
    <div className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-72'} bg-[#0f172a] text-white flex-col h-screen fixed left-0 top-0 overflow-y-auto print:hidden z-30 transition-all duration-300 shadow-2xl border-r border-slate-800`}>
      <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black tracking-tighter text-blue-400">RETEN<span className="text-white">FÁCIL</span></h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">SaaS {role}</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl">
          <span className="material-icons">{isCollapsed ? 'menu' : 'menu_open'}</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button 
            key={item.route}
            onClick={() => { resetStates(); setRoute(item.route); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${currentRoute === item.route ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
        
        {/* Profile Button Desktop */}
        <button 
          onClick={() => { resetStates(); setRoute(AppRoute.PROFILE); }}
          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${currentRoute === AppRoute.PROFILE ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Mi Perfil" : ''}
        >
          <span className="material-icons text-xl">account_circle</span>
          {!isCollapsed && <span>Mi Perfil</span>}
        </button>
      </nav>

      <div className="p-6">
        {!isCollapsed && userProfile && (
           <div className="mb-4 px-3 py-2 bg-slate-800/50 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs uppercase">
                {userProfile.first_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{userProfile.first_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile.email}</p>
              </div>
           </div>
        )}
        <button onClick={handleLogout} className={`flex items-center gap-3 text-slate-400 hover:text-red-400 font-bold text-sm w-full p-3 rounded-2xl transition-all hover:bg-red-400/10 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="material-icons">logout</span>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

const MobileBottomNav = ({ currentRoute, setRoute, resetStates, role }: any) => {
  const isAdmin = role === 'admin';
  const tabs = [
    { route: AppRoute.DASHBOARD, icon: 'grid_view', label: 'Inicio', show: isAdmin },
    { route: AppRoute.HISTORY, icon: 'history', label: 'Historial', show: true },
    { route: AppRoute.CREATE_RETENTION, icon: 'add_circle', label: 'Nueva', show: true, special: true },
    { route: AppRoute.USER_MANAGEMENT, icon: 'group', label: 'Equipo', show: isAdmin },
    { route: AppRoute.PROFILE, icon: 'person', label: 'Perfil', show: true },
  ].filter(t => t.show);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-3 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] print:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.route}
          onClick={() => { resetStates(); setRoute(tab.route); }}
          className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${
            tab.special 
            ? 'bg-blue-600 text-white p-3 rounded-full -mt-10 shadow-lg shadow-blue-300' 
            : currentRoute === tab.route ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
        >
          <span className="material-icons text-2xl">{tab.icon}</span>
          {!tab.special && <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>}
        </button>
      ))}
    </div>
  );
};

const MobileHeader = ({ title, userProfile }: any) => {
  return (
    <div className="md:hidden sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 z-40 flex justify-between items-center print:hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xs">R</span>
        </div>
        <h1 className="font-black text-slate-800 text-lg tracking-tight uppercase">{title}</h1>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <span className="material-icons text-xl">notifications_none</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [loading, setLoading] = useState(true);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generatedVouchers, setGeneratedVouchers] = useState<VoucherType[]>([]);
  const [currentVoucher, setCurrentVoucher] = useState<VoucherType | null>(null);
  const [subUsers, setSubUsers] = useState<UserProfile[]>([]);

  // Wizard States
  const [wizStep, setWizStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [wizSupplier, setWizSupplier] = useState({ name: '', rif: '' });
  const [wizItems, setWizItems] = useState<InvoiceItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingSubUser, setIsCreatingSubUser] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingSubUser, setEditingSubUser] = useState<UserProfile | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form para nueva factura individual
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    transactionType: '01-reg',
    taxRate: 16,
    exemptAmount: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id);
          if (event === 'SIGNED_IN') setRoute(AppRoute.DASHBOARD);
      } else {
        setRoute(AppRoute.LANDING);
        setUserProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
          setUserProfile(data);
          if (data.role === 'operator' && route === AppRoute.LANDING) setRoute(AppRoute.CREATE_RETENTION);
          else if (route === AppRoute.LANDING) setRoute(AppRoute.DASHBOARD);
        }
    } catch (error) { console.error("Error profile", error); }
  };

  const loadData = async () => {
    if (!userProfile) return;
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    
    // Cargar Empresas
    const { data: cos } = await supabase.from('companies').select('*').eq('user_id', adminId);
    if (cos) setCompanies(cos.map(c => ({
        id: c.id, name: c.name, rif: c.rif, address: c.address, 
        retentionPercentage: c.retention_percentage, logoUrl: c.logo_url,
        lastCorrelationNumber: c.last_correlation_number || 1
    })));

    // Cargar Retenciones
    const { data: rets } = await supabase.from('retentions').select('*, companies(*)').eq('user_id', adminId).order('created_at', { ascending: false });
    if (rets) setGeneratedVouchers(rets.map(r => ({
        id: r.id, voucherNumber: r.voucher_number, date: r.date, fiscalPeriod: r.fiscal_period,
        company: {
            id: r.companies?.id,
            name: r.companies?.name,
            rif: r.companies?.rif,
            address: r.companies?.address,
            retentionPercentage: r.companies?.retention_percentage,
            logoUrl: r.companies?.logo_url,
            lastCorrelationNumber: r.companies?.last_correlation_number
        },
        supplier: { name: r.supplier_name, rif: r.supplier_rif }, items: r.items
    })));

    // Cargar Operadores si es Admin
    if (userProfile.role === 'admin') {
        const { data: subs } = await supabase.from('profiles').select('*').eq('admin_id', userProfile.id);
        if (subs) setSubUsers(subs);
    }
  };

  useEffect(() => {
    if (userProfile) loadData();
  }, [userProfile]);

  // Dashboard Stats Calculations
  const dashboardStats = useMemo(() => {
    const totalRetained = generatedVouchers.reduce((acc, v) => {
      const itemsRetained = (v.items || []).reduce((sum, item) => sum + item.retentionAmount, 0);
      return acc + itemsRetained;
    }, 0);

    const companyDistribution = companies.map(c => {
      const count = generatedVouchers.filter(v => v.company.id === c.id).length;
      return { name: c.name, count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const count = generatedVouchers.filter(v => {
        const vDate = new Date(v.date);
        const vYM = `${vDate.getFullYear()}${String(vDate.getMonth() + 1).padStart(2, '0')}`;
        return vYM === yearMonth;
      }).length;

      return { label: monthName, value: count };
    });

    const maxMonthly = Math.max(...monthlyTrend.map(t => t.value), 1);

    return { totalRetained, companyDistribution, monthlyTrend, maxMonthly };
  }, [generatedVouchers, companies]);

  // Lógica de cálculo de facturas
  const calculateInvoice = (total: number, exempt: number = 0, taxRate: number = 16) => {
    const base = (total - exempt) / (1 + taxRate/100);
    const tax = base * (taxRate/100);
    const retentionRate = selectedCompany?.retentionPercentage || 75;
    const retentionAmount = tax * (retentionRate/100);
    
    return {
      taxBase: Number(base.toFixed(2)),
      taxAmount: Number(tax.toFixed(2)),
      retentionAmount: Number(retentionAmount.toFixed(2)),
      retentionRate
    };
  };

  const handleAddItem = () => {
    if (!newItem.invoiceNumber || !newItem.totalAmount) return alert("Faltan datos de la factura");
    
    const calcs = calculateInvoice(newItem.totalAmount, newItem.exemptAmount || 0, newItem.taxRate || 16);
    const item: InvoiceItem = {
      id: Date.now().toString(),
      date: newItem.date || new Date().toISOString().split('T')[0],
      invoiceNumber: newItem.invoiceNumber,
      controlNumber: newItem.controlNumber || '00',
      transactionType: newItem.transactionType as any,
      totalAmount: newItem.totalAmount,
      exemptAmount: newItem.exemptAmount || 0,
      taxBase: calcs.taxBase,
      taxRate: newItem.taxRate || 16,
      taxAmount: calcs.taxAmount,
      retentionRate: calcs.retentionRate,
      retentionAmount: calcs.retentionAmount
    };

    setWizItems([...wizItems, item]);
    setNewItem({ transactionType: '01-reg', taxRate: 16, exemptAmount: 0 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const jsonStr = await analyzeInvoiceImage(base64);
      try {
        const data = JSON.parse(jsonStr);
        if (data) {
          setWizSupplier({ name: data.supplierName || '', rif: data.supplierRif || '' });
          setNewItem(prev => ({ 
            ...prev, 
            invoiceNumber: data.invoiceNumber, 
            controlNumber: data.controlNumber,
            totalAmount: data.totalAmount,
            date: data.date 
          }));
          if (data.invoiceNumber) setWizStep(3);
        }
      } catch (err) { console.error("Error parseando IA", err); }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const generateVoucher = async () => {
    if (!userProfile || !selectedCompany) return;
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    
    const now = new Date();
    const periodStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNum = selectedCompany.lastCorrelationNumber || 1;
    const voucherNumber = `${periodStr}${String(nextNum).padStart(8, '0')}`;
    
    const payload = {
      user_id: adminId,
      company_id: selectedCompany.id,
      supplier_name: wizSupplier.name,
      supplier_rif: wizSupplier.rif,
      items: wizItems,
      voucher_number: voucherNumber,
      date: now.toISOString().split('T')[0],
      fiscal_period: `${now.getFullYear()} ${String(now.getMonth()+1).padStart(2,'0')}`,
      total_purchase: wizItems.reduce((acc, i) => acc + i.totalAmount, 0),
      total_tax: wizItems.reduce((acc, i) => acc + i.taxAmount, 0),
      total_retained: wizItems.reduce((acc, i) => acc + i.retentionAmount, 0)
    };

    const { error } = await supabase.from('retentions').insert([payload]);
    if (!error) {
      // Incrementar el correlativo en la tabla de empresas
      await supabase.from('companies').update({ last_correlation_number: nextNum + 1 }).eq('id', selectedCompany.id);
      loadData();
      setRoute(AppRoute.HISTORY);
      resetStates();
    } else { alert(error.message); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    setIsCreatingCompany(true);
    const fd = new FormData(e.target as HTMLFormElement);
    
    const payload = {
      user_id: userProfile.id,
      name: fd.get('name') as string,
      rif: fd.get('rif') as string,
      address: fd.get('address') as string,
      retention_percentage: parseInt(fd.get('retention_percentage') as string),
      last_correlation_number: parseInt(fd.get('last_correlation_number') as string || "1")
    };

    let error;
    if (editingCompany) {
      const { error: updateError } = await supabase.from('companies').update(payload).eq('id', editingCompany.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('companies').insert([payload]);
      error = insertError;
    }

    if (!error) {
      loadData();
      setEditingCompany(null);
      (e.target as HTMLFormElement).reset();
      alert(editingCompany ? "Empresa actualizada correctamente" : "Empresa registrada exitosamente");
    } else {
      alert("Error al procesar empresa: " + error.message);
    }
    setIsCreatingCompany(false);
  };

  const resetStates = () => {
    setWizStep(1);
    setSelectedCompany(null);
    setWizSupplier({ name: '', rif: '' });
    setWizItems([]);
    setNewItem({ transactionType: '01-reg', taxRate: 16, exemptAmount: 0 });
    setEditingCompany(null);
    setEditingSubUser(null);
  };

  const handleCreateSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    setIsCreatingSubUser(true);
    
    const fd = new FormData(e.target as HTMLFormElement);
    const email = (fd.get('email') as string).trim();
    const password = fd.get('password') as string;
    const firstName = (fd.get('first_name') as string).trim();
    const role = (fd.get('role') as string) as UserRole;

    try {
        if (editingSubUser) {
            // Edición de perfil existente (Nombre y Rol)
            const { error: profileError } = await supabase.from('profiles').update({
                first_name: firstName,
                role: role
            }).eq('id', editingSubUser.id);

            if (profileError) throw profileError;
            alert(`Operador "${firstName}" actualizado.`);
        } else {
            // Creación de nuevo
            if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { first_name: firstName, role: role, admin_id: userProfile.id }
                }
            });

            if (authError) throw authError;

            const { error: profileError } = await supabase.from('profiles').upsert([{
              id: authData.user?.id || crypto.randomUUID(), 
              email: email, 
              first_name: firstName,
              role: role, 
              admin_id: userProfile.id
            }]);

            if (profileError) throw profileError;
            alert(`Operador "${firstName}" creado con éxito.`);
        }

        loadData(); 
        setEditingSubUser(null);
        (e.target as HTMLFormElement).reset(); 
    } catch (err: any) {
        alert("ERROR: " + (err.message || "Ocurrió un error."));
    } finally {
        setIsCreatingSubUser(false);
    }
  };

  const handleDeleteSubUser = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este acceso? El usuario ya no podrá entrar.")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) loadData();
    else alert("Error: " + error.message);
  };

  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingProfile(true);
    const fd = new FormData(e.target as HTMLFormElement);
    const firstName = fd.get('first_name') as string;
    const phone = fd.get('phone') as string;
    const newPassword = fd.get('new_password') as string;

    try {
        // Update DB Profile
        const { error: profileError } = await supabase.from('profiles').update({
            first_name: firstName,
            phone: phone
        }).eq('id', userProfile.id);

        if (profileError) throw profileError;

        // Update Auth Password if provided
        if (newPassword.trim()) {
            if (newPassword.length < 6) throw new Error("La contraseña nueva debe tener al menos 6 caracteres.");
            const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
            if (authError) throw authError;
            alert("Perfil y contraseña actualizados.");
        } else {
            alert("Perfil actualizado correctamente.");
        }
        
        fetchProfile(userProfile.id);
    } catch (err: any) {
        alert("Error: " + err.message);
    } finally {
        setIsSavingProfile(false);
    }
  };

  const getPageTitle = (r: AppRoute) => {
    switch(r) {
      case AppRoute.DASHBOARD: return 'Dashboard';
      case AppRoute.CREATE_RETENTION: return 'Nueva Retención';
      case AppRoute.HISTORY: return 'Historial';
      case AppRoute.USER_MANAGEMENT: return 'Mi Equipo';
      case AppRoute.PROFILE: return 'Perfil';
      case AppRoute.CREATE_COMPANY: return 'Empresas';
      default: return 'RetenFácil';
    }
  }

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
       <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
       <p className="text-blue-400 font-bold tracking-widest text-xs uppercase">Cargando RetenFácil</p>
    </div>
  );
  
  if (!user || route === AppRoute.LANDING) return <LandingPage />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Components */}
      <MobileHeader title={getPageTitle(route)} userProfile={userProfile} />
      <MobileBottomNav currentRoute={route} setRoute={setRoute} resetStates={resetStates} role={userProfile?.role} />

      {/* Desktop Sidebar */}
      <Sidebar 
        currentRoute={route} setRoute={setRoute} 
        handleLogout={() => supabase.auth.signOut()} 
        resetStates={resetStates}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        role={userProfile?.role || 'operator'}
        userProfile={userProfile}
      />
      
      <main className={`flex-1 transition-all duration-300 pb-24 md:pb-8 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} p-4 md:p-8`}>
        
        {/* DASHBOARD */}
        {route === AppRoute.DASHBOARD && userProfile?.role === 'admin' && (
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-fade-in">
            <header className="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tight">Bienvenido, {userProfile.first_name}</h1>
                <p className="text-slate-500 mt-2 font-medium">Resumen general de tu plataforma SaaS.</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="material-icons text-xl">account_balance_wallet</span>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Retenido</p>
                    <p className="font-black text-slate-900">{dashboardStats.totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                 </div>
              </div>
            </header>

            {/* Mobile Stats Top Bar */}
            <div className="md:hidden bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-200">
               <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Retenido Global</p>
               <h3 className="text-3xl font-black mt-1">{dashboardStats.totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</h3>
               <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="bg-white/10 px-4 py-2 rounded-2xl whitespace-nowrap">
                    <span className="text-[10px] font-bold block opacity-60">Empresas</span>
                    <span className="font-bold">{companies.length}</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-2xl whitespace-nowrap">
                    <span className="text-[10px] font-bold block opacity-60">Comprobantes</span>
                    <span className="font-bold">{generatedVouchers.length}</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-2xl whitespace-nowrap">
                    <span className="text-[10px] font-bold block opacity-60">Equipo</span>
                    <span className="font-bold">{subUsers.length}</span>
                  </div>
               </div>
            </div>

            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="material-icons">business</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Empresas</p>
                  <h3 className="text-4xl font-black mt-1">{companies.length}</h3>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <span className="material-icons">receipt_long</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comprobantes</p>
                  <h3 className="text-4xl font-black mt-1">{generatedVouchers.length}</h3>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <span className="material-icons">people</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operadores</p>
                  <h3 className="text-4xl font-black mt-1">{subUsers.length}</h3>
               </div>
            </div>

            {/* GRÁFICOS Y ESTADÍSTICAS ADICIONALES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
               {/* Tendencia Mensual */}
               <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-2">
                    <span className="material-icons text-blue-600">trending_up</span>
                    Tendencia de Emisión
                  </h3>
                  <div className="flex-1 flex items-end justify-between gap-2 h-40 md:h-48 px-1 md:px-2">
                    {dashboardStats.monthlyTrend.map((t, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center group">
                        <div className="w-full relative flex flex-col justify-end h-full">
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {t.value} comprobantes
                           </div>
                           <div 
                              className="w-full bg-blue-100 group-hover:bg-blue-600 rounded-t-lg md:rounded-t-xl transition-all duration-500 ease-out" 
                              style={{ height: `${(t.value / dashboardStats.maxMonthly) * 100}%`, minHeight: '4px' }}
                           ></div>
                        </div>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 mt-3 md:mt-4 uppercase tracking-tighter">{t.label}</p>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Distribución por Empresa */}
               <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-2">
                    <span className="material-icons text-indigo-600">pie_chart</span>
                    Actividad por Empresa
                  </h3>
                  <div className="space-y-4 md:space-y-6">
                     {dashboardStats.companyDistribution.map((item, idx) => (
                       <div key={idx} className="space-y-1.5 md:space-y-2">
                          <div className="flex justify-between text-[10px] md:text-xs font-bold">
                             <span className="text-slate-700 truncate max-w-[70%]">{item.name}</span>
                             <span className="text-slate-400">{item.count}</span>
                          </div>
                          <div className="h-1.5 md:h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-700" 
                                style={{ width: `${(item.count / (generatedVouchers.length || 1)) * 100}%` }}
                             ></div>
                          </div>
                       </div>
                     ))}
                     {dashboardStats.companyDistribution.length === 0 && (
                        <div className="h-32 md:h-40 flex items-center justify-center text-slate-300 italic text-sm">
                           Sin datos suficientes
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100">
               <h3 className="font-black text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-2">
                  <span className="material-icons text-amber-500">history</span>
                  Actividad Reciente
               </h3>
               <div className="space-y-3 md:space-y-4">
                  {generatedVouchers.slice(0, 5).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                             <span className="material-icons text-lg md:text-xl">receipt</span>
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 text-xs md:text-base truncate max-w-[120px] md:max-w-none">{v.supplier.name}</p>
                             <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comp: {v.voucherNumber.substring(0, 8)}...</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-slate-900 text-xs md:text-sm">{(v.items || []).reduce((acc, i) => acc + i.retentionAmount, 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">{v.date}</p>
                       </div>
                    </div>
                  ))}
                  {generatedVouchers.length === 0 && (
                    <p className="text-center py-4 text-slate-400 italic">No hay actividad reciente.</p>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* GESTIÓN DE EMPRESAS */}
        {route === AppRoute.CREATE_COMPANY && userProfile?.role === 'admin' && (
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
            <header className="hidden md:block">
              <h2 className="text-3xl font-black tracking-tight">Gestión de Empresas</h2>
              <p className="text-slate-500 mt-2">Agrega y administra las entidades bajo tu control administrativo.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 md:sticky md:top-8">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="material-icons text-blue-600">{editingCompany ? 'edit' : 'add_business'}</span>
                    {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
                  </h3>
                  <form onSubmit={handleCreateCompany} className="space-y-4">
                    <input required name="name" defaultValue={editingCompany?.name} placeholder="Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input required name="rif" defaultValue={editingCompany?.rif} placeholder="RIF (J-00000000-0)" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    <textarea required name="address" defaultValue={editingCompany?.address} placeholder="Dirección Fiscal" className="w-full bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tasa IVA</label>
                          <select name="retention_percentage" defaultValue={editingCompany?.retentionPercentage || "75"} className="w-full bg-slate-50 border-none p-4 rounded-2xl appearance-none font-bold">
                            <option value="75">75%</option>
                            <option value="100">100%</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Próximo Correlativo</label>
                          <input required type="number" name="last_correlation_number" defaultValue={editingCompany?.lastCorrelationNumber || 1} placeholder="1" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-4">
                      <button type="submit" disabled={isCreatingCompany} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                        {isCreatingCompany ? 'Guardando...' : editingCompany ? 'Actualizar Datos' : 'Registrar Empresa'}
                      </button>
                      {editingCompany && (
                        <button type="button" onClick={() => setEditingCompany(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3 hover:bg-slate-300 transition-all">
                          Cancelar Edición
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {companies.map(c => (
                  <div key={c.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <span className="material-icons text-xl md:text-3xl">business</span>
                      </div>
                      <div>
                        <h4 className="font-black text-sm md:text-lg text-slate-800">{c.name}</h4>
                        <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">
                           {c.rif} • {c.retentionPercentage}%
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditingCompany(c)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Editar Empresa"
                    >
                      <span className="material-icons text-lg md:text-xl">edit</span>
                    </button>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="p-12 md:p-20 text-center bg-white rounded-[2rem] md:rounded-[2.5rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">No hay empresas registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MI PERFIL */}
        {route === AppRoute.PROFILE && userProfile && (
           <div className="max-w-4xl mx-auto space-y-6 md:space-y-12 animate-fade-in">
              <header className="hidden md:block">
                <h2 className="text-3xl font-black tracking-tight">Mi Perfil</h2>
                <p className="text-slate-500 mt-2">Gestiona tu información personal y seguridad.</p>
              </header>

              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 md:h-32 relative">
                   <div className="absolute -bottom-10 md:-bottom-12 left-8 md:left-12 w-20 h-20 md:w-24 md:h-24 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl flex items-center justify-center border-4 border-white">
                      <span className="material-icons text-blue-600 text-3xl md:text-4xl">person</span>
                   </div>
                </div>
                <div className="p-6 md:p-12 pt-14 md:pt-16">
                   <form onSubmit={handleUpdateOwnProfile} className="space-y-6 md:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre Completo</label>
                            <input required name="first_name" defaultValue={userProfile.first_name} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Correo Electrónico</label>
                            <input disabled value={userProfile.email} className="w-full bg-slate-100 border-none p-4 rounded-2xl text-slate-400 cursor-not-allowed font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Teléfono</label>
                            <input name="phone" defaultValue={userProfile.phone} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nueva Contraseña</label>
                            <input name="new_password" type="password" placeholder="Opcional" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                      </div>

                      <div className="pt-6 border-t flex flex-col md:flex-row gap-3">
                        <button type="submit" disabled={isSavingProfile} className="flex-1 md:flex-none bg-blue-600 text-white px-12 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                           {isSavingProfile ? (
                             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                           ) : <span className="material-icons">save</span>}
                           Guardar Cambios
                        </button>
                        <button 
                          type="button" 
                          onClick={() => supabase.auth.signOut()}
                          className="md:hidden bg-red-50 text-red-600 px-12 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                        >
                           <span className="material-icons">logout</span>
                           Cerrar Sesión
                        </button>
                      </div>
                   </form>
                </div>
              </div>
           </div>
        )}

        {/* WIZARD DE RETENCION */}
        {route === AppRoute.CREATE_RETENTION && (
           <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="mb-6 md:mb-10 flex items-center justify-between">
                <div>
                  <h2 className="hidden md:block text-3xl font-black tracking-tight">Nueva Retención</h2>
                  <p className="text-slate-500 text-sm md:text-base">Paso {wizStep} de 3</p>
                </div>
                <div className="flex gap-2">
                   {[1,2,3].map(s => (
                     <div key={s} className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${wizStep >= s ? 'w-8 md:w-10 bg-blue-600' : 'w-3 md:w-4 bg-slate-200'}`}></div>
                   ))}
                </div>
              </div>

              {wizStep === 1 && (
                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                   <h3 className="font-bold text-lg md:text-xl mb-6 md:mb-8">1. Empresa Agente</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companies.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCompany(c); setWizStep(2); }} className="text-left p-4 md:p-6 border-2 border-slate-50 rounded-2xl md:rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group">
                          <div className="truncate pr-2">
                            <p className="font-bold group-hover:text-blue-700 truncate">{c.name}</p>
                            <p className="text-[10px] md:text-xs text-slate-400">RIF: {c.rif}</p>
                          </div>
                          <span className="material-icons text-slate-300 group-hover:text-blue-500">chevron_right</span>
                        </button>
                      ))}
                      {companies.length === 0 && (
                        <div className="col-span-2 text-center py-10 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold text-xs">No hay empresas registradas para facturar.</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {wizStep === 2 && (
                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                  {isAnalyzing && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-blue-600 uppercase text-[10px] tracking-widest text-center px-6">Procesando imagen con IA...</p>
                  </div>}
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-10">
                    <h3 className="font-bold text-lg md:text-xl">2. Proveedor</h3>
                    <div className="relative w-full md:w-auto group">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <button className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 py-4 md:py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                        <span className="material-icons">auto_awesome</span> Escanear Factura
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RIF del Proveedor</label>
                          <input value={wizSupplier.rif} onChange={e => setWizSupplier({...wizSupplier, rif: e.target.value})} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                          <input value={wizSupplier.name} onChange={e => setWizSupplier({...wizSupplier, name: e.target.value})} placeholder="Nombre completo" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                       </div>
                    </div>
                    <div className="flex justify-between pt-8 md:pt-10 border-t">
                       <button onClick={() => setWizStep(1)} className="text-slate-400 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-all">Atrás</button>
                       <button onClick={() => setWizStep(3)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all">Siguiente</button>
                    </div>
                  </div>
                </div>
              )}

              {wizStep === 3 && (selectedCompany) && (
                <div className="space-y-6 md:space-y-8 animate-fade-in">
                   <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <span className="material-icons text-blue-600">receipt</span>
                        Añadir Factura
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nro Factura</label>
                          <input value={newItem.invoiceNumber || ''} onChange={e => setNewItem({...newItem, invoiceNumber: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto Total Bs</label>
                          <input type="number" value={newItem.totalAmount || ''} onChange={e => setNewItem({...newItem, totalAmount: parseFloat(e.target.value)})} className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="flex items-end">
                           <button onClick={handleAddItem} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all">
                             + Agregar a Lista
                           </button>
                        </div>
                      </div>
                   </div>

                   {wizItems.length > 0 && (
                     <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <h4 className="font-bold text-slate-400 uppercase text-[9px] md:text-xs mb-6 tracking-widest">Resumen de Comprobante ({selectedCompany.retentionPercentage}%)</h4>
                        <div className="space-y-3 md:space-y-4">
                          {wizItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                              <div>
                                 <p className="font-black text-slate-900 text-sm md:text-base">Factura #{item.invoiceNumber}</p>
                                 <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">IVA: {item.retentionAmount.toLocaleString('es-VE')} Bs</p>
                              </div>
                              <span className="font-black text-blue-600 text-base md:text-lg">{item.totalAmount.toLocaleString('es-VE')} Bs</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 pt-6 md:pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                           <div className="text-center md:text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total a Retener</p>
                              <p className="text-3xl font-black text-slate-900">
                                {wizItems.reduce((acc, i) => acc + i.retentionAmount, 0).toLocaleString('es-VE')} <span className="text-lg">Bs</span>
                              </p>
                           </div>
                           <button onClick={generateVoucher} className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all">
                             Emitir Comprobante
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        )}

        {route === AppRoute.HISTORY && (
          <div className="space-y-6 md:space-y-10 animate-fade-in max-w-6xl mx-auto">
            <header className="hidden md:block">
              <h2 className="text-3xl font-black tracking-tight">Historial</h2>
              <p className="text-slate-500 mt-2 font-medium">Gestiona y visualiza tus retenciones emitidas.</p>
            </header>
            
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Comprobante</th>
                      <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Fecha</th>
                      <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Sujeto Retenido</th>
                      <th className="p-8 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {generatedVouchers.map(v => (
                      <tr key={v.id} className="group hover:bg-slate-50/30 transition-all">
                        <td className="p-8">
                           <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black border border-blue-100">
                              {v.voucherNumber}
                           </span>
                        </td>
                        <td className="p-8 text-slate-500 font-medium">{v.date}</td>
                        <td className="p-8 font-bold text-slate-700">{v.supplier.name}</td>
                        <td className="p-8 text-center">
                           <button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all inline-flex items-center justify-center">
                              <span className="material-icons">visibility</span>
                           </button>
                        </td>
                      </tr>
                    ))}
                    {generatedVouchers.length === 0 && (
                      <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-bold uppercase tracking-widest">No hay registros</td></tr>
                    )}
                  </tbody>
               </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {generatedVouchers.map(v => (
                <div key={v.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                  <div className="truncate pr-2">
                    <p className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-tighter">Comprobante #{v.voucherNumber.substring(v.voucherNumber.length - 8)}</p>
                    <h4 className="font-bold text-slate-800 truncate">{v.supplier.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{v.date}</p>
                  </div>
                  <button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center active:bg-blue-600 active:text-white transition-all shadow-sm">
                    <span className="material-icons">visibility</span>
                  </button>
                </div>
              ))}
              {generatedVouchers.length === 0 && (
                <div className="p-20 text-center">
                  <span className="material-icons text-slate-200 text-6xl">receipt</span>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4">Sin registros disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {route === AppRoute.VIEW_RETENTION && currentVoucher && (
           <div className="flex flex-col items-center animate-fade-in-up">
             <div className="w-full max-w-4xl flex justify-start mb-6 md:mb-8 no-print">
               <button onClick={() => setRoute(AppRoute.HISTORY)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 transition-all px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50">
                 <span className="material-icons">arrow_back</span> Atrás
               </button>
             </div>
             <RetentionVoucher data={currentVoucher} />
           </div>
        )}

        {/* GESTION DE EQUIPO */}
        {route === AppRoute.USER_MANAGEMENT && userProfile?.role === 'admin' && (
          <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
             <header className="hidden md:block">
               <h2 className="text-3xl font-black tracking-tight">Mi Equipo</h2>
               <p className="text-slate-500 mt-2">Registra operadores para que emitan retenciones a nombre de tus empresas.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
               <div className="lg:col-span-1">
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 md:sticky md:top-8">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <span className="material-icons text-blue-600">{editingSubUser ? 'edit' : 'person_add'}</span>
                      {editingSubUser ? 'Editar' : 'Nuevo Miembro'}
                    </h3>
                    <form onSubmit={handleCreateSubUser} className="space-y-4 md:space-y-5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre</label>
                        <input required name="first_name" defaultValue={editingSubUser?.first_name} placeholder="Nombre completo" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                        <input required disabled={!!editingSubUser} name="email" type="email" defaultValue={editingSubUser?.email} placeholder="ejemplo@empresa.com" className={`w-full bg-slate-50 border-none p-4 rounded-2xl outline-none ${editingSubUser ? 'text-slate-400' : 'focus:ring-2 focus:ring-blue-500'}`} />
                      </div>
                      {!editingSubUser && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Clave</label>
                          <input required name="password" type="password" placeholder="Mínimo 6" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Rol</label>
                        <select name="role" defaultValue={editingSubUser?.role || 'operator'} className="w-full bg-slate-50 border-none p-4 rounded-2xl appearance-none font-bold outline-none">
                           <option value="operator">Operador (Solo emite)</option>
                           <option value="admin">Administrador (Total)</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-4">
                        <button type="submit" disabled={isCreatingSubUser} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2">
                          {isCreatingSubUser ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          ) : editingSubUser ? 'Actualizar' : 'Crear Acceso'}
                        </button>
                        {editingSubUser && (
                           <button type="button" onClick={() => setEditingSubUser(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3 hover:bg-slate-300 transition-all">
                              Cancelar
                           </button>
                        )}
                      </div>
                    </form>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                     <table className="hidden md:table w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b">
                           <tr>
                              <th className="p-6 uppercase tracking-widest text-[10px] font-bold text-slate-400">Nombre</th>
                              <th className="p-6 uppercase tracking-widest text-[10px] font-bold text-slate-400">Acceso</th>
                              <th className="p-6 uppercase tracking-widest text-[10px] font-bold text-slate-400 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {subUsers.map(u => (
                             <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="p-6">
                                  <p className="font-bold text-slate-700">{u.first_name}</p>
                                  <p className="text-xs text-slate-400">{u.email}</p>
                               </td>
                               <td className="p-6">
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {u.role}
                                  </span>
                               </td>
                               <td className="p-6 flex items-center justify-center gap-2">
                                  <button onClick={() => setEditingSubUser(u)} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center justify-center">
                                     <span className="material-icons text-lg">edit</span>
                                  </button>
                                  <button onClick={() => handleDeleteSubUser(u.id)} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-red-600 hover:text-white rounded-xl transition-all flex items-center justify-center">
                                     <span className="material-icons text-lg">delete</span>
                                  </button>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                     
                     {/* Mobile Team List */}
                     <div className="md:hidden divide-y">
                        {subUsers.map(u => (
                          <div key={u.id} className="p-5 flex items-center justify-between">
                            <div>
                               <p className="font-bold text-slate-800 text-sm">{u.first_name}</p>
                               <p className="text-[10px] text-slate-400 mb-2">{u.email}</p>
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                 {u.role}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => setEditingSubUser(u)} className="w-10 h-10 bg-slate-50 text-slate-400 active:bg-blue-600 active:text-white rounded-xl flex items-center justify-center transition-all">
                                  <span className="material-icons text-lg">edit</span>
                               </button>
                               <button onClick={() => handleDeleteSubUser(u.id)} className="w-10 h-10 bg-slate-50 text-slate-400 active:bg-red-600 active:text-white rounded-xl flex items-center justify-center transition-all">
                                  <span className="material-icons text-lg">delete</span>
                               </button>
                            </div>
                          </div>
                        ))}
                        {subUsers.length === 0 && (
                           <div className="p-10 text-center text-slate-400 italic text-xs">No hay miembros en el equipo</div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        <ChatBot userProfile={userProfile} companies={companies} recentVouchers={generatedVouchers} />
      </main>
    </div>
  );
};

export default App;
