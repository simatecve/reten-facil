
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

  // --- Suppliers Page Specific Search ---
  const [supplierListSearch, setSupplierListSearch] = useState('');

  // --- Report Filters ---
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedCompanyId, setReportSelectedCompanyId] = useState('');
  const [reportSelectedSupplierId, setReportSelectedSupplierId] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- Previews para Empresa ---
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  // --- Estado de Edición de Empresa ---
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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

  const suppliersWithRank = useMemo(() => {
    const counts: Record<string, number> = {};
    generatedVouchers.forEach(v => {
      if (v.supplier?.id) {
        counts[v.supplier.id] = (counts[v.supplier.id] || 0) + 1;
      }
    });
    const sorted = [...suppliers].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    if (supplierListSearch.trim()) {
      const q = supplierListSearch.toLowerCase();
      return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.rif.toLowerCase().includes(q));
    }
    return sorted.slice(0, 6);
  }, [suppliers, generatedVouchers, supplierListSearch]);

  const filteredReportVouchers = useMemo(() => {
    return generatedVouchers.filter(v => {
      const dateMatch = (!reportStartDate || v.date >= reportStartDate) && 
                       (!reportEndDate || v.date <= reportEndDate);
      const companyMatch = !reportSelectedCompanyId || v.company?.id === reportSelectedCompanyId;
      const supplierMatch = !reportSelectedSupplierId || v.supplier?.id === reportSelectedSupplierId;
      return dateMatch && companyMatch && supplierMatch;
    });
  }, [generatedVouchers, reportStartDate, reportEndDate, reportSelectedCompanyId, reportSelectedSupplierId]);

  // Fix: Add dashboardStats useMemo to resolve "Cannot find name 'dashboardStats'" errors.
  const dashboardStats = useMemo(() => {
    const totalRetained = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0);
    const totalIVA = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.taxAmount || 0), 0) || 0), 0);
    
    const supplierTotals: Record<string, { name: string, total: number }> = {};
    generatedVouchers.forEach(v => {
      if (v.supplier) {
        const amount = v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0;
        if (!supplierTotals[v.supplier.id]) {
          supplierTotals[v.supplier.id] = { name: v.supplier.name, total: 0 };
        }
        supplierTotals[v.supplier.id].total += amount;
      }
    });
    const topSuppliers = Object.values(supplierTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const chartLabels: string[] = [];
    const chartValues: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('es-VE', { month: 'short' }).toUpperCase();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const period = `${year} ${month}`;
      
      const monthTotal = generatedVouchers
        .filter(v => v.fiscalPeriod === period)
        .reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0);
      
      chartLabels.push(label);
      chartValues.push(monthTotal);
    }
    const maxVal = Math.max(...chartValues, 1);

    return { totalRetained, totalIVA, topSuppliers, chartLabels, chartValues, maxVal };
  }, [generatedVouchers]);

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
    
    const { data: cos } = await supabase.from('companies').select('*').eq('user_id', adminId);
    if (cos) setCompanies(cos.map(c => ({
        id: c.id, name: c.name, rif: c.rif, address: c.address, 
        logoUrl: c.logo_url, signatureUrl: c.signature_url, stampUrl: c.stamp_url,
        lastCorrelationNumber: c.last_correlation_number || 1
    })));

    const { data: sups } = await supabase.from('suppliers').select('*').eq('user_id', adminId);
    if (sups) setSuppliers(sups);

    const { data: rets } = await supabase.from('retentions').select('*, companies(*), suppliers(*)').eq('user_id', adminId).order('created_at', { ascending: false });
    if (rets) setGeneratedVouchers(rets.map(r => ({
        id: r.id, voucherNumber: r.voucher_number, date: r.date, fiscalPeriod: r.fiscal_period,
        invoiceUrl: r.invoice_url, retentionPercentage: r.retention_percentage,
        company: r.companies, supplier: r.suppliers, items: r.items
    })));

    if (userProfile.role === 'admin') {
      const { data: subs } = await supabase.from('profiles').select('*').eq('admin_id', userProfile.id);
      if (subs) setSubUsers(subs);
    }
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
    if (!error) { setIsCreatingTopic(false); fetchCommunityTopics(); }
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
    if (!error) { (e.target as HTMLFormElement).reset(); fetchTopicComments(selectedTopic.id); }
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
      const updated = wizItems.map(item => ({
        ...item, retentionRate: wizRetentionPercentage, retentionAmount: Number((item.taxAmount * (wizRetentionPercentage / 100)).toFixed(2))
      }));
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
            ...prev, invoiceNumber: data.invoiceNumber, controlNumber: data.controlNumber, totalAmount: data.totalAmount, date: data.date 
          }));
          if (data.invoiceNumber || data.controlNumber) setWizStep(3);
        }
      } catch (err) { console.error("Error IA", err); }
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
         user_id: adminId, name: selectedSupplier.name, rif: selectedSupplier.rif, address: selectedSupplier.address || ''
       }]).select().single();
       if (!supErr) supplierId = newSup.id;
    }
    const now = new Date();
    const periodStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    let voucherNumber = '';
    if (editingVoucherId) {
       voucherNumber = generatedVouchers.find(v => v.id === editingVoucherId)?.voucherNumber || '';
    } else {
       const nextNum = selectedCompany.lastCorrelationNumber || 1;
       voucherNumber = `${periodStr}${String(nextNum).padStart(8, '0')}`;
    }
    let uploadedImageUrl = '';
    if (lastScannedFile) {
        const fileName = `${voucherNumber}_${Date.now()}.jpg`;
        const { data: uploadData } = await supabase.storage.from('facturas').upload(fileName, lastScannedFile);
        if (uploadData) uploadedImageUrl = supabase.storage.from('facturas').getPublicUrl(fileName).data.publicUrl;
    }
    const payload = {
      user_id: adminId, company_id: selectedCompany.id, supplier_id: supplierId,
      supplier_name: selectedSupplier.name, supplier_rif: selectedSupplier.rif,
      items: wizItems, voucher_number: voucherNumber, control_number: wizItems[0].controlNumber,
      invoice_url: uploadedImageUrl || (editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.invoiceUrl : ''),
      retention_percentage: wizRetentionPercentage, date: editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.date : now.toISOString().split('T')[0],
      fiscal_period: editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.fiscalPeriod : `${now.getFullYear()} ${String(now.getMonth()+1).padStart(2,'0')}`,
      total_purchase: wizItems.reduce((acc, i) => acc + i.totalAmount, 0),
      total_tax: wizItems.reduce((acc, i) => acc + i.taxAmount, 0),
      total_retained: wizItems.reduce((acc, i) => acc + i.retentionAmount, 0)
    };
    let { error } = editingVoucherId ? await supabase.from('retentions').update(payload).eq('id', editingVoucherId) : await supabase.from('retentions').insert([payload]);
    if (!error) {
      if (!editingVoucherId) await supabase.from('companies').update({ last_correlation_number: (selectedCompany.lastCorrelationNumber || 1) + 1 }).eq('id', selectedCompany.id);
      loadData(); setRoute(AppRoute.HISTORY); resetStates(); alert("Éxito");
    } else alert(error.message);
  };

  const handleEditVoucher = (voucher: VoucherType) => {
    setEditingVoucherId(voucher.id); setSelectedCompany(voucher.company); setSelectedSupplier(voucher.supplier);
    setSupplierSearchQuery(voucher.supplier?.name || ''); setWizItems(voucher.items);
    setWizRetentionPercentage(voucher.retentionPercentage as 75 | 100); setWizStep(3); setRoute(AppRoute.CREATE_RETENTION);
  };

  const handleUpdateVoucherNumber = async () => {
    if (!currentVoucher || !userProfile) return;
    if (!/^\d{14}$/.test(tempVoucherNum)) return alert("Formato YYYYMMXXXXXXXX");
    setIsUpdatingVoucherNum(true);
    try {
      const { data: existing } = await supabase.from('retentions').select('id').eq('company_id', currentVoucher.company?.id).eq('voucher_number', tempVoucherNum).not('id', 'eq', currentVoucher.id);
      if (existing?.length) throw new Error("Ya existe.");
      const { error: updateError } = await supabase.from('retentions').update({ voucher_number: tempVoucherNum }).eq('id', currentVoucher.id);
      if (updateError) throw updateError;
      await supabase.from('retention_audit_logs').insert([{ retention_id: currentVoucher.id, user_id: userProfile.id, old_value: currentVoucher.voucherNumber, new_value: tempVoucherNum }]);
      alert("Actualizado."); setIsEditingVoucherNum(false); setCurrentVoucher({ ...currentVoucher, voucherNumber: tempVoucherNum }); loadData();
    } catch (err: any) { alert(err.message); } finally { setIsUpdatingVoucherNum(false); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    setIsSavingCompany(true);
    const fd = new FormData(e.target as HTMLFormElement);
    const logoFile = fd.get('logo') as File;
    const signatureFile = fd.get('signature') as File;
    const stampFile = fd.get('stamp') as File;
    
    let logoUrl = editingCompany?.logoUrl || '';
    let signatureUrl = editingCompany?.signatureUrl || '';
    let stampUrl = editingCompany?.stampUrl || '';
    
    try {
      if (logoFile?.size) {
        const { data } = await supabase.storage.from('logos').upload(`logo_${Date.now()}_${logoFile.name}`, logoFile);
        if (data) logoUrl = supabase.storage.from('logos').getPublicUrl(data.path).data.publicUrl;
      }
      if (signatureFile?.size) {
        const { data } = await supabase.storage.from('logos').upload(`sig_${Date.now()}_${signatureFile.name}`, signatureFile);
        if (data) signatureUrl = supabase.storage.from('logos').getPublicUrl(data.path).data.publicUrl;
      }
      if (stampFile?.size) {
        const { data } = await supabase.storage.from('logos').upload(`stamp_${Date.now()}_${stampFile.name}`, stampFile);
        if (data) stampUrl = supabase.storage.from('logos').getPublicUrl(data.path).data.publicUrl;
      }

      const payload = {
        name: fd.get('name') as string, 
        rif: fd.get('rif') as string, 
        address: fd.get('address') as string,
        logo_url: logoUrl, 
        signature_url: signatureUrl, 
        stamp_url: stampUrl,
        last_correlation_number: parseInt(fd.get('last_correlation_number') as string || "1")
      };

      if (editingCompany) {
        const { error } = await supabase.from('companies').update(payload).eq('id', editingCompany.id);
        if (error) throw error;
        alert("Empresa actualizada");
      } else {
        const { error } = await supabase.from('companies').insert([{ ...payload, user_id: userProfile.id }]);
        if (error) throw error;
        alert("Empresa registrada");
      }
      
      loadData(); 
      (e.target as HTMLFormElement).reset(); 
      setEditingCompany(null);
      setLogoPreview(null); 
      setSignaturePreview(null); 
      setStampPreview(null);
    } catch (err: any) { alert("Error: " + err.message); } finally { setIsSavingCompany(false); }
  };

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm("¿Eliminar?")) {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (!error) loadData(); else alert(error.message);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingSupplier(true);
    const adminId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = { user_id: adminId, name: fd.get('name'), rif: fd.get('rif'), address: fd.get('address'), defaultRetentionRate: parseInt(fd.get('defaultRetentionRate') as string) || 75 };
    const { error } = editingSupplier ? await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id) : await supabase.from('suppliers').insert([payload]);
    if (!error) { loadData(); setEditingSupplier(null); (e.target as HTMLFormElement).reset(); alert("Éxito"); } else alert(error.message);
    setIsSavingSupplier(false);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm("¿Eliminar?")) { const { error } = await supabase.from('suppliers').delete().eq('id', id); if (!error) loadData(); }
  };

  const handleCreateSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'admin') return;
    setIsCreatingSubUser(true);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
        if (editingSubUser) {
            await supabase.from('profiles').update({ first_name: fd.get('first_name'), role: fd.get('role') }).eq('id', editingSubUser.id);
        } else {
            const { data: authData, error: authError } = await supabase.auth.signUp({ email: fd.get('email') as string, password: fd.get('password') as string });
            if (authError) throw authError;
            await supabase.from('profiles').insert([{ id: authData.user?.id, email: fd.get('email'), first_name: fd.get('first_name'), role: fd.get('role'), admin_id: userProfile.id }]);
        }
        loadData(); setEditingSubUser(null); (e.target as HTMLFormElement).reset(); alert("Éxito");
    } catch (err: any) { alert(err.message); } finally { setIsCreatingSubUser(false); }
  };

  const handleDeleteSubUser = async (id: string) => {
    if (window.confirm("¿Eliminar?")) await supabase.from('profiles').delete().eq('id', id).then(() => loadData());
  };

  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingProfile(true);
    const fd = new FormData(e.target as HTMLFormElement);
    try {
        await supabase.from('profiles').update({ first_name: fd.get('first_name'), phone: fd.get('phone') }).eq('id', userProfile.id);
        if (fd.get('new_password')) await supabase.auth.updateUser({ password: fd.get('new_password') as string });
        alert("Perfil actualizado."); fetchProfile(userProfile.id);
    } catch (err: any) { alert(err.message); } finally { setIsSavingProfile(false); }
  };

  const resetStates = () => {
    setWizStep(1); setSelectedCompany(null); setSelectedSupplier(null); setSupplierSearchQuery(''); setShowSupplierResults(false);
    setWizItems([]); setWizRetentionPercentage(75); setLastScannedFile(null); setEditingSubUser(null); setEditingSupplier(null);
    setEditingVoucherId(null); setIsEditingVoucherNum(false); setSelectedTopic(null);
    setEditingCompany(null); setLogoPreview(null); setSignaturePreview(null); setStampPreview(null);
    localStorage.removeItem('wiz_step'); localStorage.removeItem('wiz_company'); localStorage.removeItem('wiz_supplier');
    localStorage.removeItem('wiz_items'); localStorage.removeItem('wiz_percentage'); localStorage.removeItem('wiz_search_query'); localStorage.removeItem('wiz_editing_id');
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

  const exportReportToPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingReport(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
      pdf.save(`Reporte_${Date.now()}.pdf`);
    } catch (e) { alert("Error PDF"); } finally { setIsGeneratingReport(false); }
  };

  const exportReportToCsv = () => {
    const rows = filteredReportVouchers.map(v => [v.date, v.voucherNumber, v.company?.name, v.supplier?.name, v.supplier?.rif, v.items?.reduce((acc, i) => acc + (i?.taxBase || 0), 0), v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0), v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0)]);
    const csv = "Fecha,Comprobante,Empresa,Proveedor,RIF,Base,IVA,Retenido\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = `Reporte_${Date.now()}.csv`; link.click();
  };

  if (loading) return null;
  if (!user || route === AppRoute.LANDING) return <LandingPage />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <MobileHeader title={getPageTitle(route)} />
      <MobileBottomNav currentRoute={route} setRoute={setRoute} resetStates={resetStates} role={userProfile?.role} />
      <Sidebar currentRoute={route} setRoute={setRoute} handleLogout={() => supabase.auth.signOut()} resetStates={resetStates} isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} role={userProfile?.role || 'operator'} />
      <main className={`flex-1 transition-all duration-300 pb-24 md:pb-8 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} p-4 md:p-8`}>
        
        {route === AppRoute.DASHBOARD && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div><h1 className="text-4xl font-black tracking-tight text-slate-900">Hola, {userProfile?.first_name}</h1><p className="text-slate-500 font-medium">Resumen fiscal.</p></div>
                <button onClick={() => setRoute(AppRoute.CREATE_RETENTION)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"><span className="material-icons">add_circle</span> Nueva Retención</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[ {l: 'Total Retenido', v: dashboardStats.totalRetained, i: 'account_balance_wallet'}, {l: 'IVA Gestionado', v: dashboardStats.totalIVA, i: 'receipt_long'}, {l: 'Proveedores', v: suppliers.length, i: 'people'}, {l: 'Vouchers', v: generatedVouchers.length, i: 'description'}].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-icons text-6xl">{s.i}</span></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
                    <p className="text-3xl font-black mt-1">{typeof s.v === 'number' ? s.v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : s.v}</p>
                  </div>
                ))}
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <h3 className="font-black text-lg mb-8">Tendencia (6 meses)</h3>
                   <div className="h-64 flex items-end justify-between gap-4 px-2">
                      {dashboardStats.chartValues.map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <div className="w-full bg-blue-100 group-hover:bg-blue-600 rounded-t-xl transition-all duration-500" style={{ height: `${(val / (dashboardStats.maxVal || 1)) * 100}%` }}>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Bs {val.toLocaleString()}</div>
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
                           <div className="flex justify-between text-xs font-bold uppercase tracking-tight"><span className="text-slate-500 truncate max-w-[150px]">{s.name}</span><span className="text-slate-900">Bs {s.total.toLocaleString()}</span></div>
                           <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(s.total / Math.max(...dashboardStats.topSuppliers.map(p => p.total), 1)) * 100}%` }}></div>
                           </div>
                        </div>
                      )) : <p className="text-slate-400 text-sm py-10 text-center font-medium">Sin datos.</p>}
                   </div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6"><h3 className="font-black text-lg">Actividad Reciente</h3><button onClick={() => setRoute(AppRoute.HISTORY)} className="text-blue-600 text-xs font-bold uppercase hover:underline">Ver Todo</button></div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead><tr className="border-b border-slate-50"><th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">N° Voucher</th><th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th><th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Retenido</th><th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acción</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                         {generatedVouchers.slice(0, 5).map(v => (
                           <tr key={v.id} className="hover:bg-slate-50 transition-all group">
                              <td className="py-4 text-sm font-bold text-blue-600">{v.voucherNumber}</td>
                              <td className="py-4 text-sm font-medium text-slate-700">{v.supplier?.name}</td>
                              <td className="py-4 text-sm font-black text-right">Bs {v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toLocaleString()}</td>
                              <td className="py-4 text-right"><button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="text-slate-300 group-hover:text-blue-600 transition-colors"><span className="material-icons">visibility</span></button></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {route === AppRoute.CREATE_RETENTION && (
           <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                <div><h2 className="hidden md:block text-3xl font-black">{editingVoucherId ? 'Editar' : 'Nueva'} Retención</h2><p className="text-slate-500">Paso {wizStep} de 3</p></div>
                <div className="flex gap-2">{[1,2,3].map(s => (<div key={s} className={`h-2 rounded-full transition-all duration-300 ${wizStep >= s ? 'w-10 bg-blue-600' : 'w-4 bg-slate-200'}`}></div>))}</div>
              </div>
              {wizStep === 1 && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                   <h3 className="font-bold text-xl mb-6">1. Empresa Emisora</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companies.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCompany(c); setWizStep(2); }} className="text-left p-6 border-2 border-slate-50 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group">
                          <div className="truncate"><p className="font-bold group-hover:text-blue-700 truncate">{c.name}</p><p className="text-xs text-slate-400">RIF: {c.rif}</p></div>
                          <span className="material-icons text-slate-300 group-hover:text-blue-500">chevron_right</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}
              {wizStep === 2 && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden min-h-[400px]">
                  {isAnalyzing && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-bold text-blue-600">IA Analizando...</p></div>}
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <h3 className="font-bold text-xl">2. Proveedor</h3>
                    <div className="relative group"><input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" /><button className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><span className="material-icons">auto_awesome</span> Escanear Factura</button></div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Buscar Proveedor</label>
                      <div className="relative"><div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm"><span className="material-icons text-slate-400 ml-4">search</span><input type="text" className="w-full p-4 outline-none text-sm font-semibold text-slate-700" placeholder="Nombre o RIF..." value={supplierSearchQuery} onChange={(e) => { setSupplierSearchQuery(e.target.value); setShowSupplierResults(true); }} onFocus={() => setShowSupplierResults(true)} /></div>
                        {showSupplierResults && supplierSearchQuery.trim() && (<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto animate-fade-in divide-y divide-slate-50">{filteredSuppliers.length ? filteredSuppliers.map(s => (<button key={s.id} onClick={() => { setSelectedSupplier(s); if (s.defaultRetentionRate) setWizRetentionPercentage(s.defaultRetentionRate as 75 | 100); setSupplierSearchQuery(s.name); setShowSupplierResults(false); }} className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between transition-all"><div><p className="font-bold text-slate-800">{s.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">RIF: {s.rif}</p></div><span className="material-icons text-slate-300">add_circle_outline</span></button>)) : <div className="p-6 text-center text-slate-400 italic">No encontrado.</div>}</div>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                       <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">RIF</label><input value={selectedSupplier?.rif || ''} onChange={e => setSelectedSupplier({...selectedSupplier, rif: e.target.value})} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" /></div>
                       <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Razón Social</label><input value={selectedSupplier?.name || ''} onChange={e => setSelectedSupplier({...selectedSupplier, name: e.target.value})} placeholder="Nombre" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" /></div>
                    </div>
                    <div className="flex justify-between pt-8 border-t"><button onClick={() => setWizStep(1)} className="text-slate-400 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl">Atrás</button><button onClick={() => (selectedSupplier?.name && selectedSupplier?.rif) ? setWizStep(3) : alert("Completa los datos")} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-md">Siguiente</button></div>
                  </div>
                </div>
              )}
              {wizStep === 3 && selectedCompany && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6"><div><h3 className="font-bold text-lg flex items-center gap-2"><span className="material-icons text-blue-600">receipt</span>Facturas</h3><p className="text-xs text-slate-400 mt-1">{selectedSupplier?.name}</p></div>
                        <div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setWizRetentionPercentage(75)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 75 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>75%</button><button onClick={() => setWizRetentionPercentage(100)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 100 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>100%</button></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label><input type="date" value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">N° Factura</label><input value={newItem.invoiceNumber || ''} onChange={e => setNewItem({...newItem, invoiceNumber: e.target.value})} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">N° Control</label><input value={newItem.controlNumber || ''} onChange={e => setNewItem({...newItem, controlNumber: e.target.value})} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-1 space-y-1 w-full"><label className="text-[10px] font-bold text-slate-400 uppercase">Monto Total (Bs)</label><input type="number" value={newItem.totalAmount || ''} onChange={e => setNewItem({...newItem, totalAmount: parseFloat(e.target.value)})} placeholder="0.00" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg" /></div><button onClick={handleAddItem} className="w-full md:w-auto bg-blue-600 text-white px-8 h-[52px] rounded-xl font-black flex items-center justify-center gap-2"><span className="material-icons">add</span> Agregar</button></div>
                   </div>
                   {wizItems.length > 0 && (
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in"><h4 className="font-bold text-sm text-slate-500 uppercase mb-4">Resumen</h4>
                        <div className="space-y-3">{wizItems.map(item => (<div key={item.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group"><div><p className="font-black text-slate-900">#{item.invoiceNumber}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IVA: {(item?.retentionAmount || 0).toLocaleString('es-VE')} Bs</p></div><div className="flex items-center gap-4"><span className="font-black text-blue-600 text-lg">{(item?.totalAmount || 0).toLocaleString('es-VE')} Bs</span><button onClick={() => setWizItems(wizItems.filter(i => i.id !== item.id))} className="w-10 h-10 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"><span className="material-icons text-sm">delete</span></button></div></div>))}</div>
                        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Retener</p><p className="text-3xl font-black text-slate-900">{wizItems.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toLocaleString('es-VE')} <span className="text-lg text-slate-400">Bs</span></p></div><div className="flex gap-4 w-full md:w-auto"><button onClick={() => { resetStates(); setRoute(AppRoute.HISTORY); }} className="flex-1 md:flex-none border border-slate-200 text-slate-400 px-8 py-5 rounded-[2rem] font-bold hover:bg-slate-50">Cancelar</button><button onClick={generateVoucher} className="flex-1 md:flex-none bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"><span className="material-icons">task_alt</span> Emitir</button></div></div>
                     </div>
                   )}
                </div>
              )}
           </div>
        )}

        {route === AppRoute.REPORTS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="text-3xl font-black">Reportes</h2><p className="text-slate-500">Analiza tus retenciones.</p></div><div className="flex gap-3"><button onClick={exportReportToCsv} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"><span className="material-icons">table_view</span> Excel</button><button onClick={exportReportToPdf} disabled={isGeneratingReport} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"><span className="material-icons">picture_as_pdf</span> {isGeneratingReport ? '...' : 'PDF'}</button></div></header>
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end no-print">
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest ml-1">Desde</label><input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest ml-1">Hasta</label><input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest ml-1">Empresa</label><select value={reportSelectedCompanyId} onChange={e => setReportSelectedCompanyId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none"><option value="">Todas</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-widest ml-1">Proveedor</label><select value={reportSelectedSupplierId} onChange={e => setReportSelectedSupplierId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none"><option value="">Todos</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
             </div>
             <div ref={reportRef} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 min-h-[600px] flex flex-col"><div className="flex justify-between items-start border-b pb-8 mb-8"><div>{reportSelectedCompanyId && (<div className="flex items-center gap-4">{companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl && (<img src={companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl} className="h-16 w-auto object-contain" />)}<div><h1 className="text-2xl font-black text-slate-900">{companies.find(c => c.id === reportSelectedCompanyId)?.name}</h1><p className="text-sm font-bold text-blue-600">RIF: {companies.find(c => c.id === reportSelectedCompanyId)?.rif}</p></div></div>)} {!reportSelectedCompanyId && <h1 className="text-2xl font-black text-slate-900">Reporte Consolidado</h1>}</div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest">Fecha</p><p className="font-bold">{new Date().toLocaleDateString('es-VE')}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10"><div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-[10px] font-bold uppercase mb-1">Vouchers</p><p className="text-3xl font-black">{filteredReportVouchers.length}</p></div><div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><p className="text-[10px] font-bold uppercase mb-1">Base (Bs)</p><p className="text-3xl font-black">{filteredReportVouchers.reduce((acc, v) => acc + v.items.reduce((sum, i) => sum + (i?.taxBase || 0), 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p></div><div className="bg-blue-50 p-6 rounded-3xl border border-blue-100"><p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Retenido (Bs)</p><p className="text-3xl font-black text-blue-600">{filteredReportVouchers.reduce((acc, v) => acc + v.items.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p></div></div><div className="flex-1 overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b-2 border-slate-100"><th className="py-4 text-[10px] font-bold uppercase">Fecha</th><th className="py-4 text-[10px] font-bold uppercase">N° Voucher</th><th className="py-4 text-[10px] font-bold uppercase">Proveedor</th><th className="py-4 text-[10px] font-bold uppercase text-right">Retenido (Bs)</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredReportVouchers.map(v => (<tr key={v.id} className="hover:bg-slate-50/50"><td className="py-4 text-xs font-bold text-slate-600">{v.date}</td><td className="py-4 text-xs font-black text-blue-600">{v.voucherNumber}</td><td className="py-4"><p className="text-xs font-bold text-slate-800">{v.supplier?.name || 'N/A'}</p><p className="text-[9px] text-slate-400 uppercase">{v.supplier?.rif || 'N/A'}</p></td><td className="py-4 text-xs font-black text-right text-slate-900">{(v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {route === AppRoute.SUPPLIERS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><h2 className="text-3xl font-black">Proveedores</h2><div className="w-full md:w-80 relative group"><div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"><span className="material-icons text-slate-400 ml-4">search</span><input type="text" className="w-full p-4 outline-none text-sm font-semibold text-slate-700" placeholder="Filtrar por Nombre o RIF..." value={supplierListSearch} onChange={(e) => setSupplierListSearch(e.target.value)} /></div></div></div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1"><div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100"><h3 className="font-bold text-lg mb-6 flex items-center gap-2"><span className="material-icons text-blue-600">{editingSupplier ? 'edit' : 'add_circle'}</span>{editingSupplier ? 'Editar' : 'Nuevo'} Proveedor</h3><form onSubmit={handleSaveSupplier} className="space-y-4"><div><label className="text-[10px] font-bold uppercase ml-1 block mb-1">Razón Social</label><input required name="name" defaultValue={editingSupplier?.name} placeholder="Empresa" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" /></div><div><label className="text-[10px] font-bold uppercase ml-1 block mb-1">RIF</label><input required name="rif" defaultValue={editingSupplier?.rif} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" /></div><div><label className="text-[10px] font-bold uppercase ml-1 block mb-1">Dirección</label><textarea name="address" defaultValue={editingSupplier?.address} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-20" /></div><div><label className="text-[10px] font-bold uppercase ml-1 block mb-1">Defecto</label><select name="defaultRetentionRate" defaultValue={editingSupplier?.defaultRetentionRate || 75} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold appearance-none"><option value="75">75%</option><option value="100">100%</option></select></div><button type="submit" disabled={isSavingSupplier} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all">{isSavingSupplier ? '...' : editingSupplier ? 'Actualizar' : 'Registrar'}</button>{editingSupplier && (<button type="button" onClick={() => setEditingSupplier(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3 mt-2">Cancelar</button>)}</form></div></div>
                <div className="lg:col-span-2 space-y-4"><p className="text-[10px] font-bold text-slate-400 uppercase px-4">{supplierListSearch ? 'Resultados' : 'Top 6 Activos'}</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suppliersWithRank.map(s => (<div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md group"><div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><span className="material-icons text-xl">person</span></div><div className="flex gap-1"><button onClick={() => setEditingSupplier(s)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center"><span className="material-icons text-xs">edit</span></button><button onClick={() => handleDeleteSupplier(s.id)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center"><span className="material-icons text-xs">delete</span></button></div></div><h3 className="font-bold text-slate-800 line-clamp-1">{s.name}</h3><p className="text-blue-600 font-bold text-xs uppercase">RIF: {s.rif}</p></div>))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {route === AppRoute.CREATE_COMPANY && userProfile?.role === 'admin' && (
           <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
              <header><h2 className="text-3xl font-black">Empresas</h2><p className="text-slate-500">Agentes de retención.</p></header>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
                   <h3 className="font-bold text-lg mb-6">{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
                   <form 
                    key={editingCompany?.id || 'new'}
                    onSubmit={handleCreateCompany} 
                    className="space-y-4"
                   >
                     <input required name="name" defaultValue={editingCompany?.name || ''} placeholder="Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     <input required name="rif" defaultValue={editingCompany?.rif || ''} placeholder="RIF (J-12345678-0)" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     <textarea required name="address" defaultValue={editingCompany?.address || ''} placeholder="Dirección Fiscal" className="w-full bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     
                     <div className="space-y-4 pt-2">
                        {/* Logo */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Logo</label>
                             <input type="file" name="logo" accept="image/*" className="w-full text-[10px] file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setLogoPreview(URL.createObjectURL(file));
                             }} />
                          </div>
                          {logoPreview && <img src={logoPreview} className="w-12 h-12 object-contain bg-white rounded-lg p-1 border shadow-sm" alt="Preview" />}
                        </div>
                        {/* Firma */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Firma Digitalizada</label>
                             <input type="file" name="signature" accept="image/*" className="w-full text-[10px] file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setSignaturePreview(URL.createObjectURL(file));
                             }} />
                          </div>
                          {signaturePreview && <img src={signaturePreview} className="w-12 h-12 object-contain bg-white rounded-lg p-1 border shadow-sm" alt="Preview" />}
                        </div>
                        {/* Sello */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sello Húmedo</label>
                             <input type="file" name="stamp" accept="image/*" className="w-full text-[10px] file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setStampPreview(URL.createObjectURL(file));
                             }} />
                          </div>
                          {stampPreview && <img src={stampPreview} className="w-12 h-12 object-contain bg-white rounded-lg p-1 border shadow-sm" alt="Preview" />}
                        </div>
                     </div>

                     <input required type="number" name="last_correlation_number" defaultValue={editingCompany?.lastCorrelationNumber || 1} placeholder="Próximo Correlativo" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                     
                     <div className="flex gap-3">
                       <button type="submit" disabled={isSavingCompany} className="flex-1 bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                         {isSavingCompany ? 'Guardando...' : editingCompany ? 'Actualizar Empresa' : 'Registrar Empresa'}
                       </button>
                       {editingCompany && (
                         <button type="button" onClick={() => resetStates()} className="bg-slate-200 text-slate-600 rounded-2xl font-bold px-6 py-4">
                           Cancelar
                         </button>
                       )}
                     </div>
                   </form>
                </div>
                <div className="space-y-4">
                   <h3 className="font-bold text-lg mb-4">Registradas</h3>
                   {companies.map(c => (
                     <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative flex gap-4 items-center group">
                        {c.logoUrl && <img src={c.logoUrl} className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1" />}
                        <div className="flex-1"><h4 className="font-black text-slate-800 line-clamp-1 pr-16">{c.name}</h4><p className="text-blue-600 font-bold text-xs uppercase">RIF: {c.rif}</p>
                          <div className="flex gap-1 mt-2">
                             {c.signatureUrl && <span className="text-[7px] bg-green-50 text-green-600 px-1 py-0.5 rounded-full font-bold border border-green-100">FIRMA OK</span>}
                             {c.stampUrl && <span className="text-[7px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded-full font-bold border border-blue-100">SELLO OK</span>}
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCompany(c);
                              setLogoPreview(c.logoUrl || null);
                              setSignaturePreview(c.signatureUrl || null);
                              setStampPreview(c.stampUrl || null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="text-slate-400 hover:text-blue-500 p-2"
                          >
                            <span className="material-icons text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteCompany(c.id)} className="text-slate-300 hover:text-red-500 p-2"><span className="material-icons text-sm">delete</span></button>
                        </div>
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
