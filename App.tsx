import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import RetentionVoucher from './components/RetentionVoucher';
import { Company, InvoiceItem, AppRoute, RetentionVoucher as VoucherType, UserProfile } from './types';
import { analyzeInvoiceText, analyzeInvoiceImage } from './lib/gemini';

// --- Sub-components ---

const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up border border-red-100">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="bg-red-100 p-2 rounded-full">
            <span className="material-icons">warning</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-sm flex items-center gap-2"
          >
            <span>Sí, eliminar</span>
            <span className="material-icons text-sm">delete_forever</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  currentRoute, 
  setRoute, 
  handleLogout,
  resetStates,
  isCollapsed,
  toggleSidebar
}: { 
  currentRoute: AppRoute, 
  setRoute: (r: AppRoute) => void, 
  handleLogout: () => void,
  resetStates: () => void,
  isCollapsed: boolean,
  toggleSidebar: () => void
}) => (
  <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto print:hidden z-20 transition-all duration-300 ease-in-out shadow-xl`}>
    <div className={`p-6 border-b border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
      {!isCollapsed && (
        <div>
          <h2 className="text-xl font-bold tracking-tight">RetenFácil</h2>
          <p className="text-[10px] text-gray-400 mt-1">Gestión SENIAT</p>
        </div>
      )}
      <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition">
        <span className="material-icons">{isCollapsed ? 'menu' : 'chevron_left'}</span>
      </button>
    </div>
    <nav className="flex-1 p-4 space-y-2">
      {[
        { route: AppRoute.DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
        { route: AppRoute.CREATE_RETENTION, icon: 'post_add', label: 'Nueva Retención' },
        { route: AppRoute.HISTORY, icon: 'history', label: 'Historial' },
        { route: AppRoute.CREATE_COMPANY, icon: 'business', label: 'Empresas' }
      ].map((item) => (
        <button 
          key={item.route}
          onClick={() => { resetStates(); setRoute(item.route); }}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition overflow-hidden whitespace-nowrap ${currentRoute === item.route ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'} ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? item.label : ''}
        >
          <span className="material-icons text-xl min-w-[24px]">{item.icon}</span>
          {!isCollapsed && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
    <div className="p-4 border-t border-gray-800">
      <button onClick={handleLogout} className={`flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full ${isCollapsed ? 'justify-center' : ''}`}>
        <span className="material-icons">logout</span>
        {!isCollapsed && <span>Cerrar Sesión</span>}
      </button>
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // App State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generatedVouchers, setGeneratedVouchers] = useState<VoucherType[]>([]);
  const [currentVoucher, setCurrentVoucher] = useState<VoucherType | null>(null);

  // Edit States
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingRetentionId, setEditingRetentionId] = useState<string | null>(null);

  // History Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Wizard
  const [wizStep, setWizStep] = useState(1);
  const [wizCompanyId, setWizCompanyId] = useState('');
  const [wizSupplier, setWizSupplier] = useState({ name: '', rif: '' });
  const [wizItems, setWizItems] = useState<InvoiceItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Quick Invoice Item State
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    transactionType: '01-reg',
    taxRate: 16,
    retentionRate: 75
  });

  // --- Helpers ---
  const resetStates = () => {
    setEditingCompanyId(null);
    setEditingRetentionId(null);
    setWizStep(1);
    setWizCompanyId('');
    setWizSupplier({ name: '', rif: '' });
    setWizItems([]);
    setNewItem({ transactionType: '01-reg', taxRate: 16, retentionRate: 75 });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // --- Data Fetching ---

  const fetchProfile = async (userId: string) => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) setUserProfile(data);
    } catch (error) { console.error("Error fetching profile", error); }
  };

  const fetchCompanies = async () => {
    try {
        const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
        if (data) {
            const mapped = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                rif: c.rif,
                address: c.address,
                retentionPercentage: c.retention_percentage,
                logoUrl: c.logo_url,
                lastCorrelationNumber: c.last_correlation_number || 0
            }));
            setCompanies(mapped);
        }
    } catch (error) { console.error("Error fetching companies", error); }
  };

  const fetchVouchers = async () => {
      try {
          const { data } = await supabase
            .from('retentions')
            .select('*, companies(*)')
            .order('created_at', { ascending: false });
          
          if(data) {
              const mapped: VoucherType[] = data.map((r: any) => ({
                  id: r.id,
                  voucherNumber: r.voucher_number,
                  date: r.date,
                  fiscalPeriod: r.fiscal_period || '',
                  company: {
                      id: r.companies?.id,
                      name: r.companies?.name || 'Empresa Eliminada',
                      rif: r.companies?.rif || 'N/A',
                      address: r.companies?.address || '',
                      retentionPercentage: r.companies?.retention_percentage || 75,
                      logoUrl: r.companies?.logo_url,
                      lastCorrelationNumber: r.companies?.last_correlation_number
                  },
                  supplier: {
                      name: r.supplier_name,
                      rif: r.supplier_rif
                  },
                  items: r.items || [] 
              }));
              setGeneratedVouchers(mapped);
          }
      } catch (error) { console.error("Error fetching vouchers", error); }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id);
          setRoute(r => r === AppRoute.LANDING ? AppRoute.DASHBOARD : r);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          if (event === 'SIGNED_IN') {
             setRoute(AppRoute.DASHBOARD);
          }
          fetchProfile(session.user.id);
      } else {
        setRoute(AppRoute.LANDING);
        setUserProfile(null);
        setCompanies([]);
        setGeneratedVouchers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      if(user) {
          fetchCompanies();
          fetchVouchers();
      }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetStates();
    setRoute(AppRoute.LANDING);
    setUserProfile(null);
  };

  // --- Company CRUD ---

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    setIsUploading(true);

    try {
        const formData = new FormData(e.target as HTMLFormElement);
        let logoUrl = null;

        const logoFile = formData.get('logo') as File;
        if (logoFile && logoFile.size > 0) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
            logoUrl = data.publicUrl;
        } else if (editingCompanyId) {
            // Keep existing logo if not replaced
            const existing = companies.find(c => c.id === editingCompanyId);
            logoUrl = existing?.logoUrl;
        }
        
        const payload = {
            user_id: user.id,
            name: formData.get('name'),
            rif: formData.get('rif'),
            address: formData.get('address'),
            retention_percentage: Number(formData.get('retentionPercentage')),
            last_correlation_number: Number(formData.get('lastCorrelationNumber')),
            logo_url: logoUrl
        };

        if (editingCompanyId) {
             const { error } = await supabase
                .from('companies')
                .update(payload)
                .eq('id', editingCompanyId);
             if (error) throw error;
        } else {
             const { error } = await supabase
                .from('companies')
                .insert(payload);
             if (error) throw error;
        }

        await fetchCompanies();
        resetStates();
        setRoute(AppRoute.DASHBOARD);

    } catch (error: any) {
        alert("Error al guardar empresa: " + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setRoute(AppRoute.CREATE_COMPANY);
  };

  const handleDeleteCompany = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Empresa',
      message: '¿Estás absolutamente seguro de que deseas eliminar esta empresa? Esta acción es irreversible y podría causar la pérdida de acceso al historial de comprobantes generados bajo este RIF. Por favor, confirma si realmente deseas proceder.',
      onConfirm: async () => {
        try {
            const { error } = await supabase.from('companies').delete().eq('id', id);
            if (error) throw error;
            await fetchCompanies();
            closeConfirmDialog();
        } catch (error: any) {
            alert("Error al eliminar: " + error.message);
            closeConfirmDialog();
        }
      }
    });
  };

  // --- Retention CRUD ---

  const handleSelectCompany = (companyId: string) => {
    setWizCompanyId(companyId);
    const company = companies.find(c => c.id === companyId);
    if (company) {
        setNewItem(prev => ({ ...prev, retentionRate: company.retentionPercentage }));
    }
    setWizStep(2);
  };

  const addItemToWizard = () => {
    if(!newItem.invoiceNumber || !newItem.totalAmount) return;

    const total = Number(newItem.totalAmount);
    const rate = Number(newItem.taxRate || 16);
    const base = newItem.taxBase ? Number(newItem.taxBase) : total / (1 + (rate/100));
    const tax = total - base;
    const retRate = Number(newItem.retentionRate || 75);
    const retAmount = tax * (retRate/100);

    const item: InvoiceItem = {
        id: Date.now().toString(),
        date: newItem.date || new Date().toISOString().split('T')[0],
        invoiceNumber: newItem.invoiceNumber as string,
        controlNumber: newItem.controlNumber || newItem.invoiceNumber as string, 
        transactionType: newItem.transactionType as any,
        totalAmount: total,
        exemptAmount: 0,
        taxBase: base,
        taxRate: rate,
        taxAmount: tax,
        retentionRate: retRate,
        retentionAmount: retAmount,
        noteNumber: newItem.noteNumber,
        affectedInvoice: newItem.affectedInvoice
    };

    setWizItems([...wizItems, item]);
    setNewItem({ ...newItem, invoiceNumber: '', controlNumber: '', totalAmount: 0, taxBase: 0 }); 
  };

  const removeItemFromWizard = (index: number) => {
      const newItems = [...wizItems];
      newItems.splice(index, 1);
      setWizItems(newItems);
  };

  const generateVoucher = async () => {
    // 1. Get the CURRENT company state from DB
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', wizCompanyId)
        .single();

    if (companyError || !companyData || !user) {
        alert("Error: No se pudo verificar la secuencia de la empresa.");
        return;
    }

    const company = {
        ...companyData,
        lastCorrelationNumber: companyData.last_correlation_number || 0
    };

    let voucherNumber = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fiscalPeriod = `${year} ${now.toLocaleString('es-VE', { month: 'long' })}`;
    let dateStr = now.toISOString().split('T')[0];
    let nextSeq = 0;

    // Logic for new vs edit
    if (editingRetentionId) {
        const existing = generatedVouchers.find(v => v.id === editingRetentionId);
        if (existing) {
            voucherNumber = existing.voucherNumber;
            dateStr = existing.date;
        } else {
             alert("Error crítico: Comprobante no encontrado.");
             return;
        }
    } else {
        nextSeq = (company.lastCorrelationNumber || 0) + 1;
        const seqPadded = String(nextSeq).padStart(8, '0');
        voucherNumber = `${year}${month}${seqPadded}`;
    }

    // CALCULATE TOTALS (Required by DB Schema)
    const totalPurchase = wizItems.reduce((acc, item) => acc + item.totalAmount, 0);
    const totalTax = wizItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const totalRetained = wizItems.reduce((acc, item) => acc + item.retentionAmount, 0);

    const payload = {
        user_id: user.id,
        company_id: company.id,
        voucher_number: voucherNumber,
        date: dateStr,
        fiscal_year: String(year),
        fiscal_month: String(month),
        fiscal_period: fiscalPeriod,
        supplier_name: wizSupplier.name,
        supplier_rif: wizSupplier.rif,
        total_purchase: totalPurchase,
        total_tax: totalTax,
        total_retained: totalRetained,
        items: wizItems // Stored as JSONB in retentions
    };

    let resultError = null;
    let savedVoucher = null;

    if (editingRetentionId) {
        const { error, data } = await supabase.from('retentions').update(payload).eq('id', editingRetentionId).select().single();
        resultError = error;
        savedVoucher = data; 
    } else {
        const { error, data } = await supabase.from('retentions').insert(payload).select().single();
        resultError = error;
        savedVoucher = data;

        // CRITICAL: Update company sequence ONLY if insertion was successful
        if (!error) {
            await supabase.from('companies')
                .update({ last_correlation_number: nextSeq })
                .eq('id', company.id);
        }
    }

    if (resultError) {
        alert("Error al guardar la retención: " + resultError.message);
        return;
    }

    await fetchVouchers();
    await fetchCompanies(); // Refresh company data to update UI with new sequence
    
    // Construct view object
    const voucherView: VoucherType = {
        id: editingRetentionId || 'temp-view',
        voucherNumber,
        date: new Date(dateStr).toLocaleDateString('es-VE'), 
        fiscalPeriod,
        company: {
            ...company,
            retentionPercentage: company.retention_percentage,
            logoUrl: company.logo_url
        },
        supplier: wizSupplier,
        items: wizItems
    };

    setCurrentVoucher(voucherView);
    setRoute(AppRoute.VIEW_RETENTION);
    resetStates();
  };

  const handleEditRetention = (voucher: VoucherType) => {
      setEditingRetentionId(voucher.id);
      setWizCompanyId(voucher.company.id);
      setWizSupplier(voucher.supplier);
      setWizItems(voucher.items);
      // Determine step based on data completeness
      setWizStep(3); // Go straight to items review
      setRoute(AppRoute.CREATE_RETENTION);
  };

  const handleDeleteRetention = (id: string) => {
    setConfirmDialog({
        isOpen: true,
        title: 'Eliminar Comprobante',
        message: '¿Estás completamente seguro de que deseas eliminar este comprobante de retención? Esta acción no se puede deshacer y perderás el registro.',
        onConfirm: async () => {
            try {
                const { error } = await supabase.from('retentions').delete().eq('id', id);
                if (error) throw error;
                await fetchVouchers();
                closeConfirmDialog();
            } catch (e: any) {
                alert("Error eliminando: " + e.message);
                closeConfirmDialog();
            }
        }
    });
  };

  // --- AI Helpers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        if (!reader.result || typeof reader.result !== 'string') { setIsAnalyzing(false); return; }
        
        const base64String = reader.result.split(',')[1];
        try {
            const jsonStr = await analyzeInvoiceImage(base64String);
            const data = JSON.parse(jsonStr);
            
            if (data.supplierName || data.supplierRif) {
                setWizSupplier({
                    name: data.supplierName || wizSupplier.name,
                    rif: data.supplierRif || wizSupplier.rif
                });
            }

            setNewItem(prev => ({
                ...prev,
                invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
                controlNumber: data.controlNumber || prev.controlNumber,
                totalAmount: data.totalAmount || prev.totalAmount,
                taxBase: data.taxBase || prev.taxBase,
                date: data.date || prev.date
            }));
            
            if (wizStep < 3 && data.invoiceNumber) {
                setWizStep(3);
            }

        } catch (error) {
            console.error("Parse error", error);
            alert("No se pudo analizar la imagen correctamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleViewVoucher = (voucher: VoucherType) => {
    setCurrentVoucher(voucher);
    setRoute(AppRoute.VIEW_RETENTION);
  };

  // --- Stats ---
  const totalRetainedGlobal = generatedVouchers.reduce((acc, v) => {
      return acc + (v.items || []).reduce((iAcc, item) => iAcc + item.retentionAmount, 0);
  }, 0);

  const monthlyStats = generatedVouchers.reduce((acc, v) => {
      const period = v.fiscalPeriod || "Desconocido";
      if (!acc[period]) {
          acc[period] = {
              count: 0,
              totalRetained: 0,
              totalBase: 0,
              uniqueSuppliers: new Set<string>()
          };
      }
      acc[period].count += 1;
      acc[period].totalRetained += (v.items || []).reduce((sum, item) => sum + item.retentionAmount, 0);
      acc[period].totalBase += (v.items || []).reduce((sum, item) => sum + item.taxBase, 0);
      acc[period].uniqueSuppliers.add(v.supplier.rif);
      return acc;
  }, {} as Record<string, { count: number, totalRetained: number, totalBase: number, uniqueSuppliers: Set<string> }>);
  
  const filteredVouchers = generatedVouchers.filter(v => 
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.supplier.rif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyToEdit = () => editingCompanyId ? companies.find(c => c.id === editingCompanyId) : null;
  const companyEditData = getCompanyToEdit();

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  if (!user || route === AppRoute.LANDING) return <LandingPage />;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar 
        currentRoute={route} 
        setRoute={setRoute} 
        handleLogout={handleLogout} 
        resetStates={resetStates}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-8 print:ml-0 print:p-0 transition-all duration-300 ease-in-out`}>
        <ConfirmationModal 
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirmDialog}
        />

        {/* DASHBOARD VIEW */}
        {route === AppRoute.DASHBOARD && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                           {userProfile?.first_name ? `Hola, ${userProfile.first_name}` : `Bienvenido`}
                        </h1>
                        <p className="text-gray-500">Resumen de tus operaciones tributarias</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium">
                        {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <span className="material-icons">attach_money</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Retenido (Histórico)</p>
                            <h3 className="text-2xl font-bold text-gray-900">Bs. {totalRetainedGlobal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <span className="material-icons">receipt_long</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Comprobantes</p>
                            <h3 className="text-2xl font-bold text-gray-900">{generatedVouchers.length} Generados</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <span className="material-icons">domain</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Empresas Activas</p>
                            <h3 className="text-2xl font-bold text-gray-900">{companies.length}</h3>
                        </div>
                    </div>
                </div>

                {/* Dashboard Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Monthly Summary & Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Monthly Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-900">Resumen Mensual</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Periodo</th>
                                            <th className="px-6 py-3 font-medium text-center">Registros</th>
                                            <th className="px-6 py-3 font-medium text-center">Sujetos</th>
                                            <th className="px-6 py-3 font-medium text-right">IVA Retenido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {Object.entries(monthlyStats).length > 0 ? Object.entries(monthlyStats).map(([period, stats]) => (
                                            <tr key={period} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900 capitalize">{period}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded-full text-xs font-bold">
                                                        {stats.count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-600">
                                                    {stats.uniqueSuppliers.size}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                    {stats.totalRetained.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                    No hay datos registrados aún.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                         {/* Recent Retentions List */}
                         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">Retenciones Recientes</h3>
                                <button onClick={() => { resetStates(); setRoute(AppRoute.CREATE_RETENTION); }} className="text-blue-600 text-sm font-medium hover:underline">
                                    + Nueva
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Comprobante</th>
                                            <th className="px-6 py-3 font-medium">Fecha</th>
                                            <th className="px-6 py-3 font-medium">Proveedor</th>
                                            <th className="px-6 py-3 font-medium text-right">Monto</th>
                                            <th className="px-6 py-3 font-medium text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {generatedVouchers.length > 0 ? generatedVouchers.slice(0, 5).map((voucher) => {
                                            const total = (voucher.items || []).reduce((acc, i) => acc + i.retentionAmount, 0);
                                            return (
                                                <tr key={voucher.id} className="hover:bg-blue-50 transition">
                                                    <td className="px-6 py-4 font-medium text-blue-600">
                                                        {voucher.voucherNumber}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{voucher.date}</td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        <div className="truncate max-w-[150px]" title={voucher.supplier.name}>
                                                            {voucher.supplier.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">{voucher.supplier.rif}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-gray-700">
                                                        {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-center gap-2">
                                                            <button title="Ver" onClick={() => handleViewVoucher(voucher)} className="text-gray-500 hover:text-blue-600"><span className="material-icons text-sm">visibility</span></button>
                                                            <button title="Editar" onClick={() => handleEditRetention(voucher)} className="text-gray-500 hover:text-orange-500"><span className="material-icons text-sm">edit</span></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                    Sin retenciones recientes.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {generatedVouchers.length > 5 && (
                                <div className="p-4 text-center border-t border-gray-100">
                                    <button onClick={() => setRoute(AppRoute.HISTORY)} className="text-sm text-blue-600 font-medium hover:underline">Ver todas las retenciones</button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Quick Actions & Companies */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Acceso Rápido</h3>
                                <p className="text-gray-300 mb-6 text-sm">Gestiona tus impuestos de forma eficiente.</p>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => { resetStates(); setRoute(AppRoute.CREATE_RETENTION); }}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">add_circle</span> Nueva Retención
                                    </button>
                                    <button 
                                        onClick={() => { resetStates(); setRoute(AppRoute.CREATE_COMPANY); }}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">domain</span> Agregar Empresa
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Companies List Mini */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800">Mis Empresas</h3>
                                <button onClick={() => { resetStates(); setRoute(AppRoute.CREATE_COMPANY); }} className="text-blue-600 text-sm font-medium hover:underline">+ Agregar</button>
                            </div>
                            {companies.length > 0 ? (
                                <div className="space-y-3">
                                    {companies.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover border border-gray-200 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-200 rounded text-xs flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
                                                        {c.retentionPercentage}%
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-gray-900 truncate">{c.name}</div>
                                                    <div className="text-xs text-gray-500">{c.rif}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditCompany(c)} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-600">
                                                    <span className="material-icons text-sm">edit</span>
                                                </button>
                                                <button onClick={() => handleDeleteCompany(c.id)} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600">
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No tienes empresas registradas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* HISTORY VIEW (FULL TABLE) */}
        {route === AppRoute.HISTORY && (
             <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                   <div>
                       <h2 className="text-2xl font-bold text-gray-900">Historial de Retenciones</h2>
                       <p className="text-gray-500 text-sm">Listado completo de comprobantes generados.</p>
                   </div>
                   <div className="relative w-full md:w-80">
                       <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
                       <input
                         type="text"
                         placeholder="Buscar por RIF, proveedor o nro..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                   </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Comprobante</th>
                                    <th className="px-6 py-4 font-bold">Fecha</th>
                                    <th className="px-6 py-4 font-bold">Empresa (Agente)</th>
                                    <th className="px-6 py-4 font-bold">Proveedor (Retenido)</th>
                                    <th className="px-6 py-4 font-bold text-right">Monto Retenido</th>
                                    <th className="px-6 py-4 font-bold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVouchers.length > 0 ? filteredVouchers.map((voucher) => {
                                    const total = (voucher.items || []).reduce((acc, i) => acc + i.retentionAmount, 0);
                                    return (
                                        <tr key={voucher.id} className="hover:bg-blue-50 transition group">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {voucher.voucherNumber}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {voucher.date}
                                                <div className="text-xs text-gray-400 capitalize">{voucher.fiscalPeriod}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-xs">
                                                {voucher.company.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{voucher.supplier.name}</div>
                                                <div className="text-xs text-gray-500">{voucher.supplier.rif}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-800">
                                                {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleViewVoucher(voucher)}
                                                        className="bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                                                    >
                                                        <span className="material-icons text-sm">visibility</span>
                                                        Ver
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditRetention(voucher)}
                                                        className="bg-white border border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 px-2 py-1.5 rounded-lg transition"
                                                        title="Editar"
                                                    >
                                                        <span className="material-icons text-sm">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteRetention(voucher.id)}
                                                        className="bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-2 py-1.5 rounded-lg transition"
                                                        title="Eliminar"
                                                    >
                                                        <span className="material-icons text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'No hay retenciones generadas aún.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )}

        {/* CREATE/EDIT COMPANY VIEW */}
        {route === AppRoute.CREATE_COMPANY && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{editingCompanyId ? 'Editar Empresa' : 'Registrar Empresa (Agente)'}</h2>
                    <button onClick={() => setRoute(AppRoute.DASHBOARD)} className="text-gray-400 hover:text-gray-600"><span className="material-icons">close</span></button>
                </div>
                <form onSubmit={handleSaveCompany} className="space-y-5">
                    
                    {/* 1. RIF */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                        <input required name="rif" defaultValue={companyEditData?.rif} type="text" className="w-full border rounded-lg p-2" placeholder="J-12345678-9" />
                    </div>

                    {/* 2. Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
                        <input required name="name" defaultValue={companyEditData?.name} type="text" className="w-full border rounded-lg p-2" placeholder="Ej. INVERSIONES ABC C.A." />
                    </div>

                    {/* 3. Percentage */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Retención</label>
                         <div className="flex gap-4">
                             <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 w-full">
                                 <input type="radio" name="retentionPercentage" value="75" required defaultChecked={!companyEditData || companyEditData.retentionPercentage === 75} className="w-4 h-4 text-blue-600"/>
                                 <div>
                                     <span className="font-bold block">75%</span>
                                     <span className="text-xs text-gray-500">Estándar</span>
                                 </div>
                             </label>
                             <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 w-full">
                                 <input type="radio" name="retentionPercentage" value="100" required defaultChecked={companyEditData?.retentionPercentage === 100} className="w-4 h-4 text-blue-600"/>
                                 <div>
                                     <span className="font-bold block">100%</span>
                                     <span className="text-xs text-gray-500">Total</span>
                                 </div>
                             </label>
                         </div>
                    </div>

                    {/* NEW. Correlation Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correlativo Inicial (Último número usado)</label>
                        <input 
                            name="lastCorrelationNumber" 
                            defaultValue={companyEditData?.lastCorrelationNumber || 0} 
                            type="number" 
                            min="0"
                            className="w-full border rounded-lg p-2" 
                            placeholder="Ej. 145" 
                        />
                        <p className="text-xs text-gray-500 mt-1">El sistema generará el siguiente comprobante sumando 1 a este valor.</p>
                    </div>

                    {/* 4. Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                        <textarea required name="address" defaultValue={companyEditData?.address} rows={3} className="w-full border rounded-lg p-2" placeholder="Av. Principal..."></textarea>
                    </div>
                    
                    {/* 5. Logo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa {editingCompanyId && '(Dejar vacío para mantener actual)'}</label>
                        {companyEditData?.logoUrl && (
                             <img src={companyEditData.logoUrl} alt="Current" className="h-10 mb-2 border rounded p-1"/>
                        )}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                            <input name="logo" type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            <p className="text-xs text-gray-400 mt-2">Se mostrará en los comprobantes PDF.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <button type="button" onClick={() => { resetStates(); setRoute(AppRoute.DASHBOARD); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                            {isUploading ? 'Guardando...' : (editingCompanyId ? 'Actualizar Empresa' : 'Guardar Empresa')}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* WIZARD VIEW */}
        {route === AppRoute.CREATE_RETENTION && (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{editingRetentionId ? 'Editar Retención' : 'Nueva Retención de IVA'}</h2>
                        {editingRetentionId && <p className="text-sm text-orange-600 font-bold">Modo Edición</p>}
                    </div>
                    <div className="flex gap-2 text-sm font-bold text-gray-400">
                        <span className={wizStep >= 1 ? 'text-blue-600' : ''}>1. Agente</span> &rarr;
                        <span className={wizStep >= 2 ? 'text-blue-600' : ''}>2. Sujeto</span> &rarr;
                        <span className={wizStep >= 3 ? 'text-blue-600' : ''}>3. Facturas</span> &rarr;
                        <span className={wizStep >= 4 ? 'text-blue-600' : ''}>4. Generar</span>
                    </div>
                </div>

                {/* Step 1: Select Company */}
                {wizStep === 1 && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold mb-4">Selecciona el Agente de Retención</h3>
                        {companies.length > 0 ? (
                            <div className="space-y-3">
                                {companies.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => handleSelectCompany(c.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition flex justify-between items-center group ${wizCompanyId === c.id ? 'border-blue-600 bg-blue-50' : 'hover:border-blue-500 hover:bg-blue-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {c.logoUrl ? (
                                                <img src={c.logoUrl} alt="logo" className="w-12 h-12 rounded object-contain border bg-gray-50"/>
                                            ) : (
                                                <div className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs group-hover:bg-blue-200 group-hover:text-blue-700 transition">
                                                    {c.retentionPercentage}%
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold">{c.name}</div>
                                                <div className="text-sm text-gray-500">{c.rif}</div>
                                                <div className="text-xs text-gray-400">Próx. Correlativo: {String((c.lastCorrelationNumber || 0) + 1).padStart(8,'0')}</div>
                                            </div>
                                        </div>
                                        <span className="material-icons text-gray-400">chevron_right</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="mb-4">No tienes empresas registradas.</p>
                                <button onClick={() => setRoute(AppRoute.CREATE_COMPANY)} className="text-blue-600 underline">Crear una ahora</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Supplier Info & AI Upload - REORDERED: RIF, Name */}
                {wizStep === 2 && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative">
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center rounded-xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="font-bold text-gray-700 animate-pulse">Analizando Factura con IA...</p>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                             <div>
                                <h3 className="text-lg font-bold">Datos del Sujeto Retenido</h3>
                                <p className="text-sm text-gray-500">Puedes llenar esto manualmente o subir una foto.</p>
                             </div>
                             <div className="relative group">
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                 />
                                 <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition flex items-center gap-2 relative">
                                     <span className="material-icons">auto_awesome</span>
                                     Subir Factura y Analizar
                                 </button>
                                 <div className="absolute bottom-full right-0 mb-3 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                    <div className="font-bold mb-1 flex items-center gap-1">
                                        <span className="material-icons text-[14px] text-yellow-400">lightbulb</span>
                                        Lectura Inteligente
                                    </div>
                                    <p>Sube una foto o captura de la factura. Nuestra IA extraerá automáticamente el RIF, nombre y montos.</p>
                                    <div className="absolute top-full right-8 border-8 border-transparent border-t-gray-900"></div>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-4">
                            {/* RIF First */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                                <input 
                                    value={wizSupplier.rif}
                                    onChange={e => setWizSupplier({...wizSupplier, rif: e.target.value})}
                                    type="text" className="w-full border rounded-lg p-2" 
                                    placeholder="J-00000000-0"
                                />
                            </div>
                            
                            {/* Name Second */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                                <input 
                                    value={wizSupplier.name}
                                    onChange={e => setWizSupplier({...wizSupplier, name: e.target.value})}
                                    type="text" className="w-full border rounded-lg p-2" 
                                    placeholder="Nombre del proveedor"
                                />
                            </div>

                            <div className="pt-4 flex justify-between">
                                <button onClick={() => setWizStep(1)} className="text-gray-500">Atrás</button>
                                <button 
                                    disabled={!wizSupplier.name || !wizSupplier.rif}
                                    onClick={() => setWizStep(3)} 
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Add Invoices */}
                {wizStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             {/* Mini AI Upload in Step 3 too */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Detalle de Factura</h3>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200">
                                        <span className="material-icons text-xs">camera_alt</span>
                                        Escanear otra factura
                                    </button>
                                </div>
                            </div>
                            
                            {isAnalyzing && (
                                <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-center gap-2 animate-pulse">
                                    <span className="material-icons text-sm">hourglass_empty</span>
                                    Analizando imagen...
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <input 
                                    type="date" 
                                    className="border rounded p-2 text-sm"
                                    value={newItem.date || ''}
                                    onChange={e => setNewItem({...newItem, date: e.target.value})}
                                    placeholder="Fecha"
                                />
                                <input 
                                    type="text" 
                                    className="border rounded p-2 text-sm"
                                    value={newItem.invoiceNumber || ''}
                                    onChange={e => setNewItem({...newItem, invoiceNumber: e.target.value})}
                                    placeholder="Nro Factura"
                                />
                                <input 
                                    type="text" 
                                    className="border rounded p-2 text-sm"
                                    value={newItem.controlNumber || ''}
                                    onChange={e => setNewItem({...newItem, controlNumber: e.target.value})}
                                    placeholder="Nro Control"
                                />
                                <select 
                                    className="border rounded p-2 text-sm"
                                    value={newItem.transactionType}
                                    onChange={e => setNewItem({...newItem, transactionType: e.target.value as any})}
                                >
                                    <option value="01-reg">01 - Registro</option>
                                    <option value="02-compl">02 - Complemento</option>
                                    <option value="03-anul">03 - Anulación</option>
                                </select>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 block">Total Factura (con IVA)</label>
                                    <input 
                                        type="number" 
                                        className="border rounded p-2 w-full"
                                        value={newItem.totalAmount || ''}
                                        onChange={e => setNewItem({...newItem, totalAmount: parseFloat(e.target.value)})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block">% IVA</label>
                                    <select 
                                        className="border rounded p-2 w-full"
                                        value={newItem.taxRate}
                                        onChange={e => setNewItem({...newItem, taxRate: parseFloat(e.target.value)})}
                                    >
                                        <option value={16}>16%</option>
                                        <option value={8}>8%</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block">% Retención</label>
                                    <select 
                                        className="border rounded p-2 w-full bg-gray-50"
                                        value={newItem.retentionRate}
                                        onChange={e => setNewItem({...newItem, retentionRate: parseFloat(e.target.value)})}
                                    >
                                        <option value={75}>75%</option>
                                        <option value={100}>100%</option>
                                    </select>
                                </div>
                            </div>
                            <button 
                                onClick={addItemToWizard}
                                className="mt-4 w-full bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 font-medium border border-gray-200"
                            >
                                + Agregar Factura a la lista
                            </button>
                        </div>

                        {/* List */}
                        {wizItems.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="p-3">Factura</th>
                                            <th className="p-3">Total</th>
                                            <th className="p-3">Base</th>
                                            <th className="p-3">IVA</th>
                                            <th className="p-3">Retenido</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wizItems.map((item, idx) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="p-3">{item.invoiceNumber}</td>
                                                <td className="p-3">{item.totalAmount.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                                                <td className="p-3">{item.taxBase.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                                                <td className="p-3">{item.taxAmount.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                                                <td className="p-3 font-bold text-blue-600">{item.retentionAmount.toLocaleString('es-VE', {minimumFractionDigits: 2})}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => removeItemFromWizard(idx)} className="text-red-400 hover:text-red-600">
                                                        <span className="material-icons text-sm">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="pt-4 flex justify-between">
                            <button onClick={() => setWizStep(2)} className="text-gray-500">Atrás</button>
                            <button 
                                disabled={wizItems.length === 0}
                                onClick={generateVoucher} 
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
                            >
                                {editingRetentionId ? 'Actualizar Retención' : 'Finalizar y Generar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* VIEW VOUCHER (PRINT MODE) */}
        {route === AppRoute.VIEW_RETENTION && currentVoucher && (
            <div className="flex flex-col items-center animate-fade-in">
                <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print">
                    <button onClick={() => { resetStates(); setRoute(AppRoute.DASHBOARD); }} className="text-gray-500 hover:text-black flex items-center gap-1">
                        <span className="material-icons">arrow_back</span> Volver al inicio
                    </button>
                    <div className="flex gap-2">
                        {editingRetentionId && (
                            <button 
                                onClick={() => handleEditRetention(currentVoucher)}
                                className="bg-orange-100 text-orange-700 px-4 py-2 rounded shadow hover:bg-orange-200 flex items-center gap-2"
                            >
                                <span className="material-icons">edit</span> Seguir Editando
                            </button>
                        )}
                        <button 
                            onClick={() => window.print()}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-200 flex items-center gap-2"
                        >
                            <span className="material-icons">print</span> Imprimir
                        </button>
                    </div>
                </div>
                <RetentionVoucher data={currentVoucher} />
            </div>
        )}

        <ChatBot userProfile={userProfile} companies={companies} recentVouchers={generatedVouchers} />
      </main>
    </div>
  );
};

export default App;