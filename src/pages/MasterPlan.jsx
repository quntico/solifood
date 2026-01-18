import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/customSupabaseClient";
import { getActiveBucket } from "@/lib/bucketResolver";
import { Camera, Video, Image as ImageIcon, X, Check, Maximize2, Upload, Loader2, Play, Lock, Unlock, Settings, AlignLeft, AlignJustify, Calendar, User, Briefcase, ChevronRight, ChevronDown, ChevronsDown, ChevronsRight } from "lucide-react";
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
        collapsed: false,
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
        collapsed: false,
        summaryDesc: "",
        titulo: "3. Empaque de polvos · Bolsa 400 g",
        tag: "Oferta PKW-130",
        items: [
            { id: uid(), activo: true, codigo: "3.1", equipo: "Línea de empaquetado de polvos PKW-130 (completa)", descripcion: "Empaque para chocolate en polvo (bolsa 400 g). Total oferta: 29,000 USD.", fuente: "PKW-130", qty: 1, costoUSD: 29000, ventaUSD: 0, utilidad: 10 },
        ],
    },
    {
        id: "sec_tabletas",
        collapsed: false,
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
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [colsLocked, setColsLocked] = useState(() => localStorage.getItem("solifood_masterplan_colsLocked") === "true");
    const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);

    const [clientName, setClientName] = useState(() => localStorage.getItem("solifood_mp_client") || "YADIRA RAMIREZ");
    const [projectName, setProjectName] = useState(() => localStorage.getItem("solifood_mp_project") || "CDA 2000");
    const [projectDesc, setProjectDesc] = useState(() => localStorage.getItem("solifood_mp_desc") || "Proyecto desde grano + 2 líneas de tabletas + polvo bebida + empaque.");
    const [projectDate, setProjectDate] = useState(() => localStorage.getItem("solifood_mp_date") || new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));

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
    const [isHydrated, setIsHydrated] = useState(false); // Guard to prevent overwriting cloud data with defaults

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
    }, [clientName, projectName, projectDesc, projectDate, mpTitle, mpSubTitle, heroVideoUrl, heroVideoIsIntegrated, heroVideoScale, heroVideoBorderRadius, sections, colsLocked, colWidths, tableFontSize, isHydrated]);

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

                // HYDRATION PROTECTION: Check both column and config
                const cloudVideoUrl = data.video_url || config.heroVideoUrl;
                if (cloudVideoUrl) {
                    setHeroVideoUrl(cloudVideoUrl);
                } else {
                    console.log("[MasterPlan] No cloud video found, keeping local:", heroVideoUrl);
                }

                if (config.heroVideoIsIntegrated !== undefined) setHeroVideoIsIntegrated(config.heroVideoIsIntegrated);
                if (config.heroVideoScale) setHeroVideoScale(config.heroVideoScale);
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

    const saveToCloud = async (overrideConfig = null) => {
        setIsCloudSyncing(true);
        const configToSave = overrideConfig || {
            clientName, projectName, projectDesc, projectDate,
            mpTitle, mpSubTitle, heroVideoUrl, heroVideoIsIntegrated,
            heroVideoScale, heroVideoBorderRadius,
            tableFontSize,
            sections, // Standard sections array
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
                    project: projectName,
                    client: clientName
                })
                .eq('slug', CLOUD_SLUG);

            if (updateError) {
                console.warn("[MasterPlan] Primary update failed (could be missing column or slug):", updateError);

                // If the error is about missing column (42703), try saving WITHOUT video_url column
                if (updateError.code === '42703') {
                    console.log("[MasterPlan] missing video_url column, falling back to config only...");
                    const { error: fallbackError } = await supabase
                        .from('quotations')
                        .update({
                            sections_config: configToSave,
                            updated_at: updatedDate,
                            project: projectName,
                            client: clientName
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
                            video_url: currentVideoUrl, // This might fail too if column empty
                            updated_at: updatedDate,
                            project: projectName,
                            client: clientName,
                            title: mpTitle,
                            is_home: false
                        }, { onConflict: 'slug' });

                    if (insertError) {
                        console.warn("[MasterPlan] Upsert with video_url failed, retrying without it...");
                        const { error: insertFallbackError } = await supabase
                            .from('quotations')
                            .upsert({
                                slug: CLOUD_SLUG,
                                theme_key: `mp_${uid()}`,
                                sections_config: configToSave,
                                updated_at: updatedDate,
                                project: projectName,
                                client: clientName,
                                title: mpTitle,
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
        if (isAdmin) setIsAdmin(false);
        else {
            const pwd = prompt("Ingrese clave de administrador:");
            if (pwd === "2020") setIsAdmin(true);
            else alert("Clave incorrecta");
        }
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

            setSections(prev => prev.map(s => s.id === sectionId ? {
                ...s,
                items: s.items.map(it => it.id === itemId ? { ...it, media_url: publicUrl, media_type: mediaType } : it)
            } : s));

            toast({ title: "Media actualizado", description: "El archivo se ha subido correctamente." });
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
            toast({ title: "Imagen de módulo actualizada" });
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
        setSections(prev => [...prev, { id: uid(), collapsed: false, summaryDesc: "", titulo: `${prev.length + 1}. NUEVA SECCIÓN`, tag: "NEW", items: [] }]);
    };

    const removeSection = (sectionId) => {
        if (confirm("¿Eliminar este MÓDULO completo?")) setSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const sectionTotals = useMemo(() => sections.map(s => {
        let c = 0, v = 0;
        s.items.forEach(it => { if (it.activo) { const r = calcItem(it); c += r.totalCosto; v += r.totalVenta; } });
        return { sectionId: s.id, totalCosto: c, totalVenta: v };
    }), [sections]);

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

    const reset = () => { if (confirm("¿Restablecer MASTER PLAN?")) { localStorage.removeItem(STORAGE_KEY); setSections(initialSections); } };

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
                data.forEach(row => { const p = row["PRODUCTO"] || "SIN CATEGORIA"; if (!groups[p]) groups[p] = []; groups[p].push(row); });
                setSections(Object.keys(groups).map((p, idx) => ({
                    id: `sec_${uid()}`, collapsed: false, summaryDesc: "", titulo: `${idx + 1}. ${p}`, tag: p.substring(0, 3).toUpperCase(),
                    items: groups[p].map(row => ({
                        id: uid(), activo: true, codigo: row["NUM."] || "", equipo: row["NOMBRE (ES)"] || "Sin nombre", descripcion: "", fuente: "Pendiente",
                        utilidad: row["UTILIDAD"] || 10, qty: row["QTY"] || 1, costoUSD: row["COSTO (USD)"] || 0, ventaUSD: 0
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

            <div className="relative z-10 w-full max-w-[1920px] mx-auto">
                {/* Header Container */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 bg-zinc-950/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl relative z-[100] overflow-visible group/header">
                    {/* Left side */}
                    <div className="flex items-center gap-6 flex-1 justify-start">
                        <button onClick={() => navigate('/')} className="p-3 rounded-full bg-white/5 hover:bg-primary hover:text-black text-gray-400 transition-all group/back">
                            <X size={24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                        <div className="flex flex-col gap-2">
                            <img src="/solifood-logo.png" alt="Logo" className="h-16 object-contain" />
                            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 w-fit">
                                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                                <span className="text-[9px] font-mono font-bold text-gray-400 tracking-[0.2em]">Ver 3.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Center side */}
                    <div className="flex flex-col items-center text-center flex-[2]">
                        <div className="mb-2 w-full flex flex-col items-center relative">
                            {isAdmin ? (
                                <input value={mpSubTitle} onChange={(e) => setMpSubTitle(e.target.value.toUpperCase())} className="bg-transparent border-b border-primary/30 text-xs font-black text-primary uppercase tracking-[0.4em] text-center w-full max-w-sm mb-1" />
                            ) : (
                                <span className="text-xs font-black text-primary uppercase tracking-[0.4em] opacity-80">{mpSubTitle}</span>
                            )}
                            {isAdmin ? (
                                <input value={mpTitle} onChange={(e) => setMpTitle(e.target.value.toUpperCase())} className="bg-transparent border-b border-white/20 text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase leading-none mt-1 text-center w-full max-w-xl" />
                            ) : (
                                <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter uppercase leading-none mt-1">{mpTitle}</h1>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 mt-4 text-[10px] font-bold border-t border-white/5 pt-4 w-full opacity-60 tracking-widest uppercase">
                            <div className="flex items-center gap-2">PROJECT: <span className="text-white">{projectName}</span></div>
                            <div className="flex items-center gap-2">CLIENT: <span className="text-white">{clientName}</span></div>
                            <div className="flex items-center gap-2">DATE: <span className="text-white">{projectDate}</span></div>
                        </div>
                        <p className="text-gray-400 text-[11px] font-bold mt-4 uppercase tracking-widest opacity-80 max-w-xl leading-relaxed">{projectDesc}</p>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
                        <button onClick={toggleAdmin} className={`px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all relative z-[110] active:scale-95 ${isAdmin ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-white/10 bg-white/5 text-gray-400 hover:border-primary/50'}`}>
                            {isAdmin ? "Admin Activo" : "Editor"}
                        </button>
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
                                onClick={saveToCloud}
                                disabled={isCloudSyncing}
                                className={`px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${isCloudSyncing ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}
                            >
                                {isCloudSyncing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {isCloudSyncing ? "Guardando..." : "Guardar en Nube"}
                            </button>
                        )}
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
                        <button onClick={() => window.print()} className="px-6 py-2 bg-primary text-black font-black rounded-xl text-[10px] tracking-widest uppercase">Exportar PDF</button>
                        {isAdmin && <button onClick={addSection} className="px-6 py-2 bg-white/5 border border-white/10 text-white font-black rounded-xl text-[10px] tracking-widest uppercase hover:bg-white/10">+ Añadir Módulo</button>}
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button onClick={() => fileInputRef.current.click()} className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-primary"><Upload size={18} /></button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImportExcel} />
                            <button onClick={reset} className="p-2 bg-white/5 border border-white/10 rounded-lg text-red-500 hover:bg-red-500/10"><Loader2 size={18} /></button>
                        </div>
                    )}
                </div>

                {/* Sections Render */}
                <div className="space-y-12">
                    {sections.map(s => {
                        const visibleCols = isAdmin
                            ? ['item', 'equipo', 'descripcion', 'media', 'qty', 'costo', 'util', 'unitario', 'total', 'action']
                            : ['item', 'equipo', 'descripcion', 'media', 'qty', 'unitario', 'total'];
                        const totalTableWidth = visibleCols.reduce((acc, col) => acc + (colWidths[col] || 0), 0);

                        return (
                            <div key={s.id} className={`bg-zinc-950/40 border border-white/5 rounded-[2rem] backdrop-blur-md group/section transition-all duration-500 hover:ring-1 hover:ring-primary/40 ${!s.collapsed ? 'led-border-glow ring-1 ring-primary/20 scale-[1.01]' : 'hover:led-border-glow'}`}>
                                {/* Integrated Sticky Header Host */}
                                <div
                                    className="sticky top-0 z-50 bg-black/95 shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-b border-white/10 rounded-t-[2rem]"
                                >
                                    {/* Row 1: Module Title & Actions */}
                                    <div className="p-6 flex items-center justify-between bg-white/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleSection(s.id)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${s.collapsed ? 'bg-zinc-900 text-gray-500 shadow-inner hover:led-button-glow hover:text-primary' : 'bg-primary text-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] led-button-glow'}`}
                                                title={s.collapsed ? "ABRIR MÓDULO" : "CERRAR MÓDULO"}
                                            >
                                                {s.collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                            <div className="flex flex-col">
                                                {isAdmin ? (
                                                    <input
                                                        value={s.titulo}
                                                        onChange={(e) => updateSectionTitle(s.id, e.target.value)}
                                                        className="bg-transparent border-b border-primary/20 text-xl font-black text-primary uppercase tracking-tight focus:outline-none focus:border-primary w-[500px]"
                                                    />
                                                ) : (
                                                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">
                                                        {(() => {
                                                            const parts = s.titulo.split(' ');
                                                            return (
                                                                <>
                                                                    <span className="text-white">{parts[0]}</span>
                                                                    {parts.length > 1 && ' ' + parts.slice(1).join(' ')}
                                                                </>
                                                            );
                                                        })()}
                                                    </h3>
                                                )}
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-widest leading-none h-4 flex items-center">{s.tag}</span>
                                                    {s.collapsed && s.summaryDesc && (
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider max-w-md truncate opacity-70">
                                                            {s.summaryDesc}
                                                        </span>
                                                    )}
                                                    {s.collapsed && !s.summaryDesc && (
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 opacity-40">
                                                            <ChevronsRight size={10} className="animate-pulse" /> Módulo contraído
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {s.collapsed && (
                                                <div className="flex flex-col items-end mr-2">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1 opacity-50">Subtotal Módulo</span>
                                                    <span className="text-2xl font-black text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
                                                        {money(sectionTotals.find(x => x.sectionId === s.id)?.totalVenta || 0)}
                                                    </span>
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <div className="flex gap-2 mr-4">
                                                    <button
                                                        onClick={() => {
                                                            const inp = document.createElement('input');
                                                            inp.type = 'file';
                                                            inp.onchange = (e) => handleModuleMediaUpload(s.id, e.target.files[0]);
                                                            inp.click();
                                                        }}
                                                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                                        title="Sube imagen de portada del módulo"
                                                    >
                                                        {uploadingId === `module_${s.id}` ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                                    </button>
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => removeSection(s.id)}
                                                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all"
                                                >
                                                    Eliminar Módulo
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Module Info Panel (Only when expanded) */}
                                    {!s.collapsed && (
                                        <div className="px-6 py-6 border-t border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent flex gap-8">
                                            {s.moduleImage && (
                                                <div className="w-48 h-32 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0 group/modimg relative">
                                                    <img src={s.moduleImage} className="w-full h-full object-cover grayscale group-hover/modimg:grayscale-0 transition-all duration-500" />
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => updateSection(s.id, { moduleImage: null })}
                                                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/modimg:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-4">
                                                {isAdmin ? (
                                                    <textarea
                                                        value={s.summaryDesc || ""}
                                                        onChange={(e) => updateSection(s.id, { summaryDesc: e.target.value })}
                                                        placeholder="Descripción breve del módulo..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-400 font-medium outline-none focus:border-primary/30 h-32 resize-none"
                                                    />
                                                ) : (
                                                    s.summaryDesc && <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl">{s.summaryDesc}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Row 2: Industrial Labels (Yellow) - Independent Scrollable Header */}
                                    {!s.collapsed && (
                                        <div
                                            className="overflow-hidden bg-primary text-black"
                                            ref={el => headerRefs.current[s.id] = el}
                                        >
                                            <div
                                                className="flex text-[10px] font-black uppercase tracking-[0.2em] h-12"
                                                style={{ width: totalTableWidth }}
                                            >
                                                <HeaderCell label="Item" width={colWidths.item} onResize={(e) => startResize('item', e)} locked={colsLocked} />
                                                <HeaderCell label="Equipo" width={colWidths.equipo} onResize={(e) => startResize('equipo', e)} locked={colsLocked} />
                                                <HeaderCell label="Descripción" width={colWidths.descripcion} onResize={(e) => startResize('descripcion', e)} locked={colsLocked} />
                                                <HeaderCell label="FOTO / VIDEO" width={colWidths.media} onResize={(e) => startResize('media', e)} locked={colsLocked} align="center" />
                                                <HeaderCell label="Qty" width={colWidths.qty} onResize={(e) => startResize('qty', e)} locked={colsLocked} />
                                                {isAdmin && <HeaderCell label="Costo (USD)" width={colWidths.costo} onResize={(e) => startResize('costo', e)} locked={colsLocked} align="right" />}
                                                {isAdmin && <HeaderCell label="Util %" width={colWidths.util} onResize={(e) => startResize('util', e)} locked={colsLocked} align="center" />}
                                                <HeaderCell label="Unitario (USD)" width={colWidths.unitario} onResize={(e) => startResize('unitario', e)} locked={colsLocked} align="right" />
                                                <HeaderCell label="Total (USD)" width={colWidths.total} onResize={(e) => startResize('total', e)} locked={colsLocked} align="right" />
                                                {isAdmin && <HeaderCell label="Acc" width={colWidths.action} onResize={(e) => startResize('action', e)} locked={colsLocked} align="center" />}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Table Body Section */}
                                {!s.collapsed && (
                                    <div
                                        className="overflow-x-auto custom-scrollbar"
                                        style={{ width: "100%" }}
                                        ref={el => tableRefs.current[s.id] = el}
                                        onScroll={(e) => handleTableScroll(s.id, e)}
                                    >
                                        <table className="table-fixed border-collapse" style={{ width: totalTableWidth, minWidth: totalTableWidth }}>
                                            {/* Ghost Header for Alignment Anchor */}
                                            <colgroup>
                                                <col style={{ width: colWidths.item }} />
                                                <col style={{ width: colWidths.equipo }} />
                                                <col style={{ width: colWidths.descripcion }} />
                                                <col style={{ width: colWidths.media }} />
                                                <col style={{ width: colWidths.qty }} />
                                                {isAdmin && <col style={{ width: colWidths.costo }} />}
                                                {isAdmin && <col style={{ width: colWidths.util }} />}
                                                <col style={{ width: colWidths.unitario }} />
                                                <col style={{ width: colWidths.total }} />
                                                {isAdmin && <col style={{ width: colWidths.action }} />}
                                            </colgroup>
                                            <tbody style={{ fontSize: `${tableFontSize}px` }}>
                                                {s.items.map(it => {
                                                    const r = calcItem(it);
                                                    return (
                                                        <tr key={it.id} className={`border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors ${!it.activo && 'opacity-30'}`}>
                                                            <td className="p-4 border-r border-white/[0.02]">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <button
                                                                        onClick={() => updateItem(s.id, it.id, { activo: !it.activo })}
                                                                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${it.activo ? 'bg-primary border-primary text-black' : 'bg-transparent border-white/20 text-white/10 hover:border-white/40'}`}
                                                                    >
                                                                        {it.activo && <Check size={14} strokeWidth={4} />}
                                                                    </button>
                                                                    {isAdmin ? (
                                                                        <input value={it.codigo} onChange={(e) => updateItem(s.id, it.id, { codigo: e.target.value })} className="bg-transparent border-b border-white/5 text-[11px] font-mono text-gray-400 w-full text-center focus:border-primary/50 outline-none" />
                                                                    ) : (
                                                                        <span className="text-[11px] font-mono text-gray-400">{it.codigo}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 border-r border-white/[0.02]">
                                                                {isAdmin ? (
                                                                    <textarea
                                                                        value={it.equipo}
                                                                        onChange={(e) => updateItem(s.id, it.id, { equipo: e.target.value })}
                                                                        className={`bg-transparent text-sm font-black text-white w-full border-b border-white/5 outline-none focus:border-primary/50 resize-none overflow-hidden ${!it.activo ? 'line-through text-white/40' : ''}`}
                                                                        rows={1}
                                                                        style={{ fieldSizing: "content" }}
                                                                    />
                                                                ) : (
                                                                    <span className={`text-sm font-black text-white uppercase tracking-tight ${!it.activo ? 'line-through text-white/40' : ''}`}>{it.equipo}</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 border-r border-white/[0.02]">
                                                                {isAdmin ? (
                                                                    <textarea
                                                                        value={it.descripcion}
                                                                        onChange={(e) => updateItem(s.id, it.id, { descripcion: e.target.value })}
                                                                        className="bg-transparent text-[11px] text-gray-500 w-full resize-none border-none outline-none focus:text-gray-300"
                                                                        rows={1}
                                                                        style={{ fieldSizing: "content" }}
                                                                    />
                                                                ) : (
                                                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{it.descripcion}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4 border-r border-white/[0.02]">
                                                                <div className="flex flex-col items-center justify-center gap-2 group/media relative">
                                                                    {it.media_url ? (
                                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all shadow-lg hover:scale-110 cursor-pointer" onClick={() => setSelectedMedia({ url: it.media_url, type: it.media_type })}>
                                                                            {it.media_type === 'video' ? (
                                                                                <video src={it.media_url} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <img src={it.media_url} alt="" className="w-full h-full object-cover" />
                                                                            )}
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity">
                                                                                <Maximize2 size={14} className="text-white" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center">
                                                                            {isAdmin ? (
                                                                                <div className="flex gap-1">
                                                                                    <label className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-primary hover:border-primary/50 cursor-pointer transition-all">
                                                                                        {uploadingId === it.id ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleItemMediaUpload(s.id, it.id, e.target.files[0])} disabled={uploadingId === it.id} />
                                                                                    </label>
                                                                                    <label className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-primary hover:border-primary/50 cursor-pointer transition-all">
                                                                                        {uploadingId === it.id ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                                                                                        <input type="file" className="hidden" accept="video/*" onChange={(e) => handleItemMediaUpload(s.id, it.id, e.target.files[0])} disabled={uploadingId === it.id} />
                                                                                    </label>
                                                                                </div>
                                                                            ) : (
                                                                                <Camera size={16} className="text-white/5" />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {isAdmin && it.media_url && (
                                                                        <button
                                                                            onClick={() => updateItem(s.id, it.id, { media_url: null, media_type: null })}
                                                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity scale-75 hover:scale-100"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 border-r border-white/[0.02]">
                                                                {isAdmin ? (
                                                                    <input type="number" value={it.qty} onChange={(e) => updateItem(s.id, it.id, { qty: n(e.target.value) })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white w-full focus:border-primary/50 outline-none" />
                                                                ) : (
                                                                    <span className="text-xs font-mono text-gray-300">{it.qty}</span>
                                                                )}
                                                            </td>
                                                            {isAdmin && (
                                                                <td className="p-4 text-right border-r border-white/[0.02]">
                                                                    <input type="number" value={it.costoUSD} onChange={(e) => updateItem(s.id, it.id, { costoUSD: n(e.target.value) })} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white w-full text-right focus:border-primary/50 outline-none" />
                                                                </td>
                                                            )}
                                                            {isAdmin && (
                                                                <td className="p-4 text-center border-r border-white/[0.02]">
                                                                    <input type="number" value={it.utilidad} onChange={(e) => updateItem(s.id, it.id, { utilidad: n(e.target.value) })} className="bg-primary/5 border border-primary/20 rounded px-2 py-1 text-xs font-mono text-primary w-full text-center focus:border-primary/50 outline-none" />
                                                                </td>
                                                            )}
                                                            <td className={`px-4 text-right text-xs font-mono border-r border-white/5 ${!it.activo ? 'line-through text-gray-600' : 'text-gray-400'}`}>
                                                                {money(r.ventaUnitFinal)}
                                                            </td>
                                                            <td className={`px-4 text-right text-sm font-black tracking-tight border-r border-white/5 ${!it.activo ? 'line-through text-primary/30' : 'text-primary'}`}>
                                                                {money(r.totalVenta)}
                                                            </td>
                                                            {isAdmin && (
                                                                <td className="px-4 text-center border-r border-white/5">
                                                                    <button onClick={() => removeItem(s.id, it.id)} className="text-red-500 opacity-20 hover:opacity-100 transition-opacity"><X size={14} /></button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                                {isAdmin && <tr><td colSpan={isAdmin ? 10 : 7} className="p-4"><button onClick={() => addItem(s.id)} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-widest">+ Agregar Fila al Módulo</button></td></tr>}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-white/[0.02] font-black border-t border-white/5">
                                                    <td colSpan={isAdmin ? 8 : 6} className="p-4 text-right text-[10px] text-gray-500 uppercase tracking-[0.2em]">Subtotal Módulo</td>
                                                    <td className="p-4 text-right text-lg text-primary tracking-tighter">{money(sectionTotals.find(x => x.sectionId === s.id)?.totalVenta || 0)}</td>
                                                    {isAdmin && <td className="p-4 border-l border-white/[0.02]"></td>}
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Sumary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-20 p-8 bg-zinc-950/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl">
                    <div className="space-y-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Costo Total Estimado</span>
                            {isAdmin ? <span className="text-4xl font-black text-white tracking-tighter">{money(grandTotals.totalCosto)}</span> : <span className="text-4xl font-black text-white/5 tracking-tighter">$ --.---,--</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-bold uppercase tracking-widest opacity-60">
                            <div>MXN s/IVA: <span className="text-white ml-2">{fmtMXN(grandTotals.mxnSinIvaVenta / (1 + n(ivaPct) / 100))}</span></div>
                            <div>IVA {ivaPct}%: <span className="text-white ml-2">{fmtMXN(grandTotals.ivaVenta)}</span></div>
                        </div>
                    </div>
                    <div className="p-8 bg-primary rounded-[2rem] flex flex-col justify-center items-end relative overflow-hidden group/final text-black shadow-2xl shadow-primary/20">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                        <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Precio de Venta Sugerido (USD)</span>
                        <h2 className="relative z-10 text-6xl font-black tracking-tighter">{money(grandTotals.totalVenta)}</h2>
                        <div className="relative z-10 mt-4 text-xs font-black tracking-widest opacity-80 uppercase">≈ {fmtMXN(grandTotals.mxnConIvaVenta)} MXN (c/IVA)</div>
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
        </div>
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
