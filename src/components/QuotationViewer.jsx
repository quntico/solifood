import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import AdminModal from '@/components/AdminModal';
import { Toaster } from '@/components/ui/toaster';
import { CommandDialogDemo } from '@/components/CommandDialog';
import { supabase } from '@/lib/customSupabaseClient';
import PasswordPrompt from '@/components/PasswordPrompt';
import BottomNavBar from '@/components/BottomNavBar';
import CloneModal from '@/components/CloneModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { BRANDS, DEFAULT_BRAND } from '@/lib/brands';
import { getActiveBucket } from '@/lib/bucketResolver';
import { X, Video, Loader2 } from 'lucide-react';

import PortadaSection from '@/components/sections/PortadaSection';
import DescripcionSection from '@/components/sections/DescripcionSection';
import GeneralesSection from '@/components/sections/GeneralesSection';
import FichaTecnicaSection from '@/components/sections/FichaTecnicaSection';
import FichaDinamicaSection from '@/components/sections/FichaDinamicaSection';
import CronogramaSection from '@/components/sections/CronogramaSection';
import ServiciosSection from '@/components/sections/ServiciosSection';
import LayoutSection from '@/components/sections/LayoutSection';
import VideoSection from '@/components/sections/VideoSection';
import ProcesoSection from '@/components/sections/ProcesoSection';
import PDFSection from '@/components/sections/PDFSection';
import GenericSection from '@/components/sections/GenericSection';
import IASection from '@/components/sections/IASection';
import CondicionesPagoSection from '@/components/sections/CondicionesPagoSection';
import PropuestaEconomicaSection from '@/components/sections/PropuestaEconomicaSection';
import CotizadorPage from '@/components/CotizadorPage';
import CotizadorSMQ from '@/components/CotizadorSMQ';
import CalculadoraProduccion from '@/components/CalculadoraProduccion';
import ExclusionesSection from '@/components/sections/ExclusionesSection';
import CapacidadesSection from '@/components/sections/CapacidadesSection';
import SCR700Page from '@/components/sections/SCR700Page';
import ClientesSection from '@/components/sections/ClientesSection';
import VentajasSection from '@/components/sections/VentajasSection';

const componentMap = {
  ventajas: VentajasSection,
  portada: PortadaSection,
  descripcion: DescripcionSection,
  generales: GeneralesSection,
  ficha: FichaTecnicaSection,
  ficha_dinamica: FichaDinamicaSection,
  propuesta: PropuestaEconomicaSection,
  cronograma: CronogramaSection,
  servicios: ServiciosSection,
  condiciones: CondicionesPagoSection,
  layout: LayoutSection,
  video: VideoSection,
  proceso: ProcesoSection,
  pdf: PDFSection,
  generic: GenericSection,
  ia: IASection,
  cotizador_page: CotizadorPage,
  cotizador_smq: CotizadorSMQ,
  calculadora_prod: CalculadoraProduccion,
  exclusiones: ExclusionesSection,
  capacidades: CapacidadesSection,
  scr700_page: SCR700Page,
  clientes: ClientesSection,
  admin: GenericSection,
  servicios_adicionales: GenericSection,
};

const defaultSections = [
  { id: 'portada', label: 'Home', icon: 'Home', isVisible: true, component: 'portada' },
  { id: 'descripcion', label: 'Descripción', icon: 'FileText', isVisible: true, component: 'descripcion' },
  { id: 'ficha', label: 'Ficha Técnica', icon: 'ListChecks', isVisible: true, component: 'ficha' },
  { id: 'cronograma', label: 'Cronograma', icon: 'Calendar', isVisible: true, component: 'cronograma' },
  { id: 'servicios', label: 'Servicios Incluidos', icon: 'Package', isVisible: true, component: 'servicios' },
  { id: 'layout', label: 'Lay Out', icon: 'LayoutGrid', isVisible: true, isLocked: false, component: 'layout' },
  { id: 'video', label: 'Video', icon: 'Video', isVisible: true, isLocked: false, component: 'video' },
  { id: 'proceso', label: 'Proceso', icon: 'TrendingUp', isVisible: true, component: 'proceso' },
  { id: 'calculadora_prod', label: 'Calculadora', icon: 'Calculator', isVisible: true, isLocked: false, component: 'calculadora_prod' },
  { id: 'pdf', label: 'Cotizaciones PDF', icon: 'FileDown', isVisible: true, component: 'pdf' },
  { id: 'analiticas', label: 'Analíticas', icon: 'BarChart', isVisible: true, component: 'admin', adminOnly: true },
  { id: 'ajustes', label: 'Ajustes', icon: 'Settings', isVisible: true, component: 'admin', adminOnly: true },
  { id: 'propuesta', label: 'Propuesta Económica', icon: 'DollarSign', isVisible: true, component: 'propuesta' },

  // Hidden/Auxiliary
  { id: 'exclusiones', label: 'Exclusiones', icon: 'XCircle', isVisible: false, component: 'exclusiones' },
  { id: 'ia', label: 'Asistente IA', icon: 'BrainCircuit', isVisible: true, isLocked: false, component: 'ia' },
];

const clientVisibleSections = new Set(defaultSections.filter(s => !s.adminOnly).map(s => s.id));

const mergeWithDefaults = (config, themeKey) => {
  // UNIVERSAL EXTRACTOR: Use sections array if wrapped in object
  const sectionsToMerge = Array.isArray(config) ? config : (config?.sections || []);
  if (!sectionsToMerge || sectionsToMerge.length === 0) return defaultSections;
  const defaultConfigMap = new Map(defaultSections.map(s => [s.id, s]));
  let mergedConfig = sectionsToMerge
    .filter(s => s.id !== 'propuesta_dinamica') // Explicitly filter out prop_dinamica from DB configs
    .map(s => {
      let merged;
      if (!defaultConfigMap.has(s.id)) {
        const baseComponentId = s.component || s.id.split('_copy')[0];
        const baseConfig = defaultConfigMap.get(baseComponentId) || {};
        merged = { ...baseConfig, ...s, component: baseComponentId };
      } else {
        merged = { ...defaultConfigMap.get(s.id), ...s };
      }

      // FORCE UNLOCK for specific sections to ensure they are editable regardless of DB state
      if (['ia', 'layout', 'video', 'calculadora_prod'].includes(merged.id)) {
        merged.isLocked = false;
      }

      // FORCE VISIBILITY for Portada to ensure it's always the landing
      if (merged.id === 'portada') {
        merged.isVisible = true;
      }

      return merged;
    });
  const existingIds = new Set(mergedConfig.map(s => s.id));
  defaultSections.forEach(ds => {
    if (!existingIds.has(ds.id)) mergedConfig.push(ds);
  });
  return mergedConfig;
};

const QuotationViewer = ({ initialQuotationData, allThemes = {}, isAdminView = false }) => {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState(initialQuotationData.theme_key);
  const [themes, setThemes] = useState(isAdminView ? allThemes : { [initialQuotationData.theme_key]: initialQuotationData });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [activeSection, setActiveSection] = useState('portada');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isFullBlackout, setIsFullBlackout] = useState(false);
  const [isHeroVideoActive, setIsHeroVideoActive] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [heroVideoConfig, setHeroVideoConfig] = useState({
    isIntegrated: false,
    scale: 1,
    borderRadius: 20
  });
  const idleTimerRef = useRef(null);
  const initialDisplayTimerRef = useRef(null);
  const hasInteracted = useRef(false);
  const [previewData, setPreviewData] = useState(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const quotationData = themes[activeTheme];
  const displayData = previewData ? { ...quotationData, ...previewData } : quotationData;

  useEffect(() => {
    if (displayData) {
      setHeroVideoConfig({
        isIntegrated: displayData.hero_video_is_integrated ?? false,
        scale: displayData.hero_video_scale ?? 1,
        borderRadius: displayData.hero_video_border_radius ?? 20
      });
    }
  }, [displayData?.hero_video_is_integrated, displayData?.hero_video_scale, displayData?.hero_video_border_radius]);

  useEffect(() => {
    const processedData = {
      ...initialQuotationData,
      sections_config: mergeWithDefaults(initialQuotationData.sections_config, initialQuotationData.theme_key),
    };
    const initialThemes = isAdminView ? allThemes : { [initialQuotationData.theme_key]: processedData };
    setThemes(initialThemes);

    if (isAdminView) {
      const savedTheme = localStorage.getItem('activeTheme');
      // Only restore if valid AND FULL (has sections_config)
      if (savedTheme && allThemes[savedTheme] && allThemes[savedTheme].sections_config) {
        setActiveTheme(savedTheme);
      } else {
        setActiveTheme(initialQuotationData.theme_key);
      }
    } else {
      setActiveTheme(initialQuotationData.theme_key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuotationData.theme_key, isAdminView]);

  // EFFECT: Auto-fetch full data if the ACTIVE theme is a stub
  useEffect(() => {
    const currentTheme = themes[activeTheme];
    // Check if it exists but is missing heavy content (e.g. sections_config)
    if (currentTheme && !currentTheme.sections_config) {
      console.log(`[LazyLoad] Active theme ${activeTheme} is a stub. Fetching full content...`);
      supabase
        .from('quotations')
        .select('*')
        .eq('theme_key', activeTheme)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setThemes(prev => ({
              ...prev,
              [activeTheme]: { ...prev[activeTheme], ...data }
            }));
            console.log(`[LazyLoad] Content loaded for ${activeTheme}`);
          } else {
            console.error(`[LazyLoad] Failed to load content for ${activeTheme}`, error);
            toast({ title: "Error de Carga", description: "No se pudo descargar el contenido.", variant: "destructive" });
          }
        });
    }
  }, [activeTheme, themes]);

  // EFFECT: Handle "Saved Theme" hydration with strict check for data completeness
  useEffect(() => {
    if (!isAdminView) return;

    const savedTheme = localStorage.getItem('activeTheme');
    // If we have a saved theme, it exists in our list, and it's NOT the already-loaded initial data...
    if (savedTheme && allThemes[savedTheme] && savedTheme !== initialQuotationData.theme_key) {

      // Check if it's "Stub" data (metadata only) -> Check for a key field like 'sections_config'
      if (!allThemes[savedTheme].sections_config) {
        console.log(`[Hydration] Saved theme ${savedTheme} is metadata-only. Fetching full data...`);
        supabase
          .from('quotations')
          .select('*')
          .eq('theme_key', savedTheme)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setThemes(prev => ({ ...prev, [savedTheme]: data }));
              setActiveTheme(savedTheme);
            } else {
              // Fallback if fetch fails
              setActiveTheme(initialQuotationData.theme_key);
            }
          });
      } else {
        // It's already full data (rare but possible if logic changes)
        setActiveTheme(savedTheme);
      }
    }
  }, [isAdminView, allThemes, initialQuotationData.theme_key]);

  // LAZY LOADING THEME SWITCHER
  const handleThemeSwitch = async (newThemeKey) => {
    // 1. Check if we already have the full data (e.g. sections_config exists)
    const targetTheme = themes[newThemeKey];
    if (targetTheme && targetTheme.sections_config) {
      setActiveTheme(newThemeKey);
      return;
    }

    // 2. If not, fetch it from Supabase
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('theme_key', newThemeKey)
        .single();

      if (error) throw error;

      // 3. Update themes state with the full data
      setThemes(prev => ({
        ...prev,
        [newThemeKey]: data
      }));

      // 4. Switch
      setActiveTheme(newThemeKey);
      toast({ title: "Cargado", description: `Proyecto ${data.project} listo.` });

    } catch (err) {
      console.error("Error lazy loading theme:", err);
      toast({ title: "Error", description: "No se pudo cargar el proyecto.", variant: "destructive" });
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsEditorMode(false);
  };

  const handleHomeClick = useCallback(() => {
    setActiveSection('portada');
    const homeEl = document.getElementById('main-content-scroll-area');
    if (homeEl) homeEl.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!displayData) return;
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      clearTimeout(initialDisplayTimerRef.current);
    }
    setIsBannerVisible(false);
    clearTimeout(idleTimerRef.current);
    const timeoutDuration = (displayData.idle_timeout || 4) * 1000;
    idleTimerRef.current = setTimeout(() => {
      setIsBannerVisible(true);
    }, timeoutDuration);
  }, [displayData]);

  useEffect(() => {
    if (!displayData) return;
    const initialTime = (displayData.initial_display_time || 2) * 1000;
    const idleTime = (displayData.idle_timeout || 4) * 1000;

    // Initial Timer: Hide banner after initial time, BUT only if we aren't already "idle enough" to keep it shown
    // or if we want to enforce a "blink" effect (Show -> Hide -> Show).
    // Given the user wants it to "run", a blink (Show Intro -> Hide -> Show Screensaver) is a good feedback loop.
    initialDisplayTimerRef.current = setTimeout(() => {
      if (!hasInteracted.current) {
        // If initial time is less than idle time, we hide it temporarily so it can "come back" at idle time.
        // If initial time is longer than idle time, we should just keep it visible.
        if (initialTime < idleTime) {
          setIsBannerVisible(false);
        }
      }
    }, initialTime);

    // Start Idle Timer on mount to ensure it shows up if user does nothing from start
    idleTimerRef.current = setTimeout(() => {
      if (!hasInteracted.current) {
        setIsBannerVisible(true);
      }
    }, idleTime);

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      clearTimeout(idleTimerRef.current);
      clearTimeout(initialDisplayTimerRef.current);
    };
  }, [resetIdleTimer, displayData]);

  useEffect(() => {
    if (displayData) {
      if (isAdminView) localStorage.setItem('activeTheme', activeTheme);
      document.body.className = 'theme-nova';

      // Dynamic Brand Theming
      // Dynamic Brand Theming
      const root = document.documentElement;

      const brandId = displayData.brand_color || DEFAULT_BRAND;
      const brandConfig = BRANDS[brandId] || BRANDS[DEFAULT_BRAND];

      root.style.setProperty('--primary', brandConfig.colors.primary);
      root.style.setProperty('--secondary', brandConfig.colors.secondary);
      root.style.setProperty('--primary-foreground', brandConfig.colors.primaryForeground);
      root.style.setProperty('--ring', brandConfig.colors.primary);

      // Legacy support
      root.style.setProperty('--color-led-blue', brandConfig.colors.primary);
    }
  }, [activeTheme, displayData, isAdminView]);

  const handleSectionSelect = useCallback((sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else {
      const mainContent = document.getElementById('main-content-scroll-area');
      if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const setSectionsConfig = async (newConfig) => {
    // Sanitize config to remove Component and other derived props before saving
    const sanitizedConfig = newConfig.map(({ Component, ...rest }) => rest);

    try {
      setThemes(prevThemes => ({
        ...prevThemes,
        [activeTheme]: { ...prevThemes[activeTheme], sections_config: sanitizedConfig },
      }));

      // WRAPPED SAVE: Always save as object to support metadata
      const wrappedPayload = {
        sections: sanitizedConfig,
        heroVideoUrl: displayData.video_url, // Use the current video url
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('quotations')
        .update({ sections_config: wrappedPayload })
        .eq('theme_key', activeTheme);

      if (error) throw error;
    } catch (err) {
      console.error("Error saving sections config:", err);
      toast({
        title: "Error de Guardado",
        description: `Error: ${err.message || err.details || "Desconocido"}.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const [activeTabMap, setActiveTabMap] = useState({});

  const handleSubItemSelect = (sectionId, index) => {
    setActiveSection(sectionId);
    setActiveTabMap(prev => ({ ...prev, [sectionId]: index }));
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };



  if (!displayData) return null;

  // UNIVERSAL CONFIG RESOLVER: Handle both Array (Standard) and Object (Master Plan/Defensive)
  const config = displayData.sections_config;
  const sectionsArray = Array.isArray(config)
    ? config
    : (config?.sections || defaultSections);

  // Resolve Video URL from column or fallback JSON (Defensive)
  const resolvedVideoUrl = displayData.video_url || (config && !Array.isArray(config) ? config.heroVideoUrl : null);

  let menuItems = sectionsArray.map(section => {
    const cleanCompKey = (section.component || section.id).split('_copy')[0];
    // Fix for 'ventajas' label potentially being saved as the translation key
    let displayLabel = section.label;
    if (section.id === 'ventajas' && (displayLabel === 'sections.ventajas' || !displayLabel)) {
      displayLabel = t('sections.ventajas');
    }

    // Generate subItems for Ficha
    let subItems = [];
    if (section.id === 'ficha' && section.content && Array.isArray(section.content)) {
      subItems = section.content.map((item, index) => ({
        id: index,
        label: item.tabTitle || `Ficha ${index + 1}`,
        icon: item.icon || 'FileText'
      }));
    }

    return {
      ...section,
      Component: componentMap[cleanCompKey] || componentMap[section.id] || GenericSection,
      label: displayLabel || t(`sections.${section.id}`),
      subItems // Add subItems
    };
  });

  // Extra safety filter to ensure removed components don't crash
  menuItems = menuItems.filter(section => section.id !== 'propuesta_dinamica' && !['ventajas', 'generales'].includes(section.id));

  if (!isAdminView) {
    // Filter hidden items and admin items for normal view
    menuItems = menuItems.filter(item => item.isVisible && clientVisibleSections.has(item.id.split('_copy')[0]) && !item.adminOnly && !item._deleted);
  } else if (!isAdminAuthenticated) {
    // Filter admin items for non-authenticated admin view AND respect visibility
    menuItems = menuItems.filter(item => item.isVisible && !item.adminOnly && !item._deleted);
  } else {
    // Admin authenticated view: still hide deleted items
    menuItems = menuItems.filter(item => !item._deleted);
  }

  const handleDeleteSection = async (sectionId) => {
    const fullConfig = displayData.sections_config || defaultSections;
    // Map over FULL config to mark item as deleted
    const newConfig = fullConfig.map(s =>
      s.id === sectionId ? { ...s, _deleted: true } : s
    );

    await setSectionsConfig(newConfig);

    toast({
      title: "Sección eliminada",
      description: "La sección se ha eliminado correctamente.",
    });
  };

  const handleVideoUrlUpdate = async (newUrl) => {
    const updatedDate = new Date().toISOString();

    // REDUNDANCY: In Standard Viewer, sections_config is usually an Array of sections.
    // We update the themes state immediately.
    const updatedData = {
      ...displayData,
      video_url: newUrl,
      updated_at: updatedDate
    };

    setThemes(prev => ({
      ...prev,
      [activeTheme]: updatedData
    }));

    try {
      // Primary attempt: Save to dedicated columns.
      // We ALSO save to sections_config as a fallback for absolute persistence.
      const wrappedPayload = {
        sections: sectionsArray,
        heroVideoUrl: newUrl,
        updated_at: updatedDate
      };

      const { error } = await supabase
        .from('quotations')
        .update({
          video_url: newUrl,
          updated_at: updatedDate,
          sections_config: wrappedPayload
        })
        .eq('theme_key', activeTheme);

      if (error) {
        console.warn("[QuotationViewer] Primary save failed, retrying with wrapped config only...", error);
        // Fallback: Save ONLY to sections_config if video_url column is missing
        await supabase
          .from('quotations')
          .update({
            sections_config: wrappedPayload
          })
          .eq('theme_key', activeTheme);
      }
    } catch (err) {
      console.error("Critical save error in QuotationViewer:", err);
      toast({ title: "Error", description: "No se pudo guardar la URL del video.", variant: "destructive" });
    }
  };

  const handleHeroVideoUpload = async (file) => {
    if (!file) return;
    setIsUploadingHero(true);
    try {
      const bucket = await getActiveBucket();
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeTheme}_hero_${Date.now()}.${fileExt}`;
      const filePath = `hero_videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      await handleVideoUrlUpdate(publicUrl);
      toast({ title: "Video del Hero actualizado", description: "El video se ha subido correctamente." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo subir el video.", variant: "destructive" });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const triggerHeroVideo = () => {
    if (resolvedVideoUrl) {
      setIsHeroVideoActive(true);
    } else {
      toast({ title: "Sin video", description: "Sube un video en modo Editor para activar la animación." });
    }
  };

  const renderActiveComponent = () => {
    if (activeSection === 'cotizador_page') {
      return (
        <CotizadorPage
          quotationData={displayData}
          activeTheme={activeTheme}
          setThemes={setThemes}
        />
      );
    }

    const activeSectionObj = menuItems.find(s => s.id === activeSection);
    const ActiveComponent = activeSectionObj?.Component || componentMap[activeSection] || GenericSection;

    return (
      <MainContent
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        quotationData={displayData}
        aiQuery={aiQuery}
        setAiQuery={setAiQuery}
        sections={menuItems}
        allSectionsData={displayData.sections_config} // Pass full config including hidden items
        isEditorMode={isEditorMode && isAdminView}
        setIsEditorMode={setIsEditorMode}
        activeTheme={activeTheme}
        onSectionContentUpdate={setSectionsConfig}
        onVideoUrlUpdate={handleVideoUrlUpdate}
        activeTabMap={activeTabMap} // Pass active tabs
        triggerHeroVideo={triggerHeroVideo}
        handleHeroVideoUpload={handleHeroVideoUpload}
        isUploadingHero={isUploadingHero}
        isAdminAuthenticated={isAdminAuthenticated}
        heroVideoConfig={heroVideoConfig}
        isHeroVideoActive={isHeroVideoActive}
        setIsHeroVideoActive={setIsHeroVideoActive}
      />
    );
  };

  return (
    <>
      <Helmet>
        <title>{displayData?.company || 'Solimaq'} - {displayData?.project || 'Proyecto'}</title>
        <link rel="icon" href={displayData?.favicon || "/favicon.png"} />

      </Helmet>
      {isAdminView && showPasswordPrompt && (
        <PasswordPrompt
          onCorrectPassword={() => { setIsAdminAuthenticated(true); setShowPasswordPrompt(false); }}
          onCancel={() => setShowPasswordPrompt(false)}
        />
      )}
      {isAdminView && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => { setShowAdminModal(false); setPreviewData(null); }}
          themes={themes}
          setThemes={setThemes}
          activeTheme={activeTheme}
          setActiveTheme={handleThemeSwitch}
          onCloneClick={() => { setShowAdminModal(false); setShowCloneModal(true); }}
          onPreviewUpdate={setPreviewData}
        />
      )}
      {isAdminView && (
        <CloneModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          themes={themes}
          setThemes={setThemes}
          activeTheme={activeTheme}
          onCloneSuccess={(newThemeKey) => {
            handleThemeSwitch(newThemeKey);
            setShowCloneModal(false);
            toast({ title: "¡Clonado exitoso! 🚀", description: "La cotización ha sido duplicada correctamente." });
          }}
        />
      )}
      <div className="flex h-screen overflow-hidden bg-black relative">
        <div className="hidden lg:flex lg:flex-shrink-0 absolute h-full z-50">
          <Sidebar
            activeSection={activeSection}
            onSectionSelect={handleSectionSelect}
            onHomeClick={handleHomeClick}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            onAdminClick={() => isAdminView && setShowAdminModal(true)}
            isEditorMode={isEditorMode && isAdminView}
            setIsEditorMode={setIsEditorMode}
            sections={menuItems}
            setSections={setSectionsConfig}
            isAdminAuthenticated={isAdminAuthenticated && isAdminView}
            onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
            onAdminLogout={handleAdminLogout}
            isAdminView={isAdminView}
            onCotizadorClick={() => handleSectionSelect('cotizador_page')}
            onSubItemSelect={handleSubItemSelect}
            activeTabMap={activeTabMap}
            onDeleteSection={handleDeleteSection}
          />
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[320px]'} pl-0`}>
          <Header
            quotationData={displayData}
            onLogoClick={handleHomeClick}
            onSearchClick={() => isAdminView && setShowCommandDialog(true)}
            isBannerVisible={isBannerVisible}
            isEditorMode={isEditorMode}
            isAdminView={isAdminView}
            // Mobile Menu Props
            sections={menuItems}
            activeSection={activeSection}
            onSectionSelect={handleSectionSelect}
            onHomeClick={handleHomeClick}
            isAdminAuthenticated={isAdminAuthenticated && isAdminView}
            onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
            onAdminLogout={handleAdminLogout}
            onCotizadorClick={() => handleSectionSelect('cotizador_page')}
            onSubItemSelect={handleSubItemSelect}
            activeTabMap={activeTabMap}
            setIsEditorMode={setIsEditorMode}
            onAdminClick={() => isAdminView && setShowAdminModal(true)}
          />
          <div id="main-content-scroll-area" className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
            {renderActiveComponent()}
          </div>
        </div>

        {/* Hero Video Overlay - Simplified v2.34.2 */}
        {isHeroVideoActive && !heroVideoConfig.isIntegrated && (
          <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
            {resolvedVideoUrl && (
              <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500">
                <video
                  src={resolvedVideoUrl}
                  autoPlay
                  onEnded={() => setIsHeroVideoActive(false)}
                  className="w-full h-full object-contain shadow-2xl shadow-primary/20"
                />
                <button
                  onClick={() => setIsHeroVideoActive(false)}
                  className="absolute top-10 right-10 p-5 rounded-full bg-white/10 text-white hover:bg-red-500 transition-all border border-white/10 group backdrop-blur-md"
                >
                  <X size={32} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}

        <BottomNavBar
          sections={menuItems}
          activeSection={activeSection}
          onSectionSelect={handleSectionSelect}
          onHomeClick={handleHomeClick}
          isEditorMode={isEditorMode && isAdminView}
          isAdminAuthenticated={isAdminAuthenticated && isAdminView}
          onAdminClick={() => isAdminView && setShowAdminModal(true)}
          setIsEditorMode={setIsEditorMode}
          onAdminLogin={() => isAdminView && setShowPasswordPrompt(true)}
          onAdminLogout={handleAdminLogout}
          activeTheme={activeTheme}
          isAdminView={isAdminView}
        />
        <Toaster />
      </div>
    </>
  );
};

export default QuotationViewer;