
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan, UserProfile, Subscription } from '../types';

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'users' | 'subscriptions'>('overview');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isEditingPlan, setIsEditingPlan] = useState<Plan | null>(null);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubscription && !isCreatingSubscription) return;

        const fd = new FormData(e.target as HTMLFormElement);
        const payload: any = {
            start_date: fd.get('start_date'),
            end_date: fd.get('end_date'),
            payment_status: fd.get('payment_status'),
            payment_method: fd.get('payment_method'),
            payment_reference: fd.get('payment_reference'),
            notes: fd.get('notes'),
        };

        const file = fd.get('payment_proof') as File;
        if (file?.size) {
            const { data } = await supabase.storage.from('pagos').upload(`proof_${Date.now()}`, file);
            if (data) {
                const { data: publicUrl } = supabase.storage.from('pagos').getPublicUrl(data.path);
                payload.payment_proof_url = publicUrl.publicUrl;
            }
        }

        let error;
        if (isCreatingSubscription) {
            const userId = fd.get('user_id') as string;
            const planId = fd.get('plan_id') as string;
            if (!userId || !planId) return alert("Seleccione usuario y plan");

            // Check if exists
            const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single();

            if (existing) {
                // Update existing to be active/new plan instead of duplicate
                payload.plan_id = planId;
                payload.status = 'active';
                const res = await supabase.from('subscriptions').update(payload).eq('id', existing.id);
                error = res.error;
            } else {
                payload.user_id = userId;
                payload.plan_id = planId;
                payload.status = 'active';
                const res = await supabase.from('subscriptions').insert([payload]);
                error = res.error;
            }
        } else if (editingSubscription) {
            const res = await supabase.from('subscriptions').update(payload).eq('id', editingSubscription.id);
            error = res.error;
        }

        if (!error) {
            alert(isCreatingSubscription ? "Suscripción creada/actualizada" : "Suscripción actualizada");
            setEditingSubscription(null);
            setIsCreatingSubscription(false);
            loadData();
        } else {
            alert("Error: " + error.message);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: plansData } = await supabase.from('plans').select('*').order('price');
            if (plansData) setPlans(plansData);

            const { data: usersData } = await supabase.from('profiles').select('*');
            if (usersData) setUsers(usersData);

            const { data: subsData } = await supabase.from('subscriptions').select('*, pricing_plan:plans(*)');
            if (subsData) setSubscriptions(subsData as any);

        } catch (error) {
            console.error('Error loading super admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const payload = {
            name: fd.get('name'),
            price: parseFloat(fd.get('price') as string),
            features: {
                ai_invoice_analysis: fd.get('feat_ai_invoice_analysis') === 'on',
                ai_copilot: fd.get('feat_ai_copilot') === 'on',
                custom_branding: fd.get('feat_custom_branding') === 'on',
                team_collaboration: fd.get('feat_team_collaboration') === 'on',
                advanced_reports: fd.get('feat_advanced_reports') === 'on',
                priority_support: fd.get('feat_priority_support') === 'on',
            },
            limits: {
                max_companies: parseInt(fd.get('limit_max_companies') as string) || 0,
                max_users: parseInt(fd.get('limit_max_users') as string) || 0,
                max_vouchers: parseInt(fd.get('limit_max_vouchers') as string) || 0,
            },
        };

        try {
            const { error } = isEditingPlan
                ? await supabase.from('plans').update(payload).eq('id', isEditingPlan.id)
                : await supabase.from('plans').insert([payload]);

            if (error) throw error;
            alert('Plan guardado éxitosamente');
            setIsCreatingPlan(false);
            setIsEditingPlan(null);
            loadData();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('¿Eliminar plan?')) return;
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (!error) loadData();
    };

    const handleAssignPlan = async (userId: string, planId: string) => {
        // Check if sub exists
        const existingSub = subscriptions.find(s => s.user_id === userId);

        if (existingSub) {
            await supabase.from('subscriptions').update({ plan_id: planId, status: 'active' }).eq('id', existingSub.id);
        } else {
            await supabase.from('subscriptions').insert([{ user_id: userId, plan_id: planId, status: 'active' }]);
        }
        loadData();
    };

    if (loading) return <div className="p-10 text-center">Cargando panel de control...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-900 overflow-x-hidden">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Super Admin</h1>
                    <p className="text-slate-500 font-medium">Gestión global del sistema.</p>
                </div>
                <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto no-scrollbar">
                    {(['overview', 'plans', 'users', 'subscriptions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </header>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuarios Totales</p>
                        <p className="text-4xl font-black mt-2">{users.length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suscripciones Activas</p>
                        <p className="text-4xl font-black mt-2 text-green-600">{subscriptions.filter(s => s.status === 'active').length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planes Disponibles</p>
                        <p className="text-4xl font-black mt-2 text-blue-600">{plans.length}</p>
                    </div>
                </div>
            )}

            {/* PLANS TAB */}
            {activeTab === 'plans' && (
                <div className="animate-fade-in space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">Planes y Precios</h2>
                        <button onClick={() => setIsCreatingPlan(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                            <span className="material-icons">add</span> Nuevo Plan
                        </button>
                    </div>

                    {(isCreatingPlan || isEditingPlan) && (
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg mb-8">
                            <h3 className="font-bold text-lg mb-6">{isEditingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}</h3>
                            <form onSubmit={handleSavePlan} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nombre del Plan</label>
                                        <input name="name" defaultValue={isEditingPlan?.name} placeholder="Ej: Básico, Pro, Enterprise" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 font-bold" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Precio Mensual (USD)</label>
                                        <input name="price" type="number" step="0.01" defaultValue={isEditingPlan?.price} placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-transparent focus:border-blue-500 font-bold" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Limits */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                                            <span className="material-icons text-blue-600 text-sm">tune</span>
                                            Límites del Plan
                                        </h4>
                                        <div className="space-y-4">
                                            {['Empresas (Máx)', 'Usuarios (Máx)', 'Comprobantes / Mes'].map((label, idx) => {
                                                const keys = ['max_companies', 'max_users', 'max_vouchers'];
                                                const key = keys[idx];
                                                const val = isEditingPlan?.limits?.[key] || 0;
                                                return (
                                                    <div key={key} className="flex justify-between items-center">
                                                        <label className="text-xs font-semibold text-slate-600 uppercase">{label}</label>
                                                        <input
                                                            type="number"
                                                            name={`limit_${key}`}
                                                            defaultValue={val}
                                                            className="w-24 bg-white p-2 rounded-lg text-right font-bold border border-slate-200 focus:border-blue-500 outline-none"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                                            <span className="material-icons text-green-600 text-sm">check_circle</span>
                                            Funciones Habilitadas
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                { k: 'ai_invoice_analysis', l: 'Lectura Automática de Facturas (IA)' },
                                                { k: 'ai_copilot', l: 'Asistente Fiscal IA (Co-Pilot)' },
                                                { k: 'custom_branding', l: 'Marca Personalizada en Vouchers' },
                                                { k: 'team_collaboration', l: 'Acceso para Equipo/Operadores' },
                                                { k: 'advanced_reports', l: 'Reportes Financieros Detallados' },
                                                { k: 'priority_support', l: 'Soporte Técnico Prioritario' }
                                            ].map((feat) => {
                                                const isActive = isEditingPlan?.features?.[feat.k] === true;
                                                return (
                                                    <label key={feat.k} className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                name={`feat_${feat.k}`}
                                                                border-slate-300
                                                                defaultChecked={isActive}
                                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600"
                                                            />
                                                            <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                                                <span className="material-icons text-[14px]">check</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{feat.l}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => { setIsCreatingPlan(false); setIsEditingPlan(null); }} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Cancelar</button>
                                    <button className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">Guardar Plan</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setIsEditingPlan(plan)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-500 hover:text-white"><span className="material-icons text-sm">edit</span></button>
                                    <button onClick={() => handleDeletePlan(plan.id)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white"><span className="material-icons text-sm">delete</span></button>
                                </div>
                                <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                                <p className="text-3xl font-black text-blue-600">${plan.price}</p>
                                <pre className="mt-6 bg-slate-50 p-4 rounded-2xl text-[10px] text-slate-500 overflow-x-auto">
                                    {JSON.stringify(plan.features, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex gap-4 mb-4">
                        <input
                            placeholder="Buscar por nombre o email..."
                            className="flex-1 bg-white border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Note: Ideally we filter a separate state, but for simplicity we rely on the map below or add state if needed. 
                             For now, let's implement the table directly with an inline filter or assume 'users' is the full list.
                             To make it robust, let's just render the table columns requested. */}


                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                <tr>
                                    <th className="p-6">Usuario / Email</th>
                                    <th className="p-6">Tipo de Cuenta</th>
                                    <th className="p-6">Estado Acceso</th>
                                    <th className="p-6">Suscripción / Plan</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => {
                                    if (!searchQuery) return true;
                                    const q = searchQuery.toLowerCase();
                                    return (u.first_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
                                }).map(user => {
                                    const sub = subscriptions.find(s => s.user_id === user.id);
                                    const isSubUser = !!user.admin_id;
                                    const parentUser = isSubUser ? users.find(u => u.id === user.admin_id) : null;
                                    const isActive = user.is_active !== false; // Default true

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-all group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isActive ? 'bg-blue-600' : 'bg-slate-400'}`}>
                                                        {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{user.first_name || 'Sin Nombre'}</p>
                                                        <p className="text-xs text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' :
                                                        user.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {user.role === 'operator' ? 'Operador (Sub-usuario)' : user.role === 'admin' ? 'Administrador' : 'Super Admin'}
                                                    </span>
                                                    {isSubUser && parentUser && (
                                                        <span className="text-[10px] text-slate-400">
                                                            De: {parentUser.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <button
                                                    onClick={async () => {
                                                        const newVal = !isActive;
                                                        if (confirm(`¿${newVal ? 'Activar' : 'Desactivar'} acceso para ${user.email}?`)) {
                                                            const { error } = await supabase.from('profiles').update({ is_active: newVal }).eq('id', user.id);
                                                            if (!error) loadData();
                                                        }
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${isActive
                                                        ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                                        : 'bg-red-50 text-red-600 border border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                                                        }`}
                                                >
                                                    <span className="material-icons text-[14px]">{isActive ? 'check_circle' : 'block'}</span>
                                                    {isActive ? 'Activo' : 'Suspendido'}
                                                </button>
                                            </td>
                                            <td className="p-6">
                                                {!isSubUser ? (
                                                    <div className="space-y-2">
                                                        {sub ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                <span className="font-bold text-sm">{plans.find(p => p.id === sub.plan_id)?.name || 'Plan Desconocido'}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic">Sin plan asignado</span>
                                                        )}

                                                        <select
                                                            onChange={(e) => handleAssignPlan(user.id, e.target.value)}
                                                            className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 outline-none focus:border-blue-500 w-full"
                                                            value={sub?.plan_id || ''}
                                                        >
                                                            <option value="">{sub ? 'Cambiar Plan...' : 'Asignar Plan...'}</option>
                                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}/mes</option>)}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                {/* Future actions like "Login As" could go here */}
                                                <button className="text-slate-400 hover:text-blue-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-icons">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="p-8 text-center text-slate-400">No hay usuarios registrados.</div>}
                    </div>
                </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">Gestionar Suscripciones</h2>
                        <button onClick={() => setIsCreatingSubscription(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                            <span className="material-icons">add</span> Nueva Suscripción
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                                <tr>
                                    <th className="p-6">Usuario</th>
                                    <th className="p-6">Plan</th>
                                    <th className="p-6">Periodo</th>
                                    <th className="p-6">Estado Pago</th>
                                    <th className="p-6">Comprobante</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subscriptions.map(sub => {
                                    const user = users.find(u => u.id === sub.user_id);
                                    const plan = plans.find(p => p.id === sub.plan_id);

                                    return (
                                        <tr key={sub.id} className="hover:bg-slate-50 transition-all">
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900">{user?.first_name || 'Usuario Eliminado'}</p>
                                                <p className="text-xs text-slate-400">{user?.email}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className="font-bold text-blue-600">{plan?.name || 'Unknown'}</span>
                                                <p className="text-xs text-slate-500">${plan?.price}/mes</p>
                                            </td>
                                            <td className="p-6 text-xs text-slate-500">
                                                <p>Inicia: {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : 'N/A'}</p>
                                                <p>Vence: {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'N/A'}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${sub.payment_status === 'paid' ? 'bg-green-100 text-green-600' :
                                                    sub.payment_status === 'overdue' ? 'bg-red-100 text-red-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    {sub.payment_status === 'paid' ? 'Pagado' : sub.payment_status === 'overdue' ? 'Vencido' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {sub.payment_proof_url ? (
                                                    <a href={sub.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                                        <span className="material-icons text-sm">attachment</span> Ver Recibo
                                                    </a>
                                                ) : <span className="text-slate-300 text-xs">Sin recibo</span>}
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => setEditingSubscription(sub)}
                                                    className="bg-slate-100 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                                    title="Gestionar Pago"
                                                >
                                                    <span className="material-icons text-sm">payments</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EDIT/CREATE SUBSCRIPTION MODAL */}
            {(editingSubscription || isCreatingSubscription) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2rem] max-w-lg w-full shadow-2xl space-y-6">
                        <h3 className="font-black text-xl">{isCreatingSubscription ? 'Crear Nueva Suscripción' : 'Gestionar Suscripción'}</h3>

                        <form onSubmit={handleUpdateSubscription} className="space-y-4">
                            {/* User & Plan Selection (Create Mode) */}
                            {isCreatingSubscription ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Usuario</label>
                                        <select name="user_id" required className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none">
                                            <option value="">Seleccionar Usuario...</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.first_name} ({u.email})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Plan</label>
                                        <select name="plan_id" required className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none">
                                            <option value="">Seleccionar Plan...</option>
                                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-xl mb-4">
                                    <p className="text-xs text-blue-600 font-bold uppercase">Suscripción de</p>
                                    <p className="font-black text-blue-900">{users.find(u => u.id === editingSubscription?.user_id)?.first_name}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fecha Inicio</label>
                                    <input type="date" name="start_date" defaultValue={editingSubscription?.start_date?.split('T')[0]} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fecha Fin</label>
                                    <input type="date" name="end_date" defaultValue={editingSubscription?.end_date?.split('T')[0]} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Estado del Pago</label>
                                <select name="payment_status" defaultValue={editingSubscription?.payment_status || 'pending'} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none">
                                    <option value="pending">Pendiente</option>
                                    <option value="paid">Pagado</option>
                                    <option value="overdue">Vencido</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Método de Pago</label>
                                    <input name="payment_method" placeholder="Ej: Zelle, Transf" defaultValue={editingSubscription?.payment_method} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Referencia</label>
                                    <input name="payment_reference" placeholder="REF-123456" defaultValue={editingSubscription?.payment_reference} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-bold outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Comprobante de Pago</label>
                                <input type="file" name="payment_proof" accept="image/*,application/pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Observaciones</label>
                                <textarea name="notes" defaultValue={editingSubscription?.notes} className="w-full bg-slate-50 p-3 rounded-lg text-sm font-medium outline-none h-24 resize-none" placeholder="Notas adicionales sobre el pago o suscripción..."></textarea>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => { setEditingSubscription(null); setIsCreatingSubscription(false); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
