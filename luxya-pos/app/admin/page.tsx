
'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import {
    Users,
    Store,
    Shield,
    LayoutDashboard,
    ArrowLeft,
    Plus,
    MoreVertical,
    CheckCircle2,
    XCircle,
    BarChart3,
    UserPlus,
    X,
    Lock,
    Mail,
    Package,
    PieChart,
    ArrowUpRight,
    ShoppingBag,
    Trash2,
    Edit
} from 'lucide-react'
import Link from 'next/link'
import { shops, Shop } from '@/types/shop'
import CustomDropdown from '@/components/CustomDropdown'
import { API_URL } from '@/utils/api'

export default function AdminDashboard() {
    const { profile, loading: userLoading } = useUser()
    const router = useRouter()
    const { showToast } = useToast()
    const [users, setUsers] = useState<any[]>([])
    const [connectionLogs, setConnectionLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userLoading && (!profile || profile.role !== 'admin')) {
            router.push('/')
        }
    }, [profile, userLoading, router])

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchUsers()
            fetchLogs()
        } else if (!userLoading) {
            setLoading(false)
        }
    }, [profile, userLoading])

    const fetchLogs = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/logs`)
            if (res.ok) {
                const data = await res.json()
                setConnectionLogs(data)
            }
        } catch (e) {}
    }

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [newUserData, setNewUserData] = useState({
        email: '',
        password: '',
        role: 'cashier',
        shopId: null as any,
        hasStockAccess: false
    })
    const [editData, setEditData] = useState({
        email: '',
        password: '',
        role: '',
        shopId: null as any,
        hasStockAccess: false
    })
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)

    const roleOptions = [
        { label: 'Administrateur', value: 'admin', icon: <Shield className="w-3.5 h-3.5" /> },
        { label: 'Manager Boutique', value: 'manager', icon: <Store className="w-3.5 h-3.5" /> },
        { label: 'Caissier / POS', value: 'cashier', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    ]

    const shopOptions = [
        { label: 'Accès Global', value: '', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ...shops.map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5" /> }))
    ]

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setCreating(true)
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserData)
            })
            if (res.ok) {
                showToast("Compte créé avec succès", "success")
                setIsCreateModalOpen(false)
                setNewUserData({ email: '', password: '', role: 'cashier', shopId: null, hasStockAccess: false })
                fetchUsers()
            } else {
                const data = await res.json()
                showToast(data.error || 'Erreur lors de la création', "error")
            }
        } catch (err) {
            console.error('Create failed')
        } finally {
            setCreating(false)
        }
    }

    const openEditModal = (user: any) => {
        setEditingUser(user)
        setEditData({
            email: user.email || '',
            password: '',
            role: user.role,
            shopId: user.shop_id,
            hasStockAccess: user.has_stock_access
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setUpdating(true)
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    ...editData,
                    password: editData.password || undefined
                })
            })
            if (res.ok) {
                showToast("Utilisateur mis à jour", "success")
                setIsEditModalOpen(false)
                fetchUsers()
            } else {
                const data = await res.json()
                showToast(data.error || 'Erreur lors de la mise à jour', "error")
            }
        } catch (err) {
            console.error('Update failed')
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
            if (res.ok) {
                showToast("Utilisateur supprimé", "success")
                fetchUsers()
            } else {
                const data = await res.json()
                showToast(data.error || 'Erreur lors de la suppression', "error")
            }
        } catch (err) {
            console.error('Delete failed')
        }
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } finally {
            setLoading(false)
        }
    }

    const updateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            })
            if (res.ok) fetchUsers()
        } catch (err) {}
    }

    const updateShop = async (userId: string, shopId: number | null) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, shopId })
            })
            if (res.ok) fetchUsers()
        } catch (err) {}
    }

    const toggleStockAccess = async (userId: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hasStockAccess: !currentStatus })
            })
            if (res.ok) fetchUsers()
        } catch (err) {}
    }

    if (userLoading || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-shop border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Administration...</p>
            </div>
        </div>
    )

    if (!profile || profile.role !== 'admin') return null

    return (
        <div className="min-h-screen flex flex-col pb-12">
            {/* Header */}
            <header className="glass-panel sticky top-0 z-50 m-2 sm:m-4 rounded-[20px] sm:rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shop rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Administration</h1>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestion Globale</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 sm:px-6 py-2 bg-shop text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                    >
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Nouvel Accès</span>
                        <span className="sm:hidden">Ajouter</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12">
                {/* Global Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                    <Link href="/analytics" className="glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group hover:border-shop/50 transition-all">
                        <div className="absolute top-0 right-0 p-4 sm:p-6 text-shop/5 group-hover:text-shop/10 transition-colors">
                            <BarChart3 className="w-16 h-16 sm:w-24 sm:h-24 rotate-12" />
                        </div>
                        <div className="relative z-10 space-y-1 sm:space-y-2">
                            <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Rapports</p>
                            <h2 className="text-2xl sm:text-4xl font-black group-hover:text-shop transition-colors">Analytics</h2>
                        </div>
                    </Link>

                    <div className="glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 sm:p-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
                            <Users className="w-16 h-16 sm:w-24 sm:h-24 -rotate-12" />
                        </div>
                        <div className="relative z-10 space-y-1 sm:space-y-2">
                            <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Utilisateurs</p>
                            <h2 className="text-2xl sm:text-4xl font-black">{users.length}</h2>
                        </div>
                    </div>

                    <div className="glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group sm:col-span-2 md:col-span-1">
                        <div className="absolute top-0 right-0 p-4 sm:p-6 text-shop-secondary/5 group-hover:text-shop-secondary/10 transition-colors">
                            <Store className="w-16 h-16 sm:w-24 sm:h-24 rotate-6" />
                        </div>
                        <div className="relative z-10 space-y-1 sm:space-y-2">
                            <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Réseau Boutique</p>
                            <h2 className="text-2xl sm:text-4xl font-black">{shops.length} Actives</h2>
                        </div>
                    </div>
                </div>

                {/* Users Management */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="px-2">
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Utilisateurs</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Contrôle des accès et des permissions du personnel.</p>
                    </div>

                    {/* --- DESKTOP VIEW (Table) --- */}
                    <div className="hidden lg:block glass-panel rounded-[40px] overflow-hidden border-white/5 bg-white/[0.01]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/5">Utilisateur</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/5">Rôle</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/5">Accès Stock</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/5">Boutique</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 border-r border-white/5">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-shop/20 to-shop/5 border border-shop/20 flex items-center justify-center font-black text-shop text-xl uppercase shadow-inner">
                                                    {u.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white group-hover:text-shop transition-colors">{u.email}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-50">ID: {u.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 border-r border-white/5">
                                            <CustomDropdown 
                                                options={roleOptions}
                                                value={u.role}
                                                onChange={(val) => updateRole(u.id, val)}
                                                className="w-[180px]"
                                            />
                                        </td>
                                        <td className="px-8 py-6 border-r border-white/5">
                                            <button
                                                onClick={() => toggleStockAccess(u.id, u.has_stock_access)}
                                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${u.has_stock_access
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                    : 'bg-white/5 border-white/10 text-muted-foreground'
                                                    }`}
                                            >
                                                {u.has_stock_access ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {u.has_stock_access ? 'Autorisé' : 'Refusé'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 border-r border-white/5">
                                            <CustomDropdown 
                                                options={shopOptions}
                                                value={u.shop_id || ''}
                                                onChange={(val) => updateShop(u.id, val === '' ? null : val)}
                                                className="w-[200px]"
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => openEditModal(u)} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-shop transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === profile?.id} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-red-400 transition-all disabled:opacity-20">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- MOBILE VIEW (Cards) --- */}
                    <div className="lg:hidden space-y-4">
                        {users.map((u) => (
                            <div key={u.id} className="glass-panel p-6 rounded-[32px] space-y-6">
                                {/* Header: User Info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-shop/20 to-shop/5 border border-shop/20 flex items-center justify-center font-black text-shop text-xl uppercase">
                                            {u.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white truncate max-w-[150px]">{u.email}</p>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-50">ID: {u.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openEditModal(u)} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-shop">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === profile?.id} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-red-400 disabled:opacity-20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Rôle & Permissions</p>
                                        <CustomDropdown 
                                            options={roleOptions}
                                            value={u.role}
                                            onChange={(val) => updateRole(u.id, val)}
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Boutique Assignée</p>
                                        <CustomDropdown 
                                            options={shopOptions}
                                            value={u.shop_id || ''}
                                            onChange={(val) => updateShop(u.id, val === '' ? null : val)}
                                            className="w-full"
                                        />
                                    </div>

                                    <button
                                        onClick={() => toggleStockAccess(u.id, u.has_stock_access)}
                                        className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-2xl border transition-all ${u.has_stock_access
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-white/5 border-white/10 text-muted-foreground'
                                            }`}
                                    >
                                        {u.has_stock_access ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {u.has_stock_access ? 'Accès Stock Autorisé' : 'Accès Stock Refusé'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                                    </div>
                    
                                    {/* --- ROLE ACCREDITATION GUIDE --- */}
                                    <div className="glass-panel p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border-white/5 bg-white/[0.01] overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Lock className="w-32 h-32 rotate-12" />
                                        </div>
                                        <div className="relative z-10 space-y-8">
                                            <div>
                                                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Guide des Accréditations</h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Définition des droits d'accès Lolly Group</p>
                                            </div>
                    
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                    <div className="flex items-center space-x-3 text-shop">
                                                        <Shield className="w-5 h-5" />
                                                        <h4 className="font-black uppercase text-sm">Administrateur</h4>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Accès **Total & Illimité**. Gestion des employés, configuration du site Web, analyse financière globale et modification de l'inventaire.</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                    <div className="flex items-center space-x-3 text-shop-secondary">
                                                        <Store className="w-5 h-5" />
                                                        <h4 className="font-black uppercase text-sm">Manager</h4>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Accès **ERP & Stock**. Peut modifier les produits, voir l'historique des ventes et enregistrer les dépenses de sa boutique assignée.</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                    <div className="flex items-center space-x-3 text-green-400">
                                                        <ShoppingBag className="w-5 h-5" />
                                                        <h4 className="font-black uppercase text-sm">Caissier</h4>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">Accès **Vente Uniquement**. Limité au terminal de vente (POS). Ne peut pas voir les rapports financiers ni modifier le catalogue.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                    
                                    {/* --- CONNECTION LOGS --- */}
                                    <div className="space-y-6">
                                        <div className="px-2">
                                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none">Journal des Connexions</h3>
                                            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-widest mt-2">Audit des accès en temps réel</p>
                                        </div>
                    
                                    <div className="glass-panel rounded-[32px] sm:rounded-[40px] overflow-hidden border-white/5 bg-white/[0.01]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/5 border-b border-white/5">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-muted-foreground">Utilisateur</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-muted-foreground">Appareil / IP</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase text-muted-foreground text-right">Date & Heure</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {connectionLogs.length > 0 ? connectionLogs.map((log, i) => (
                                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-8 py-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                                                                    <span className="text-xs font-bold text-white">{log.email}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{log.device} • {log.ip_address}</td>
                                                            <td className="px-8 py-4 text-right text-[10px] font-black text-white/60">
                                                                {new Date(log.created_at).toLocaleString('fr-FR')}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan={3} className="p-12 text-center opacity-30 font-black uppercase text-[10px]">Aucun log récent</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    </div>
                    
                                    {/* Invite Instructions Card */}                    <div className="glass-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border-dashed border-white/10 bg-white/[0.01]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0 lg:space-x-10">
                            <div className="flex-1 space-y-4 text-center lg:text-left">
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-shop/10 border border-shop/20 text-shop text-[10px] font-black uppercase tracking-[0.2em]">
                                    Guide d'invitation
                                </div>
                                <h4 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Comment ajouter un employé ?</h4>
                                <ol className="space-y-4 text-muted-foreground font-medium text-xs sm:text-sm text-left">
                                    <li className="flex items-start">
                                        <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black mr-4 shrink-0 mt-0.5">1</span>
                                        L'employé doit s'inscrire via la page de connexion.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black mr-4 shrink-0 mt-0.5">2</span>
                                        Rafraîchissez cette page pour le voir apparaître dans la liste.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black mr-4 shrink-0 mt-0.5">3</span>
                                        Assignez-lui son rôle et sa boutique de destination.
                                    </li>
                                </ol>
                            </div>
                            <div className="w-full lg:w-auto">
                                <Link href="/login" className="flex items-center justify-center w-full px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-[24px] sm:rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl">
                                    Page Login <Plus className="w-5 h-5 ml-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Responsive Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-md p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center"><UserPlus className="w-6 h-6 text-shop" /></div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Nouvel Accès</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Provisioning Direct</p>
                            </div>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="email" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-shop/50 transition-all" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="password" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-shop/50 transition-all" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Rôle</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-[10px] font-black uppercase outline-none focus:border-shop/50 appearance-none bg-black" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}>
                                        <option value="cashier">Caissier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Boutique</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-[10px] font-black uppercase outline-none focus:border-shop/50 appearance-none bg-black" value={newUserData.shopId || ''} onChange={e => setNewUserData({ ...newUserData, shopId: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">Global</option>
                                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={creating} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-shop hover:text-white transition-all shadow-xl disabled:opacity-50">
                                {creating ? 'Création...' : 'Créer le Compte'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Responsive Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-md p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center"><Edit className="w-6 h-6 text-shop" /></div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Modifier Accès</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">{editingUser?.email}</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nouvel Email (Optionnel)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-shop/50 transition-all" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nouveau Mot de passe (Laisser vide si inchangé)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-shop/50 transition-all" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Rôle</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-[10px] font-black uppercase outline-none focus:border-shop/50 appearance-none bg-black" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}>
                                        <option value="cashier">Caissier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Boutique</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-[10px] font-black uppercase outline-none focus:border-shop/50 appearance-none bg-black" value={editData.shopId || ''} onChange={e => setEditData({ ...editData, shopId: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">Global</option>
                                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={updating} className="w-full py-4 bg-shop text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50">
                                {updating ? 'Mise à jour...' : 'Sauvegarder les changements'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
