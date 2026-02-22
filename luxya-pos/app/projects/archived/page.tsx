'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/context/ToastContext';
import { ArrowLeft, ArchiveRestore, Trash2, FolderKanban, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ArchivedProjectsPage() {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useToast();
    const [archived, setArchived] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArchived();
    }, []);

    const fetchArchived = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('agency_projects')
                .select('*')
                .eq('status', 'annule')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setArchived(data || []);
        } catch (err) {
            showToast('Erreur de chargement des archives', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (projectId: string) => {
        if (!confirm("Restaurer ce projet ? Il retournera à l'état 'Planifié'.")) return;
        try {
            const { error } = await supabase
                .from('agency_projects')
                .update({ status: 'planifie' })
                .eq('id', projectId);
            if (error) throw error;
            showToast('Projet restauré avec succès.', 'success');
            fetchArchived();
        } catch (err: any) {
            showToast(`Erreur : ${err.message}`, 'error');
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm("Supprimer ce projet DÉFINITIVEMENT ? Cette action est irréversible.")) return;
        try {
            const { error } = await supabase.from('agency_projects').delete().eq('id', projectId);
            if (error) throw error;
            showToast('Projet supprimé définitivement.', 'success');
            fetchArchived();
        } catch (err: any) {
            showToast(`Erreur : ${err.message}`, 'error');
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-panel sticky top-4 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/projects" className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Projets Archivés</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {archived.length} projet(s) archivé(s)
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto w-full px-8 py-6 space-y-6">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-shop" /></div>
                ) : archived.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="font-bold text-lg">Aucun projet archivé</h3>
                        <p className="text-sm text-muted-foreground">Les projets que vous annulez apparaîtront ici.</p>
                    </div>
                ) : (
                    <div className="glass-panel rounded-[32px] border-white/5 p-4 space-y-2">
                        {archived.map(project => (
                            <div key={project.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl hover:bg-white/5 transition-colors">
                                <div>
                                    <p className="font-bold text-white">{project.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Archivé le {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleRestore(project.id)}
                                        className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                        title="Restaurer"
                                    >
                                        <ArchiveRestore className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(project.id)}
                                        className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                        title="Supprimer définitivement"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
