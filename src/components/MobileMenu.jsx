import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Shield, Calculator, Settings, Home, Map, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { useLanguage } from '@/contexts/LanguageContext';

const MobileMenu = ({
    isOpen,
    onClose,
    sections,
    activeSection,
    onSectionSelect,
    onHomeClick,
    isAdminView,
    isAdminAuthenticated,
    onAdminLogin,
    onAdminLogout,
    onCotizadorClick,
    onSubItemSelect,
    activeTabMap,
    isEditorMode,
    setIsEditorMode,
    onAdminClick
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const menuVariants = {
        closed: { x: '-100%', opacity: 0 },
        open: { x: 0, opacity: 1 },
    };

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 },
    };

    // Filter sections for display
    // We reuse the logic from Sidebar/QuotationViewer to ensure consistency
    // But here we might want to show everything available to the user.

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#0a0a0a] border-r border-gray-800 z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#0f0f0f]">
                            <span className="font-bold text-xl text-white tracking-tight">Menú</span>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            {sections.map((section) => (
                                <SidebarItem
                                    key={section.id}
                                    section={section}
                                    isActive={activeSection === section.id}
                                    isCollapsed={false}
                                    onClick={() => {
                                        if (section.id === 'portada') onHomeClick();
                                        else onSectionSelect(section.id);
                                        onClose();
                                    }}
                                    isEditorMode={false} // Always false for mobile menu navigation focus
                                    onVisibilityToggle={() => { }} // No-op

                                    subItems={section.subItems}
                                    onSubItemSelect={(index) => {
                                        if (onSubItemSelect) onSubItemSelect(section.id, index);
                                        onClose();
                                    }}
                                    activeSubItemIndex={activeTabMap ? activeTabMap[section.id] : undefined}

                                    // Pass dummy handlers for editor props to avoid errors if SidebarItem expects them
                                    onMoveUp={() => { }}
                                    onMoveDown={() => { }}
                                    onLabelChange={() => { }}
                                    onIconChange={() => { }}
                                    onDuplicate={() => { }}
                                    onDelete={() => { }}
                                    isFirst={false}
                                    isLast={false}
                                    isDragging={false}
                                    dragHandleProps={{}}
                                />
                            ))}

                            {/* Accesos Rápidos Adicionales */}
                            <div className="pt-6 pb-2 px-2">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">
                                    Navegación Global
                                </div>

                                <button
                                    onClick={() => { navigate('/'); onClose(); }}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 text-white hover:bg-primary/10 transition-all group mb-3 shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Home size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm tracking-tight">DASHBOARD</div>
                                            <div className="text-[10px] text-gray-400 font-medium">Lista de Proyectos</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:text-primary transition-colors" />
                                </button>

                                <button
                                    onClick={() => { navigate('/solifood/master-plan'); onClose(); }}
                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-white/5 text-white hover:border-primary/30 transition-all group shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                            <Map size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm tracking-tight text-yellow-500/90">MASTER PLAN</div>
                                            <div className="text-[10px] text-gray-500 font-medium">Concentrado General</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* Footer / Admin Controls */}
                        {isAdminView && (
                            <div className="p-4 border-t border-gray-800 bg-[#0f0f0f] space-y-2">
                                {isAdminAuthenticated && (
                                    <>
                                        <button
                                            onClick={() => { onCotizadorClick(); onClose(); }}
                                            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeSection === 'cotizador_page' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}
                                        >
                                            <Calculator size={20} />
                                            <span className="ml-3 font-semibold">Modo Cotizador</span>
                                        </button>

                                        {/* Editor Mode Toggle - Optional for mobile, but maybe useful */}
                                        <button
                                            onClick={() => { setIsEditorMode(!isEditorMode); onClose(); }}
                                            className={`w-full flex items-center p-3 rounded-lg transition-colors ${isEditorMode ? 'bg-primary/10 text-primary' : 'hover:bg-gray-800 text-gray-300'}`}
                                        >
                                            <Settings size={20} />
                                            <span className="ml-3 font-semibold">{t('sidebar.editorMode')}</span>
                                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${isEditorMode ? 'bg-primary/20' : 'bg-gray-700'}`}>
                                                {isEditorMode ? 'ON' : 'OFF'}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => { onAdminClick(); onClose(); }}
                                            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
                                        >
                                            <Settings size={20} />
                                            <span className="ml-3 font-semibold">{t('sidebar.admin')}</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        isAdminAuthenticated ? onAdminLogout() : onAdminLogin();
                                        onClose();
                                    }}
                                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-primary transition-colors"
                                >
                                    {isAdminAuthenticated ? <LogOut size={20} className="text-red-500" /> : <Shield size={20} />}
                                    <span className="ml-3 font-semibold">{isAdminAuthenticated ? t('sidebar.logout') : t('sidebar.login')}</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
