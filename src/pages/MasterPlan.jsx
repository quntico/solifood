import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExportTemplateEditor from '../components/ExportTemplateEditor';
import { supabase } from "@/lib/customSupabaseClient";
import PasswordPrompt from '@/components/PasswordPrompt';
import { getActiveBucket } from "@/lib/bucketResolver";
import { Camera, Video, Image as ImageIcon, X, Check, Maximize2, Upload, Loader2, Play, Lock, Unlock, Settings, Edit, Shield, AlignLeft, AlignCenter, AlignRight, AlignJustify, Calendar, User, Briefcase, ChevronRight, ChevronDown, ChevronsDown, ChevronsRight, FileSpreadsheet, Download, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const STORAGE_KEY = "solifood_masterplan_v1_autonomo";
const DEFAULT_CLOUD_SLUG = "master-plan";

const STICKY_OFFSETS = {
    header_compact: 64, // Height of the slim main header
    module_title: 56,   // Height of the module title bar
};

const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

const money = (v) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmt = money;

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const initialSections = [
    {
        id: "sec_cacao",
        titulo: "1. Línea de cacao (desde grano) · Selección → Tostado → Descascarillado → Molienda → Prensado",
        tag: "Oferta LST · Bean to Powder 200–300 kg/h",
        items: [
            { id: uid(), activo: true, codigo: "1.1", equipo: "Máquina seleccionadora de grano de cacao", descripcion: "Separación/limpieza por etapas (winnowing) para eficiencia.", fuente: "LST", qty: 1, costoUSD: 5000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.2", equipo: "Elevador/cargador tipo Z para 2 tostadores", descripcion: "Carga automática para alimentar 2 tostadores.", fuente: "LST", qty: 1, costoUSD: 8000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.3", equipo: "Tostadores a gas (roasting machine)", descripcion: "Tostado controlado por lotes (según oferta).", fuente: "LST", qty: 2, costoUSD: 10000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.4", equipo: "Placas de enfriamiento (cooling plate)", descripcion: "Enfriado de cacao tostado para estabilizar proceso.", fuente: "LST", qty: 2, costoUSD: 4800, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.5", equipo: "Cargadores por vacío (vacuum loading)", descripcion: "Transporte/carga para grano tostado y nibs (según oferta).", fuente: "LST", qty: 2, costoUSD: 4600, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.6", equipo: "Tanques de almacenamiento para grano/nibs", descripcion: "Pulmón/almacenamiento para continuidad de línea.", fuente: "LST", qty: 2, costoUSD: 4200, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.7", equipo: "Descascarilladora + aventadora (peeling & winnowing)", descripcion: "Separación de cáscara y obtención de nibs.", fuente: "LST", qty: 1, costoUSD: 12000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.8", equipo: "Cargadores por vacío para nibs (vacuum loading)", descripcion: "Transporte de nibs a molienda/almacenamiento (según oferta).", fuente: "LST", qty: 2, costoUSD: 4600, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.9", equipo: "Tanques de almacenamiento de nibs", descripcion: "Pulmón dedicado para nibs previo a molienda.", fuente: "LST", qty: 2, costoUSD: 4200, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.10", equipo: "Molino de bolas 1ª molienda (nibs → pasta/licor)", descripcion: "Molienda inicial de nibs para formar cocoa mass.", fuente: "LST", qty: 1, costoUSD: 40000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.11", equipo: "Chiller de agua 15 HP", descripcion: "Enfriamiento para estabilidad térmica (según oferta).", fuente: "LST", qty: 1, costoUSD: 10000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.12", equipo: "Tanques almacenamiento pasta/chocolate", descripcion: "Tanques jacketed para cocoa mass/chocolate (según oferta).", fuente: "LST", qty: 2, costoUSD: 5500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.13", equipo: "Bombas para chocolate (Durex)", descripcion: "Bombeo sanitario de chocolate/pasta (según oferta).", fuente: "LST", qty: 2, costoUSD: 2300, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.14", equipo: "Prensa de licor (oil press) · 3 sets", descripcion: "Prensado para obtener manteca de cacao + torta.", fuente: "LST", qty: 3, costoUSD: 14000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.15", equipo: "Tanque de manteca de cacao", descripcion: "Almacenamiento de cocoa butter para formulación.", fuente: "LST", qty: 1, costoUSD: 5500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.16", equipo: "Bomba para manteca", descripcion: "Transferencia de cocoa butter a proceso.", fuente: "LST", qty: 1, costoUSD: 2300, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.17", equipo: "Crusher de torta de cacao", descripcion: "Rompedor de torta tras prensado.", fuente: "LST", qty: 1, costoUSD: 4500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.18", equipo: "Molino/pulverizador de cacao (cocoa powder grinder)", descripcion: "Pulveriza torta para cacao en polvo base.", fuente: "LST", qty: 1, costoUSD: 6500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "1.19", equipo: "Tubería chaquetada para chocolate (50 m)", descripcion: "Pipe jacketed para transferencia térmica controlada.", fuente: "LST", qty: 50, costoUSD: 120, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_polvo_bebida",
        collapsed: true,
        summaryDesc: "",
        titulo: "2. Chocolate en polvo para bebida (mezcla con leche) · Formulación → Mezclado → (Opcional) Instantizado",
        tag: "Pendiente de cotizar (requerido para tu SKU de bebida)",
        items: [
            { id: uid(), activo: true, codigo: "2.1", equipo: "Tolvas para azúcar / leche en polvo / cacao en polvo base", descripcion: "Almacenamiento y alimentación controlada de ingredientes secos.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "2.2", equipo: "Sistema de pesaje y dosificación de ingredientes secos", descripcion: "Dosificación por receta para repetibilidad de mezcla.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "2.3", equipo: "Mezcladora tipo ribbon/paddle (grado alimenticio)", descripcion: "Mezcla homogénea (cacao + azúcar + leche en polvo + aditivos).", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "2.4", equipo: "Tamiz / desaglomerador", descripcion: "Elimina grumos y controla granulometría final.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "2.5", equipo: "Sistema de instantizado (opcional recomendado)", descripcion: "Mejora humectación/disolución con lecitina (menos grumos al mezclar con leche).", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "2.6", equipo: "Colector de polvo / filtración", descripcion: "Control de polvo por higiene, merma y seguridad.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_empaque_polvo",
        collapsed: true,
        summaryDesc: "",
        titulo: "3. Empaque de polvos · Bolsa 400 g",
        tag: "Oferta PKW-130",
        items: [
            { id: uid(), activo: true, codigo: "3.1", equipo: "Línea de empaquetado de polvos PKW-130 (completa)", descripcion: "Empaque para chocolate en polvo (bolsa 400 g). Total oferta: 29,000 USD.", fuente: "PKW-130", qty: 1, costoUSD: 29000, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_tabletas",
        collapsed: true,
        summaryDesc: "",
        titulo: "4. Tabletas (2 líneas) · Templado → Moldeo → Vibrado → Enfriado → Desmolde",
        tag: "Oferta Mini Chocolate Molding Line (ajustada a 2 líneas) + 1 Foil",
        items: [
            { id: uid(), activo: true, codigo: "4.1", equipo: "Fundidor de grasa/manteca (fat melter)", descripcion: "Tanque 1000 L con pesaje + bomba (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 8800, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.2", equipo: "Cargador de polvos (powder loader)", descripcion: "Carga de azúcar/cacao en polvo para formulación (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 4500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.3", equipo: "Molino de bolas para chocolate (ball mill) 300 kg/batch", descripcion: "Refinado por batch (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 21500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.4", equipo: "Chiller de agua 5 HP", descripcion: "Enfriamiento para sistema (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 4000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.5", equipo: "Sistema de alimentación de chocolate (tanque + bomba + control)", descripcion: "Tanque 500 kg + bomba + control (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 7000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.6", equipo: "Templadora 100 kg/batch", descripcion: "Templado por batch (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 14000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.7", equipo: "Cargador de moldes + calentador (mould loader & heater)", descripcion: "Carga automática de moldes a calentador (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 6200, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.8", equipo: "Depositador One-Shot (mini depositor)", descripcion: "Sistema Delta/Schneider (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 20500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.9", equipo: "Vibrador", descripcion: "Elimina burbujas (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 5200, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.10", equipo: "Túnel de enfriamiento vertical", descripcion: "Capacidad 180 moldes, con chiller 8HP (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 31000, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.11", equipo: "Desmoldeador (demoulder) (opcional en oferta)", descripcion: "Voltea/knock de molde y regresa (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 20500, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.12", equipo: "Moldes (200 pcs por línea aprox.)", descripcion: "Se asume 400 pcs totales para 2 líneas/2 formas (ajustable).", fuente: "Mini Molding", qty: 400, costoUSD: 8, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.13", equipo: "Herramental / tooling (2 sets)", descripcion: "1 set por cada forma de molde (lisa + hex).", fuente: "Mini Molding", qty: 2, costoUSD: 800, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "4.14", equipo: "Envolvedora foil (foil wrapping machine)", descripcion: "1 sola línea de foil para tabletas lisas. Costo: 118,000 USD.", fuente: "Mini Molding", qty: 1, costoUSD: 118000, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_hex",
        collapsed: false,
        summaryDesc: "",
        titulo: "5. Empaque de tabletas hexagonales · Encartonado hex",
        tag: "Pendiente de cotizar (tu otra presentación)",
        items: [
            { id: uid(), activo: true, codigo: "5.1", equipo: "Formadora/encartonadora de caja hexagonal", descripcion: "Formado y cierre de caja hex.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "5.2", equipo: "Alimentación/insertado de tableta + cierre", descripcion: "Inserta tableta, cierra y expulsa.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "5.3", equipo: "Etiquetado/impresión lote (si aplica)", descripcion: "Trazabilidad y presentación.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_utilidades",
        collapsed: false,
        summaryDesc: "",
        titulo: "6. Utilidades mínimas (planta)",
        tag: "Pendiente (no inflar: queda en 0 hasta cotizar)",
        items: [
            { id: uid(), activo: true, codigo: "6.1", equipo: "Aire comprimido (compresor + secador + tanque)", descripcion: "Actuadores y empaque.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "6.2", equipo: "Extracción de polvo / filtros", descripcion: "Zona de mezcla de polvos e higiene.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
            { id: uid(), activo: true, codigo: "6.3", equipo: "HVAC / control de temperatura", descripcion: "Estabilidad del chocolate/áreas críticas.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0, utilidad: 10 },
        ],
    },
];

export default function MasterPlan() {
    const { slug } = useParams();
    const CLOUD_SLUG = slug || DEFAULT_CLOUD_SLUG;
    const navigate = useNavigate();
    const { toast } = useToast();
    const [horasDia, setHorasDia] = useState(16);
    const [kgLisas, setKgLisas] = useState(800);
    const [gLisas, setGLisas] = useState(20);
    const [kgHex, setKgHex] = useState(800);
    const [gHex, setGHex] = useState(90);
    const [kgPolvo, setKgPolvo] = useState(400);
    const [gBolsaPolvo, setGBolsaPolvo] = useState(400);
    const [tipoCambio, setTipoCambio] = useState(18.5);
    const [ivaPct, setIvaPct] = useState(16);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const tableContainerRefs = useRef({});
    const virtualHeaderRefs = useRef({});


    const [uploadingId, setUploadingId] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [colsLocked, setColsLocked] = useState(() => localStorage.getItem("solifood_masterplan_colsLocked") === "true");
    const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
    const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);

    const [clientName, setClientName] = useState(() => localStorage.getItem("solifood_mp_client") || "YADIRA RAMIREZ");
    const [projectName, setProjectName] = useState(() => localStorage.getItem("solifood_mp_project") || "CDA 2000");
    const [projectDesc, setProjectDesc] = useState(() => localStorage.getItem("solifood_mp_desc") || "Proyecto desde grano + 2 líneas de tabletas + polvo bebida + empaque.");
    const [projectDate, setProjectDate] = useState(() => localStorage.getItem("solifood_mp_date") || new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("solifood_mp_logo") || "/solifood-logo-v418.png");

    const [mpTitle, setMpTitle] = useState(() => localStorage.getItem("solifood_mp_title") || "MASTER PLAN");
    const [mpSubTitle, setMpSubTitle] = useState(() => localStorage.getItem("solifood_mp_subtitle") || "INDUSTRIAL CENTER");
    const [heroVideoUrl, setHeroVideoUrl] = useState(() => localStorage.getItem("solifood_mp_hero_video") || "");
    const [isHeroVideoActive, setIsHeroVideoActive] = useState(false);
    const [heroVideoIsIntegrated, setHeroVideoIsIntegrated] = useState(() => localStorage.getItem("solifood_mp_hero_integrated") === "true");
    const [heroVideoScale, setHeroVideoScale] = useState(() => Number(localStorage.getItem("solifood_mp_hero_scale")) || 100);
    const [heroVideoBorderRadius, setHeroVideoBorderRadius] = useState(() => Number(localStorage.getItem("solifood_mp_hero_radius")) || 20);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [lastCloudSync, setLastCloudSync] = useState(null);
    const [tableFontSize, setTableFontSize] = useState(() => Number(localStorage.getItem("solifood_mp_table_font_size")) || 14);
    const [isHydrated, setIsHydrated] = useState(false);
    const [importedFileName, setImportedFileName] = useState(() => localStorage.getItem("solifood_mp_imported_filename") || "");
    const [globalUtilVal, setGlobalUtilVal] = useState(10);
    const [targetAmountModalOpen, setTargetAmountModalOpen] = useState(false);
    const [targetAmountValue, setTargetAmountValue] = useState(0);
    const [pdfSettings, setPdfSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('solifood_pdf_template_v11');
            return saved ? JSON.parse(saved) : {
                primaryColor: '#facc15',
                secondaryColor: '#000000',
                headerBg: '#facc15',
                headerText: '#000000',
                titleText: 'CONCENTRADO',
                logoPos: { x: 235, y: 0, width: 45, height: 25 },
                headerBox: { x: 15, y: 0, width: 95, height: 15 },
                metaPos: { x: 120, y: 3 },
                colWidths: { item: 15, equipo: 45, desc: 85, foto: 35, qty: 15, unit: 32, total: 32 },
                fontSize: 9,
                rowHeight: 25,
                showImages: true,
                imgSize: 18,
            };
        } catch { return null; }
    });
    const [isFooterHovered, setIsFooterHovered] = useState(false);

    const logoRef = useRef(null);
    const heroVideoInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const tableRefs = useRef({});
    const headerRefs = useRef({});

    const [colWidths, setColWidths] = useState(() => {
        try {
            const saved = localStorage.getItem("solifood_masterplan_colWidths_v2");
            return saved ? JSON.parse(saved) : {
                item: 80, equipo: 250, descripcion: 350, media: 120, qty: 80, costo: 130, util: 80, unitario: 140, total: 160, action: 60
            };
        } catch { return { item: 80, equipo: 250, descripcion: 350, media: 120, qty: 80, costo: 130, util: 80, unitario: 140, total: 160, action: 60 }; }
    });

    const [sections, setSections] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return initialSections;
            const parsed = JSON.parse(raw);
            return parsed?.length ? parsed : initialSections;
        } catch { return initialSections; }
    });

    useEffect(() => {
        if (!isHydrated) return; // Prevent saving until we have fetched or decided we are the source of truth

        console.log("[MasterPlan] Syncing to LocalStorage");
        localStorage.setItem("solifood_mp_client", clientName);
        localStorage.setItem("solifood_mp_project", projectName);
        localStorage.setItem("solifood_mp_desc", projectDesc);
        localStorage.setItem("solifood_mp_date", projectDate);
        localStorage.setItem("solifood_mp_logo", logoUrl);
        localStorage.setItem("solifood_mp_title", mpTitle);
        localStorage.setItem("solifood_mp_subtitle", mpSubTitle);
        localStorage.setItem("solifood_mp_hero_video", heroVideoUrl);
        localStorage.setItem("solifood_mp_hero_integrated", heroVideoIsIntegrated);
        localStorage.setItem("solifood_mp_hero_scale", heroVideoScale);
        localStorage.setItem("solifood_mp_hero_radius", heroVideoBorderRadius);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
        localStorage.setItem("solifood_masterplan_colsLocked", colsLocked);
        localStorage.setItem("solifood_masterplan_colWidths_v2", JSON.stringify(colWidths));
        localStorage.setItem("solifood_mp_table_font_size", tableFontSize);
        if (pdfSettings) localStorage.setItem('solifood_pdf_template_v11', JSON.stringify(pdfSettings));
    }, [clientName, projectName, projectDesc, projectDate, mpTitle, mpSubTitle, heroVideoUrl, heroVideoIsIntegrated, heroVideoScale, heroVideoBorderRadius, sections, colsLocked, colWidths, tableFontSize, pdfSettings, isHydrated]);

    const syncScroll = (id, e) => {
        if (virtualHeaderRefs.current[id]) {
            virtualHeaderRefs.current[id].scrollLeft = e.target.scrollLeft;
        }
    };

    useEffect(() => {
        const handleGlobalExport = () => {
            console.log("Global export triggered: Master Plan Concentrado");
            handleExportPDF();
        };
        window.addEventListener('SOLIFOOD_EXPORT_MASTERPLAN', handleGlobalExport);
        return () => window.removeEventListener('SOLIFOOD_EXPORT_MASTERPLAN', handleGlobalExport);
    }, [sections, pdfSettings, clientName, projectName]); // Dependencies for handleExportPDF

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchCloudData = async () => {
        try {
            const { data, error } = await supabase
                .from('quotations')
                .select('*')
                .eq('slug', CLOUD_SLUG)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                const config = data.sections_config || {};
                console.log("[MasterPlan] Cloud data found:", data);

                if (config.clientName) setClientName(config.clientName);
                if (config.projectName) setProjectName(config.projectName);
                if (config.projectDesc) setProjectDesc(config.projectDesc);
                if (config.projectDate) setProjectDate(config.projectDate);
                if (config.mpTitle) setMpTitle(config.mpTitle);
                if (config.mpSubTitle) setMpSubTitle(config.mpSubTitle);
                if (config.logoUrl) setLogoUrl(config.logoUrl);
                else if (data.logo_url) setLogoUrl(data.logo_url);

                // HYDRATION PROTECTION: Check both column and config
                const cloudVideoUrl = data.video_url || config.heroVideoUrl;
                if (cloudVideoUrl) {
                    setHeroVideoUrl(cloudVideoUrl);
                } else {
                    console.log("[MasterPlan] No cloud video found, keeping local:", heroVideoUrl);
                }

                if (config.heroVideoIsIntegrated !== undefined) setHeroVideoIsIntegrated(config.heroVideoIsIntegrated);
                if (config.heroVideoScale) setHeroVideoScale(config.heroVideoScale);
                if (config.pdfSettings) setPdfSettings(config.pdfSettings);
                if (config.heroVideoBorderRadius) setHeroVideoBorderRadius(config.heroVideoBorderRadius);
                if (config.tableFontSize) setTableFontSize(config.tableFontSize);

                // UNIVERSAL RESOLVER: Handle sections if wrapped in an object
                const sectionsToSet = Array.isArray(config.sections) ? config.sections : (Array.isArray(config) ? config : null);
                if (sectionsToSet) setSections(sectionsToSet);

                setLastCloudSync(new Date());
            } else {
                console.log("[MasterPlan] No cloud data, using defaults.");
            }
            setIsHydrated(true);
        } catch (error) {
            console.error("Error fetching cloud data:", error);
            setIsHydrated(true); // Still hydrate to allow local edits if cloud fails
        }
    };

    const saveToCloud = async (passedConfig = null) => {
        setIsCloudSyncing(true);
        // Guard against React/DOM events being passed as config
        const overrideConfig = (passedConfig && passedConfig.nativeEvent) ? null : passedConfig;

        const configToSave = overrideConfig || {
            clientName, projectName, projectDesc, projectDate,
            mpTitle, mpSubTitle, heroVideoUrl, heroVideoIsIntegrated,
            heroVideoScale, heroVideoBorderRadius,
            tableFontSize, logoUrl,
            sections, // Standard sections array
            pdfSettings, // Flagship settings
            // metadata fallback
            heroVideoUrl: heroVideoUrl
        };

        const updatedDate = new Date().toISOString();
        const currentVideoUrl = overrideConfig ? overrideConfig.heroVideoUrl : heroVideoUrl;

        try {
            console.log("[MasterPlan] Saving to cloud...", configToSave);
            // Try to update with all columns
            const { error: updateError } = await supabase
                .from('quotations')
                .update({
                    sections_config: configToSave,
                    video_url: currentVideoUrl,
                    updated_at: updatedDate,
                    project: configToSave.projectName || projectName,
                    client: configToSave.clientName || clientName,
                    logo_url: configToSave.logoUrl || logoUrl
                })
                .eq('slug', CLOUD_SLUG);

            if (updateError) {
                console.warn("[MasterPlan] Primary update failed (could be missing column or slug):", updateError);

                // If the error is about missing column (42703 or PGRST204), try saving WITHOUT video_url/logo_url columns
                if (updateError.code === '42703' || updateError.code === 'PGRST204') {
                    console.log("[MasterPlan] missing columns, falling back to config only...");
                    const { error: fallbackError } = await supabase
                        .from('quotations')
                        .update({
                            sections_config: configToSave,
                            updated_at: updatedDate,
                            project: configToSave.projectName || projectName,
                            client: configToSave.clientName || clientName
                        })
                        .eq('slug', CLOUD_SLUG);

                    if (fallbackError) throw fallbackError;
                } else {
                    // Try to upsert/insert if slug not found
                    const { error: insertError } = await supabase
                        .from('quotations')
                        .upsert({
                            slug: CLOUD_SLUG,
                            theme_key: `mp_${uid()}`,
                            sections_config: configToSave,
                            video_url: currentVideoUrl,
                            logo_url: configToSave.logoUrl || logoUrl,
                            updated_at: updatedDate,
                            project: configToSave.projectName || projectName,
                            client: configToSave.clientName || clientName,
                            title: configToSave.mpTitle || mpTitle,
                            is_home: false
                        }, { onConflict: 'slug' });

                    if (insertError) {
                        console.warn("[MasterPlan] Upsert failed, retrying without extended columns...");
                        const { error: insertFallbackError } = await supabase
                            .from('quotations')
                            .upsert({
                                slug: CLOUD_SLUG,
                                theme_key: `mp_${uid()}`,
                                sections_config: configToSave,
                                updated_at: updatedDate,
                                project: configToSave.projectName || projectName,
                                client: configToSave.clientName || clientName,
                                title: configToSave.mpTitle || mpTitle,
                                is_home: false
                            }, { onConflict: 'slug' });

                        if (insertFallbackError) throw insertFallbackError;
                    }
                }
            }

            setLastCloudSync(new Date());
            if (!overrideConfig) {
                toast({ title: "Sincronizado con la Nube", description: "Los cambios se han guardado permanentemente." });
            }
        } catch (error) {
            console.error("Error saving to cloud:", error);
            toast({ title: "Error de Sincronización", description: "No se pudo guardar en la nube.", variant: "destructive" });
        } finally {
            setIsCloudSyncing(false);
        }
    };

    useEffect(() => {
        fetchCloudData();
    }, []);

    const handleSavePdfSettings = (newSettings, newClient, newProject, pdfLogoUrl) => {
        // 1. Update LOCAL React state instantly
        setPdfSettings(newSettings);
        if (newClient) setClientName(newClient);
        if (newProject) setProjectName(newProject);

        // 2. Prepare the config object
        const updatedConfig = {
            clientName: newClient || clientName,
            projectName: newProject || projectName,
            projectDesc, projectDate,
            mpTitle, mpSubTitle, heroVideoUrl, heroVideoIsIntegrated,
            heroVideoScale, heroVideoBorderRadius,
            tableFontSize,
            logoUrl: logoUrl, // Institutional logo remains same
            sections,
            pdfSettings: {
                ...newSettings,
                logoUrl: pdfLogoUrl // PDF specific logo stored inside pdfSettings
            }
        };

        // 3. Fire-and-forget sync to fix INP issue
        saveToCloud(updatedConfig).catch(e => console.error("Cloud sync error:", e));
    };

    const toggleSection = (id) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, collapsed: !s.collapsed } : s));
    };

    const updateSectionTitle = (id, val) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, titulo: val.toUpperCase() } : s));
    };
    const updateSection = (id, patch) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    const handleTableScroll = (id, e) => {
        if (headerRefs.current[id]) {
            headerRefs.current[id].scrollLeft = e.target.scrollLeft;
        }
    };

    const startResize = (colKey, e) => {
        if (colsLocked) return;
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = colWidths[colKey];

        const onMouseMove = (moveEvent) => {
            const delta = moveEvent.pageX - startX;
            setColWidths(prev => ({ ...prev, [colKey]: Math.max(40, startWidth + delta) }));
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "default";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "col-resize";
    };

    const toggleColsLocked = () => {
        setColsLocked(!colsLocked);
        toast({ title: !colsLocked ? "Celdas Bloqueadas" : "Edición de Celdas Activa" });
    };

    const toggleAdmin = () => {
        if (!isAdminAuthenticated) {
            setShowPasswordPrompt(true);
        } else {
            const newAdminState = !isAdmin;
            setIsAdmin(newAdminState);

            // Si estamos desactivando el editor, guardamos todo preventivamente
            if (!newAdminState) {
                console.log("[MasterPlan] Desactivando editor, guardando cambios...");
                saveToCloud();
            }
        }
    };

    const handleLogoUpload = async (file) => {
        if (!file) return;
        setUploadingId('logo');
        try {
            const bucket = await getActiveBucket();
            const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
            const filePath = `masterplan/${fileName}`;
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            setLogoUrl(publicUrl);

            // Pass the literal updated config to avoid stale state in saveToCloud
            const updatedConfig = {
                clientName, projectName, projectDesc, projectDate,
                mpTitle, mpSubTitle, logoUrl: publicUrl, heroVideoUrl,
                heroVideoIsIntegrated, heroVideoScale, heroVideoBorderRadius,
                tableFontSize, sections
            };
            await saveToCloud(updatedConfig);

            toast({ title: "Logotipo actualizado", description: "El logo se ha subido y guardado en la nube." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo subir o guardar el logotipo.", variant: "destructive" });
        } finally { setUploadingId(null); }
    };

    const handleHeroVideoUpload = async (file) => {
        if (!file) return;
        setUploadingId('hero-video');
        try {
            const bucket = await getActiveBucket();
            const fileName = `hero_video_${Date.now()}.${file.name.split('.').pop()}`;
            const filePath = `masterplan/${fileName}`;
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            setHeroVideoUrl(publicUrl);

            // Pass the literal updated config to avoid stale state in saveToCloud
            const updatedConfig = {
                clientName, projectName, projectDesc, projectDate,
                mpTitle, mpSubTitle, heroVideoUrl: publicUrl, heroVideoIsIntegrated,
                heroVideoScale, heroVideoBorderRadius,
                sections
            };
            await saveToCloud(updatedConfig);

            toast({ title: "Video actualizado", description: "El video se ha subido y guardado correctamente." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo subir el video.", variant: "destructive" });
        } finally { setUploadingId(null); }
    };

    const handleItemMediaUpload = async (sectionId, itemId, file) => {
        if (!file) return;
        setUploadingId(itemId);
        try {
            const bucket = await getActiveBucket();
            const fileExt = file.name.split('.').pop();
            const fileName = `item_${sectionId}_${itemId}_${Date.now()}.${fileExt}`;
            const filePath = `masterplan/${fileName}`;
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            let updatedSections = [];
            setSections(prev => {
                updatedSections = prev.map(s => s.id === sectionId ? {
                    ...s,
                    items: s.items.map(it => it.id === itemId ? { ...it, media_url: publicUrl, media_type: mediaType } : it)
                } : s);
                return updatedSections;
            });

            // Persistir inmediatamente después de actualizar el estado local
            const updatedConfig = {
                clientName, projectName, projectDesc, projectDate,
                mpTitle, mpSubTitle, logoUrl, heroVideoUrl,
                heroVideoIsIntegrated, heroVideoScale, heroVideoBorderRadius,
                tableFontSize, sections: updatedSections
            };
            await saveToCloud(updatedConfig);

            toast({ title: "Media actualizado", description: "El archivo se ha subido y guardado correctamente." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo subir el archivo.", variant: "destructive" });
        } finally { setUploadingId(null); }
    };

    const handleModuleMediaUpload = async (sectionId, file) => {
        if (!file) return;
        setUploadingId(`module_${sectionId}`);
        try {
            const bucket = await getActiveBucket();
            const fileName = `module_${sectionId}_${Date.now()}.${file.name.split('.').pop()}`;
            const filePath = `masterplan/${fileName}`;
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            updateSection(sectionId, { moduleImage: publicUrl });

            // Forzar guardado inmediato para el módulo
            saveToCloud();

            toast({ title: "Imagen de módulo actualizada", description: "Cambios guardados en la nube." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" });
        } finally { setUploadingId(null); }
    };

    const calcItem = (it) => {
        const costoUnit = n(it.costoUSD);
        const qty = n(it.qty);
        const util = n(it.utilidad);
        const ventaUnitFinal = costoUnit * (1 + (util / 100));
        return { costoUnit, ventaUnitFinal, totalCosto: costoUnit * qty, totalVenta: ventaUnitFinal * qty };
    };

    const updateItem = (sectionId, itemId, patch) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: s.items.map(it => it.id === itemId ? { ...it, ...patch } : it) } : s));
    };

    const addItem = (sectionId) => {
        const it = { id: uid(), activo: true, codigo: "", equipo: "Nuevo equipo", descripcion: "", fuente: "Pendiente", utilidad: 10, qty: 1, costoUSD: 0, ventaUSD: 0 };
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...s.items, it] } : s));
    };

    const removeItem = (sectionId, itemId) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: s.items.filter(x => x.id !== itemId) } : s));
    };

    const addSection = () => {
        setSections(prev => [...prev, { id: uid(), collapsed: true, summaryDesc: "", titulo: `${prev.length + 1}. NUEVA SECCIÓN`, tag: "NEW", items: [] }]);
    };

    const removeSection = (sectionId) => {
        if (confirm("¿Eliminar este MÓDULO completo?")) setSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const sectionTotals = useMemo(() => sections.map(s => {
        let c = 0, v = 0;
        s.items.forEach(it => { if (it.activo) { const r = calcItem(it); c += r.totalCosto; v += r.totalVenta; } });
        return { sectionId: s.id, totalCosto: c, totalVenta: v };
    }), [sections]);

    const toggleAllSections = (val) => {
        setSections(prev => prev.map(s => ({ ...s, collapsed: val })));
        toast({ title: val ? "Módulos Contraídos" : "Módulos Expandidos", description: val ? "Se han cerrado todos los módulos." : "Se han abierto todos los módulos." });
    };

    const grandTotals = useMemo(() => {
        const totalCosto = sectionTotals.reduce((acc, x) => acc + x.totalCosto, 0);
        const totalVenta = sectionTotals.reduce((acc, x) => acc + x.totalVenta, 0);
        const mxnSinIvaCosto = totalCosto * n(tipoCambio);
        const mxnSinIvaVenta = totalVenta * n(tipoCambio);
        return {
            totalCosto, totalVenta,
            mxnSinIvaCosto, ivaCosto: mxnSinIvaCosto * (n(ivaPct) / 100), mxnConIvaCosto: mxnSinIvaCosto * (1 + n(ivaPct) / 100),
            mxnSinIvaVenta, ivaVenta: mxnSinIvaVenta * (n(ivaPct) / 100), mxnConIvaVenta: mxnSinIvaVenta * (1 + n(ivaPct) / 100)
        };
    }, [sectionTotals, tipoCambio, ivaPct]);

    const [animatedPriceVal, setAnimatedPriceVal] = useState(0);
    useEffect(() => {
        if (isFooterHovered) {
            let count = 0;
            const interval = setInterval(() => {
                setAnimatedPriceVal(Math.random() * grandTotals.totalVenta * 1.2);
                count++;
                if (count > 12) {
                    clearInterval(interval);
                    setAnimatedPriceVal(grandTotals.totalVenta);
                }
            }, 50);
            return () => clearInterval(interval);
        } else {
            setAnimatedPriceVal(grandTotals.totalVenta);
        }
    }, [isFooterHovered, grandTotals.totalVenta]);

    const applyGlobalUtility = () => {
        if (!window.confirm(`¿Seguro que quieres aplicar ${globalUtilVal}% de utilidad a TODOS los equipos del proyecto?`)) return;
        const newSections = sections.map(s => ({
            ...s,
            items: s.items.map(it => ({ ...it, utilidad: Number(globalUtilVal) }))
        }));
        setSections(newSections);
        toast({ title: "Utilidad Actualizada", description: `Se aplicó ${globalUtilVal}% a todos los módulos.` });
    };

    const applyTargetAmountAdjustment = () => {
        const totalCostoBase = grandTotals.totalCosto;
        if (totalCostoBase <= 0) {
            toast({ title: "Error", description: "El costo base total es 0. No se puede ajustar.", variant: "destructive" });
            return;
        }

        const target = Number(targetAmountValue);
        if (target <= 0) {
            toast({ title: "Error", description: "El monto objetivo debe ser mayor a 0.", variant: "destructive" });
            return;
        }

        if (target < totalCostoBase) {
            if (!window.confirm("El monto objetivo es menor al costo total base. La utilidad será negativa. ¿Deseas continuar?")) return;
        }

        const calculatedUtil = ((target / totalCostoBase) - 1) * 100;
        const finalUtil = Number(calculatedUtil.toFixed(4));

        const newSections = sections.map(s => ({
            ...s,
            items: s.items.map(it => ({ ...it, utilidad: finalUtil }))
        }));

        setSections(newSections);
        setGlobalUtilVal(finalUtil);
        setTargetAmountModalOpen(false);
        saveToCloud(newSections);
        toast({ title: "Ajuste Masivo Aplicado y Guardado", description: `Se calculó una utilidad de ${finalUtil}% y se sincronizó con la nube.` });
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const settings = pdfSettings || {
            primaryColor: '#facc15',
            secondaryColor: '#000000',
            headerBg: '#facc15',
            headerText: '#000000',
            titleText: 'CONCENTRADO',
            logoPos: { x: 235, y: 0, width: 45, height: 25 },
            headerBox: { x: 15, y: 0, width: 95, height: 15 },
            metaPos: { x: 120, y: 3 },
            colWidths: { item: 15, equipo: 45, desc: 85, foto: 35, qty: 15, unit: 32, total: 32 },
            fontSize: 9,
            rowHeight: 25,
            showImages: true,
            imgSize: 18,
        };

        const { headerBg, headerText, titleText, logoPos, colWidths, fontSize, rowHeight, imgSize, metaPos, headerBox, logoUrl: pdfLogoUrl } = settings;

        const logoImg = new Image();
        logoImg.src = pdfLogoUrl || logoUrl || "/solifood-logo.png";
        logoImg.crossOrigin = "Anonymous";

        const start = () => {
            const topMargin = 8;
            const drawHeader = () => {
                doc.setFillColor(headerBg);
                doc.rect(headerBox.x, headerBox.y + topMargin, headerBox.width, headerBox.height, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.setTextColor(headerText);
                doc.text(titleText, headerBox.x + (headerBox.width / 2), headerBox.y + topMargin + (headerBox.height / 2) + 4, { align: 'center' });

                doc.setTextColor(40, 40, 40);
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text("CLIENTE:", metaPos.x, metaPos.y + topMargin);
                doc.setFont("helvetica", "normal");
                doc.text(clientName.toUpperCase(), metaPos.x + 23, metaPos.y + topMargin);
                doc.setFont("helvetica", "bold");
                doc.text("PROYECTO:", metaPos.x, metaPos.y + topMargin + 5);
                doc.setFont("helvetica", "normal");
                doc.text(projectName.toUpperCase(), metaPos.x + 23, metaPos.y + topMargin + 5);
                doc.setFont("helvetica", "bold");
                doc.text("FECHA:", metaPos.x, metaPos.y + topMargin + 10);
                doc.setFont("helvetica", "normal");
                doc.text(new Date().toLocaleDateString('es-MX'), metaPos.x + 23, metaPos.y + topMargin + 10);

                try {
                    doc.addImage(logoImg, 'PNG', logoPos.x, logoPos.y + topMargin, logoPos.width, logoPos.height, undefined, 'FAST');
                } catch (e) { console.error("Logo PDF Draw Error", e); }
            };

            let tableData = [];
            let globalIdx = 1;

            sections.forEach((s, sIdx) => {
                const activeItems = s.items.filter(it => it.activo);
                if (activeItems.length === 0) return;

                tableData.push([
                    { content: `MÓDULO ${sIdx + 1}: ${s.titulo}`, colSpan: 7, styles: { fillColor: [120, 120, 120], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', minCellHeight: 10 } }
                ]);

                let modSum = 0;
                activeItems.forEach(it => {
                    const r = calcItem(it);
                    modSum += r.totalVenta;
                    tableData.push([
                        { content: globalIdx++, styles: { textColor: settings.primaryColor, fontStyle: 'bold' } },
                        it.equipo.toUpperCase(),
                        it.descripcion.substring(0, 350),
                        { content: "", image: it.media_url && it.media_type !== 'video' ? it.media_url : null },
                        it.qty,
                        money(r.ventaUnitFinal),
                        money(r.totalVenta)
                    ]);
                });

                tableData.push([
                    { content: `SUBTOTAL MÓDULO ${sIdx + 1}`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } },
                    { content: money(modSum), styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } }
                ]);
            });

            doc.autoTable({
                startY: 40,
                head: [['ITEM', 'EQUIPO', 'DESCRIPCIÓN', 'FOTO', 'QTY', 'UNITARIO', 'TOTAL']],
                body: tableData,
                theme: 'plain',
                headStyles: { fillColor: settings.primaryColor, textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 12 },
                styles: { fontSize, cellPadding: 2, valign: 'middle', lineWidth: 0.1, minCellHeight: rowHeight },
                columnStyles: {
                    0: { halign: 'center', cellWidth: colWidths.item },
                    1: { fontStyle: 'bold', cellWidth: colWidths.equipo },
                    2: { cellWidth: colWidths.desc },
                    3: { halign: 'center', cellWidth: colWidths.foto },
                    4: { halign: 'center', cellWidth: colWidths.qty },
                    5: { halign: 'right', cellWidth: colWidths.unit },
                    6: { halign: 'right', cellWidth: colWidths.total }
                },
                rowPageBreak: 'avoid',
                margin: { top: 40, left: 15, right: 15, bottom: 20 },
                didDrawPage: (data) => {
                    drawHeader();
                    doc.setFontSize(7);
                    doc.setTextColor(180, 180, 180);
                    doc.text(`Página ${data.pageNumber} | www.solifood.mx`, 282, 202, { align: 'right' });
                },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        const img = tableData[data.row.index]?.[3]?.image;
                        if (img) try { doc.addImage(img, 'JPEG', data.cell.x + (data.cell.width - imgSize) / 2, data.cell.y + 2, imgSize, imgSize, undefined, 'FAST'); } catch (e) { }
                    }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 8;
            if (finalY < 185) {
                const totalBoxWidth = settings.colWidths.total + settings.colWidths.unit + 30;
                const tableRightPos = 282;
                doc.setFillColor(0, 0, 0);
                doc.rect(tableRightPos - totalBoxWidth, finalY, totalBoxWidth, 14, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.text("TOTAL GENERAL", tableRightPos - totalBoxWidth + 5, finalY + 9);
                doc.setFontSize(16);
                doc.text(money(grandTotals.totalVenta), tableRightPos - 5, finalY + 9, { align: 'right' });
            }
            doc.save(`SOLIFOOD_MP_${projectName.replace(/\s+/g, '_')}.pdf`);
        };

        if (logoImg.complete) start();
        else {
            logoImg.onload = start;
            logoImg.onerror = () => start();
        }
    };

    const reset = () => { if (confirm("¿Restablecer MASTER PLAN?")) { localStorage.removeItem(STORAGE_KEY); setSections(initialSections); } };

    const handleExportSectionExcel = (section) => {
        try {
            const data = section.items.map(it => {
                const precio = Number((it.qty * (Number(it.costoUSD || 0) * (1 + (it.utilidad || 10) / 100))).toFixed(2));
                return {
                    "MODULO": section.titulo,
                    "NUM.": it.codigo,
                    "EQUIPO": it.equipo,
                    "DESCRIPCIÓN": it.descripcion,
                    "QTY": it.qty,
                    "COSTO (USD)": Number(Number(it.costoUSD || 0).toFixed(2)),
                    "UTILIDAD %": it.utilidad,
                    "FUENTE": it.fuente || "LST",
                    "PRECIO (USD)": precio
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Equipos");
            XLSX.writeFile(wb, `${section.titulo.substring(0, 30)}.xlsx`);
            toast({ title: "Excel Generado", description: `Exportada sección: ${section.titulo}` });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo exportar el módulo.", variant: "destructive" });
        }
    };

    const handleImportSectionExcel = (sectionId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                if (!data?.length) return;

                const newItems = data.map(row => ({
                    id: uid(),
                    activo: true,
                    codigo: String(row["NUM."] || ""),
                    equipo: row["EQUIPO"] || "Sin nombre",
                    descripcion: row["DESCRIPCIÓN"] || "",
                    fuente: row["FUENTE"] || "LST",
                    utilidad: n(row["UTILIDAD %"] || 10),
                    qty: n(row["QTY"] || 1),
                    costoUSD: n(row["COSTO (USD)"] || 0),
                    ventaUSD: 0
                }));

                setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: newItems } : s));
                setImportedFileName(file.name);
                localStorage.setItem("solifood_mp_imported_filename", file.name);
                toast({ title: "Excel Importado", description: `Se cargó: ${file.name}` });
            } catch (err) {
                console.error(err);
                toast({ title: "Error de Importación", description: "Verifica el formato del archivo.", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleMasterExportExcel = () => {
        try {
            const allItems = [];
            sections.forEach(s => {
                s.items.forEach(it => {
                    const precio = Number((it.qty * (Number(it.costoUSD || 0) * (1 + (it.utilidad || 10) / 100))).toFixed(2));
                    allItems.push({
                        "MODULO": s.titulo,
                        "NUM.": it.codigo,
                        "EQUIPO": it.equipo,
                        "DESCRIPCIÓN": it.descripcion,
                        "QTY": it.qty,
                        "COSTO (USD)": Number(Number(it.costoUSD || 0).toFixed(2)),
                        "UTILIDAD %": it.utilidad,
                        "FUENTE": it.fuente || "LST",
                        "PRECIO (USD)": precio
                    });
                });
            });

            const ws = XLSX.utils.json_to_sheet(allItems);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Master Plan");
            XLSX.writeFile(wb, `MASTER_PLAN_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast({ title: "Master Excel Generado", description: "Se han exportado todos los módulos." });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "No se pudo generar el Master Excel.", variant: "destructive" });
        }
    };

    const handleMasterImportExcel = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                if (!data?.length) return;

                // Group by "MODULO"
                const groups = {};
                data.forEach(row => {
                    const modName = row["MODULO"] || "SIN CATEGORIA";
                    if (!groups[modName]) groups[modName] = [];
                    groups[modName].push(row);
                });

                const newSections = Object.keys(groups).map((modName, idx) => ({
                    id: `sec_${uid()}`,
                    collapsed: true,
                    summaryDesc: "",
                    titulo: modName,
                    tag: modName.substring(0, 3).toUpperCase(),
                    items: groups[modName].map(row => ({
                        id: uid(),
                        activo: true,
                        codigo: String(row["NUM."] || ""),
                        equipo: row["EQUIPO"] || "Sin nombre",
                        descripcion: row["DESCRIPCIÓN"] || "",
                        fuente: row["FUENTE"] || "LST",
                        utilidad: n(row["UTILIDAD %"] || 10),
                        qty: n(row["QTY"] || 1),
                        costoUSD: n(row["COSTO (USD)"] || 0),
                        ventaUSD: 0
                    }))
                }));

                setSections(newSections);
                setImportedFileName(file.name);
                localStorage.setItem("solifood_mp_imported_filename", file.name);
                saveToCloud(newSections);
                toast({ title: "Excel Importado y Sincronizado", description: `Se cargó y guardó en la nube: ${file.name}` });
            } catch (err) {
                console.error(err);
                toast({ title: "Error de Importación", description: "Verifica el formato del Master Excel.", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                if (!data?.length) return;
                const groups = {};
                data.forEach(row => { const p = row["MODULO"] || "SIN CATEGORIA"; if (!groups[p]) groups[p] = []; groups[p].push(row); });
                setSections(Object.keys(groups).map((p, idx) => ({
                    id: `sec_${uid()}`, collapsed: true, summaryDesc: "", titulo: p, tag: p.substring(0, 3).toUpperCase(),
                    items: groups[p].map(row => ({
                        id: uid(), activo: true, codigo: row["NUM."] || "", equipo: row["EQUIPO"] || "Sin nombre", descripcion: row["DESCRIPCIÓN"] || "",
                        fuente: row["FUENTE"] || "LST", utilidad: row["UTILIDAD %"] || 10, qty: row["QTY"] || 1, costoUSD: row["COSTO (USD)"] || 0, ventaUSD: 0
                    }))
                })));
                alert("Importado con éxito");
            } catch (err) { console.error(err); alert("Error al importar"); }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    return (
        <div className="min-h-screen bg-black text-white px-8 md:px-16 lg:px-32 py-12 pb-32 bg-[url('https://horizons-cdn.hostinger.com/0f98fff3-e5cd-4ceb-b0fd-55d6f1d7dd5c/dcea69d21f8fa04833cff852034084fb.png')] bg-cover bg-fixed bg-center relative">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] z-0" />

            <div className={`relative z-[100] w-full max-w-[1920px] mx-auto transition-all duration-500 ${isScrolled ? 'pt-24' : ''}`}>
                {/* Header Container */}
                <div className={`flex flex-col md:flex-row items-center justify-between gap-8 mb-12 bg-zinc-950/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl transition-all duration-500 group/header ${isScrolled ? 'fixed top-4 left-8 right-8 md:left-16 md:right-16 lg:left-32 lg:right-32 z-[200] !p-3 !mb-0 !gap-4 !rounded-2xl shadow-2xl scale-[0.98] border-white/20 !bg-zinc-950/50 backdrop-blur-3xl ring-1 ring-white/10' : 'relative z-[100]'}`}>
                    {/* Left side */}
                    <div className={`flex items-center gap-6 flex-1 justify-start transition-all duration-500 ${isScrolled ? '!gap-3' : ''}`}>
                        <button onClick={() => navigate('/')} className={`p-3 rounded-full bg-white/5 hover:bg-primary hover:text-black text-gray-400 transition-all group/back ${isScrolled ? '!p-2' : ''}`}>
                            <X size={isScrolled ? 18 : 24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                        <div className="flex flex-col gap-1">
                            <div className={`relative group/logo ${isAdmin ? 'cursor-pointer' : ''}`} onClick={() => isAdmin && logoRef.current?.click()}>
                                <img src={logoUrl || "/solifood-logo.png"} alt="Logo" className={`object-contain transition-all duration-500 ${isScrolled ? 'h-10' : 'h-24'}`} />
                                {isAdmin && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity rounded-lg">
                                        {uploadingId === 'logo' ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
                                    </div>
                                )}
                                <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files[0])} />
                            </div>
                            {!isScrolled && (
                                <span className="text-[10px] font-black text-white bg-primary/10 px-2 py-0.5 rounded border border-primary/20 inline-block uppercase tracking-wider">VER 4.36</span>
                            )}
                        </div>
                    </div>

                    {/* Center side */}
                    <div className={`flex flex-col items-center text-center transition-all duration-500 ${isScrolled ? 'flex-row gap-4 items-center flex-[3]' : 'flex-[2]'}`}>
                        <div className={`w-full flex flex-col items-center relative transition-all duration-500 ${isScrolled ? '!w-auto !items-start' : 'mb-2'}`}>
                            {isAdmin ? (
                                <input value={mpSubTitle} onChange={(e) => setMpSubTitle(e.target.value.toUpperCase())} className={`bg-transparent border-b border-primary/30 text-xs font-black text-primary uppercase tracking-[0.4em] text-center w-full max-w-sm mb-1 ${isScrolled ? '!text-[10px] !mb-0 !text-left' : ''}`} />
                            ) : (
                                !isScrolled && <span className="text-xs font-black text-primary uppercase tracking-[0.4em] opacity-80">{mpSubTitle}</span>
                            )}
                            <h1 className={`font-black tracking-tighter uppercase leading-none mt-1 transition-all duration-500 ${isScrolled ? 'text-2xl !mt-0' : 'text-4xl md:text-6xl'}`}>
                                {isAdmin ? (
                                    <><span className="text-white">MASTER</span> <span className="text-primary">EDITOR</span></>
                                ) : (
                                    <><span className="text-white">MASTER</span> <span className="text-primary">PLAN</span></>
                                )}
                            </h1>
                        </div>
                        {!isScrolled && (
                            <div className="flex flex-wrap justify-center gap-8 mt-6 text-[11px] font-black border-t border-white/10 pt-6 w-full tracking-[0.15em] uppercase">
                                <div className="flex items-center gap-2.5 group/meta">
                                    <Briefcase size={14} className="text-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                                    <span className="text-gray-400">PROJECT:</span>
                                    <span className="text-white text-xs">{projectName}</span>
                                </div>
                                <div className="flex items-center gap-2.5 group/meta">
                                    <User size={14} className="text-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                                    <span className="text-gray-400">CLIENT:</span>
                                    <span className="text-white text-xs">{clientName}</span>
                                </div>
                                <div className="flex items-center gap-2.5 group/meta">
                                    <Calendar size={14} className="text-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                                    <span className="text-gray-400">DATE:</span>
                                    <span className="text-white text-xs">{projectDate}</span>
                                </div>
                            </div>
                        )}
                        {!isScrolled && <p className="text-gray-400 text-[11px] font-bold mt-4 uppercase tracking-widest opacity-80 max-w-xl leading-relaxed">{projectDesc}</p>}
                        {isAdmin && importedFileName && (
                            <div className="mt-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">Archivo: {importedFileName}</span>
                            </div>
                        )}
                    </div>

                    {/* Right side */}
                    <div className={`flex flex-wrap items-center justify-end gap-3 flex-1 transition-all duration-500 ${isScrolled ? '!gap-2' : ''}`}>
                        <button onClick={toggleAdmin} className={`px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all relative z-[110] active:scale-95 ${isAdmin ? 'border-red-500/50 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]'} ${isScrolled ? '!px-3 !py-1.5 !text-[9px]' : ''}`}>
                            {isAdminAuthenticated ? (isAdmin ? (isScrolled ? <Lock size={12} /> : "DESACTIVAR EDITOR") : (isScrolled ? <Edit size={12} /> : "ACTIVAR EDITOR")) : (isScrolled ? <Shield size={12} /> : "ACTIVAR EDITOR")}
                        </button>

                        {isAdmin && (
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                                <div className="flex items-center gap-2 px-2 border-r border-white/5">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">UTILIDAD GLOBAL:</span>
                                    <input
                                        type="number"
                                        value={globalUtilVal}
                                        onChange={(e) => setGlobalUtilVal(e.target.value)}
                                        className="w-12 bg-black/40 border-none text-[10px] font-black text-center text-primary rounded focus:ring-1 focus:ring-primary/40 focus:outline-none"
                                    />
                                    <span className="text-[10px] font-black text-primary">%</span>
                                </div>
                                <button
                                    onClick={applyGlobalUtility}
                                    className="px-3 py-1.5 text-[8px] font-black text-white bg-primary/20 hover:bg-primary/40 rounded-lg transition-all uppercase tracking-widest border border-primary/20"
                                >
                                    Aplicar Todo
                                </button>
                            </div>
                        )}
                        {isAdmin && (
                            <button
                                onClick={toggleColsLocked}
                                className={`px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${colsLocked ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-blue-500/50 bg-blue-500/10 text-blue-500'}`}
                                title={colsLocked ? "Desbloquear celdas" : "Bloquear celdas"}
                            >
                                {colsLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                {colsLocked ? "Bloqueado" : "Ajuste Libre"}
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setTargetAmountValue(grandTotals.totalVenta.toFixed(2));
                                    setTargetAmountModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl border border-primary/50 bg-primary/20 text-white text-[10px] font-black tracking-widest uppercase hover:bg-primary/30 transition-all flex items-center gap-2"
                            >
                                <ChevronsDown size={14} className="text-primary" />
                                Ajuste por Monto
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => saveToCloud()}
                                disabled={isCloudSyncing}
                                className={`px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${isCloudSyncing ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}
                            >
                                {isCloudSyncing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isCloudSyncing ? "Guardando..." : "Guardar en Nube"}
                            </button>
                        )}
                        <Dialog open={targetAmountModalOpen} onOpenChange={setTargetAmountModalOpen}>
                            <DialogContent className="max-w-md bg-zinc-950 border border-primary/30 text-white rounded-3xl p-8 shadow-[0_0_50px_rgba(250,204,21,0.1)]">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10">
                                            <Check size={24} />
                                        </div>
                                        Ajuste por Monto Objetivo
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                    <p className="text-zinc-400 text-xs font-bold leading-relaxed uppercase tracking-wider">
                                        Ingresa el monto total deseado para el proyecto. El sistema calculará y aplicará automáticamente la utilidad necesaria a todos los ítems.
                                    </p>

                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            <span>Venta Actual Total:</span>
                                            <span className="text-primary">{money(grandTotals.totalVenta)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Monto Objetivo (USD)</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">$</div>
                                            <input
                                                type="number"
                                                value={targetAmountValue}
                                                onChange={(e) => setTargetAmountValue(e.target.value)}
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={applyTargetAmountAdjustment}
                                        className="w-full py-4 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-yellow-400 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(250,204,21,0.2)]"
                                    >
                                        Aplicar Ajuste Global
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isParamsModalOpen} onOpenChange={setIsParamsModalOpen}>
                            <DialogTrigger asChild>
                                <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary font-black text-[10px] tracking-widest uppercase flex items-center gap-2"><Settings size={14} /> Ajustes Iniciales</button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] bg-black border border-white/20 text-white rounded-3xl overflow-hidden p-8">
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-3xl font-black text-primary uppercase tracking-tighter">Configuración</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-10 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <Field label="Horas/día" value={horasDia} onChange={setHorasDia} />
                                        <Field label="Tipo Cambio" value={tipoCambio} onChange={setTipoCambio} />
                                        <Field label="IVA %" value={ivaPct} onChange={setIvaPct} />
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estética de Tabla</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tamaño de Fuente: {tableFontSize}px</span>
                                                </div>
                                                <Slider value={[tableFontSize]} onValueChange={([v]) => setTableFontSize(v)} min={8} max={24} step={1} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hero Video Config</h4>
                                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Input Video:</span>
                                            <input type="file" ref={heroVideoInputRef} className="hidden" onChange={(e) => handleHeroVideoUpload(e.target.files[0])} />
                                            <button onClick={() => heroVideoInputRef.current.click()} className="px-3 py-1 bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-widest">Subir</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end"><button onClick={() => setIsParamsModalOpen(false)} className="px-10 py-4 bg-primary text-black font-black rounded-xl uppercase tracking-widest text-xs">Guardar Cambios</button></div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Sub-Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => setIsTemplateEditorOpen(true)}
                                className="px-6 py-2 bg-zinc-900 border border-white/10 text-white hover:border-primary/50 font-black rounded-xl text-[10px] tracking-widest uppercase transition-all flex items-center gap-2"
                            >
                                <Settings size={14} className="text-primary" />
                                Plantilla de Exportación
                            </button>
                        )}
                        <button onClick={handleExportPDF} className="px-6 py-2 bg-primary text-black font-black rounded-xl text-[10px] tracking-widest uppercase">Exportar PDF</button>
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => toggleAllSections(false)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                                title="Abrir todas las secciones"
                            >
                                <Maximize2 size={12} /> Abrir Todo
                            </button>
                            <div className="w-[1px] bg-white/10 my-1" />
                            <button
                                onClick={() => toggleAllSections(true)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                                title="Cerrar todas las secciones"
                            >
                                <AlignJustify size={12} /> Cerrar Todo
                            </button>
                        </div>
                        {isAdmin && <button onClick={addSection} className="px-6 py-2 bg-white/5 border border-white/10 text-white font-black rounded-xl text-[10px] tracking-widest uppercase hover:bg-white/10">+ Añadir Módulo</button>}
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            {/* Master Excel Functions */}
                            <button
                                onClick={handleMasterExportExcel}
                                className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-2"
                                title="Exportar TODO el Master Plan"
                            >
                                <Download size={14} />
                                Master Excel
                            </button>
                            <button
                                onClick={() => {
                                    const inp = document.createElement('input');
                                    inp.type = 'file';
                                    inp.accept = '.xlsx, .xls';
                                    inp.onchange = (e) => handleMasterImportExcel(e.target.files[0]);
                                    inp.click();
                                }}
                                className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center gap-2"
                                title="Importar TODO el Master Plan"
                            >
                                <FileSpreadsheet size={14} />
                                Cargar Master
                            </button>

                            <button onClick={() => fileInputRef.current.click()} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-primary"><Upload size={18} /></button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportExcel} />
                            <button onClick={reset} className="p-2 bg-white/5 border border-white/10 rounded-lg text-red-500 hover:bg-red-500/10"><Loader2 size={18} /></button>
                        </div>
                    )}
                </div>

                <div className="space-y-12">
                    {sections.map((s, sIdx) => {
                        const visibleCols = isAdmin
                            ? ['item', 'equipo', 'descripcion', 'media', 'qty', 'costo', 'util', 'unitario', 'total', 'action']
                            : ['item', 'equipo', 'descripcion', 'media', 'qty', 'unitario', 'total'];

                        // Fallback widths to prevent layout collapse
                        const initialColWidths = {
                            item: 80, equipo: 400, descripcion: 600, media: 120, qty: 80,
                            costo: 120, util: 80, unitario: 120, total: 150, action: 80
                        };

                        const totalTableWidth = visibleCols.reduce((acc, colId) => {
                            return acc + (colWidths[colId] || initialColWidths[colId] || 100);
                        }, 0);

                        return (
                            <div key={s.id} className={`relative bg-zinc-950/40 border border-white/5 rounded-[2rem] group/section transition-all duration-500 hover:ring-1 hover:ring-primary/40 ${!s.collapsed ? 'led-border-glow-static ring-1 ring-primary/20 scale-[1.01]' : 'hover:led-border-glow-static'}`}>

                                {/* 1. Module Title Bar - Sticky below main header */}
                                <div className={`sticky z-[150] bg-black/95 border-b border-white/10 backdrop-blur-xl transition-all duration-300 ${s.collapsed ? 'rounded-[2rem]' : 'rounded-t-[2rem]'}`} style={{ top: isScrolled ? '76px' : '0px' }}>
                                    <div className="min-h-[56px] h-auto py-3 px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleSection(s.id)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${s.collapsed ? 'bg-zinc-900 text-gray-500 shadow-inner hover:led-button-glow-static hover:text-primary' : 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] led-button-glow-static hover:scale-110 active:scale-95'}`}
                                            >
                                                {s.collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                            <div className="flex flex-col">
                                                {isAdmin ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black text-primary">{sIdx + 1}.</span>
                                                        <input
                                                            value={s.titulo}
                                                            onChange={(e) => updateSectionTitle(s.id, e.target.value)}
                                                            className="bg-transparent border-b border-primary/20 text-xl font-black text-white uppercase tracking-tight focus:outline-none focus:border-primary w-[500px]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                                        <span className="text-primary">{sIdx + 1}.</span>
                                                        {s.titulo}
                                                    </h3>
                                                )}
                                                <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-widest leading-none h-4 flex items-center">{s.tag}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {s.collapsed && sectionTotals.find(x => x.sectionId === s.id) && (
                                                <div className="flex flex-col items-end mr-2 shrink-0">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 opacity-50">Subtotal Módulo</span>
                                                    <span className="text-2xl font-black text-primary tracking-tighter">
                                                        {money(sectionTotals.find(x => x.sectionId === s.id).totalVenta)}
                                                    </span>
                                                </div>
                                            )}
                                            {isAdmin && !s.collapsed && (
                                                <div className="flex gap-2">
                                                    {/* Export Excel Button */}
                                                    <button
                                                        onClick={() => handleExportSectionExcel(s)}
                                                        className="p-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                                                        title="Exportar Formato Excel"
                                                    >
                                                        <Download size={16} />
                                                    </button>

                                                    {/* Import Excel Button */}
                                                    <button
                                                        onClick={() => {
                                                            const inp = document.createElement('input');
                                                            inp.type = 'file';
                                                            inp.accept = '.xlsx, .xls';
                                                            inp.onchange = (e) => handleImportSectionExcel(s.id, e.target.files[0]);
                                                            inp.click();
                                                        }}
                                                        className="p-2 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                        title="Importar Datos Excel"
                                                    >
                                                        <FileSpreadsheet size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const inp = document.createElement('input');
                                                            inp.type = 'file';
                                                            inp.onchange = (e) => handleModuleMediaUpload(s.id, e.target.files[0]);
                                                            inp.click();
                                                        }}
                                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                                    >
                                                        {uploadingId === `module_${s.id}` ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={() => removeSection(s.id)}
                                                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Virtual Sticky Header (Yellow Bar) - Part of the sticky unit */}
                                    {!s.collapsed && (
                                        <div
                                            ref={el => virtualHeaderRefs.current[s.id] = el}
                                            className="overflow-hidden bg-primary border-t border-black/10"
                                        >
                                            <div style={{ width: totalTableWidth, minWidth: totalTableWidth }} className="flex h-10">
                                                {visibleCols.map(colId => {
                                                    const labels = {
                                                        item: "Item", equipo: "Equipo", descripcion: "Descripción",
                                                        media: "FOTO / VIDEO", qty: "Qty", costo: "Costo (USD)",
                                                        util: "Util %", unitario: "Unitario (USD)", total: "Total (USD)", action: "Acc"
                                                    };
                                                    const aligns = { media: "center", costo: "right", util: "center", unitario: "right", total: "right", action: "center" };
                                                    const w = colWidths[colId] || initialColWidths[colId] || 100;
                                                    return (
                                                        <div
                                                            key={colId}
                                                            style={{ width: w, minWidth: w }}
                                                            className={`flex-shrink-0 px-4 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-black border-r border-black/10 relative group/cell ${aligns[colId] === "right" ? "justify-end text-right" : aligns[colId] === "center" ? "justify-center text-center" : "justify-start text-left"}`}
                                                        >
                                                            <span className="truncate">{labels[colId]}</span>
                                                            {!colsLocked && (
                                                                <div onMouseDown={(e) => startResize(colId, e)} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-black/20 z-10" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {
                                    !s.collapsed && (
                                        <div className="flex flex-col">
                                            {/* 2. Info Panel Details - Conditional */}
                                            {(s.moduleImage || s.summaryDesc) && (
                                                <div className="px-6 py-1 flex gap-8 border-b border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
                                                    {s.moduleImage && (
                                                        <div className="w-64 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group/modimg relative">
                                                            <img src={s.moduleImage} className="w-full h-full object-cover grayscale group-hover/modimg:grayscale-0 transition-all duration-500" />
                                                            {isAdmin && (
                                                                <button onClick={() => updateSection(s.id, { moduleImage: null })} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/modimg:opacity-100 transition-opacity"><X size={12} /></button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 space-y-4">
                                                        {isAdmin ? (
                                                            <textarea
                                                                value={s.summaryDesc || ""}
                                                                onChange={(e) => updateSection(s.id, { summaryDesc: e.target.value })}
                                                                placeholder="Descripción breve..."
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-400 font-medium outline-none focus:border-primary/30 h-32 resize-none"
                                                            />
                                                        ) : (
                                                            s.summaryDesc && <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl">{s.summaryDesc}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Table Data - Horizontal Scroll Sync */}
                                            <div
                                                ref={el => tableContainerRefs.current[s.id] = el}
                                                onScroll={(e) => syncScroll(s.id, e)}
                                                className="overflow-x-auto custom-scrollbar overflow-y-visible"
                                            >
                                                <table className="table-fixed border-collapse" style={{ width: totalTableWidth, minWidth: totalTableWidth }}>
                                                    <colgroup>
                                                        {visibleCols.map(colId => (
                                                            <col key={colId} style={{ width: colWidths[colId] || initialColWidths[colId] || 100 }} />
                                                        ))}
                                                    </colgroup>
                                                    <thead className="invisible h-0">
                                                        <tr className="h-0">
                                                            {visibleCols.map(colId => {
                                                                const labels = {
                                                                    item: "Item", equipo: "Equipo", descripcion: "Descripción",
                                                                    media: "FOTO / VIDEO", qty: "Qty", costo: "Costo (USD)",
                                                                    util: "Util %", unitario: "Unitario (USD)", total: "Total (USD)", action: "Acc"
                                                                };
                                                                const aligns = { media: "center", costo: "right", util: "center", unitario: "right", total: "right", action: "center" };
                                                                const w = colWidths[colId] || initialColWidths[colId] || 100;
                                                                return (
                                                                    <th
                                                                        key={colId}
                                                                        style={{ width: w, minWidth: w, top: isScrolled ? '132px' : '56px' }}
                                                                        className={`sticky z-[140] bg-primary px-4 text-[10px] font-black uppercase tracking-[0.2em] border-r border-black/5 relative group/cell transition-all duration-300 ${aligns[colId] === "right" ? "text-right" : aligns[colId] === "center" ? "text-center" : "text-left"}`}
                                                                    >
                                                                        <div className="flex items-center h-full w-full">
                                                                            <span className="truncate block" title={labels[colId]}>{labels[colId]}</span>
                                                                        </div>
                                                                    </th>
                                                                );
                                                            })}
                                                        </tr>
                                                    </thead>
                                                    <tbody style={{ fontSize: `${tableFontSize}px` }}>
                                                        {/* Spacer Row is no longer needed with zero-gap sticky logic */}
                                                        {s.items.map(it => {
                                                            const r = calcItem(it);
                                                            return (
                                                                <tr key={it.id} className={`border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors ${!it.activo && 'opacity-30'}`}>
                                                                    {visibleCols.map(colId => {
                                                                        const w = colWidths[colId] || initialColWidths[colId] || 100;
                                                                        const cellStyle = { width: w, minWidth: w };
                                                                        if (colId === 'item') return (
                                                                            <td key={colId} style={cellStyle} className="p-4 border-r border-white/[0.02]">
                                                                                <div className="flex flex-col items-center gap-2">
                                                                                    <button onClick={() => updateItem(s.id, it.id, { activo: !it.activo })} className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${it.activo ? 'bg-primary border-primary text-black' : 'bg-transparent border-white/20 text-white/10 hover:border-white/40'}`}>
                                                                                        {it.activo && <Check size={14} strokeWidth={4} />}
                                                                                    </button>
                                                                                    {isAdmin ? <input value={it.codigo} onChange={(e) => updateItem(s.id, it.id, { codigo: e.target.value })} className="bg-transparent border-b border-white/5 text-[11px] font-mono text-gray-400 w-full text-center focus:border-primary/50 outline-none" /> : <span className="text-[11px] font-mono text-gray-400">{it.codigo}</span>}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                        if (colId === 'equipo') return (
                                                                            <td key={colId} style={cellStyle} className="p-4 border-r border-white/[0.02]">
                                                                                {isAdmin ? <textarea value={it.equipo} onChange={(e) => updateItem(s.id, it.id, { equipo: e.target.value })} className="bg-transparent text-sm font-black text-white w-full border-b border-white/5 outline-none focus:border-primary/50 resize-none overflow-hidden" rows={1} style={{ fieldSizing: "content" }} /> : <span className={`text-sm font-black text-white uppercase tracking-tight ${!it.activo ? 'line-through text-white/40' : ''}`}>{it.equipo}</span>}
                                                                            </td>
                                                                        );
                                                                        if (colId === 'descripcion') return (
                                                                            <td key={colId} style={cellStyle} className="p-4 border-r border-white/[0.02] relative group/desc">
                                                                                {isAdmin ? (
                                                                                    <div className="flex flex-col gap-2">
                                                                                        <textarea
                                                                                            value={it.descripcion}
                                                                                            onChange={(e) => updateItem(s.id, it.id, { descripcion: e.target.value })}
                                                                                            className="bg-transparent text-gray-500 w-full resize-none border-none outline-none focus:text-gray-300 transition-all"
                                                                                            rows={1}
                                                                                            style={{
                                                                                                fieldSizing: "content",
                                                                                                textAlign: it.descAlign || "left",
                                                                                                fontSize: `${it.descFontSize || tableFontSize}px`
                                                                                            }}
                                                                                        />
                                                                                        <div className="flex items-center gap-1 opacity-0 group-hover/desc:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 w-fit self-end">
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descAlign: "left" })} className={`p-1 rounded hover:bg-white/10 ${it.descAlign === "left" || !it.descAlign ? "text-primary" : "text-gray-500"}`}><AlignLeft size={10} /></button>
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descAlign: "center" })} className={`p-1 rounded hover:bg-white/10 ${it.descAlign === "center" ? "text-primary" : "text-gray-500"}`}><AlignCenter size={10} /></button>
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descAlign: "right" })} className={`p-1 rounded hover:bg-white/10 ${it.descAlign === "right" ? "text-primary" : "text-gray-500"}`}><AlignRight size={10} /></button>
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descAlign: "justify" })} className={`p-1 rounded hover:bg-white/10 ${it.descAlign === "justify" ? "text-primary" : "text-gray-500"}`}><AlignJustify size={10} /></button>
                                                                                            <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descFontSize: (it.descFontSize || tableFontSize) + 1 })} className="p-1 rounded hover:bg-white/10 text-gray-500"><Plus size={10} /></button>
                                                                                            <button onClick={() => updateItem(s.id, it.id, { descFontSize: Math.max(8, (it.descFontSize || tableFontSize) - 1) })} className="p-1 rounded hover:bg-white/10 text-gray-500"><Minus size={10} /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p
                                                                                        className="text-gray-500 font-medium leading-relaxed"
                                                                                        style={{
                                                                                            textAlign: it.descAlign || "left",
                                                                                            fontSize: `${it.descFontSize || tableFontSize}px`
                                                                                        }}
                                                                                    >
                                                                                        {it.descripcion}
                                                                                    </p>
                                                                                )}
                                                                            </td>
                                                                        );
                                                                        if (colId === 'media') return (
                                                                            <td key={colId} style={cellStyle} className="p-4 border-r border-white/[0.02]">
                                                                                <div className="flex flex-col items-center justify-center gap-2 group/media relative">
                                                                                    {it.media_url ? (
                                                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all shadow-lg hover:scale-110 cursor-pointer" onClick={() => setSelectedMedia({ url: it.media_url, type: it.media_type })}>
                                                                                            {it.media_type === 'video' ? <video src={it.media_url} className="w-full h-full object-cover" /> : <img src={it.media_url} alt="" className="w-full h-full object-cover" />}
                                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity"><Maximize2 size={14} className="text-white" /></div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center justify-center">{isAdmin ? <div className="flex gap-1"><label className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-primary hover:border-primary/50 cursor-pointer transition-all">{uploadingId === it.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleItemMediaUpload(s.id, it.id, e.target.files[0])} /></label><label className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-primary hover:border-primary/50 cursor-pointer transition-all">{uploadingId === it.id ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}<input type="file" className="hidden" accept="video/*" onChange={(e) => handleItemMediaUpload(s.id, it.id, e.target.files[0])} /></label></div> : <Camera size={16} className="text-white/5" />}</div>
                                                                                    )}
                                                                                    {isAdmin && it.media_url && <button onClick={() => updateItem(s.id, it.id, { media_url: null, media_type: null })} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity scale-75 hover:scale-100"><X size={10} /></button>}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                        if (colId === 'qty') return (
                                                                            <td key={colId} style={cellStyle} className="p-4 border-r border-white/[0.02]">
                                                                                {isAdmin ? <input type="number" value={it.qty} onChange={(e) => updateItem(s.id, it.id, { qty: n(e.target.value) })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white w-full focus:border-primary/50 outline-none" /> : <span className="text-xs font-mono text-gray-300">{it.qty}</span>}
                                                                            </td>
                                                                        );
                                                                        if (colId === 'costo' && isAdmin) return (
                                                                            <td key={colId} style={cellStyle} className="p-4 text-right border-r border-white/[0.02]">
                                                                                <input type="number" value={it.costoUSD} onChange={(e) => updateItem(s.id, it.id, { costoUSD: n(e.target.value) })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white w-full text-right focus:border-primary/50 outline-none" />
                                                                            </td>
                                                                        );
                                                                        if (colId === 'util' && isAdmin) return (
                                                                            <td key={colId} style={cellStyle} className="p-4 text-center border-r border-white/[0.02]">
                                                                                <input type="number" value={it.utilidad} onChange={(e) => updateItem(s.id, it.id, { utilidad: n(e.target.value) })} className="bg-primary/5 border border-primary/20 rounded px-2 py-1 text-xs font-mono text-primary w-full text-center focus:border-primary/50 outline-none" />
                                                                            </td>
                                                                        );
                                                                        if (colId === 'unitario') return (
                                                                            <td key={colId} style={cellStyle} className={`p-4 text-right text-xs font-mono border-r border-white/[0.02] ${!it.activo ? 'line-through text-gray-600' : 'text-gray-400'}`}>{money(r.ventaUnitFinal)}</td>
                                                                        );
                                                                        if (colId === 'total') return (
                                                                            <td key={colId} style={cellStyle} className={`p-4 text-right text-sm font-black tracking-tight border-r border-white/[0.02] ${!it.activo ? 'line-through text-primary/30' : 'text-primary'}`}>{money(r.totalVenta)}</td>
                                                                        );
                                                                        if (colId === 'action' && isAdmin) return (
                                                                            <td key={colId} style={cellStyle} className="p-4 text-center border-l border-white/[0.02]"><button onClick={() => removeItem(s.id, it.id)} className="text-red-500 opacity-20 hover:opacity-100 transition-opacity"><X size={14} /></button></td>
                                                                        );
                                                                        return null;
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                        {isAdmin && <tr><td colSpan={visibleCols.length} className="p-4"><button onClick={() => addItem(s.id)} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-widest">+ Agregar Fila</button></td></tr>}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-white/[0.05] font-black border-t border-white/5">
                                                            <td colSpan={visibleCols.length - 1} className="p-6 text-right text-[10px] text-gray-500 uppercase tracking-[0.2em]">Subtotal Módulo</td>
                                                            <td className="p-6 text-right text-xl text-primary tracking-tighter border-l border-white/5">{money(sectionTotals.find(x => x.sectionId === s.id)?.totalVenta || 0)}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })}
                </div>


                {/* Footer Sumary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-20 p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl group/footer">
                    <div className="space-y-6 flex flex-col justify-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1 opacity-40">RESUMEN DE PROYECTO</span>
                            <div className="h-[2px] w-12 bg-primary/30 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-bold uppercase tracking-widest opacity-60">
                            <div>MXN s/IVA: <span className="text-white ml-2">{fmtMXN(grandTotals.mxnSinIvaVenta)}</span></div>
                            <div>IVA {ivaPct}%: <span className="text-white ml-2">{fmtMXN(grandTotals.ivaVenta)}</span></div>
                        </div>
                    </div>

                    <div
                        onMouseEnter={() => setIsFooterHovered(true)}
                        onMouseLeave={() => setIsFooterHovered(false)}
                        className={`p-8 rounded-[2.5rem] flex flex-col justify-center items-end relative overflow-hidden transition-all duration-700 cursor-default shadow-2xl ${isFooterHovered ? 'bg-primary scale-[1.02] shadow-primary/30' : 'bg-primary shadow-primary/20'}`}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

                        <span className={`relative z-10 font-black uppercase tracking-[0.4em] transition-all duration-500 mb-2 ${isFooterHovered ? 'text-[14px] text-black shadow-none' : 'text-[11px] opacity-70 text-black'}`}>
                            PRECIO DE VENTA USD
                        </span>

                        <h2 className="relative z-10 text-6xl md:text-7xl font-black tracking-tighter text-black tabular-nums transition-transform duration-300">
                            {money(isFooterHovered ? animatedPriceVal : grandTotals.totalVenta)}
                        </h2>

                        <div className="relative z-10 mt-6 flex flex-col items-end gap-1">
                            <div className="text-[11px] font-black tracking-widest text-black/80 uppercase">
                                ≈ {fmtMXN(grandTotals.mxnSinIvaVenta)} MXN
                            </div>
                            <div className="px-3 py-1 bg-black/10 rounded-full text-[10px] font-black tracking-[0.2em] text-black/60 uppercase">
                                MÁS {ivaPct}% DE I.V.A.
                            </div>
                        </div>

                        {/* Animated background decoration */}
                        <AnimatePresence>
                            {isFooterHovered && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.1, scale: 1.5 }}
                                    exit={{ opacity: 0, scale: 2 }}
                                    className="absolute -bottom-10 -left-10 w-64 h-64 bg-white rounded-full blur-3xl pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Versión Footer */}
                <div className="mt-20 text-center opacity-30">
                    <img src="/solifood-logo.png" alt="Footer Logo" className="h-8 object-contain mx-auto grayscale brightness-200 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Solifood Center · Industrial Planning Solutions · 2024</p>
                </div>
            </div>

            {/* Hero Video Overlay - Simplified v2.34.2 */}
            <AnimatePresence>
                {isHeroVideoActive && !heroVideoIsIntegrated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 sm:p-20"
                    >
                        {heroVideoUrl && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.1, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                                className="relative w-full h-full flex items-center justify-center"
                            >
                                <video
                                    src={heroVideoUrl}
                                    autoPlay
                                    onEnded={() => setIsHeroVideoActive(false)}
                                    className="w-full h-full object-contain rounded-3xl"
                                    style={{ borderRadius: `${heroVideoBorderRadius}px`, transform: `scale(${heroVideoScale / 100})` }}
                                />
                                <button
                                    onClick={() => setIsHeroVideoActive(false)}
                                    className="absolute top-10 right-10 p-5 rounded-full bg-white/10 text-white hover:bg-red-500 transition-all border border-white/10 group backdrop-blur-md z-[210]"
                                >
                                    <X size={32} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Item Media Lightbox */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="relative max-w-7xl w-full h-full flex items-center justify-center"
                        >
                            {selectedMedia.type === 'video' ? (
                                <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" />
                            ) : (
                                <img src={selectedMedia.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" />
                            )}
                            <button
                                onClick={() => setSelectedMedia(null)}
                                className="absolute top-4 right-4 md:-top-4 md:-right-4 p-4 rounded-full bg-white/10 text-white hover:bg-red-500 transition-all border border-white/10 backdrop-blur-md z-[310]"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ExportTemplateEditor
                isOpen={isTemplateEditorOpen}
                onClose={() => setIsTemplateEditorOpen(false)}
                sections={sections}
                grandTotals={grandTotals}
                clientName={clientName}
                projectName={projectName}
                money={money}
                calcItem={calcItem}
                initialSettings={pdfSettings}
                onSave={handleSavePdfSettings}
                logoUrl={logoUrl}
            />

            {showPasswordPrompt && (
                <PasswordPrompt
                    onCorrectPassword={(pw) => {
                        setIsAdminAuthenticated(true);
                        setIsAdmin(true);
                        setShowPasswordPrompt(false);
                    }}
                    onCancel={() => setShowPasswordPrompt(false)}
                />
            )}
        </div >
    );
}

function Field({ label, value, onChange }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:translate-x-1 transition-transform">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all" />
        </div>
    );
}

function HeaderCell({ label, width, onResize, locked, align = "left" }) {
    return (
        <div
            style={{ width }}
            className={`px-4 flex items-center border-r border-black/5 flex-shrink-0 relative group/cell h-full ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}
        >
            <span className="truncate block" title={label}>{label}</span>
            {!locked && (
                <div
                    onMouseDown={onResize}
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-black/20 z-10"
                    title="Arrastra para redimensionar"
                />
            )}
        </div>
    );
}

function fmtMXN(v) {
    return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
