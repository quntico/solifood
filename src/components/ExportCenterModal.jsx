import React, { useState, useRef, useEffect } from 'react';
import {
    X, Upload, Link as LinkIcon, FileText, Eye, EyeOff,
    Trash2, Plus, Download, ExternalLink, Edit2, Check,
    MoreVertical, File, DollarSign, Search
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { generateMasterPlanPDF } from '@/lib/masterPlanExporter';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Componente para gestionar el Centro de Exportación.
 * Permite subir archivos, añadir enlaces, y configurar su visibilidad.
 */
const ExportCenterModal = ({
    isOpen,
    onClose,
    quotationData,
    isEditorMode,
    onUpdate
}) => {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExportingMP, setIsExportingMP] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [iconSearch, setIconSearch] = useState('');

    // Filter icons for performance and relevance (common icons + search)
    const iconList = Object.keys(LucideIcons).filter(iconName => {
        // Simple filter to avoid non-component exports if any (usually capitalized)
        return /^[A-Z]/.test(iconName);
    });

    const filteredIcons = iconList.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    ).slice(0, 200); // Limit to 200 display items by default/search to prevent lag

    // Ref for file input
    const fileInputRef = useRef(null);

    // Load items from quotationData on open
    useEffect(() => {
        if (isOpen && quotationData) {
            // Intentar leer desde sections_config.export_center_items o inicializar vacío
            const existingItems = quotationData.sections_config?.export_center_items || [];
            setItems(existingItems);
        }
    }, [isOpen, quotationData]);

    // Save items to Supabase
    const saveItems = async (newItems) => {
        setLoading(true);
        try {
            // Prepare payload: update sections_config preserving other data
            const currentConfig = quotationData.sections_config || {};
            const updatedConfig = {
                ...currentConfig,
                export_center_items: newItems
            };

            const { error } = await supabase
                .from('quotations')
                .update({ sections_config: updatedConfig })
                .eq('id', quotationData.id);

            if (error) throw error;

            setItems(newItems);
            if (onUpdate) onUpdate(updatedConfig); // Notify parent (Header/Layout)

            return true;
        } catch (error) {
            console.error("Error saving export items:", error);
            toast({
                title: "Error al guardar",
                description: "No se pudieron guardar los cambios: " + error.message,
                variant: "destructive"
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMasterPlan = async () => {
        setLoading(true);
        try {
            const currentConfig = quotationData.sections_config || {};
            const newHiddenState = !currentConfig.hide_master_plan;

            const updatedConfig = {
                ...currentConfig,
                hide_master_plan: newHiddenState
            };

            const { error } = await supabase
                .from('quotations')
                .update({ sections_config: updatedConfig })
                .eq('id', quotationData.id);

            if (error) throw error;

            if (onUpdate) onUpdate(updatedConfig);
            toast({ title: newHiddenState ? "Master Plan Oculto" : "Master Plan Visible", description: "Configuración actualizada." });
        } catch (error) {
            console.error("Error updating master plan visibility:", error);
            toast({ title: "Error", description: "No se pudo actualizar la visibilidad.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleMasterPlanExport = async () => {
        setIsExportingMP(true);
        try {
            const currentSlug = quotationData.slug || quotationData.theme_key;
            // Simplified logic: try cloud first as per Header logic, or use existing data
            let config = null;

            // STEP A: Try embedded config (fastest)
            const sConfig = quotationData.sections_config;
            if (Array.isArray(sConfig)) {
                config = sConfig.find(s => s.component === 'master_plan' || s.id === 'master_plan')?.content;
            } else if (sConfig?.sections) {
                config = sConfig.sections.find(s => s.component === 'master_plan' || s.id === 'master_plan')?.content;
            }

            // STEP B: If not embedded, fetch from DB
            if (!config) {
                const slug = `mp-${currentSlug}`;
                const { data: cloudData } = await supabase
                    .from('quotations')
                    .select('sections_config')
                    .eq('slug', slug)
                    .single();
                if (cloudData?.sections_config) config = cloudData.sections_config;
            }

            // STEP C: Auto-generate if still nothing
            if (!config) {
                const sectionsData = quotationData.sections_config?.sections || (Array.isArray(quotationData.sections_config) ? quotationData.sections_config : []);
                const fichas = sectionsData.filter(s => s.component === 'ficha' || s.id === 'ficha' || s.id?.includes('ficha'));
                if (fichas && fichas.length > 0) {
                    const generatedItems = [];
                    fichas.forEach(f => {
                        const fContent = f.content;
                        const tabs = Array.isArray(fContent) ? fContent : (fContent ? [fContent] : []);
                        tabs.forEach(tab => {
                            if (tab && (tab.tabTitle || tab.technical_data)) {
                                generatedItems.push({
                                    id: `gen_${Date.now()}_${Math.random()}`,
                                    equipo: (tab.tabTitle || "Equipo").toUpperCase(),
                                    descripcion: (tab.technical_data || []).map(d => `${d.label}: ${d.value} ${d.unit || ''}`).join(' | '),
                                    media_url: tab.image || '',
                                    media_type: 'image',
                                    activo: true,
                                    qty: 1,
                                    costoUSD: 0,
                                    ventaUSD: 0,
                                    utilidad: 0
                                });
                            }
                        });
                    });
                    if (generatedItems.length > 0) {
                        config = {
                            sections: [{
                                id: 'gen_module_main',
                                titulo: 'EQUIPOS PRINCIPALES DEL PROYECTO',
                                items: generatedItems
                            }]
                        };
                    }
                }
            }

            if (!config) throw new Error("No se encontró configuración para Master Plan");

            let finalSections = [];
            if (Array.isArray(config)) finalSections = config;
            else if (config.sections) finalSections = config.sections;
            else if (typeof config === 'object') {
                const potentialArray = Object.values(config).find(v => Array.isArray(v) && v.length > 0);
                if (potentialArray) finalSections = potentialArray;
            }

            await generateMasterPlanPDF({
                sections: finalSections,
                pdfSettings: config.pdfSettings,
                clientName: quotationData.client || "CLIENTE",
                projectName: quotationData.project || "PROYECTO",
                logoUrl: quotationData.logo
            });
            toast({ title: "Master Plan Exportado", description: "El PDF se ha generado correctamente." });

        } catch (err) {
            console.error("Master Plan export error:", err);
            toast({ title: "Error", description: "No se pudo generar el Master Plan.", variant: "destructive" });
        } finally {
            setIsExportingMP(false);
        }
    };


    const handleCreateItem = () => {
        // Use a simple random fallback if crypto is not available, or better, use uuid lib if installed.
        // For now, simpler fallback to avoid crash:
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        setEditingItem({
            id: newId,
            title: "Nuevo Documento",
            description: "Descripción del documento",
            type: 'file', // 'file' | 'link' | 'pdf_generator'
            url: '',
            color: '#22c55e', // Default green
            icon: 'FileText', // Default icon
            is_visible: true,
            is_new: true
        });
    };

    const handleEditItem = (item) => {
        setEditingItem({ ...item, is_new: false });
    };

    const handleDeleteItem = async (itemId) => {
        if (confirm("¿Estás seguro de eliminar este ítem?")) {
            const newItems = items.filter(i => i.id !== itemId);
            await saveItems(newItems);
            toast({ title: "Eliminado", description: "Ítem eliminado correctamente." });
        }
    };

    const handleToggleVisibility = async (itemId) => {
        const newItems = items.map(i =>
            i.id === itemId ? { ...i, is_visible: !i.is_visible } : i
        );
        // Optimistic update locally first? items state is updated by saveItems on success only usually, 
        // but for toggle it feels slow. Let's rely on saveItems logic.
        await saveItems(newItems);
    };

    const handleSaveEditor = async () => {
        if (!editingItem) return;

        // Validation
        if (!editingItem.title.trim()) {
            toast({ title: "Falta título", description: "El título es obligatorio", variant: "destructive" });
            return;
        }

        let newItems;
        if (editingItem.is_new) {
            const { is_new, ...itemToSave } = editingItem;
            newItems = [...items, itemToSave];
        } else {
            newItems = items.map(i => i.id === editingItem.id ? editingItem : i);
        }

        const success = await saveItems(newItems);
        if (success) {
            setEditingItem(null);
            toast({ title: "Guardado", description: "Cambios guardados correctamente." });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !editingItem) return;

        if (file.size > 80 * 1024 * 1024) { // 80MB limit
            toast({ title: "Archivo muy grande", description: "Máximo 80MB", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${quotationData.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('quotation-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('quotation-files')
                .getPublicUrl(filePath);

            setEditingItem(prev => ({
                ...prev,
                url: publicUrlData.publicUrl,
                type: 'file',
                description: prev.description === "Descripción del documento" ? `Archivo: ${file.name}` : prev.description
            }));

            toast({ title: "Archivo subido", description: "Archivo cargado exitosamente." });

        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Error de subida", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
            // Clear input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const renderCard = (item) => {
        // Only show if visible or if admin (editor mode)
        if (!item.is_visible && !isEditorMode) return null;

        return (
            <div key={item.id} className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${!item.is_visible ? 'opacity-60 border-dashed border-gray-700 bg-gray-900/20' : 'bg-gray-900/60 border-gray-800 hover:border-gray-600 hover:bg-gray-800/60'}`}>

                {/* Visibility Badge (Editor Only) */}
                {isEditorMode && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleVisibility(item.id); }}
                            className="text-gray-500 hover:text-white transition-colors p-1"
                            title={item.is_visible ? "Ocultar al cliente" : "Mostrar al cliente"}
                        >
                            {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
                            className="text-gray-500 hover:text-primary transition-colors p-1"
                            title="Editar"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                            style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                            {(() => {
                                const IconComponent = LucideIcons[item.icon] || LucideIcons['FileText'];
                                return <IconComponent className="w-6 h-6" />;
                            })()}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                    </div>
                </div>

                {/* Actions Area */}
                <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                        {item.type === 'link' ? 'ENLACE EXTERNO' : 'DOCUMENTO PDF'}
                    </span>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-primary hover:bg-white/5 gap-2 h-8"
                            onClick={() => {
                                if (item.url) window.open(item.url, '_blank');
                                else toast({ title: "Sin archivo", description: "No hay recurso para visualizar.", variant: "destructive" });
                            }}
                        >
                            {item.type === 'link' ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span className="text-xs font-bold">{item.type === 'link' ? 'ABRIR' : 'VER'}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8"
                            onClick={() => {
                                if (item.url) {
                                    const link = document.createElement('a');
                                    link.href = item.url;
                                    link.setAttribute('download', item.title || 'documento');
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                } else {
                                    toast({ title: "Sin archivo", description: "No hay recurso para descargar.", variant: "destructive" });
                                }
                            }}
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-xs font-bold">DESCARGAR</span>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1000px] w-full bg-zinc-950 border-gray-800 text-white p-0 overflow-hidden rounded-2xl">
                <div className="flex h-[75vh]">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <DialogHeader className="p-6 border-b border-gray-800 bg-zinc-900/50">
                            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                                <span className="text-primary">CENTRO DE EXPORTACIÓN</span>
                                <span className="text-gray-600 text-lg not-italic font-normal normal-case tracking-normal">| Documentación y Archivos del Proyecto</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 p-6 overflow-y-auto bg-black/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">

                                {/* Standard Items */}
                                <div className="group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 bg-gray-900/60 border-gray-800 hover:border-gray-600 hover:bg-gray-800/60">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: '#eab30820', color: '#eab308' }}>
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">Propuesta Económica</h3>
                                            <p className="text-sm text-gray-400 mt-1">Inversión y desglose total del proyecto.</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SISTEMA</span>
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8" onClick={() => window.dispatchEvent(new CustomEvent('SOLIFOOD_EXPORT_PROPUESTA'))}>
                                            <Download className="w-4 h-4" /> <span className="text-xs font-bold">DESCARGAR</span>
                                        </Button>
                                    </div>
                                </div>

                                {(!quotationData.sections_config?.hide_master_plan || isEditorMode) && (
                                    <div className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${quotationData.sections_config?.hide_master_plan ? 'opacity-60 border-dashed border-gray-700 bg-gray-900/20' : 'bg-gray-900/60 border-gray-800 hover:border-gray-600 hover:bg-gray-800/60'}`}>

                                        {/* Visibility Togggle (Editor Only) */}
                                        {isEditorMode && (
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleMasterPlan(); }}
                                                    className="text-gray-500 hover:text-white transition-colors p-1"
                                                    title={quotationData.sections_config?.hide_master_plan ? "Mostrar al cliente" : "Ocultar al cliente"}
                                                >
                                                    {!quotationData.sections_config?.hide_master_plan ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">Master Plan</h3>
                                                <p className="text-sm text-gray-400 mt-1">Concentrado técnico de equipos.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SISTEMA</span>
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8" onClick={handleMasterPlanExport} disabled={isExportingMP}>
                                                <Download className="w-4 h-4" /> <span className="text-xs font-bold">{isExportingMP ? 'GENERANDO...' : 'DESCARGAR'}</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 bg-gray-900/60 border-gray-800 hover:border-gray-600 hover:bg-gray-800/60">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">Cotización PDF</h3>
                                            <p className="text-sm text-gray-400 mt-1">Documento original oficial.</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">SISTEMA</span>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="text-white hover:text-primary hover:bg-white/5 gap-2 h-8" onClick={() => window.dispatchEvent(new CustomEvent('SOLIFOOD_EXPORT_PDF_DOC', { detail: { action: 'view' } }))}>
                                                <Eye className="w-4 h-4" /> <span className="text-xs font-bold">VER</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8" onClick={() => window.dispatchEvent(new CustomEvent('SOLIFOOD_EXPORT_PDF_DOC', { detail: { action: 'download' } }))}>
                                                <Download className="w-4 h-4" /> <span className="text-xs font-bold">DESCARGAR</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {items.map(renderCard)}

                                {/* Add New Card (Editor Only) */}
                                {isEditorMode && (
                                    <button
                                        onClick={handleCreateItem}
                                        className="group flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-gray-800 bg-gray-900/10 hover:bg-gray-900/30 hover:border-gray-600 transition-all min-h-[180px] gap-3"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-black" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-500 group-hover:text-gray-300">Añadir Nuevo Documento</span>
                                    </button>
                                )}
                            </div>

                            {items.length === 0 && !isEditorMode && (
                                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center h-48 text-gray-500 gap-2 p-8 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                                    <p className="text-sm">No hay documentos adicionales cargados.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Sidebar (Visible when editing/creating) */}
                    {editingItem && (
                        <div className="w-[350px] bg-zinc-900 border-l border-gray-800 flex flex-col p-6 shadow-2xl z-20 overflow-y-auto animate-in slide-in-from-right-10 duration-200">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                                <h3 className="font-bold text-lg">{editingItem.is_new ? 'Nuevo Documento' : 'Editar Documento'}</h3>
                                <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="h-8 w-8 text-gray-400 hover:text-white"><X className="w-4 h-4" /></Button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input
                                        value={editingItem.title}
                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                        className="bg-black/50 border-gray-700"
                                        placeholder="Ej: Ficha Técnica"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descripción</Label>
                                    <Textarea
                                        value={editingItem.description}
                                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="bg-black/50 border-gray-700 resize-none"
                                        rows={3}
                                        placeholder="Breve descripción del archivo..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Contenido</Label>
                                    <div className="flex bg-black/50 p-1 rounded-lg border border-gray-700">
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, type: 'file' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${editingItem.type === 'file' ? 'bg-primary text-black shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            ARCHIVO
                                        </button>
                                        <button
                                            onClick={() => setEditingItem({ ...editingItem, type: 'link' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${editingItem.type === 'link' ? 'bg-primary text-black shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            ENLACE
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Icono</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-500" />
                                        <Input
                                            placeholder="Buscar icono..."
                                            className="pl-8 bg-black/50 border-gray-700 text-xs h-8 mb-2"
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-6 gap-2 h-32 overflow-y-auto p-2 bg-black/20 rounded-lg border border-gray-800">
                                        {filteredIcons.map(iconName => {
                                            const Icon = LucideIcons[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setEditingItem({ ...editingItem, icon: iconName })}
                                                    title={iconName}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${editingItem.icon === iconName ? 'bg-primary text-black' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {editingItem.type === 'file' ? (
                                    <div className="space-y-2">
                                        <Label>Archivo</Label>
                                        {editingItem.url ? (
                                            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-900/50 rounded-lg">
                                                <File className="w-4 h-4 text-green-500" />
                                                <span className="text-xs text-green-400 truncate flex-1">Archivo cargado</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-900/20" onClick={() => setEditingItem({ ...editingItem, url: '' })}><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition-colors"
                                            >
                                                <Upload className="w-8 h-8" />
                                                <span className="text-xs font-bold">CLICK PARA SUBIR</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>URL del Enlace</Label>
                                        <Input
                                            value={editingItem.url}
                                            onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                                            className="bg-black/50 border-gray-700 font-mono text-xs"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Color de Identidad</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#ec4899', '#8b5cf6', '#f97316', '#6366f1', '#14b8a6', '#ffffff'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setEditingItem({ ...editingItem, color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${editingItem.color === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:border-white/50'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Delete button only for existing items */}
                                {!editingItem.is_new && (
                                    <Button
                                        variant="destructive"
                                        className="w-full bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50 mt-4"
                                        onClick={() => { handleDeleteItem(editingItem.id); setEditingItem(null); }}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar Documento
                                    </Button>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-800 flex gap-2">
                                <Button variant="outline" className="flex-1 bg-transparent border-gray-700 hover:bg-gray-800" onClick={() => setEditingItem(null)}>Cancelar</Button>
                                <Button className="flex-1" disabled={loading} onClick={handleSaveEditor}>
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExportCenterModal;
