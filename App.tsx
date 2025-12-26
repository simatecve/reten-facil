
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import RetentionVoucher from './components/RetentionVoucher';
import { Company, InvoiceItem, AppRoute, RetentionVoucher as VoucherType, UserProfile, UserRole, Supplier, CommunityTopic, CommunityComment } from './types';
import { analyzeInvoiceImage } from './lib/gemini';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    { route: AppRoute.REPORTS, icon: 'analytics', label: 'Reportes', show: true },
    { route: AppRoute.SUPPLIERS, icon: 'contacts', label: 'Proveedores', show: true },
    { route: AppRoute.COMMUNITY, icon: 'forum', label: 'Comunidad', show: true },
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
            onClick={() => { setRoute(item.route); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${currentRoute === item.route ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
        
        <button 
          onClick={() => { setRoute(AppRoute.PROFILE); }}
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
    { route: AppRoute.REPORTS, icon: 'analytics', label: 'Rep', show: true },
    { route: AppRoute.PROFILE, icon: 'person', label: 'Perfil', show: true },
  ].filter(t => t.show);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-3 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] print:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.route}
          onClick={() => { setRoute(tab.route); }}
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
  const [route, setRoute] = useState<AppRoute>(() => {
    const saved = localStorage.getItem('last_route');
    return (saved as AppRoute) || AppRoute.LANDING;
  });
  const [loading, setLoading] = useState(true);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [generatedVouchers, setGeneratedVouchers] = useState<VoucherType[]>([]);
  const [currentVoucher, setCurrentVoucher] = useState<VoucherType | null>(null);
  const [subUsers, setSubUsers] = useState<UserProfile[]>([]);

  // Community States
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [topicComments, setTopicComments] = useState<CommunityComment[]>([]);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Wizard States con persistencia
  const [wizStep, setWizStep] = useState<number>(() => parseInt(localStorage.getItem('wiz_step') || '1'));
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('wiz_company');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Partial<Supplier> | null>(() => {
    const saved = localStorage.getItem('wiz_supplier');
    return saved ? JSON.parse(saved) : null;
  });
  const [wizItems, setWizItems] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem('wiz_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [wizRetentionPercentage, setWizRetentionPercentage] = useState<75 | 100>(() => {
    const saved = localStorage.getItem('wiz_percentage');
    return (parseInt(saved || '75') as 75 | 100);
  });
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(() => localStorage.getItem('wiz_editing_id'));
  const [supplierSearchQuery, setSupplierSearchQuery] = useState(() => localStorage.getItem('wiz_search_query') || '');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastScannedFile, setLastScannedFile] = useState<File | null>(null);
  const [showSupplierResults, setShowSupplierResults] = useState(false);

  // --- Report Filters ---
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedCompanyId, setReportSelectedCompanyId] = useState('');
  const [reportSelectedSupplierId, setReportSelectedSupplierId] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Efectos para persistir cambios en tiempo real
  useEffect(() => {
    if (user) {
      localStorage.setItem('last_route', route);
      localStorage.setItem('wiz_step', wizStep.toString());
      localStorage.setItem('wiz_company', JSON.stringify(selectedCompany));
      localStorage.setItem('wiz_supplier', JSON.stringify(selectedSupplier));
      localStorage.setItem('wiz_items', JSON.stringify(wizItems));
      localStorage.setItem('wiz_percentage', wizRetentionPercentage.toString());
      localStorage.setItem('wiz_search_query', supplierSearchQuery);
      if (editingVoucherId) localStorage.setItem('wiz_editing_id', editingVoucherId);
      else localStorage.removeItem('wiz_editing_id');
    }
  }, [route, wizStep, selectedCompany, selectedSupplier, wizItems, wizRetentionPercentage, editingVoucherId, supplierSearchQuery, user]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return [];
    const q = supplierSearchQuery.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.rif.toLowerCase().includes(q)
    );
  }, [suppliers, supplierSearchQuery]);

  const filteredReportVouchers = useMemo(() => {
    return generatedVouchers.filter(v => {
      const dateMatch = (!reportStartDate || v.date >= reportStartDate) && 
                       (!reportEndDate || v.date <= reportEndDate);
      const companyMatch = !reportSelectedCompanyId || v.company?.id === reportSelectedCompanyId;
      const supplierMatch = !reportSelectedSupplierId || v.supplier?.id === reportSelectedSupplierId;
      return dateMatch && companyMatch && supplierMatch;
    });
  }, [generatedVouchers, reportStartDate, reportEndDate, reportSelectedCompanyId, reportSelectedSupplierId]);

  // States for sub-users, suppliers and profile
  const [isCreatingSubUser, setIsCreatingSubUser] = useState(false);
  const [editingSubUser, setEditingSubUser] = useState<UserProfile | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Voucher Edit States (Voucher Number only)
  const [isEditingVoucherNum, setIsEditingVoucherNum] = useState(false);
  const [tempVoucherNum, setTempVoucherNum] = useState('');
  const [isUpdatingVoucherNum, setIsUpdatingVoucherNum] = useState(false);

  // Form para nueva factura individual
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    transactionType: '01-reg',
    taxRate: 16,
    exemptAmount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (!localStorage.getItem('last_route') || localStorage.getItem('last_route') === AppRoute.LANDING) {
            setRoute(AppRoute.DASHBOARD);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id);
          if (event === 'SIGNED_IN') {
             const savedRoute = localStorage.getItem('last_route');
             setRoute((savedRoute as AppRoute) || AppRoute.DASHBOARD);
          }
      } else {
        setRoute(AppRoute.LANDING);
        setUserProfile(null);
        localStorage.clear();
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
        logoUrl: c.logo_url, signatureUrl: c.signature_url, 
        lastCorrelationNumber: c.last_correlation_number || 1
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

    // Cargar Comunidad
    fetchCommunityTopics();
  };

  const fetchCommunityTopics = async () => {
    const { data } = await supabase
      .from('community_topics')
      .select('*, profiles(first_name, role)')
      .order('created_at', { ascending: false });
    if (data) setTopics(data as any);
  };

  const fetchTopicComments = async (topicId: string) => {
    const { data } = await supabase
      .from('community_comments')
      .select('*, profiles(first_name, role)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    if (data) setTopicComments(data as any);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    const { error } = await supabase.from('community_topics').insert([{
      user_id: userProfile.id,
      title: fd.get('title'),
      content: fd.get('content'),
      category: fd.get('category')
    }]);

    if (!error) {
      setIsCreatingTopic(false);
      fetchCommunityTopics();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedTopic) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const content = fd.get('comment') as string;
    if (!content.trim()) return;

    setIsPostingComment(true);
    const { error } = await supabase.from('community_comments').insert([{
      topic_id: selectedTopic.id,
      user_id: userProfile.id,
      content
    }]);

    if (!error) {
      (e.target as HTMLFormElement).reset();
      fetchTopicComments(selectedTopic.id);
    }
    setIsPostingComment(false);
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
    setNewItem({ ...newItem, invoiceNumber: '', controlNumber: '', totalAmount: 0 });
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
          if (existing) {
              setSelectedSupplier(existing);
              setSupplierSearchQuery(existing.name);
              if (existing.defaultRetentionRate) setWizRetentionPercentage(existing.defaultRetentionRate);
          }
          else {
            setSelectedSupplier({ name: data.supplierName || '', rif: data.supplierRif || '', address: '' });
            setSupplierSearchQuery(data.supplierName || '');
          }
          
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
    
    let voucherNumber = '';
    
    if (editingVoucherId) {
       const existing = generatedVouchers.find(v => v.id === editingVoucherId);
       voucherNumber = existing?.voucherNumber || '';
    } else {
       const nextNum = selectedCompany.lastCorrelationNumber || 1;
       voucherNumber = `${periodStr}${String(nextNum).padStart(8, '0')}`;
    }
    
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
      invoice_url: uploadedImageUrl || (editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.invoiceUrl : ''),
      retention_percentage: wizRetentionPercentage,
      date: editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.date : now.toISOString().split('T')[0],
      fiscal_period: editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.fiscalPeriod : `${now.getFullYear()} ${String(now.getMonth()+1).padStart(2,'0')}`,
      total_purchase: wizItems.reduce((acc, i) => acc + i.totalAmount, 0),
      total_tax: wizItems.reduce((acc, i) => acc + i.taxAmount, 0),
      total_retained: wizItems.reduce((acc, i) => acc + i.retentionAmount, 0)
    };

    let resultError;
    if (editingVoucherId) {
       const { error } = await supabase.from('retentions').update(payload).eq('id', editingVoucherId);
       resultError = error;
    } else {
       const { error } = await supabase.from('retentions').insert([payload]);
       resultError = error;
       if (!error) {
         await supabase.from('companies').update({ last_correlation_number: (selectedCompany.lastCorrelationNumber || 1) + 1 }).eq('id', selectedCompany.id);
       }
    }

    if (!resultError) {
      loadData();
      setRoute(AppRoute.HISTORY);
      resetStates();
      alert(editingVoucherId ? "Retención actualizada" : "Retención generada");
    } else { 
      alert(resultError.message); 
    }
  };

  const handleEditVoucher = (voucher: VoucherType) => {
    setEditingVoucherId(voucher.id);
    setSelectedCompany(voucher.company);
    setSelectedSupplier(voucher.supplier);
    setSupplierSearchQuery(voucher.supplier?.name || '');
    setWizItems(voucher.items);
    setWizRetentionPercentage(voucher.retentionPercentage as 75 | 100);
    setWizStep(3);
    setRoute(AppRoute.CREATE_RETENTION);
  };

  const handleUpdateVoucherNumber = async () => {
    if (!currentVoucher || !userProfile) return;
    
    const voucherRegex = /^\d{14}$/;
    if (!voucherRegex.test(tempVoucherNum)) {
      return alert("El formato debe ser YYYYMMXXXXXXXX (14 dígitos numéricos).");
    }

    if (!window.confirm(`¿Estás seguro de cambiar el número del comprobante de ${currentVoucher.voucherNumber} a ${tempVoucherNum}? Esta acción quedará registrada.`)) return;

    setIsUpdatingVoucherNum(true);
    try {
      const { data: existing, error: checkError } = await supabase
        .from('retentions')
        .select('id')
        .eq('company_id', currentVoucher.company?.id)
        .eq('voucher_number', tempVoucherNum)
        .not('id', 'eq', currentVoucher.id);
      
      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        throw new Error("Este número de comprobante ya existe para esta empresa.");
      }

      const { error: updateError } = await supabase
        .from('retentions')
        .update({ voucher_number: tempVoucherNum })
        .eq('id', currentVoucher.id);
      
      if (updateError) throw updateError;

      await supabase.from('retention_audit_logs').insert([{
        retention_id: currentVoucher.id,
        user_id: userProfile.id,
        old_value: currentVoucher.voucherNumber,
        new_value: tempVoucherNum
      }]);

      alert("Número de comprobante actualizado con éxito.");
      setIsEditingVoucherNum(false);
      
      const updatedVoucher = { ...currentVoucher, voucherNumber: tempVoucherNum };
      setCurrentVoucher(updatedVoucher);
      loadData();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setIsUpdatingVoucherNum(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    setIsSavingCompany(true);
    
    const fd = new FormData(e.target as HTMLFormElement);
    const logoFile = fd.get('logo') as File;
    const signatureFile = fd.get('signature') as File;
    
    let logoUrl = '';
    let signatureUrl = '';

    try {
      if (logoFile && logoFile.size > 0) {
        const logoName = `logo_${Date.now()}_${logoFile.name}`;
        const { data: ld } = await supabase.storage.from('logos').upload(logoName, logoFile);
        if (ld) {
          const { data: purl } = supabase.storage.from('logos').getPublicUrl(logoName);
          logoUrl = purl.publicUrl;
        }
      }

      if (signatureFile && signatureFile.size > 0) {
        const sigName = `sig_${Date.now()}_${signatureFile.name}`;
        const { data: sd } = await supabase.storage.from('logos').upload(sigName, signatureFile);
        if (sd) {
          const { data: purl } = supabase.storage.from('logos').getPublicUrl(sigName);
          signatureUrl = purl.publicUrl;
        }
      }

      const payload = {
        user_id: userProfile.id,
        name: fd.get('name') as string,
        rif: fd.get('rif') as string,
        address: fd.get('address') as string,
        logo_url: logoUrl,
        signature_url: signatureUrl,
        last_correlation_number: parseInt(fd.get('last_correlation_number') as string || "1")
      };

      const { error } = await supabase.from('companies').insert([payload]);
      if (error) throw error;
      
      loadData(); 
      alert("Empresa registrada con éxito"); 
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      alert("Error al registrar empresa: " + err.message);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm("¿Eliminar esta empresa? Esto podría afectar retenciones asociadas.")) return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (!error) loadData();
    else alert(error.message);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingSupplier(true);
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    const fd = new FormData(e.target as HTMLFormElement);
    
    const payload = {
      user_id: adminId,
      name: fd.get('name') as string,
      rif: fd.get('rif') as string,
      address: fd.get('address') as string,
      defaultRetentionRate: parseInt(fd.get('defaultRetentionRate') as string) || 75
    };

    try {
        if (editingSupplier) {
            const { error } = await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id);
            if (error) throw error;
            alert("Proveedor actualizado.");
        } else {
            const { error } = await supabase.from('suppliers').insert([payload]);
            if (error) throw error;
            alert("Proveedor registrado.");
        }
        loadData();
        setEditingSupplier(null);
        (e.target as HTMLFormElement).reset();
    } catch (err: any) { alert(err.message); }
    finally { setIsSavingSupplier(false); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("¿Eliminar este proveedor?")) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) loadData();
    else alert(error.message);
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
    setSupplierSearchQuery('');
    setShowSupplierResults(false);
    setWizItems([]);
    setWizRetentionPercentage(75);
    setLastScannedFile(null);
    setEditingSubUser(null);
    setEditingSupplier(null);
    setEditingVoucherId(null);
    setIsEditingVoucherNum(false);
    setSelectedTopic(null);
    localStorage.removeItem('wiz_step');
    localStorage.removeItem('wiz_company');
    localStorage.removeItem('wiz_supplier');
    localStorage.removeItem('wiz_items');
    localStorage.removeItem('wiz_percentage');
    localStorage.removeItem('wiz_search_query');
    localStorage.removeItem('wiz_editing_id');
  };

  const getPageTitle = (r: AppRoute) => {
    switch(r) {
      case AppRoute.DASHBOARD: return 'Dashboard';
      case AppRoute.CREATE_RETENTION: return 'Nueva Retención';
      case AppRoute.HISTORY: return 'Historial';
      case AppRoute.SUPPLIERS: return 'Proveedores';
      case AppRoute.COMMUNITY: return 'Comunidad & Feedback';
      case AppRoute.PROFILE: return 'Mi Perfil';
      case AppRoute.USER_MANAGEMENT: return 'Mi Equipo';
      case AppRoute.CREATE_COMPANY: return 'Empresas';
      case AppRoute.REPORTS: return 'Reportes e Informes';
      default: return 'RetenFácil';
    }
  }

  // --- Analítica del Dashboard ---
  const dashboardStats = useMemo(() => {
    const totalRetained = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + i.retentionAmount, 0) || 0), 0);
    const totalIVA = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + i.taxAmount, 0) || 0), 0);
    
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

    const supplierRanking: Record<string, { name: string, total: number }> = {};
    generatedVouchers.forEach(v => {
      const sId = v.supplier?.id || 'unknown';
      if (!supplierRanking[sId]) supplierRanking[sId] = { name: v.supplier?.name || 'Desconocido', total: 0 };
      supplierRanking[sId].total += v.items?.reduce((sum, i) => sum + i.retentionAmount, 0) || 0;
    });
    const topSuppliers = Object.values(supplierRanking).sort((a, b) => b.total - a.total).slice(0, 4);

    return { totalRetained, totalIVA, chartLabels, chartValues, maxVal, topSuppliers };
  }, [generatedVouchers]);

  // --- Report Export Functions ---
  const exportReportToPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingReport(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Retenciones_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error al generar PDF");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReportToCsv = () => {
    const headers = ["Fecha", "Comprobante", "Empresa", "Proveedor", "RIF Proveedor", "Base Imponible", "IVA", "Retenido"];
    const rows = filteredReportVouchers.map(v => {
      const base = v.items?.reduce((acc, i) => acc + (i?.taxBase || 0), 0) || 0;
      const tax = v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0) || 0;
      const retained = v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0;
      return [v.date, v.voucherNumber, v.company?.name || 'N/A', v.supplier?.name || 'N/A', v.supplier?.rif || 'N/A', base, tax, retained];
    });
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="font-black text-lg mb-8">Tendencia de Retención (6 meses)</h3>
                   <div className="h-64 flex items-end justify-between gap-4 px-2">
                      {dashboardStats.chartValues.map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <div 
                            className="w-full bg-blue-100 group-hover:bg-blue-600 rounded-t-xl transition-all duration-500" 
                            style={{ height: `${(val / (dashboardStats.maxVal || 1)) * 100}%` }}
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
                                style={{ width: `${(s.total / Math.max(...dashboardStats.topSuppliers.map(p => p.total), 1)) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                      )) : (
                        <p className="text-slate-400 text-sm py-10 text-center font-medium">Aún no hay datos de proveedores.</p>
                      )}
                   </div>
                </div>
             </div>

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
                              <td className="py-4 text-sm font-black text-right">Bs {v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toLocaleString()}</td>
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
                  <h2 className="hidden md:block text-3xl font-black">{editingVoucherId ? 'Editar Retención' : 'Nueva Retención'}</h2>
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
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden min-h-[400px]">
                  {isAnalyzing && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-blue-600">Analizando con IA...</p>
                  </div>}
                  
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <h3 className="font-bold text-xl">2. Proveedor</h3>
                    <div className="relative group">
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                        <span className="material-icons">auto_awesome</span> Escanear Factura
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Buscar Proveedor Existente (Nombre o RIF)</label>
                      <div className="relative">
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                          <span className="material-icons text-slate-400 ml-4">search</span>
                          <input 
                            type="text"
                            className="w-full p-4 outline-none text-sm font-semibold text-slate-700"
                            placeholder="Escribe el nombre o RIF..."
                            value={supplierSearchQuery}
                            onChange={(e) => {
                              setSupplierSearchQuery(e.target.value);
                              setShowSupplierResults(true);
                            }}
                            onFocus={() => setShowSupplierResults(true)}
                          />
                        </div>
                        
                        {showSupplierResults && (supplierSearchQuery.trim() !== '') && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto animate-fade-in divide-y divide-slate-50">
                            {filteredSuppliers.length > 0 ? filteredSuppliers.map(s => (
                              <button 
                                key={s.id}
                                onClick={() => {
                                  setSelectedSupplier(s);
                                  if (s.defaultRetentionRate) setWizRetentionPercentage(s.defaultRetentionRate as 75 | 100);
                                  setSupplierSearchQuery(s.name);
                                  setShowSupplierResults(false);
                                }}
                                className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between group transition-all"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 group-hover:text-blue-700">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">RIF: {s.rif}</p>
                                </div>
                                <span className="material-icons text-slate-300 group-hover:text-blue-500">add_circle_outline</span>
                              </button>
                            )) : (
                              <div className="p-6 text-center text-slate-400 text-sm italic">
                                No se encontraron proveedores.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RIF del Proveedor</label>
                          <input 
                            value={selectedSupplier?.rif || ''} 
                            onChange={e => setSelectedSupplier({...selectedSupplier, rif: e.target.value})} 
                            placeholder="J-12345678-0" 
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                          <input 
                            value={selectedSupplier?.name || ''} 
                            onChange={e => setSelectedSupplier({...selectedSupplier, name: e.target.value})} 
                            placeholder="Nombre del proveedor" 
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" 
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
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-md"
                      >Siguiente</button>
                    </div>
                  </div>
                </div>
              )}

              {wizStep === 3 && (selectedCompany) && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-icons text-blue-600">receipt</span>
                            Facturas a Retener
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Proveedor: {selectedSupplier?.name}</p>
                        </div>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Factura</label>
                          <input type="date" value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">N° Factura</label>
                          <input value={newItem.invoiceNumber || ''} onChange={e => setNewItem({...newItem, invoiceNumber: e.target.value})} placeholder="Ej: 000123" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">N° Control</label>
                          <input value={newItem.controlNumber || ''} onChange={e => setNewItem({...newItem, controlNumber: e.target.value})} placeholder="Ej: 00-1234" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Monto Total (Bs)</label>
                          <input type="number" value={newItem.totalAmount || ''} onChange={e => setNewItem({...newItem, totalAmount: parseFloat(e.target.value)})} placeholder="0.00" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg" />
                        </div>
                        <button onClick={handleAddItem} className="w-full md:w-auto bg-blue-600 text-white px-8 h-[52px] rounded-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                           <span className="material-icons">add</span> Agregar a la Lista
                        </button>
                      </div>
                   </div>

                   {wizItems.length > 0 && (
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4">Resumen de Facturas agregadas</h4>
                        <div className="space-y-3">
                          {wizItems.map(item => (
                            <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                              <div>
                                 <div className="flex items-center gap-2">
                                   <p className="font-black text-slate-900">Factura #{item.invoiceNumber}</p>
                                   <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-bold">{item.date}</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IVA retener ({wizRetentionPercentage}%): {(item?.retentionAmount || 0).toLocaleString('es-VE')} Bs</p>
                              </div>
                              <div className="flex items-center gap-4 mt-3 md:mt-0 w-full md:w-auto justify-between">
                                <span className="font-black text-blue-600 text-lg">{(item?.totalAmount || 0).toLocaleString('es-VE')} Bs</span>
                                <button 
                                  onClick={() => setWizItems(wizItems.filter(i => i.id !== item.id))} 
                                  className="w-10 h-10 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                                  title="Eliminar de la lista"
                                >
                                  <span className="material-icons text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total a Retener (Comprobante Único)</p>
                              <p className="text-3xl font-black text-slate-900">{wizItems.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toLocaleString('es-VE')} <span className="text-lg text-slate-400">Bs</span></p>
                              <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-tight">{wizItems.length} facturas incluidas</p>
                           </div>
                           <div className="flex gap-4 w-full md:w-auto">
                              <button onClick={() => { resetStates(); setRoute(AppRoute.HISTORY); }} className="flex-1 md:flex-none border border-slate-200 text-slate-400 px-8 py-5 rounded-[2rem] font-bold hover:bg-slate-50 transition-all">Cancelar</button>
                              <button onClick={generateVoucher} className="flex-1 md:flex-none bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-500/30 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                                <span className="material-icons">task_alt</span> {editingVoucherId ? 'Guardar Cambios' : 'Emitir Retención Única'}
                              </button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        )}

        {/* REPORTES E INFORMES */}
        {route === AppRoute.REPORTS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Reportes e Informes</h2>
                  <p className="text-slate-500">Analiza tus retenciones por periodo y proveedor.</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={exportReportToCsv} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all">
                      <span className="material-icons">table_view</span> Excel (CSV)
                   </button>
                   <button onClick={exportReportToPdf} disabled={isGeneratingReport} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                      <span className="material-icons">picture_as_pdf</span> {isGeneratingReport ? 'Generando...' : 'Exportar PDF'}
                   </button>
                </div>
             </header>

             {/* Filtros de Reporte */}
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end no-print">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                   <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                   <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                   <select value={reportSelectedCompanyId} onChange={e => setReportSelectedCompanyId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none">
                      <option value="">Todas las Empresas</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                   <select value={reportSelectedSupplierId} onChange={e => setReportSelectedSupplierId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none">
                      <option value="">Todos los Proveedores</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
             </div>

             {/* Contenido del Reporte para Exportación */}
             <div ref={reportRef} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                   <div>
                      {reportSelectedCompanyId && (
                         <div className="flex items-center gap-4">
                            {companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl && (
                               <img src={companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl} className="h-16 w-auto object-contain" alt="Logo" />
                            )}
                            <div>
                               <h1 className="text-2xl font-black text-slate-900">{companies.find(c => c.id === reportSelectedCompanyId)?.name}</h1>
                               <p className="text-sm font-bold text-blue-600">RIF: {companies.find(c => c.id === reportSelectedCompanyId)?.rif}</p>
                            </div>
                         </div>
                      )}
                      {!reportSelectedCompanyId && <h1 className="text-2xl font-black text-slate-900">Informe Consolidado de Retenciones</h1>}
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha del Reporte</p>
                      <p className="font-bold text-slate-700">{new Date().toLocaleDateString('es-VE')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Comprobantes</p>
                      <p className="text-3xl font-black">{filteredReportVouchers.length}</p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Imponible Total (Bs)</p>
                      <p className="text-3xl font-black text-slate-900">
                         {filteredReportVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.taxBase || 0), 0) || 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                   </div>
                   <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Retenido (Bs)</p>
                      <p className="text-3xl font-black text-blue-600">
                         {filteredReportVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                   </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b-2 border-slate-100">
                            <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                            <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">N° Comprobante</th>
                            <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                            <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">IVA</th>
                            <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Retenido (Bs)</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredReportVouchers.map(v => (
                           <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 text-xs font-bold text-slate-600">{v.date}</td>
                              <td className="py-4 text-xs font-black text-blue-600">{v.voucherNumber}</td>
                              <td className="py-4">
                                 <p className="text-xs font-bold text-slate-800">{v.supplier?.name || 'N/A'}</p>
                                 <p className="text-[9px] text-slate-400 uppercase font-black">{v.supplier?.rif || 'N/A'}</p>
                              </td>
                              <td className="py-4 text-xs font-semibold text-right">
                                 {(v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 text-xs font-black text-right text-slate-900">
                                 {(v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                              </td>
                           </tr>
                         ))}
                         {filteredReportVouchers.length === 0 && (
                           <tr>
                              <td colSpan={5} className="py-20 text-center text-slate-300 font-medium italic">No se encontraron registros con los filtros aplicados.</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="mt-12 pt-8 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                   <p>Generado por RetenFácil Venezuela</p>
                   <p>Página 1 de 1</p>
                </div>
             </div>
          </div>
        )}

        {/* COMUNIDAD Y FEEDBACK */}
        {route === AppRoute.COMMUNITY && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">Comunidad & Feedback</h2>
                  <p className="text-slate-500">Comparte dudas, sugiere mejoras o reporta problemas.</p>
                </div>
                {!selectedTopic && (
                  <button onClick={() => setIsCreatingTopic(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg">
                    <span className="material-icons">add_comment</span> Nuevo Tema
                  </button>
                )}
                {selectedTopic && (
                  <button onClick={() => setSelectedTopic(null)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2">
                    <span className="material-icons">arrow_back</span> Volver al Foro
                  </button>
                )}
             </header>

             {isCreatingTopic && (
               <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 animate-fade-in-up">
                  <h3 className="font-bold text-xl mb-6">Publicar en la Comunidad</h3>
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Título</label>
                          <input required name="title" placeholder="Ej: Sugerencia para el reporte mensual" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Categoría</label>
                          <select name="category" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                             <option value="General">💬 General</option>
                             <option value="Sugerencia">💡 Sugerencia</option>
                             <option value="Problema">⚠️ Problema / Error</option>
                             <option value="Fiscal">⚖️ Duda Fiscal</option>
                          </select>
                       </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Contenido</label>
                        <textarea required name="content" placeholder="Describe tu tema en detalle..." className="w-full bg-slate-50 border-none p-4 rounded-2xl h-40 focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
                    </div>
                    <div className="flex gap-4">
                       <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg">Publicar Tema</button>
                       <button type="button" onClick={() => setIsCreatingTopic(false)} className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-bold">Cancelar</button>
                    </div>
                  </form>
               </div>
             )}

             {!selectedTopic && !isCreatingTopic && (
               <div className="grid grid-cols-1 gap-4">
                  {topics.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => { setSelectedTopic(t); fetchTopicComments(t.id); }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-6 group text-left w-full"
                    >
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                         t.category === 'Problema' ? 'bg-red-50 text-red-500' :
                         t.category === 'Sugerencia' ? 'bg-amber-50 text-amber-500' :
                         t.category === 'Fiscal' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
                       }`}>
                          <span className="material-icons text-3xl">
                             {t.category === 'Problema' ? 'error_outline' :
                              t.category === 'Sugerencia' ? 'lightbulb' :
                              t.category === 'Fiscal' ? 'gavel' : 'chat_bubble_outline'}
                          </span>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                               t.category === 'Problema' ? 'border-red-100 text-red-600' :
                               t.category === 'Sugerencia' ? 'border-amber-100 text-amber-600' :
                               t.category === 'Fiscal' ? 'border-purple-100 text-purple-600' : 'border-blue-100 text-blue-600'
                             }`}>
                                {t.category}
                             </span>
                             <span className="text-slate-400 text-xs font-bold">• {new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-black text-slate-800 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">{t.title}</h4>
                          <p className="text-slate-500 text-sm line-clamp-1">{t.content}</p>
                       </div>
                       <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest shrink-0">
                          <span className="flex items-center gap-1"><span className="material-icons text-sm">person</span> {t.profiles?.first_name}</span>
                          <span className="flex items-center gap-1"><span className="material-icons text-sm">chevron_right</span></span>
                       </div>
                    </button>
                  ))}
                  {topics.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                       <span className="material-icons text-6xl text-slate-100 mb-4">forum</span>
                       <p className="text-slate-400 font-bold">Sé el primero en iniciar una conversación.</p>
                    </div>
                  )}
               </div>
             )}

             {selectedTopic && (
               <div className="space-y-8 animate-fade-in-up">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black uppercase px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{selectedTopic.category}</span>
                        <span className="text-slate-400 text-xs font-bold">{new Date(selectedTopic.created_at).toLocaleString()}</span>
                     </div>
                     <h3 className="text-3xl font-black text-slate-900 mb-4">{selectedTopic.title}</h3>
                     <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{selectedTopic.content}</p>
                     <div className="mt-8 pt-6 border-t flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500">
                           {selectedTopic.profiles?.first_name?.[0]}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900">{selectedTopic.profiles?.first_name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedTopic.profiles?.role}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pl-0 md:pl-12">
                     <h4 className="font-black text-slate-500 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="material-icons text-sm">comment</span> Respuestas ({topicComments.length})
                     </h4>
                     
                     {topicComments.map(c => (
                        <div key={c.id} className={`p-6 rounded-[2rem] border animate-fade-in-up ${c.profiles?.role === 'admin' ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-white border-slate-100 shadow-xs'}`}>
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                 <span className="font-black text-slate-900 text-sm">{c.profiles?.first_name}</span>
                                 {c.profiles?.role === 'admin' && <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase">Staff</span>}
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(c.created_at).toLocaleString()}</span>
                           </div>
                           <p className="text-slate-700 text-sm leading-relaxed">{c.content}</p>
                        </div>
                     ))}

                     <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl mt-8">
                        <form onSubmit={handlePostComment} className="flex flex-col md:flex-row gap-4">
                           <textarea 
                             required
                             name="comment"
                             placeholder="Escribe una respuesta o ayuda al colega..." 
                             className="flex-1 bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
                           />
                           <button 
                             type="submit" 
                             disabled={isPostingComment}
                             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2 h-fit"
                           >
                              {isPostingComment ? '...' : <span className="material-icons">send</span>} 
                              Responder
                           </button>
                        </form>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* MI EQUIPO */}
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
                      <th className="p-6 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {generatedVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-all group">
                        <td className="p-6 font-bold text-blue-600">{v.voucherNumber}</td>
                        <td className="p-6 font-medium text-slate-500">{v.company?.name}</td>
                        <td className="p-6 font-bold">{v.supplier?.name}</td>
                        <td className="p-6 font-black">{v.items?.reduce((acc: number, i: any) => acc + (i?.retentionAmount || 0), 0).toLocaleString('es-VE')} Bs ({v.retentionPercentage}%)</td>
                        <td className="p-6 text-center">
                           <div className="flex justify-center gap-2">
                              <button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="w-9 h-9 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all inline-flex items-center justify-center shadow-sm">
                                 <span className="material-icons text-sm">visibility</span>
                              </button>
                              <button onClick={() => handleEditVoucher(v)} className="w-9 h-9 bg-slate-100 text-slate-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all inline-flex items-center justify-center shadow-sm">
                                 <span className="material-icons text-sm">edit</span>
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {generatedVouchers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-slate-400 italic">No hay registros históricos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* PROVEEDORES */}
        {route === AppRoute.SUPPLIERS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">Gestión de Proveedores</h2>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1">
                   <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <span className="material-icons text-blue-600">{editingSupplier ? 'edit' : 'add_circle'}</span>
                        {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                      </h3>
                      <form onSubmit={handleSaveSupplier} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Razón Social</label>
                          <input required name="name" defaultValue={editingSupplier?.name} placeholder="Nombre de la empresa" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">RIF</label>
                          <input required name="rif" defaultValue={editingSupplier?.rif} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Dirección</label>
                          <textarea name="address" defaultValue={editingSupplier?.address} placeholder="Dirección física" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold h-20" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Retención por Defecto</label>
                          <select name="defaultRetentionRate" defaultValue={editingSupplier?.defaultRetentionRate || 75} className="w-full bg-slate-50 border-none p-4 rounded-2xl appearance-none font-bold outline-none">
                             <option value="75">75% (General)</option>
                             <option value="100">100% (Especial)</option>
                          </select>
                        </div>
                        <button type="submit" disabled={isSavingSupplier} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                          {isSavingSupplier ? 'Guardando...' : editingSupplier ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
                        </button>
                        {editingSupplier && (
                          <button type="button" onClick={() => setEditingSupplier(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3">Cancelar</button>
                        )}
                      </form>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suppliers.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                 <span className="material-icons text-xl">person</span>
                              </div>
                              <div className="flex gap-1">
                                 <button onClick={() => setEditingSupplier(s)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center justify-center"><span className="material-icons text-xs">edit</span></button>
                                 <button onClick={() => handleDeleteSupplier(s.id)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white rounded-lg transition-all flex items-center justify-center"><span className="material-icons text-xs">delete</span></button>
                              </div>
                           </div>
                           <h3 className="font-bold text-slate-800 line-clamp-1">{s.name}</h3>
                           <p className="text-blue-600 font-bold text-xs mt-1 uppercase">RIF: {s.rif}</p>
                           <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">Defecto: {s.defaultRetentionRate || 75}%</span>
                              <span className="material-icons text-slate-200 text-sm">chevron_right</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VISTA DE COMPROBANTE */}
        {route === AppRoute.VIEW_RETENTION && currentVoucher && (
           <div className="flex flex-col items-center animate-fade-in-up">
             <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4 no-print">
               <div className="flex items-center gap-3">
                  <button onClick={() => setRoute(AppRoute.HISTORY)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 transition-all px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50">
                    <span className="material-icons">arrow_back</span> Regresar
                  </button>
                  <button onClick={() => handleEditVoucher(currentVoucher)} className="text-amber-500 hover:bg-amber-500 hover:text-white font-bold flex items-center gap-2 transition-all px-4 py-2 bg-white rounded-xl shadow-sm border border-amber-100">
                    <span className="material-icons">edit</span> Editar Retención
                  </button>
               </div>
               
               <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  {isEditingVoucherNum ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                       <input 
                         autoFocus
                         value={tempVoucherNum} 
                         onChange={(e) => setTempVoucherNum(e.target.value)} 
                         placeholder="YYYYMMXXXXXXXX"
                         className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none w-44"
                       />
                       <button 
                         onClick={handleUpdateVoucherNumber} 
                         disabled={isUpdatingVoucherNum}
                         className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                       >
                         <span className="material-icons text-sm">{isUpdatingVoucherNum ? 'hourglass_top' : 'check'}</span>
                       </button>
                       <button 
                         onClick={() => setIsEditingVoucherNum(false)} 
                         className="bg-slate-100 text-slate-400 p-1.5 rounded-lg hover:bg-slate-200"
                       >
                         <span className="material-icons text-sm">close</span>
                       </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">N° Comprobante:</span>
                       <span className="font-black text-slate-700">{currentVoucher.voucherNumber}</span>
                       <button 
                         onClick={() => { setTempVoucherNum(currentVoucher.voucherNumber); setIsEditingVoucherNum(true); }} 
                         className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                         title="Editar número de comprobante de forma segura"
                       >
                         <span className="material-icons text-sm">edit</span>
                       </button>
                    </div>
                  )}
               </div>
             </div>
             <RetentionVoucher data={currentVoucher} />
           </div>
        )}

        {/* EMPRESAS */}
        {route === AppRoute.CREATE_COMPANY && userProfile?.role === 'admin' && (
           <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
              <header>
                <h2 className="text-3xl font-black">Gestión de Empresas</h2>
                <p className="text-slate-500">Agentes de retención autorizados.</p>
              </header>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
                   <h3 className="font-bold text-lg mb-6">Nueva Empresa</h3>
                   <form onSubmit={handleCreateCompany} className="space-y-4">
                     <input required name="name" placeholder="Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     <input required name="rif" placeholder="RIF (J-12345678-0)" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     <textarea required name="address" placeholder="Dirección Fiscal Completa" className="w-full bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Logo Empresa</label>
                          <input type="file" name="logo" accept="image/*" className="w-full text-xs bg-slate-50 border border-slate-100 p-2 rounded-xl" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Firma y Sello</label>
                          <input type="file" name="signature" accept="image/*" className="w-full text-xs bg-slate-50 border border-slate-100 p-2 rounded-xl" />
                        </div>
                     </div>

                     <input required type="number" name="last_correlation_number" placeholder="Próximo Correlativo" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     
                     <button type="submit" disabled={isSavingCompany} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                       {isSavingCompany ? 'Guardando...' : 'Registrar Empresa'}
                     </button>
                   </form>
                </div>

                <div className="space-y-4">
                   <h3 className="font-bold text-lg mb-4">Empresas Registradas</h3>
                   {companies.map(c => (
                     <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group relative flex gap-4 items-center">
                        {c.logoUrl && <img src={c.logoUrl} className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1" alt="Logo" />}
                        <div className="flex-1">
                          <h4 className="font-black text-slate-800 line-clamp-1 pr-8">{c.name}</h4>
                          <p className="text-blue-600 font-bold text-xs mt-1 uppercase">RIF: {c.rif}</p>
                          <div className="flex gap-2 mt-1">
                             {c.signatureUrl && <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">Firma Digital OK</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteCompany(c.id)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                     </div>
                   ))}
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
