
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import ChatBot from './components/ChatBot';
import RetentionVoucher from './components/RetentionVoucher';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { Company, InvoiceItem, AppRoute, RetentionVoucher as VoucherType, UserProfile, UserRole, Supplier, CommunityTopic, CommunityComment, Plan } from './types';
import { analyzeInvoiceImage } from './lib/gemini';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  const menuGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        { route: AppRoute.DASHBOARD, icon: 'grid_view', label: 'Dashboard', show: isAdmin },
        { route: AppRoute.CREATE_RETENTION, icon: 'add_circle', label: 'Nueva Retención', show: true },
      ]
    },
    {
      title: 'VOUCHERS Y FISCAL',
      items: [
        { route: AppRoute.HISTORY, icon: 'history', label: 'Historial', show: true },
        { route: AppRoute.REPORTS, icon: 'analytics', label: 'Reportes', show: true },
      ]
    },
    {
      title: 'DIRECTORIO',
      items: [
        { route: AppRoute.SUPPLIERS, icon: 'contacts', label: 'Proveedores', show: true },
        { route: AppRoute.CREATE_COMPANY, icon: 'business', label: 'Empresas', show: isAdmin },
        { route: AppRoute.USER_MANAGEMENT, icon: 'group_add', label: 'Equipo', show: isAdmin },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { route: AppRoute.COMMUNITY, icon: 'forum', label: 'Comunidad', show: true },
        { route: AppRoute.SUBSCRIPTION, icon: 'card_membership', label: 'Plan & Suscripción', show: isAdmin },
        { route: AppRoute.SUPER_ADMIN, icon: 'admin_panel_settings', label: 'Super Admin', show: isSuperAdmin },
      ]
    }
  ];

  return (
    <div className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-72'} bg-[#0f172a] text-white flex-col h-screen fixed left-0 top-0 overflow-y-auto no-scrollbar print:hidden z-30 transition-all duration-300 shadow-2xl border-r border-slate-800`}>
      <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black tracking-tighter text-blue-400">RETEN<span className="text-white">FÁCIL</span></h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-lg border border-blue-500/20 uppercase tracking-widest">{userProfile?.subscription?.pricing_plan?.name || 'Gratis'}</span>
            </div>
          </div>
        )}
        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl">
          <span className="material-icons">{isCollapsed ? 'menu' : 'menu_open'}</span>
        </button>
      </div>

      <nav className="flex-1 px-4 mt-2 space-y-6 pb-8">
        {menuGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                  {group.title}
                </p>
              )}
              {visibleItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => { setRoute(item.route); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${currentRoute === item.route ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="material-icons text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        {!isCollapsed && (
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-sm">
                {userProfile?.first_name?.[0] || 'U'}
              </div>
              <div className="flex-1 truncate">
                <p className="font-bold text-sm truncate">{userProfile?.first_name || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{role}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className={`flex items-center gap-3 text-slate-400 hover:text-red-400 font-bold text-sm w-full p-3 rounded-2xl transition-all hover:bg-red-400/10 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="material-icons">logout</span>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>

        {!isCollapsed && (
          <div className="pt-2 text-center">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">v1.1 26-01</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileBottomNav = ({ currentRoute, setRoute, resetStates, role }: any) => {
  const isAdmin = role === 'admin' || role === 'super_admin';
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
          className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${tab.special
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
  const [plans, setPlans] = useState<Plan[]>([]);

  // Community States
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [topicComments, setTopicComments] = useState<CommunityComment[]>([]);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Wizard States
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

  // --- Search & Filters ---
  const [supplierListSearch, setSupplierListSearch] = useState('');
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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // --- Persistencia ---
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

  // --- Memoized Stats & Filtered Data ---
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return [];
    const q = supplierSearchQuery.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.rif.toLowerCase().includes(q));
  }, [suppliers, supplierSearchQuery]);

  const suppliersWithRank = useMemo(() => {
    const counts: Record<string, number> = {};
    generatedVouchers.forEach(v => { if (v.supplier?.id) counts[v.supplier.id] = (counts[v.supplier.id] || 0) + 1; });
    const sorted = [...suppliers].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    if (supplierListSearch.trim()) {
      const q = supplierListSearch.toLowerCase();
      return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.rif.toLowerCase().includes(q));
    }
    return sorted.slice(0, 6);
  }, [suppliers, generatedVouchers, supplierListSearch]);

  const filteredReportVouchers = useMemo(() => {
    return generatedVouchers.filter(v => {
      const dateMatch = (!reportStartDate || v.date >= reportStartDate) && (!reportEndDate || v.date <= reportEndDate);
      const companyMatch = !reportSelectedCompanyId || v.company?.id === reportSelectedCompanyId;
      const supplierMatch = !reportSelectedSupplierId || v.supplier?.id === reportSelectedSupplierId;
      return dateMatch && companyMatch && supplierMatch;
    });
  }, [generatedVouchers, reportStartDate, reportEndDate, reportSelectedCompanyId, reportSelectedSupplierId]);

  const dashboardStats = useMemo(() => {
    const totalRetained = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0);
    const totalIVA = generatedVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.taxAmount || 0), 0) || 0), 0);
    const supplierTotals: Record<string, { name: string, total: number }> = {};
    generatedVouchers.forEach(v => {
      if (v.supplier) {
        const amount = v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0;
        if (!supplierTotals[v.supplier.id]) supplierTotals[v.supplier.id] = { name: v.supplier.name, total: 0 };
        supplierTotals[v.supplier.id].total += amount;
      }
    });
    const topSuppliers = Object.values(supplierTotals).sort((a, b) => b.total - a.total).slice(0, 5);
    const chartLabels: string[] = [];
    const chartValues: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      chartLabels.push(d.toLocaleString('es-VE', { month: 'short' }).toUpperCase());
      const period = `${d.getFullYear()} ${String(d.getMonth() + 1).padStart(2, '0')}`;
      chartValues.push(generatedVouchers.filter(v => v.fiscalPeriod === period).reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0));
    }
    return { totalRetained, totalIVA, topSuppliers, chartLabels, chartValues, maxVal: Math.max(...chartValues, 1) };
  }, [generatedVouchers]);

  // --- States for actions ---
  const [isCreatingSubUser, setIsCreatingSubUser] = useState(false);
  const [editingSubUser, setEditingSubUser] = useState<UserProfile | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
  const [isEditingVoucherNum, setIsEditingVoucherNum] = useState(false);
  const [tempVoucherNum, setTempVoucherNum] = useState('');
  const [isUpdatingVoucherNum, setIsUpdatingVoucherNum] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({ transactionType: '01-reg', taxRate: 16, exemptAmount: 0, date: new Date().toISOString().split('T')[0] });

  // --- Supabase Data ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (!localStorage.getItem('last_route') || localStorage.getItem('last_route') === AppRoute.LANDING) setRoute(AppRoute.DASHBOARD);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          // We need to fetch profile first to know the role, but for now let's stick to last route or dashboard
          // The actual redirection happens in the loadData or effect below if role is super_admin
          setRoute((localStorage.getItem('last_route') as AppRoute) || AppRoute.DASHBOARD);
        }
      } else { setRoute(AppRoute.LANDING); setUserProfile(null); localStorage.clear(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      if (data.is_active === false) {
        await supabase.auth.signOut();
        alert("Tu cuenta ha sido suspendida. Contacta a soporte.");
        return;
      }
      setUserProfile(data);
      if (data.role === 'super_admin') setRoute(AppRoute.SUPER_ADMIN);
    }
  };

  const loadData = async () => {
    if (!userProfile) return;
    const adminId = (userProfile.role === 'admin' || userProfile.role === 'super_admin') ? userProfile.id : userProfile.admin_id;
    const { data: cos } = await supabase.from('companies').select('*').eq('user_id', adminId);
    if (cos) setCompanies(cos.map(c => ({ id: c.id, name: c.name, rif: c.rif, address: c.address, logoUrl: c.logo_url, signatureUrl: c.signature_url, stampUrl: c.stamp_url, lastCorrelationNumber: c.last_correlation_number || 1 })));
    const { data: sups } = await supabase.from('suppliers').select('*').eq('user_id', adminId);
    if (sups) setSuppliers(sups);
    const { data: rets } = await supabase.from('retentions').select('*, companies(*), suppliers(*)').eq('user_id', adminId).order('created_at', { ascending: false });
    if (rets) setGeneratedVouchers(rets.map(r => ({ id: r.id, voucherNumber: r.voucher_number, date: r.date, fiscalPeriod: r.fiscal_period, invoiceUrl: r.invoice_url, retentionPercentage: r.retention_percentage, company: r.companies, supplier: r.suppliers, items: r.items })));
    if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
      const { data: subsProf } = await supabase.from('profiles').select('*').eq('admin_id', userProfile.id);
      if (subsProf) setSubUsers(subsProf);

      const { data: plansData } = await supabase.from('plans').select('*').order('price');
      if (plansData) setPlans(plansData);
    }
    const { data: currentSub } = await supabase.from('subscriptions').select('*, pricing_plan:plans(*)').eq('user_id', adminId).single();
    if (currentSub) {
      setUserProfile(prev => prev ? ({ ...prev, subscription: currentSub }) : null);
    }
    fetchCommunityTopics();
  };

  const fetchCommunityTopics = async () => {
    const { data } = await supabase.from('community_topics').select('*, profiles(first_name, role)').order('created_at', { ascending: false });
    if (data) setTopics(data as any);
  };

  const fetchTopicComments = async (topicId: string) => {
    const { data } = await supabase.from('community_comments').select('*, profiles(first_name, role)').eq('topic_id', topicId).order('created_at', { ascending: true });
    if (data) setTopicComments(data as any);
  };

  useEffect(() => { if (userProfile) loadData(); }, [userProfile]);

  // --- Handlers ---
  const handleAddItem = () => {
    if (!newItem.invoiceNumber || !newItem.totalAmount) return alert("Faltan datos");
    const tr = newItem.taxRate || 16, ex = newItem.exemptAmount || 0, base = (newItem.totalAmount - ex) / (1 + tr / 100), tax = base * (tr / 100), ret = tax * (wizRetentionPercentage / 100);
    setWizItems([...wizItems, { id: Date.now().toString(), date: newItem.date || '', invoiceNumber: newItem.invoiceNumber, controlNumber: newItem.controlNumber || '00', transactionType: newItem.transactionType as any, totalAmount: newItem.totalAmount, exemptAmount: ex, taxBase: Number(base.toFixed(2)), taxRate: tr, taxAmount: Number(tax.toFixed(2)), retentionRate: wizRetentionPercentage, retentionAmount: Number(ret.toFixed(2)) }]);
    setNewItem({ ...newItem, invoiceNumber: '', controlNumber: '', totalAmount: 0 });
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0]; if (!file) return; setLastScannedFile(file); setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const json = await analyzeInvoiceImage((reader.result as string).split(',')[1]);
        const d = JSON.parse(json);

        if (!d.isInvoice) {
          if (d.error === "config_missing") {
            alert("⚠️ Error de Configuración: La API Key de Gemini no está configurada en el servidor. Por favor, contacta al administrador.");
          } else {
            alert("La imagen no parece ser una factura válida o está muy borrosa. Por favor, intenta con otra o ingresa los datos manualmente.");
          }
          setIsAnalyzing(false);
          return;
        }

        const s = suppliers.find(x => x.rif.replace(/\W/g, '').toUpperCase() === d.supplierRif?.replace(/\W/g, '').toUpperCase());
        if (s) {
          setSelectedSupplier(s);
          setSupplierSearchQuery(s.name);
          if (s.defaultRetentionRate) setWizRetentionPercentage(s.defaultRetentionRate);
        } else {
          setSelectedSupplier({ name: d.supplierName || '', rif: d.supplierRif || '', address: '' });
          setSupplierSearchQuery(d.supplierName || '');
        }

        setNewItem(p => ({ ...p, invoiceNumber: d.invoiceNumber, controlNumber: d.controlNumber, totalAmount: d.totalAmount, date: d.date }));

        if (d.invoiceNumber) {
          setWizStep(3);
        } else {
          alert("Se detectó la factura pero no pudimos extraer el número de factura. Podrás ingresarlo manualmente en el siguiente paso.");
          setWizStep(3);
        }
      } catch (err: any) {
        console.error("Error al procesar factura:", err);
        alert("Hubo un error al analizar la imagen: " + (err.message || "Error desconocido"));
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateVoucher = async () => {
    if (!userProfile || !selectedCompany || !selectedSupplier || !wizItems.length) {
      alert("Faltan datos críticos (Empresa, Proveedor o Facturas). Por favor verifica los pasos anteriores.");
      return;
    }

    try {
      const adminId = (userProfile.role === 'admin' || userProfile.role === 'super_admin') ? userProfile.id : userProfile.admin_id;
      let sId = selectedSupplier.id;

      // Si el proveedor es nuevo (no tiene ID), lo creamos primero
      if (!sId) {
        const { data: ns, error: sErr } = await supabase.from('suppliers').insert([{
          user_id: adminId,
          name: selectedSupplier.name,
          rif: selectedSupplier.rif,
          address: selectedSupplier.address || ''
        }]).select().single();

        if (sErr) throw new Error(`Error al crear proveedor: ${sErr.message}`);
        if (ns) sId = ns.id;
      }

      const now = new Date();
      const period = `${now.getFullYear()} ${String(now.getMonth() + 1).padStart(2, '0')}`;
      const vNum = editingVoucherId
        ? generatedVouchers.find(v => v.id === editingVoucherId)?.voucherNumber
        : `${period.replace(' ', '')}${String(selectedCompany.lastCorrelationNumber || 1).padStart(8, '0')}`;

      // Subir imagen si existe
      let url = '';
      if (lastScannedFile) {
        const filePath = `${vNum}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('facturas').upload(filePath, lastScannedFile);
        if (uploadErr) {
          console.warn("No se pudo subir la imagen, pero continuaremos guardando los datos:", uploadErr.message);
        } else if (uploadData) {
          url = supabase.storage.from('facturas').getPublicUrl(uploadData.path).data.publicUrl;
        }
      }

      const totals = wizItems.reduce((acc, item) => ({
        purchase: acc.purchase + (item.totalAmount || 0),
        tax: acc.tax + (item.taxAmount || 0),
        retained: acc.retained + (item.retentionAmount || 0)
      }), { purchase: 0, tax: 0, retained: 0 });

      const payload = {
        user_id: adminId,
        company_id: selectedCompany.id,
        supplier_id: sId,
        supplier_name: selectedSupplier.name,
        supplier_rif: selectedSupplier.rif,
        items: wizItems,
        voucher_number: vNum,
        control_number: wizItems[0]?.controlNumber || '00',
        invoice_url: url || (editingVoucherId ? generatedVouchers.find(v => v.id === editingVoucherId)?.invoiceUrl : ''),
        retention_percentage: wizRetentionPercentage,
        date: now.toISOString().split('T')[0],
        fiscal_period: period,
        fiscal_year: now.getFullYear().toString(),
        fiscal_month: String(now.getMonth() + 1).padStart(2, '0'),
        total_purchase: Number(totals.purchase.toFixed(2)),
        total_tax: Number(totals.tax.toFixed(2)),
        total_retained: Number(totals.retained.toFixed(2))
      };

      console.log("Intentando guardar comprobante:", payload);

      const { data, error: retErr } = editingVoucherId
        ? await supabase.from('retentions').update(payload).eq('id', editingVoucherId).select()
        : await supabase.from('retentions').insert([payload]).select();

      if (retErr) throw new Error(`Error al guardar retención: ${retErr.message}`);

      // Actualizar el correlativo de la empresa si es un voucher nuevo
      if (!editingVoucherId) {
        const { error: compErr } = await supabase
          .from('companies')
          .update({ last_correlation_number: (selectedCompany.lastCorrelationNumber || 1) + 1 })
          .eq('id', selectedCompany.id);
        if (compErr) console.error("Error actualizando correlativo:", compErr.message);
      }

      alert("¡Comprobante emitido con éxito!");
      await loadData();
      setRoute(AppRoute.HISTORY);
      resetStates();

    } catch (err: any) {
      console.error("Falla en generateVoucher:", err);
      alert(err.message || "Ocurrió un error inesperado al generar el comprobante.");
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault(); if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) return;
    setIsSavingCompany(true); const fd = new FormData(e.currentTarget as HTMLFormElement);
    const lf = fd.get('logo') as File, sf = fd.get('signature') as File, stf = fd.get('stamp') as File;
    let lu = editingCompany?.logoUrl || '', su = editingCompany?.signatureUrl || '', stu = editingCompany?.stampUrl || '';
    try {
      if (lf?.size) lu = supabase.storage.from('logos').getPublicUrl((await supabase.storage.from('logos').upload(`logo_${Date.now()}`, lf)).data!.path).data.publicUrl;
      if (sf?.size) su = supabase.storage.from('logos').getPublicUrl((await supabase.storage.from('logos').upload(`sig_${Date.now()}`, sf)).data!.path).data.publicUrl;
      if (stf?.size) stu = supabase.storage.from('logos').getPublicUrl((await supabase.storage.from('logos').upload(`stamp_${Date.now()}`, stf)).data!.path).data.publicUrl;
      const payload = { name: fd.get('name'), rif: fd.get('rif'), address: fd.get('address'), logo_url: lu, signature_url: su, stamp_url: stu, last_correlation_number: parseInt(fd.get('last_correlation_number') as string || "1") };
      const { error } = editingCompany ? await supabase.from('companies').update(payload).eq('id', editingCompany.id) : await supabase.from('companies').insert([{ ...payload, user_id: userProfile.id }]);
      if (error) throw error; loadData(); (e.currentTarget as HTMLFormElement).reset(); setEditingCompany(null); setLogoPreview(null); setSignaturePreview(null); setStampPreview(null); alert("Éxito");
    } catch (err: any) { alert(err.message); } finally { setIsSavingCompany(false); }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta empresa?")) return;
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
      loadData();
      if (selectedCompany?.id === id) { setSelectedCompany(null); localStorage.removeItem('wiz_company'); }
      alert("Empresa eliminada con éxito");
    } catch (err: any) { alert("Error al eliminar la empresa: " + err.message); }
  };

  const handleUpdateOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingProfile(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const firstName = formData.get('first_name') as string;
    const phone = formData.get('phone') as string;
    const newPassword = formData.get('new_password') as string;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          phone: phone,
        })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      if (newPassword && newPassword.trim() !== '') {
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (authError) throw authError;
      }

      setUserProfile({
        ...userProfile,
        first_name: firstName,
        phone: phone,
      });

      alert('Perfil actualizado con éxito');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    if (!userProfile?.subscription?.id) return alert("No se encontró una suscripción activa para actualizar.");
    if (!confirm("¿Estás seguro de que deseas cambiar a este plan?")) return;

    setIsUpgradingPlan(true);
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan_id: planId, status: 'active' })
      .eq('id', userProfile.subscription.id);

    if (error) {
      alert("Error al actualizar el plan: " + error.message);
    } else {
      alert("Plan actualizado con éxito. Refrescando datos...");
      await loadData();
    }
    setIsUpgradingPlan(false);
  };

  // --- Reportes y Exportación ---
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
      alert("Error al generar el PDF");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReportToCsv = () => {
    const headers = ["Fecha", "Comprobante", "Empresa", "Proveedor", "RIF", "Base Imponible", "IVA", "Retenido"];
    const rows = filteredReportVouchers.map(v => {
      const base = v.items?.reduce((acc, i) => acc + (i?.taxBase || 0), 0) || 0;
      const tax = v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0) || 0;
      const ret = v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0;
      return [
        v.date,
        v.voucherNumber,
        v.company?.name || 'N/A',
        v.supplier?.name || 'N/A',
        v.supplier?.rif || 'N/A',
        base.toFixed(2),
        tax.toFixed(2),
        ret.toFixed(2)
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Retenciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSavingSupplier(true);
    setIsSavingSupplier(true);
    const adminId = (userProfile.role === 'admin' || userProfile.role === 'super_admin') ? userProfile.id : userProfile.admin_id;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      user_id: adminId,
      name: fd.get('name') as string,
      rif: fd.get('rif') as string,
      address: fd.get('address') as string,
      defaultRetentionRate: parseInt(fd.get('defaultRetentionRate') as string) || 75
    };

    try {
      const { error } = editingSupplier
        ? await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id)
        : await supabase.from('suppliers').insert([payload]);

      if (error) throw error;
      loadData();
      setEditingSupplier(null);
      (e.currentTarget as HTMLFormElement).reset();
      alert("Proveedor guardado con éxito");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("¿Deseas eliminar este proveedor?")) return;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const resetStates = () => {
    setWizStep(1); setSelectedCompany(null); setSelectedSupplier(null); setSupplierSearchQuery(''); setWizItems([]); setEditingVoucherId(null);
    setEditingCompany(null); setLogoPreview(null); setSignaturePreview(null); setStampPreview(null);
  };

  const getPageTitle = (r: AppRoute) => {
    switch (r) {
      case AppRoute.DASHBOARD: return 'Dashboard';
      case AppRoute.CREATE_RETENTION: return 'Nueva Retención';
      case AppRoute.HISTORY: return 'Historial';
      case AppRoute.SUPPLIERS: return 'Proveedores';
      case AppRoute.COMMUNITY: return 'Comunidad';
      case AppRoute.PROFILE: return 'Perfil';
      case AppRoute.USER_MANAGEMENT: return 'Equipo';
      case AppRoute.CREATE_COMPANY: return 'Empresas';
      case AppRoute.REPORTS: return 'Reportes';
      default: return 'RetenFácil';
    }
  };

  if (loading) return null;
  if (!user || route === AppRoute.LANDING) return <LandingPage />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <MobileHeader title={getPageTitle(route)} />
      <MobileBottomNav currentRoute={route} setRoute={setRoute} resetStates={resetStates} role={userProfile?.role} />
      <Sidebar currentRoute={route} setRoute={setRoute} handleLogout={() => supabase.auth.signOut()} resetStates={resetStates} isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} role={userProfile?.role || 'operator'} />

      <main className={`flex-1 transition-all duration-300 pb-32 md:pb-8 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} p-4 md:p-8 overflow-x-hidden`}>

        {/* DASHBOARD PREMIUM */}
        {route === AppRoute.DASHBOARD && (
          <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pt-4 md:pt-0">
            {/* Header iBanKo Style */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 overflow-hidden relative group cursor-pointer">
                  {userProfile?.first_name?.[0] || 'S'}
                  <div className="absolute inset-0 bg-blue-400 mix-blend-overlay opacity-20"></div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Hola, {userProfile?.first_name || 'Steward'} 👋</h1>
                  <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-wide">Gestiona tu fiscalidad hoy</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <span className="material-icons text-xl">search</span>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <span className="material-icons text-xl">notifications</span>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <span className="material-icons text-xl">chat_bubble</span>
                </button>
                <button onClick={() => setRoute(AppRoute.SUBSCRIPTION)} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <span className="material-icons text-xl">settings</span>
                </button>
              </div>
            </header>

            {/* Quick Actions Card Style */}
            <div className="bg-[#0f172a] p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full -ml-16 -mb-16 blur-[40px]"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Acciones Rápidas</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Generar Nuevo Voucher</h2>
                  <p className="text-slate-400 mt-2 text-sm font-medium">Automatiza tus retenciones en menos de 2 minutos.</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <button onClick={() => setRoute(AppRoute.CREATE_RETENTION)} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                    <span className="material-icons text-indigo-600">add</span> Nueva Retención
                  </button>

                  {/* Plan Restricted Button Demo */}
                  <div className="relative group/btn">
                    <button className="bg-slate-800/80 text-slate-400 border border-slate-700 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 cursor-not-allowed">
                      <span className="material-icons text-slate-600">auto_awesome</span> Análisis IA
                      <span className="material-icons text-xs text-slate-600">lock</span>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl">
                      DISPONIBLE EN PLAN PRO 🚀
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Status iBanKo Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { l: 'Total Retenido', v: dashboardStats.totalRetained, i: 'payments', c: 'bg-emerald-50 text-emerald-600', route: AppRoute.REPORTS },
                { l: 'IVA Gestionado', v: dashboardStats.totalIVA, i: 'receipt_long', c: 'bg-indigo-50 text-indigo-600', route: AppRoute.REPORTS },
                { l: 'Proveedores', v: suppliers.length, i: 'person', c: 'bg-orange-50 text-orange-600', route: AppRoute.SUPPLIERS },
                { l: 'Vouchers Gen.', v: generatedVouchers.length, i: 'description', c: 'bg-blue-50 text-blue-600', route: AppRoute.HISTORY }
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setRoute(s.route)}
                  className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${s.c} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <span className="material-icons">{s.i}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">{s.l}</p>
                  <p className="text-2xl font-black text-slate-900">{typeof s.v === 'number' ? s.v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : s.v} {idx < 2 ? 'Bs' : ''}</p>
                  <div className="flex items-center gap-1 mt-3">
                    <span className="material-icons text-emerald-500 text-sm">trending_up</span>
                    <span className="text-[10px] font-black text-emerald-500 tracking-tight">10% este mes</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Secondary Section Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-xl text-slate-900">Retenciones Mensuales</h3>
                  <select className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest p-2 rounded-xl outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                    <option>Últimos 6 Meses</option>
                    <option>Este Año</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={(() => {
                      // Generar datos de los últimos 6 meses basados en vouchers reales
                      const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
                      const now = new Date();
                      const monthlyData = months.map((month, idx) => {
                        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
                        const monthVouchers = generatedVouchers.filter(v => {
                          const vDate = new Date(v.date);
                          return vDate.getMonth() === monthDate.getMonth() && vDate.getFullYear() === monthDate.getFullYear();
                        });

                        const totalRetained = monthVouchers.reduce((sum, v) =>
                          sum + (v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0), 0
                        );
                        const totalIVA = monthVouchers.reduce((sum, v) =>
                          sum + (v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0) || 0), 0
                        );
                        const totalBase = monthVouchers.reduce((sum, v) =>
                          sum + (v.items?.reduce((acc, i) => acc + (i?.taxBase || 0), 0) || 0), 0
                        );

                        return {
                          mes: month,
                          retenido: Math.round(totalRetained),
                          iva: Math.round(totalIVA),
                          base: Math.round(totalBase)
                        };
                      });
                      return monthlyData;
                    })()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRetenido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIVA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="mes"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '10px', fontWeight: 'bold' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`Bs ${value.toLocaleString('es-VE')}`, '']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey="retenido"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRetenido)"
                      name="Retenido"
                    />
                    <Area
                      type="monotone"
                      dataKey="iva"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIVA)"
                      name="IVA"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl text-slate-900">Proveedores</h3>
                  <button
                    onClick={() => setRoute(AppRoute.SUPPLIERS)}
                    className="text-[10px] font-black text-blue-600 uppercase cursor-pointer hover:underline"
                  >
                    Ver Todos
                  </button>
                </div>
                <div className="space-y-8">
                  {dashboardStats.topSuppliers.length > 0 ? dashboardStats.topSuppliers.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setRoute(AppRoute.SUPPLIERS)}
                      className="flex items-center gap-4 group w-full text-left hover:bg-slate-50 p-2 -m-2 rounded-2xl transition-all"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <span className="material-icons">business</span>
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-black text-sm text-slate-900 truncate tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total: Bs {s.total.toLocaleString()}</p>
                      </div>
                      <span className="material-icons text-slate-200 text-sm group-hover:text-indigo-600 transition-colors">chevron_right</span>
                    </button>
                  )) : (
                    <div className="text-center py-10">
                      <p className="text-slate-300 font-bold text-xs">Sin transacciones registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gráficos Adicionales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Gráfico de Barras - Comparativo por Empresa */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl text-slate-900">Retenciones por Empresa</h3>
                  <span className="material-icons text-slate-300">bar_chart</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={(() => {
                      // Agrupar retenciones por empresa
                      const companyData = companies.map(company => {
                        const companyVouchers = generatedVouchers.filter(v => v.company_id === company.id);
                        const totalRetained = companyVouchers.reduce((sum, v) =>
                          sum + (v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0), 0
                        );
                        const totalIVA = companyVouchers.reduce((sum, v) =>
                          sum + (v.items?.reduce((acc, i) => acc + (i?.taxAmount || 0), 0) || 0), 0
                        );
                        return {
                          empresa: company.name.substring(0, 15) + (company.name.length > 15 ? '...' : ''),
                          retenido: Math.round(totalRetained),
                          iva: Math.round(totalIVA),
                          vouchers: companyVouchers.length
                        };
                      }).filter(d => d.vouchers > 0).slice(0, 5);
                      return companyData.length > 0 ? companyData : [
                        { empresa: 'Sin datos', retenido: 0, iva: 0, vouchers: 0 }
                      ];
                    })()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="empresa"
                      stroke="#94a3b8"
                      style={{ fontSize: '10px', fontWeight: 'bold' }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '10px', fontWeight: 'bold' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`Bs ${value.toLocaleString('es-VE')}`, '']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                      iconType="circle"
                    />
                    <Bar dataKey="retenido" fill="#10b981" radius={[8, 8, 0, 0]} name="Retenido" />
                    <Bar dataKey="iva" fill="#6366f1" radius={[8, 8, 0, 0]} name="IVA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico Circular - Distribución por Proveedor */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xl text-slate-900">Top Proveedores</h3>
                  <span className="material-icons text-slate-300">pie_chart</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];
                        const supplierData = suppliers.map(supplier => {
                          const supplierVouchers = generatedVouchers.filter(v => v.supplier_id === supplier.id);
                          const totalRetained = supplierVouchers.reduce((sum, v) =>
                            sum + (v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0), 0
                          );
                          return {
                            name: supplier.name.substring(0, 20) + (supplier.name.length > 20 ? '...' : ''),
                            value: Math.round(totalRetained),
                            vouchers: supplierVouchers.length
                          };
                        }).filter(d => d.value > 0)
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 5);

                        return supplierData.length > 0 ? supplierData.map((item, index) => ({
                          ...item,
                          fill: COLORS[index % COLORS.length]
                        })) : [
                          { name: 'Sin datos', value: 1, fill: '#e2e8f0' }
                        ];
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {(() => {
                        const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return suppliers.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ));
                      })()}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                      formatter={(value: number) => [`Bs ${value.toLocaleString('es-VE')}`, 'Retenido']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      iconType="circle"
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* NUEVA RETENCIÓN (Wizard) */}
        {route === AppRoute.CREATE_RETENTION && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div><h2 className="text-3xl font-black">{editingVoucherId ? 'Editar' : 'Nueva'} Retención</h2><p className="text-slate-500">Completa los 3 pasos.</p></div>
              <div className="flex items-center gap-4">
                <button onClick={resetStates} className="text-xs font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1 uppercase tracking-tighter">
                  <span className="material-icons text-sm">restart_alt</span> Reiniciar
                </button>
                <div className="flex gap-2">{[1, 2, 3].map(s => (<div key={s} className={`h-2 rounded-full transition-all duration-300 ${wizStep >= s ? 'w-10 bg-blue-600' : 'w-4 bg-slate-200'}`}></div>))}</div>
              </div>
            </div>

            {wizStep === 1 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-bold text-xl mb-6">1. Empresa Emisora</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companies.length > 0 ? companies.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCompany(c); setWizStep(2); }} className="text-left p-6 border-2 border-slate-50 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group">
                      <div className="truncate"><p className="font-bold group-hover:text-blue-700 truncate">{c.name}</p><p className="text-xs text-slate-400">RIF: {c.rif}</p></div>
                      <span className="material-icons text-slate-300 group-hover:text-blue-500">chevron_right</span>
                    </button>
                  )) : <div className="col-span-2 text-center py-10"><p className="text-slate-400">No tienes empresas registradas.</p><button onClick={() => setRoute(AppRoute.CREATE_COMPANY)} className="text-blue-600 font-bold mt-2 hover:underline">Ir a Empresas</button></div>}
                </div>
              </div>
            )}

            {wizStep === 2 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden min-h-[400px]">
                {isAnalyzing && <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-bold text-blue-600">IA Analizando factura...</p></div>}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                  <h3 className="font-bold text-xl">2. Proveedor</h3>
                  <div className="relative group"><input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" /><button className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><span className="material-icons">auto_awesome</span> Escanear Factura</button></div>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Buscar Proveedor</label>
                    <div className="relative">
                      <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                        <span className="material-icons text-slate-400 ml-4">search</span>
                        <input type="text" className="w-full p-4 outline-none text-sm font-semibold text-slate-700" placeholder="Escribe nombre o RIF..." value={supplierSearchQuery} onChange={(e) => { setSupplierSearchQuery(e.target.value); setShowSupplierResults(true); }} onFocus={() => setShowSupplierResults(true)} />
                      </div>
                      {showSupplierResults && supplierSearchQuery.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-60 overflow-y-auto animate-fade-in divide-y divide-slate-50">
                          {filteredSuppliers.length ? filteredSuppliers.map(s => (
                            <button key={s.id} onClick={() => { setSelectedSupplier(s); if (s.defaultRetentionRate) setWizRetentionPercentage(s.defaultRetentionRate as 75 | 100); setSupplierSearchQuery(s.name); setShowSupplierResults(false); }} className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between transition-all">
                              <div><p className="font-bold text-slate-800">{s.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">RIF: {s.rif}</p></div>
                              <span className="material-icons text-slate-300">add_circle_outline</span>
                            </button>
                          )) : <div className="p-6 text-center text-slate-400 italic">No encontrado. Se creará uno nuevo.</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">RIF</label><input value={selectedSupplier?.rif || ''} onChange={e => setSelectedSupplier({ ...selectedSupplier, rif: e.target.value })} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Razón Social</label><input value={selectedSupplier?.name || ''} onChange={e => setSelectedSupplier({ ...selectedSupplier, name: e.target.value })} placeholder="Nombre de la empresa" className="w-full bg-slate-50 border-none p-4 rounded-2xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" /></div>
                  </div>
                  <div className="flex justify-between pt-8 border-t">
                    <button onClick={() => setWizStep(1)} className="text-slate-400 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl">Atrás</button>
                    <button onClick={() => (selectedSupplier?.name && selectedSupplier?.rif) ? setWizStep(3) : alert("Completa los datos")} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-md">Siguiente</button>
                  </div>
                </div>
              </div>
            )}

            {wizStep === 3 && selectedCompany && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div><h3 className="font-bold text-lg flex items-center gap-2"><span className="material-icons text-blue-600">receipt</span>Detalles de Facturas</h3><p className="text-xs text-slate-400 mt-1">Proveedor: {selectedSupplier?.name}</p></div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setWizRetentionPercentage(75)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 75 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>75%</button>
                      <button onClick={() => setWizRetentionPercentage(100)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${wizRetentionPercentage === 100 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>100%</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Fecha</label><input type="date" value={newItem.date || ''} onChange={e => setNewItem({ ...newItem, date: e.target.value })} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">N° Factura</label><input value={newItem.invoiceNumber || ''} onChange={e => setNewItem({ ...newItem, invoiceNumber: e.target.value })} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">N° Control</label><input value={newItem.controlNumber || ''} onChange={e => setNewItem({ ...newItem, controlNumber: e.target.value })} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" /></div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1 w-full"><label className="text-[10px] font-bold text-slate-400 uppercase">Monto Total (Bs)</label><input type="number" value={newItem.totalAmount || ''} onChange={e => setNewItem({ ...newItem, totalAmount: parseFloat(e.target.value) })} placeholder="0.00" className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg" /></div>
                    <button onClick={handleAddItem} className="w-full md:w-auto bg-blue-600 text-white px-8 h-[52px] rounded-xl font-black flex items-center justify-center gap-2 transition-all hover:bg-blue-700"><span className="material-icons">add</span> Agregar</button>
                  </div>
                </div>

                {wizItems.length > 0 && (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                    <h4 className="font-bold text-sm text-slate-500 uppercase mb-4">Facturas en este comprobante</h4>
                    <div className="space-y-3">
                      {wizItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div><p className="font-black text-slate-900">#{item.invoiceNumber}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IVA Retenido: {item.retentionAmount.toLocaleString('es-VE')} Bs</p></div>
                          <div className="flex items-center gap-4"><span className="font-black text-blue-600 text-lg">{item.totalAmount.toLocaleString('es-VE')} Bs</span><button onClick={() => setWizItems(wizItems.filter(i => i.id !== item.id))} className="w-10 h-10 bg-white text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"><span className="material-icons text-sm">delete</span></button></div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total a Retener</p><p className="text-3xl font-black text-slate-900">{wizItems.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0).toLocaleString('es-VE')} <span className="text-lg text-slate-400">Bs</span></p></div>
                      <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => { resetStates(); setRoute(AppRoute.HISTORY); }} className="flex-1 md:flex-none border border-slate-200 text-slate-400 px-8 py-5 rounded-[2rem] font-bold hover:bg-slate-50">Cancelar</button>
                        <button onClick={generateVoucher} className="flex-1 md:flex-none bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"><span className="material-icons">task_alt</span> Emitir Comprobante</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {route === AppRoute.HISTORY && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-3xl font-black">Historial de Comprobantes</h2>
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Comprobante</th>
                    <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Empresa</th>
                    <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Proveedor</th>
                    <th className="p-6 font-bold text-slate-400 uppercase text-[10px]">Retenido</th>
                    <th className="p-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {generatedVouchers.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-all group">
                      <td className="p-6 font-bold text-blue-600">{v.voucherNumber}</td>
                      <td className="p-6 font-medium text-slate-500">{v.company?.name}</td>
                      <td className="p-6 font-bold">{v.supplier?.name}</td>
                      <td className="p-6 font-black">{v.items?.reduce((acc: number, i: any) => acc + (i?.retentionAmount || 0), 0).toLocaleString('es-VE')} Bs</td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setCurrentVoucher(v); setRoute(AppRoute.VIEW_RETENTION); }} className="w-9 h-9 bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all inline-flex items-center justify-center shadow-sm"><span className="material-icons text-sm">visibility</span></button>
                          <button onClick={() => { setEditingVoucherId(v.id); setSelectedCompany(v.company); setSelectedSupplier(v.supplier); setWizItems(v.items); setWizStep(3); setRoute(AppRoute.CREATE_RETENTION); }} className="w-9 h-9 bg-slate-100 text-slate-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all inline-flex items-center justify-center shadow-sm"><span className="material-icons text-sm">edit</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMUNIDAD */}
        {route === AppRoute.COMMUNITY && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <div><h2 className="text-3xl font-black">Comunidad & Soporte</h2><p className="text-slate-500">Comparte dudas fiscales o sugerencias.</p></div>
              {!selectedTopic && <button onClick={() => setIsCreatingTopic(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"><span className="material-icons">add_comment</span> Nuevo Tema</button>}
              {selectedTopic && <button onClick={() => setSelectedTopic(null)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2"><span className="material-icons">arrow_back</span> Volver</button>}
            </div>
            {!selectedTopic && topics.map(t => (
              <button key={t.id} onClick={() => { setSelectedTopic(t); fetchTopicComments(t.id); }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-6 w-full text-left">
                <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0"><span className="material-icons text-3xl">chat_bubble_outline</span></div>
                <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100 text-blue-600">{t.category}</span><span className="text-slate-400 text-xs">• {new Date(t.created_at).toLocaleDateString()}</span></div><h4 className="font-black text-slate-800 text-lg">{t.title}</h4><p className="text-slate-500 text-sm line-clamp-1">{t.content}</p></div>
                <span className="material-icons text-slate-200">chevron_right</span>
              </button>
            ))}
            {selectedTopic && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-3xl font-black mb-4">{selectedTopic.title}</h3>
                  <p className="text-slate-700 text-lg whitespace-pre-wrap">{selectedTopic.content}</p>
                </div>
                <div className="pl-8 space-y-4">
                  {topicComments.map(c => (<div key={c.id} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm"><div className="flex justify-between mb-2"><span className="font-black text-sm">{c.profiles?.first_name}</span><span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span></div><p className="text-slate-700">{c.content}</p></div>))}
                  <form onSubmit={async (e) => { e.preventDefault(); const content = new FormData(e.target as any).get('c') as string; if (!content) return; await supabase.from('community_comments').insert([{ topic_id: selectedTopic.id, user_id: userProfile?.id, content }]); (e.target as any).reset(); fetchTopicComments(selectedTopic.id); }} className="flex gap-4"><input name="c" placeholder="Escribe una respuesta..." className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" /><button className="bg-slate-900 text-white px-8 rounded-2xl font-bold">Enviar</button></form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MI EQUIPO */}
        {route === AppRoute.USER_MANAGEMENT && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl font-black">Mi Equipo (Operadores)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-fit">
                <h3 className="font-bold text-lg mb-6">Nuevo Acceso</h3>
                <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); const email = fd.get('e') as string, pass = fd.get('p') as string, name = fd.get('n') as string; const { data } = await supabase.auth.signUp({ email, password: pass }); if (data.user) { await supabase.from('profiles').insert([{ id: data.user.id, email, first_name: name, role: 'operator', admin_id: userProfile?.id }]); loadData(); (e.currentTarget as any).reset(); alert("Acceso creado"); } }} className="space-y-4">
                  <input name="n" placeholder="Nombre" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
                  <input name="e" type="email" placeholder="Email" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
                  <input name="p" type="password" placeholder="Clave temporal" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
                  <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold">Crear Operador</button>
                </form>
              </div>
              <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left"><thead className="bg-slate-50"><tr className="text-[10px] font-bold text-slate-400 uppercase"><th className="p-6">Nombre</th><th className="p-6">Email</th><th className="p-6">Rol</th><th className="p-6 text-center">Acciones</th></tr></thead><tbody className="divide-y">{subUsers.map(u => (<tr key={u.id} className="hover:bg-slate-50"><td className="p-6 font-bold">{u.first_name}</td><td className="p-6">{u.email}</td><td className="p-6"><span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Operador</span></td><td className="p-6 text-center"><button onClick={async () => { if (confirm("¿Eliminar?")) { await supabase.from('profiles').delete().eq('id', u.id); loadData(); } }} className="text-red-400 hover:text-red-600"><span className="material-icons">delete</span></button></td></tr>))}</tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* EMPRESAS */}
        {route === AppRoute.CREATE_COMPANY && (
          <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
            <header><h2 className="text-3xl font-black">Mis Empresas (Agentes)</h2><p className="text-slate-500">Configura tus sellos, firmas y logos para los comprobantes.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
                <h3 className="font-bold text-lg mb-6">{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
                <form key={editingCompany?.id || 'new'} onSubmit={handleCreateCompany} className="space-y-4">
                  <input required name="name" defaultValue={editingCompany?.name || ''} placeholder="Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                  <input required name="rif" defaultValue={editingCompany?.rif || ''} placeholder="RIF (J-12345678-0)" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                  <textarea required name="address" defaultValue={editingCompany?.address || ''} placeholder="Dirección Fiscal" className="w-full bg-slate-50 border-none p-4 rounded-2xl h-24 focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                  <div className="space-y-4 pt-2">
                    {[{ l: 'Logo', n: 'logo', p: logoPreview, set: setLogoPreview }, { l: 'Firma', n: 'signature', p: signaturePreview, set: setSignaturePreview }, { l: 'Sello', n: 'stamp', p: stampPreview, set: setStampPreview }].map(f => (
                      <div key={f.n} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{f.l}</label>
                          <input type="file" name={f.n} accept="image/*" className="w-full text-[10px]" onChange={(e) => { const file = e.target.files?.[0]; if (file) f.set(URL.createObjectURL(file)); }} /></div>
                        {f.p && <img src={f.p} className="w-12 h-12 object-contain bg-white rounded-lg p-1 border shadow-sm" alt="Preview" />}
                      </div>
                    ))}
                  </div>
                  <input required type="number" name="last_correlation_number" defaultValue={editingCompany?.lastCorrelationNumber || 1} placeholder="Próximo Correlativo" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                  <div className="flex gap-3">
                    <button type="submit" disabled={isSavingCompany} className="flex-1 bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">{isSavingCompany ? 'Guardando...' : editingCompany ? 'Actualizar' : 'Registrar'}</button>
                    {editingCompany && <button type="button" onClick={() => resetStates()} className="bg-slate-200 text-slate-600 rounded-2xl font-bold px-6 py-4">Cancelar</button>}
                  </div>
                </form>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">Empresas Registradas</h3>
                {companies.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative flex gap-4 items-center group">
                    {c.logoUrl && <img src={c.logoUrl} className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1" />}
                    <div className="flex-1"><h4 className="font-black text-slate-800 line-clamp-1 pr-16">{c.name}</h4><p className="text-blue-600 font-bold text-xs uppercase">RIF: {c.rif}</p>
                      <div className="flex gap-1 mt-2">
                        {c.signatureUrl && <span className="text-[7px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold border border-green-100 uppercase">Firma OK</span>}
                        {c.stampUrl && <span className="text-[7px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100 uppercase">Sello OK</span>}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingCompany(c); setLogoPreview(c.logoUrl || null); setSignaturePreview(c.signatureUrl || null); setStampPreview(c.stampUrl || null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-slate-400 hover:text-blue-500 p-2"><span className="material-icons text-sm">edit</span></button>
                      <button onClick={() => handleDeleteCompany(c.id)} className="text-slate-300 hover:text-red-500 p-2"><span className="material-icons text-sm">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REPORTES */}
        {route === AppRoute.REPORTS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Reportes Fiscales</h2>
                <p className="text-slate-500">Analiza y exporta tus retenciones.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={exportReportToCsv} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all">
                  <span className="material-icons">table_view</span> Excel / CSV
                </button>
                <button onClick={exportReportToPdf} disabled={isGeneratingReport} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-all">
                  <span className="material-icons">picture_as_pdf</span> {isGeneratingReport ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </header>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end no-print">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1">Desde</label>
                <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1">Hasta</label>
                <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1">Empresa</label>
                <select value={reportSelectedCompanyId} onChange={e => setReportSelectedCompanyId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none">
                  <option value="">Todas las Empresas</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1">Proveedor</label>
                <select value={reportSelectedSupplierId} onChange={e => setReportSelectedSupplierId(e.target.value)} className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none">
                  <option value="">Todos los Proveedores</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Contenido del Reporte (Ref para PDF) */}
            <div ref={reportRef} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
              <div className="flex justify-between items-start border-b pb-8 mb-8">
                <div>
                  {reportSelectedCompanyId && (
                    <div className="flex items-center gap-4">
                      {companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl && (
                        <img src={companies.find(c => c.id === reportSelectedCompanyId)?.logoUrl} className="h-16 w-auto object-contain" />
                      )}
                      <div>
                        <h1 className="text-2xl font-black text-slate-900">{companies.find(c => c.id === reportSelectedCompanyId)?.name}</h1>
                        <p className="text-sm font-bold text-blue-600">RIF: {companies.find(c => c.id === reportSelectedCompanyId)?.rif}</p>
                      </div>
                    </div>
                  )}
                  {!reportSelectedCompanyId && <h1 className="text-2xl font-black text-slate-900">Reporte Consolidado de Retenciones</h1>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Generado el</p>
                  <p className="font-bold">{new Date().toLocaleDateString('es-VE')}</p>
                </div>
              </div>

              {/* Resumen en Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase mb-1">Total Comprobantes</p>
                  <p className="text-3xl font-black">{filteredReportVouchers.length}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-bold uppercase mb-1">Base Imponible (Bs)</p>
                  <p className="text-3xl font-black">{filteredReportVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.taxBase || 0), 0) || 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Total Retenido (Bs)</p>
                  <p className="text-3xl font-black text-blue-600">{filteredReportVouchers.reduce((acc, v) => acc + (v.items?.reduce((sum, i) => sum + (i?.retentionAmount || 0), 0) || 0), 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Tabla del reporte */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="py-4 text-[10px] font-bold uppercase">Fecha</th>
                      <th className="py-4 text-[10px] font-bold uppercase">N° Voucher</th>
                      <th className="py-4 text-[10px] font-bold uppercase">Proveedor</th>
                      <th className="py-4 text-[10px] font-bold uppercase text-right">Retenido (Bs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredReportVouchers.length > 0 ? filteredReportVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50">
                        <td className="py-4 text-xs font-bold text-slate-600">{v.date}</td>
                        <td className="py-4 text-xs font-black text-blue-600">{v.voucherNumber}</td>
                        <td className="py-4">
                          <p className="text-xs font-bold text-slate-800">{v.supplier?.name || 'N/A'}</p>
                          <p className="text-[9px] text-slate-400 uppercase">{v.supplier?.rif || 'N/A'}</p>
                        </td>
                        <td className="py-4 text-xs font-black text-right text-slate-900">
                          {(v.items?.reduce((acc, i) => acc + (i?.retentionAmount || 0), 0) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 font-medium italic">No se encontraron retenciones con los filtros aplicados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PROVEEDORES */}
        {route === AppRoute.SUPPLIERS && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-3xl font-black">Directorio de Proveedores</h2>
              <div className="w-full md:w-80 relative group">
                <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <span className="material-icons text-slate-400 ml-4">search</span>
                  <input type="text" className="w-full p-4 outline-none text-sm font-semibold text-slate-700" placeholder="Buscar por Nombre o RIF..." value={supplierListSearch} onChange={(e) => setSupplierListSearch(e.target.value)} />
                </div>
              </div>
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
                      <label className="text-[10px] font-bold uppercase ml-1 block mb-1">Razón Social</label>
                      <input required name="name" defaultValue={editingSupplier?.name} placeholder="Nombre o Razón Social" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1 block mb-1">RIF</label>
                      <input required name="rif" defaultValue={editingSupplier?.rif} placeholder="J-12345678-0" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1 block mb-1">Dirección (Opcional)</label>
                      <textarea name="address" defaultValue={editingSupplier?.address} className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase ml-1 block mb-1">Retención Defecto</label>
                      <select name="defaultRetentionRate" defaultValue={editingSupplier?.defaultRetentionRate || 75} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold appearance-none">
                        <option value="75">75% (General)</option>
                        <option value="100">100% (No Contribuyente)</option>
                      </select>
                    </div>
                    <button type="submit" disabled={isSavingSupplier} className="w-full bg-slate-900 text-white rounded-2xl font-bold py-4 hover:bg-blue-600 transition-all shadow-lg">
                      {isSavingSupplier ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Registrar'}
                    </button>
                    {editingSupplier && (
                      <button type="button" onClick={() => setEditingSupplier(null)} className="w-full bg-slate-200 text-slate-600 rounded-2xl font-bold py-3 mt-2">Cancelar Edición</button>
                    )}
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase px-4">{supplierListSearch ? 'Resultados' : 'Más Activos'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suppliersWithRank.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md group transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <span className="material-icons text-xl">business_center</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingSupplier(s)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                            <span className="material-icons text-xs">edit</span>
                          </button>
                          <button onClick={() => handleDeleteSupplier(s.id)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                            <span className="material-icons text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">{s.name}</h3>
                      <p className="text-blue-600 font-bold text-xs uppercase tracking-tight">RIF: {s.rif}</p>
                    </div>
                  ))}
                  {suppliersWithRank.length === 0 && (
                    <div className="col-span-2 py-20 text-center text-slate-400 italic">No se encontraron proveedores registrados.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {route === AppRoute.VIEW_RETENTION && currentVoucher && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="w-full max-w-4xl flex justify-between mb-8 no-print">
              <button onClick={() => setRoute(AppRoute.HISTORY)} className="bg-white border p-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all"><span className="material-icons">arrow_back</span> Volver al Historial</button>
            </div>
            <RetentionVoucher data={currentVoucher} />
          </div>
        )}

        {route === AppRoute.PROFILE && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-black mb-8">Mi Perfil</h2>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <form onSubmit={handleUpdateOwnProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nombre</label><input name="first_name" defaultValue={userProfile?.first_name} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Teléfono</label><input name="phone" defaultValue={userProfile?.phone} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" /></div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nueva Contraseña (Opcional)</label><input name="new_password" type="password" className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Dejar en blanco para mantener actual" /></div>
                <button disabled={isSavingProfile} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">{isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}</button>
              </form>
            </div>
          </div>
        )}


        {/* SUPER ADMIN DASHBOARD */}
        {route === AppRoute.SUPER_ADMIN && userProfile?.role === 'super_admin' && (
          <SuperAdminDashboard />
        )}

        {route === AppRoute.SUBSCRIPTION && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
            <header>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mi Suscripción</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Detalles del plan y facturación</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Current Plan Card */}
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>

                  <div className="relative z-10">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6">Plan Actual</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-black text-slate-900">{userProfile?.subscription?.pricing_plan?.name || 'Gratis'}</p>
                        <p className="text-slate-400 font-medium mt-1">Bs {(userProfile?.subscription?.pricing_plan?.price || 0).toLocaleString()} / mes</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight">
                        {userProfile?.subscription?.status === 'active' ? 'Estado: Activo' : 'Estado: Pendiente'}
                      </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registro</p>
                        <p className="font-bold text-slate-900">{userProfile?.subscription?.start_date ? new Date(userProfile.subscription.start_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo Vencimiento</p>
                        <p className="font-bold text-slate-900">{userProfile?.subscription?.end_date ? new Date(userProfile.subscription.end_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features checklist */}
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-8">Incluido en tu plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userProfile?.subscription?.pricing_plan?.features ? Object.entries(userProfile.subscription.pricing_plan.features).map(([k, v]) => {
                      const featureNames: Record<string, string> = {
                        ai_invoice_analysis: 'Análisis de Facturas con IA',
                        ai_copilot: 'Asistente Fiscal Co-Pilot',
                        custom_branding: 'Marca Personalizada',
                        team_collaboration: 'Colaboración en Equipo',
                        advanced_reports: 'Reportes Avanzados',
                        priority_support: 'Soporte Prioritario'
                      };
                      return (
                        <div key={k} className="flex items-center gap-3 text-sm font-medium">
                          <span className={`material-icons text-sm ${v ? 'text-blue-400' : 'text-slate-600'}`}>
                            {v ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={v ? 'text-white' : 'text-slate-500'}>{featureNames[k] || k.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                      );
                    }) : <p className="text-slate-500 text-sm">No hay características definidas.</p>}
                  </div>
                </div>
              </div>

              {/* Quick Info Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons text-3xl">help_outline</span>
                  </div>
                  <h4 className="font-black text-slate-900">¿Necesitas Ayuda?</h4>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Si tienes dudas sobre tu facturación o plan actual.</p>
                  <button className="w-full bg-slate-50 text-slate-900 font-black text-xs py-3 rounded-xl mt-6 hover:bg-slate-100 transition-colors uppercase tracking-widest">Contactar Soporte</button>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="font-black">Upgrade Sugerido</h4>
                    <p className="text-xs text-indigo-100 mt-2 font-medium">Desbloquea análisis de IA avanzado y soporte prioritario.</p>
                    <button className="bg-white text-indigo-600 font-black text-xs py-3 px-6 rounded-xl mt-6 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Ver Todos los Planes</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Plans Section */}
            <section className="pt-10 space-y-8">
              <div className="flex items-end justify-between px-2">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Planes Disponibles</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Escala tu negocio con RetenFácil</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => {
                  const isCurrent = userProfile?.subscription?.plan_id === plan.id;
                  return (
                    <div key={plan.id} className={`bg-white p-8 rounded-[2.5rem] border ${isCurrent ? 'border-blue-500 shadow-blue-50' : 'border-slate-100'} shadow-sm relative group hover:shadow-xl transition-all duration-300`}>
                      {isCurrent && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Actual</span>
                      )}
                      <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">Bs {plan.price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ mes</span>
                      </div>
                      <div className="mt-8 space-y-4">
                        {Object.entries(plan.features || {}).slice(0, 4).map(([k, v]) => {
                          const featureNamesShort: Record<string, string> = {
                            ai_invoice_analysis: 'Análisis IA',
                            ai_copilot: 'Co-Pilot IA',
                            custom_branding: 'Marca Propia',
                            team_collaboration: 'Multi-usuario',
                            advanced_reports: 'Reportes Pro',
                            priority_support: 'Soporte 24/7'
                          };
                          return (
                            <div key={k} className="flex items-center gap-2">
                              <span className={`material-icons text-sm ${v ? 'text-blue-500' : 'text-slate-200'}`}>{v ? 'check_circle' : 'block'}</span>
                              <span className={`text-[10px] font-black uppercase tracking-tight ${v ? 'text-slate-600' : 'text-slate-300'}`}>{featureNamesShort[k] || k}</span>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handleUpgradePlan(plan.id)}
                        disabled={isCurrent || isUpgradingPlan}
                        className={`w-full mt-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isCurrent ? 'bg-slate-50 text-slate-400 cursor-default' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg active:scale-95'}`}
                      >
                        {isCurrent ? 'Tu Plan' : (isUpgradingPlan ? 'Actualizando...' : 'Cambiar a este Plan')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        <ChatBot userProfile={userProfile} companies={companies} recentVouchers={generatedVouchers} />
      </main>
    </div>
  );
};

export default App;
