
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import RetentionVoucher from './components/RetentionVoucher';
import { Company, InvoiceItem, AppRoute, RetentionVoucher as VoucherType, UserProfile, UserRole, Supplier } from './types';
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
}: any) => {
  const isAdmin = role === 'admin';
  
  const menuItems = [
    { route: AppRoute.DASHBOARD, icon: 'grid_view', label: 'Dashboard', show: isAdmin },
    { route: AppRoute.CREATE_RETENTION, icon: 'add_circle', label: 'Nueva Retención', show: true },
    { route: AppRoute.HISTORY, icon: 'history', label: 'Historial', show: true },
    { route: AppRoute.SUPPLIERS, icon: 'contacts', label: 'Proveedores', show: true },
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
    { route: AppRoute.SUPPLIERS, icon: 'contacts', label: 'Provs', show: true },
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

const MobileHeader = ({ title }: any) => {
  return (
    <div className="md:hidden sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 z-40 flex justify-between items-center print:hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-xs">R</span>
        </div>
        <h1 className="font-black text-slate-800 text-lg tracking-tight uppercase">{title}</h1>
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [generatedVouchers, setGeneratedVouchers] = useState<VoucherType[]>([]);
  const [currentVoucher, setCurrentVoucher] = useState<VoucherType | null>(null);
  const [subUsers, setSubUsers] = useState<UserProfile[]>([]);

  // Wizard States
  const [wizStep, setWizStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Partial<Supplier> | null>(null);
  const [wizItems, setWizItems] = useState<InvoiceItem[]>([]);
  const [wizRetentionPercentage, setWizRetentionPercentage] = useState<75 | 100>(75);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastScannedFile, setLastScannedFile] = useState<File | null>(null);

  // States for sub-users and profile
  const [isCreatingSubUser, setIsCreatingSubUser] = useState(false);
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
        if (data) setUserProfile(data);
    } catch (error) { console.error("Error profile", error); }
  };

  const loadData = async () => {
    if (!userProfile) return;
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    
    // Cargar Empresas
    const { data: cos } = await supabase.from('companies').select('*').eq('user_id', adminId);
    if (cos) setCompanies(cos.map(c => ({
        id: c.id, name: c.name, rif: c.rif, address: c.address, 
        logoUrl: c.logo_url, lastCorrelationNumber: c.last_correlation_number || 1
    })));

    // Cargar Proveedores
    const { data: sups } = await supabase.from('suppliers').select('*').eq('user_id', adminId);
    if (sups) setSuppliers(sups);

    // Cargar Retenciones
    const { data: rets } = await supabase.from('retentions').select('*, companies(*), suppliers(*)').eq('user_id', adminId).order('created_at', { ascending: false });
    if (rets) setGeneratedVouchers(rets.map(r => ({
        id: r.id, voucherNumber: r.voucher_number, date: r.date, fiscalPeriod: r.fiscal_period,
        invoiceUrl: r.invoice_url, retentionPercentage: r.retention_percentage,
        company: r.companies, supplier: r.suppliers, items: r.items
    })));

    // Cargar Sub-usuarios si es Admin
    if (userProfile.role === 'admin') {
      const { data: subs } = await supabase.from('profiles').select('*').eq('admin_id', userProfile.id);
      if (subs) setSubUsers(subs);
    }
  };

  useEffect(() => {
    if (userProfile) loadData();
  }, [userProfile]);

  const handleAddItem = () => {
    if (!newItem.invoiceNumber || !newItem.totalAmount) return alert("Faltan datos de la factura");
    
    const taxRate = newItem.taxRate || 16;
    const exempt = newItem.exemptAmount || 0;
    const base = (newItem.totalAmount - exempt) / (1 + taxRate/100);
    const tax = base * (taxRate/100);
    const retentionAmount = tax * (wizRetentionPercentage / 100);

    const item: InvoiceItem = {
      id: Date.now().toString(),
      date: newItem.date || new Date().toISOString().split('T')[0],
      invoiceNumber: newItem.invoiceNumber,
      controlNumber: newItem.controlNumber || '00',
      transactionType: newItem.transactionType as any,
      totalAmount: newItem.totalAmount,
      exemptAmount: exempt,
      taxBase: Number(base.toFixed(2)),
      taxRate: taxRate,
      taxAmount: Number(tax.toFixed(2)),
      retentionRate: wizRetentionPercentage,
      retentionAmount: Number(retentionAmount.toFixed(2))
    };

    setWizItems([...wizItems, item]);
    setNewItem({ transactionType: '01-reg', taxRate: 16, exemptAmount: 0 });
  };

  useEffect(() => {
    if (wizItems.length > 0) {
      const updated = wizItems.map(item => {
        const ret = item.taxAmount * (wizRetentionPercentage / 100);
        return { ...item, retentionRate: wizRetentionPercentage, retentionAmount: Number(ret.toFixed(2)) };
      });
      setWizItems(updated);
    }
  }, [wizRetentionPercentage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLastScannedFile(file);
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const jsonStr = await analyzeInvoiceImage(base64);
      try {
        const data = JSON.parse(jsonStr);
        if (data) {
          const existing = suppliers.find(s => s.rif.replace(/\W/g, '').toUpperCase() === data.supplierRif?.replace(/\W/g, '').toUpperCase());
          if (existing) setSelectedSupplier(existing);
          else setSelectedSupplier({ name: data.supplierName || '', rif: data.supplierRif || '', address: '' });
          
          setNewItem(prev => ({ 
            ...prev, 
            invoiceNumber: data.invoiceNumber, 
            controlNumber: data.controlNumber,
            totalAmount: data.totalAmount,
            date: data.date 
          }));
          if (data.invoiceNumber || data.controlNumber) setWizStep(3);
        }
      } catch (err) { console.error("Error parseando IA", err); }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const generateVoucher = async () => {
    if (!userProfile || !selectedCompany || !selectedSupplier || wizItems.length === 0) return;
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    
    let supplierId = selectedSupplier.id;
    if (!supplierId) {
       const { data: newSup, error: supErr } = await supabase.from('suppliers').insert([{
         user_id: adminId,
         name: selectedSupplier.name,
         rif: selectedSupplier.rif,
         address: selectedSupplier.address || ''
       }]).select().single();
       if (!supErr) supplierId = newSup.id;
    }

    const now = new Date();
    const periodStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNum = selectedCompany.lastCorrelationNumber || 1;
    const voucherNumber = `${periodStr}${String(nextNum).padStart(8, '0')}`;
    
    let uploadedImageUrl = '';
    if (lastScannedFile) {
        const fileName = `${voucherNumber}_${Date.now()}.jpg`;
        const { data: uploadData } = await supabase.storage.from('facturas').upload(fileName, lastScannedFile);
        if (uploadData) {
            const { data: publicUrlData } = supabase.storage.from('facturas').getPublicUrl(fileName);
            uploadedImageUrl = publicUrlData.publicUrl;
        }
    }

    const payload = {
      user_id: adminId,
      company_id: selectedCompany.id,
      supplier_id: supplierId,
      supplier_name: selectedSupplier.name,
      supplier_rif: selectedSupplier.rif,
      items: wizItems,
      voucher_number: voucherNumber,
      control_number: wizItems[0].controlNumber,
      invoice_url: uploadedImageUrl,
      retention_percentage: wizRetentionPercentage,
      date: now.toISOString().split('T')[0],
      fiscal_period: `${now.getFullYear()} ${String(now.getMonth()+1).padStart(2,'0')}`,
      total_purchase: wizItems.reduce((acc, i) => acc + i.totalAmount, 0),
      total_tax: wizItems.reduce((acc, i) => acc + i.taxAmount, 0),
      total_retained: wizItems.reduce((acc, i) => acc + i.retentionAmount, 0)
    };

    const { error } = await supabase.from('retentions').insert([payload]);
    if (!error) {
      await supabase.from('companies').update({ last_correlation_number: nextNum + 1 }).eq('id', selectedCompany.id);
      loadData();
      setRoute(AppRoute.HISTORY);
      resetStates();
    } else { alert(error.message); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      user_id: userProfile.id,
      name: fd.get('name') as string,
      rif: fd.get('rif') as string,
      address: fd.get('address') as string,
      last_correlation_number: parseInt(fd.get('last_correlation_number') as string || "1")
    };
    const { error } = await supabase.from('companies').insert([payload]);
    if (!error) { loadData(); alert("Empresa registrada"); (e.target as HTMLFormElement).reset(); }
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
            const { error: profileError } = await supabase.from('profiles').update({
                first_name: firstName,
                role: role
            }).eq('id', editingSubUser.id);
            if (profileError) throw profileError;
            alert(`Operador "${firstName}" actualizado.`);
        } else {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });
            if (authError) throw authError;

            const { error: profileError } = await supabase.from('profiles').insert([{
              id: authData.user?.id, 
              email: email, 
              first_name: firstName,
              role: role, 
              admin_id: userProfile.id
            }]);
            if (profileError) throw profileError;
            alert(`Acceso creado con éxito.`);
        }
        loadData(); 
        setEditingSubUser(null);
        (e.target as HTMLFormElement).reset(); 
    } catch (err: any) { alert("ERROR: " + err.message); } 
    finally { setIsCreatingSubUser(false); }
  };

  const handleDeleteSubUser = async (id: string) => {
    if (!window.confirm("¿Eliminar este acceso?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) loadData();
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
        const { error: profileError } = await supabase.from('profiles').update({
            first_name: firstName,
            phone: phone
        }).eq('id', userProfile.id);
        if (profileError) throw profileError;

        if (newPassword.trim()) {
            const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
            if (authError) throw authError;
        }
        alert("Perfil actualizado.");
        fetchProfile(userProfile.id);
    } catch (err: any) { alert("Error: " + err.message); } 
    finally { setIsSavingProfile(false); }
  };

  const resetStates = () => {
    setWizStep(1);
    setSelectedCompany(null);
    setSelectedSupplier(null);
    setWizItems([]);
    setWizRetentionPercentage(75);
    setLastScannedFile(null);
    setEditingSubUser(null);
  };

  const getPageTitle = (r: AppRoute) => {
    switch(r) {
      case AppRoute.DASHBOARD: return 'Dashboard';
      case AppRoute.CREATE_RETENTION: return 'Nueva Retención';
      case AppRoute.HISTORY: return 'Historial';
      case AppRoute.SUPPLIERS: return 'Proveedores';
      case AppRoute.PROFILE: return 'Mi Perfil';
      case AppRoute.USER_MANAGEMENT: return 'Mi Equipo';
      case AppRoute.CREATE_COMPANY: return 'Empresas';
      default: return 'RetenFácil';
    }
  }

  // --- Analítica del Dashboard ---
  const dashboardStats = useMemo(() => {
    const totalRetained = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + i.retentionAmount, 0) || 0), 0);
    const totalIVA = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + i.taxAmount, 0) || 0), 0);
    
    // Agrupar por mes (últimos 6 meses)
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }

    generatedVouchers.forEach(v => {
      const date = new Date(v.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += v.items?.reduce((sum, i) => sum + i.retentionAmount, 0) || 0;
      }
    });

    const chartLabels = Object.keys(monthlyData).map(k => {
      const [y, m] = k.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[parseInt(m) - 1];
    });
    const chartValues = Object.values(monthlyData);
    const maxVal = Math.max(...chartValues, 1);

    // Top proveedores
    const supplierRanking: Record<string, { name: string, total: number }> = {};
    generatedVouchers.forEach(v => {
      const sId = v.supplier?.id || 'unknown';
      if (!supplierRanking[sId]) supplierRanking[sId] = { name: v.supplier?.name || 'Desconocido', total: 0 };
      supplierRanking[sId].total += v.items?.reduce((sum, i) => sum + i.retentionAmount, 0) || 0;
    });
    const topSuppliers = Object.values(supplierRanking).sort((a, b) => b.total - a.total).slice(0, 4);

    return { totalRetained, totalIVA, chartLabels, chartValues, maxVal, topSuppliers };
  }, [generatedVouchers]);

  if (loading) return null;
  if (!user || route === AppRoute.LANDING) return <LandingPage />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <MobileHeader title={getPageTitle(route)} />
      <MobileBottomNav currentRoute={route} setRoute={setRoute} resetStates={resetStates} role={userProfile?.role} />
      <Sidebar 
        currentRoute={route} setRoute={setRoute} 
        handleLogout={() => supabase.auth.signOut()} 
        resetStates={resetStates}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        role={userProfile?.role || 'operator'}
      />
      
      <main className={`flex-1 transition-all duration-300 pb-24 md:pb-8 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} p-4 md:p-8`}>
        
        {/* DASHBOARD */}
        {route === AppRoute.DASHBOARD && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">Hola, {userProfile?.first_name}</h1>
                  <p className="text-slate-500 font-medium">Aquí tienes el resumen de tu actividad fiscal.</p>
                </div>
                <button onClick={() => setRoute(AppRoute.CREATE_RETENTION)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
                  <span className="material-icons">add_circle</span> Nueva Retención
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="material-icons text-6xl">account_balance_wallet</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Retenido (Bs)</p>
                   <p className="text-3xl font-black mt-1">{dashboardStats.totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="material-icons text-6xl">receipt_long</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IVA Gestionado (Bs)</p>
                   <p className="text-3xl font-black mt-1">{dashboardStats.totalIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="material-icons text-6xl">people</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedores</p>
                   <p className="text-3xl font-black mt-1">{suppliers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="material-icons text-6xl">description</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vouchers</p>
                   <p className="text-3xl font-black mt-1">{generatedVouchers.length}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de barras simple SVG */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="font-black text-lg mb-8">Tendencia de Retención (6 meses)</h3>
                   <div className="h-64 flex items-end justify-between gap-4 px-2">
                      {dashboardStats.chartValues.map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <div 
                            className="w-full bg-blue-100 group-hover:bg-blue-600 rounded-t-xl transition-all duration-500" 
                            style={{ height: `${(val / dashboardStats.maxVal) * 100}%` }}
                          >
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                               Bs {val.toLocaleString()}
                             </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">{dashboardStats.chartLabels[idx]}</p>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Top Proveedores */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="font-black text-lg mb-6">Top Proveedores</h3>
                   <div className="space-y-6">
                      {dashboardStats.topSuppliers.length > 0 ? dashboardStats.topSuppliers.map((s, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                              <span className="text-slate-500 truncate max-w-[150px]">{s.name}</span>
                              <span className="text-slate-900">Bs {s.total.toLocaleString()}</span>
                           </div>
                           <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${(s.total / Math.max(...dashboardStats.topSuppliers.map(p => p.total))) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                      )) : (
                        <p className="text-slate-400 text-sm py-10 text-center font-medium">Aún no hay datos de proveedores.</p>
                      )}
                   </div>
                </div>
             </div>

             {/* Actividad Reciente */}
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-lg">Actividad Reciente</h3>
                   <button onClick={() => setRoute(AppRoute.HISTORY)} className="text-blue-600 text-xs font-bold uppercase hover:underline">Ver Todo</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-slate-50">
                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">N° Voucher</th>
                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Retenido</th>
                            <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acción</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {generatedVouchers.slice(0, 5).map(v => (
                           <tr key={v.id} className="hover:bg-slate-50 transition-all group">
                              <td className="py-4 text-sm font-bold text-blue-600">{v.voucherNumber}</td>
                              <td className="py-4 text-sm font-medium text-slate-700">{v.supplier?.name}</td>
                              <td className="py-4 text-sm font-black text-right">Bs {v.items?.reduce((acc, i) => acc + i.retentionAmount, 0).toLocaleString()}</td>
                              <td className="py-4 text-right">
                                 <button 
                                   onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }}
                                   className="text-slate-300 group-hover:text-blue-600 transition-colors"
                                 >
                                    <span className="material-icons">visibility</span>
                                 </button>
                              </td>
                           </tr>
                         ))}
                         {generatedVouchers.length === 0 && (
                           <tr>
                              <td colSpan={4} className="py-10 text-center text-slate-400 text-sm italic">Sin registros aún.</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* WIZARD DE RETENCION */}
        {route === AppRoute.CREATE_RETENTION && (
           <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="hidden md:block text-3xl font-black">Nueva Retención</h2>
                  <p className="text-slate-500">Paso {wizStep} de 3</p>
                </div>
                <div className="flex gap-2">
                   {[1,2,3].map(s => (
                     <div key={s} className={`h-2 rounded-full transition-all duration-300 ${wizStep >= s ? 'w-10 bg-blue-600' : 'w-4 bg-slate-200'}`}></div>
                   ))}
                </div>
              </div>

              {wizStep === 1 && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                   <h3 className="font-bold text-xl mb-6">1. Selecciona la Empresa Emisora</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companies.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCompany(c); setWizStep(2); }} className="text-left p-6 border-2 border-slate-50 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group">
                          <div className="truncate">
                            <p className="font-bold group-hover:text-blue-700 truncate">{c.name}</p>
                            <p className="text-xs text-slate-400">RIF: {c.rif}</p>
                          </div>
                          <span className="material-icons text-slate-300 group-hover:text-blue-500">chevron_right</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {wizStep === 2 && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  {isAnalyzing && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-blue-600">Analizando con IA...</p>
                  </div>}
                  
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <h3 className="font-bold text-xl">2. Proveedor</h3>
                    <div className="relative group">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
                        <span className="material-icons">auto_awesome</span> Escanear Factura
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Buscar Existente</label>
                      <select 
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                        onChange={(e) => {
                          const s = suppliers.find(sup => sup.id === e.target.value);
                          if (s) setSelectedSupplier(s);
                        }}
                        value={selectedSupplier?.id || ''}
                      >
                        <option value="">-- Seleccionar de la lista --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rif})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RIF del Proveedor</label>
                          <input 
                            value={selectedSupplier?.rif || ''} 
                            onChange={e => setSelectedSupplier({...selectedSupplier, rif: e.target.value})} 
                            placeholder="J-12345678-0" 
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                          <input 
                            value={selectedSupplier?.name || ''} 
                            onChange={e => setSelectedSupplier({...selectedSupplier, name: e.target.value})} 
                            placeholder="Nombre del proveedor" 
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                       </div>
                    </div>
                    <div className="flex justify-between pt-8 border-t">
                       <button onClick={() => setWizStep(1)} className="text-slate-400 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl">Atrás</button>
                       <button 
                        onClick={() => {
                          if (selectedSupplier?.name && selectedSupplier?.rif) setWizStep(3);
                          else alert("Completa los datos del proveedor");
                        }} 
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600"
                      >Siguiente</button>
                    </div>
                  </div>
                </div>
              )}

              {wizStep === 3 && (selectedCompany) && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <span className="material-icons text-blue-600">receipt</span>
                          Datos de la Factura
                        </h3>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           <button 
                             onClick={() => setWizRetentionPercentage(75)} 
                             className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 75 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                           >75%</button>
                           <button 
                             onClick={() => setWizRetentionPercentage(100)} 
                             className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 100 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                           >100%</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input value={newItem.invoiceNumber || ''} onChange={e => setNewItem({...newItem, invoiceNumber: e.target.value})} placeholder="N° Factura" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input value={newItem.controlNumber || ''} onChange={e => setNewItem({...newItem, controlNumber: e.target.value})} placeholder="N° Control" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="number" value={newItem.totalAmount || ''} onChange={e => setNewItem({...newItem, totalAmount: parseFloat(e.target.value)})} placeholder="Monto Total Bs" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleAddItem} className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all">+ Añadir</button>
                      </div>
                   </div>

                   {wizItems.length > 0 && (
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="space-y-4">
                          {wizItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                 <p className="font-black text-slate-900">Factura #{item.invoiceNumber}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IVA retener ({wizRetentionPercentage}%): {item.retentionAmount.toLocaleString('es-VE')} Bs</p>
                              </div>
                              <span className="font-black text-blue-600">{item.totalAmount.toLocaleString('es-VE')} Bs</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Comprobante</p>
                              <p className="text-3xl font-black">{wizItems.reduce((acc, i) => acc + i.retentionAmount, 0).toLocaleString('es-VE')} <span className="text-lg">Bs</span></p>
                           </div>
                           <button onClick={generateVoucher} className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all">Emitir Comprobante</button>
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        )}

        {/* MI EQUIPO (Gestión de Equipo) */}
        {route === AppRoute.USER_MANAGEMENT && userProfile?.role === 'admin' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
             <header>
               <h2 className="text-3xl font-black">Mi Equipo</h2>
               <p className="text-slate-500">Gestiona los accesos para tus operadores.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-1">
                  <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <span className="material-icons text-blue-600">{editingSubUser ? 'edit' : 'person_add'}</span>
                      {editingSubUser ? 'Editar Miembro' : 'Nuevo Miembro'}
                    </h3>
                    <form onSubmit={handleCreateSubUser} className="space-y-4">
                      <input required name="first_name" defaultValue={editingSubUser?.first_name} placeholder="Nombre completo" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                      <input required disabled={!!editingSubUser} name="email" type="email" defaultValue={editingSubUser?.email} placeholder="Email" className={`w-full bg-slate-50 border-none p-4 rounded-2xl outline-none font-semibold ${editingSubUser ? 'text-slate-400' : 'focus:ring-2 focus:ring-blue-500'}`} />
                      {!editingSubUser && <input required name="password" type="password" placeholder="Contraseña" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />}
                      <select name="role" defaultValue={editingSubUser?.role || 'operator'} className="w-full bg-slate-50 border-none p-4 rounded-2xl appearance-none font-bold outline-none">
                         <option value="operator">Operador (Emisor)</option>
                         <option value="admin">Administrador (Total)</option>
                      </select>
                      <button type="submit" disabled={isCreatingSubUser} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                        {isCreatingSubUser ? 'Procesando...' : editingSubUser ? 'Actualizar' : 'Crear Acceso'}
                      </button>
                      {editingSubUser && <button type="button" onClick={() => setEditingSubUser(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3">Cancelar</button>}
                    </form>
                  </div>
               </div>
               <div className="lg:col-span-2">
                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b">
                           <tr>
                              <th className="p-6 uppercase tracking-widest text-[10px] font-bold text-slate-400">Miembro</th>
                              <th className="p-6 uppercase tracking-widest text-[10px] font-bold text-slate-400">Rol</th>
                              <th className="p-6 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {subUsers.map(u => (
                             <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="p-6">
                                  <p className="font-bold text-slate-700">{u.first_name}</p>
                                  <p className="text-xs text-slate-400">{u.email}</p>
                               </td>
                               <td className="p-6">
                                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {u.role}
                                  </span>
                               </td>
                               <td className="p-6 text-center flex items-center justify-center gap-2">
                                  <button onClick={() => setEditingSubUser(u)} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><span className="material-icons text-sm">edit</span></button>
                                  <button onClick={() => handleDeleteSubUser(u.id)} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"><span className="material-icons text-sm">delete</span></button>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* MI PERFIL */}
        {route === AppRoute.PROFILE && userProfile && (
           <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <h2 className="text-3xl font-black">Mi Perfil</h2>
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 relative"></div>
                <div className="p-8 md:p-12 pt-16">
                   <form onSubmit={handleUpdateOwnProfile} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre</label>
                            <input required name="first_name" defaultValue={userProfile.first_name} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email</label>
                            <input disabled value={userProfile.email} className="w-full bg-slate-100 border-none p-4 rounded-2xl text-slate-400 cursor-not-allowed font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Teléfono</label>
                            <input name="phone" defaultValue={userProfile.phone} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nueva Contraseña (Opcional)</label>
                            <input name="new_password" type="password" placeholder="Mínimo 6 caracteres" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                         </div>
                      </div>
                      <button type="submit" disabled={isSavingProfile} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
                        {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                   </form>
                </div>
              </div>
           </div>
        )}

        {/* HISTORIAL */}
        {route === AppRoute.HISTORY && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
             <h2 className="text-3xl font-black">Historial</h2>
             <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Comprobante</th>
                      <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Empresa</th>
                      <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Proveedor</th>
                      <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Monto Retenido</th>
                      <th className="p-6 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {generatedVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-all">
                        <td className="p-6 font-bold text-blue-600">{v.voucherNumber}</td>
                        <td className="p-6 font-medium text-slate-500">{v.company?.name}</td>
                        <td className="p-6 font-bold">{v.supplier?.name}</td>
                        <td className="p-6 font-black">{v.items?.reduce((acc: number, i: any) => acc + i.retentionAmount, 0).toLocaleString('es-VE')} Bs ({v.retentionPercentage}%)</td>
                        <td className="p-6 text-center">
                           <button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="w-10 h-10 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all inline-flex items-center justify-center">
                              <span className="material-icons">visibility</span>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* PROVEEDORES */}
        {route === AppRoute.SUPPLIERS && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">Mis Proveedores</h2>
                <button 
                  onClick={() => {
                    const name = prompt("Nombre:");
                    const rif = prompt("RIF:");
                    if(name && rif) {
                       supabase.from('suppliers').insert([{ user_id: userProfile?.id || userProfile?.admin_id, name, rif }]).then(() => loadData());
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                   <span className="material-icons">add</span> Nuevo Proveedor
                </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group">
                     <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all mb-4">
                        <span className="material-icons">person</span>
                     </div>
                     <h3 className="font-bold text-lg leading-tight">{s.name}</h3>
                     <p className="text-blue-600 font-bold text-xs uppercase mt-1">RIF: {s.rif}</p>
                     <p className="text-slate-400 text-xs mt-2 line-clamp-2">{s.address || 'Sin dirección registrada'}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* VISTA DE COMPROBANTE (DETALLE) */}
        {route === AppRoute.VIEW_RETENTION && currentVoucher && (
           <div className="flex flex-col items-center animate-fade-in-up">
             <div className="w-full max-w-4xl flex justify-start mb-8 no-print">
               <button onClick={() => setRoute(AppRoute.HISTORY)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 transition-all px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50">
                 <span className="material-icons">arrow_back</span> Regresar al Historial
               </button>
             </div>
             <RetentionVoucher data={currentVoucher} />
           </div>
        )}

        {/* EMPRESAS */}
        {route === AppRoute.CREATE_COMPANY && userProfile?.role === 'admin' && (
           <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
              <header>
                <h2 className="text-3xl font-black">Gestión de Empresas</h2>
                <p className="text-slate-500">Entidades emisoras bajo tu control.</p>
              </header>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required name="name" placeholder="Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input required name="rif" placeholder="RIF" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea required name="address" placeholder="Dirección Fiscal" className="w-full md:col-span-2 bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input required type="number" name="last_correlation_number" placeholder="Correlativo Inicial" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="submit" className="bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all">Registrar Empresa</button>
                </form>
              </div>
           </div>
        )}

        <ChatBot userProfile={userProfile} companies={companies} recentVouchers={generatedVouchers} />
      </main>
    </div>
  );
};

export default App;
