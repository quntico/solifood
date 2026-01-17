import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/customSupabaseClient";
import { getActiveBucket } from "@/lib/bucketResolver";
import { Camera, Video, Image as ImageIcon, X, Maximize2, Upload, Loader2, Play, Lock, Unlock, Settings } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const STORAGE_KEY = "solifood_masterplan_v1_autonomo";

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
            // LST (tal cual tabla de cotización)
            { id: uid(), activo: true, codigo: "1.1", equipo: "Máquina seleccionadora de grano de cacao", descripcion: "Separación/limpieza por etapas (winnowing) para eficiencia.", fuente: "LST", qty: 1, costoUSD: 5000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.2", equipo: "Elevador/cargador tipo Z para 2 tostadores", descripcion: "Carga automática para alimentar 2 tostadores.", fuente: "LST", qty: 1, costoUSD: 8000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.3", equipo: "Tostadores a gas (roasting machine)", descripcion: "Tostado controlado por lotes (según oferta).", fuente: "LST", qty: 2, costoUSD: 10000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.4", equipo: "Placas de enfriamiento (cooling plate)", descripcion: "Enfriado de cacao tostado para estabilizar proceso.", fuente: "LST", qty: 2, costoUSD: 4800, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.5", equipo: "Cargadores por vacío (vacuum loading)", descripcion: "Transporte/carga para grano tostado y nibs (según oferta).", fuente: "LST", qty: 2, costoUSD: 4600, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.6", equipo: "Tanques de almacenamiento para grano/nibs", descripcion: "Pulmón/almacenamiento para continuidad de línea.", fuente: "LST", qty: 2, costoUSD: 4200, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.7", equipo: "Descascarilladora + aventadora (peeling & winnowing)", descripcion: "Separación de cáscara y obtención de nibs.", fuente: "LST", qty: 1, costoUSD: 12000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.8", equipo: "Cargadores por vacío para nibs (vacuum loading)", descripcion: "Transporte de nibs a molienda/almacenamiento (según oferta).", fuente: "LST", qty: 2, costoUSD: 4600, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.9", equipo: "Tanques de almacenamiento de nibs", descripcion: "Pulmón dedicado para nibs previo a molienda.", fuente: "LST", qty: 2, costoUSD: 4200, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.10", equipo: "Molino de bolas 1ª molienda (nibs → pasta/licor)", descripcion: "Molienda inicial de nibs para formar cocoa mass.", fuente: "LST", qty: 1, costoUSD: 40000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.11", equipo: "Chiller de agua 15 HP", descripcion: "Enfriamiento para estabilidad térmica (según oferta).", fuente: "LST", qty: 1, costoUSD: 10000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.12", equipo: "Tanques almacenamiento pasta/chocolate", descripcion: "Tanques jacketed para cocoa mass/chocolate (según oferta).", fuente: "LST", qty: 2, costoUSD: 5500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.13", equipo: "Bombas para chocolate (Durex)", descripcion: "Bombeo sanitario de chocolate/pasta (según oferta).", fuente: "LST", qty: 2, costoUSD: 2300, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.14", equipo: "Prensa de licor (oil press) · 3 sets", descripcion: "Prensado para obtener manteca de cacao + torta.", fuente: "LST", qty: 3, costoUSD: 14000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.15", equipo: "Tanque de manteca de cacao", descripcion: "Almacenamiento de cocoa butter para formulación.", fuente: "LST", qty: 1, costoUSD: 5500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.16", equipo: "Bomba para manteca", descripcion: "Transferencia de cocoa butter a proceso.", fuente: "LST", qty: 1, costoUSD: 2300, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.17", equipo: "Crusher de torta de cacao", descripcion: "Rompedor de torta tras prensado.", fuente: "LST", qty: 1, costoUSD: 4500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.18", equipo: "Molino/pulverizador de cacao (cocoa powder grinder)", descripcion: "Pulveriza torta para cacao en polvo base.", fuente: "LST", qty: 1, costoUSD: 6500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "1.19", equipo: "Tubería chaquetada para chocolate (50 m)", descripcion: "Pipe jacketed para transferencia térmica controlada.", fuente: "LST", qty: 50, costoUSD: 120, ventaUSD: 0 },
        ],
    },

    {
        id: "sec_polvo_bebida",
        collapsed: false,
        summaryDesc: "",
        titulo: "2. Chocolate en polvo para bebida (mezcla con leche) · Formulación → Mezclado → (Opcional) Instantizado",
        tag: "Pendiente de cotizar (requerido para tu SKU de bebida)",
        items: [
            { id: uid(), activo: true, codigo: "2.1", equipo: "Tolvas para azúcar / leche en polvo / cacao en polvo base", descripcion: "Almacenamiento y alimentación controlada de ingredientes secos.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "2.2", equipo: "Sistema de pesaje y dosificación de ingredientes secos", descripcion: "Dosificación por receta para repetibilidad de mezcla.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "2.3", equipo: "Mezcladora tipo ribbon/paddle (grado alimenticio)", descripcion: "Mezcla homogénea (cacao + azúcar + leche en polvo + aditivos).", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "2.4", equipo: "Tamiz / desaglomerador", descripcion: "Elimina grumos y controla granulometría final.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "2.5", equipo: "Sistema de instantizado (opcional recomendado)", descripcion: "Mejora humectación/disolución con lecitina (menos grumos al mezclar con leche).", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "2.6", equipo: "Colector de polvo / filtración", descripcion: "Control de polvo por higiene, merma y seguridad.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
        ],
    },

    {
        id: "sec_empaque_polvo",
        collapsed: false,
        summaryDesc: "",
        titulo: "3. Empaque de polvos · Bolsa 400 g",
        tag: "Oferta PKW-130",
        items: [
            { id: uid(), activo: true, codigo: "3.1", equipo: "Línea de empaquetado de polvos PKW-130 (completa)", descripcion: "Empaque para chocolate en polvo (bolsa 400 g). Total oferta: 29,000 USD.", fuente: "PKW-130", qty: 1, costoUSD: 29000, ventaUSD: 0 },
        ],
    },

    {
        id: "sec_tabletas",
        collapsed: false,
        summaryDesc: "",
        titulo: "4. Tabletas (2 líneas) · Templado → Moldeo → Vibrado → Enfriado → Desmolde",
        tag: "Oferta Mini Chocolate Molding Line (ajustada a 2 líneas) + 1 Foil",
        items: [
            // Compartidos (1 set)
            { id: uid(), activo: true, codigo: "4.1", equipo: "Fundidor de grasa/manteca (fat melter)", descripcion: "Tanque 1000 L con pesaje + bomba (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 8800, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.2", equipo: "Cargador de polvos (powder loader)", descripcion: "Carga de azúcar/cacao en polvo para formulación (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 4500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.3", equipo: "Molino de bolas para chocolate (ball mill) 300 kg/batch", descripcion: "Refinado por batch (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 21500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.4", equipo: "Chiller de agua 5 HP", descripcion: "Enfriamiento para sistema (según oferta).", fuente: "Mini Molding", qty: 1, costoUSD: 4000, ventaUSD: 0 },

            // DOBLE (2 líneas)
            { id: uid(), activo: true, codigo: "4.5", equipo: "Sistema de alimentación de chocolate (tanque + bomba + control)", descripcion: "Tanque 500 kg + bomba + control (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 7000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.6", equipo: "Templadora 100 kg/batch", descripcion: "Templado por batch (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 14000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.7", equipo: "Cargador de moldes + calentador (mould loader & heater)", descripcion: "Carga automática de moldes a calentador (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 6200, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.8", equipo: "Depositador One-Shot (mini depositor)", descripcion: "Sistema Delta/Schneider (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 20500, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.9", equipo: "Vibrador", descripcion: "Elimina burbujas (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 5200, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.10", equipo: "Túnel de enfriamiento vertical", descripcion: "Capacidad 180 moldes, con chiller 8HP (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 31000, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.11", equipo: "Desmoldeador (demoulder) (opcional en oferta)", descripcion: "Voltea/knock de molde y regresa (x2 líneas).", fuente: "Mini Molding", qty: 2, costoUSD: 20500, ventaUSD: 0 },

            // Moldes/herramental (2 tipos: lisa + hex)
            { id: uid(), activo: true, codigo: "4.12", equipo: "Moldes (200 pcs por línea aprox.)", descripcion: "Se asume 400 pcs totales para 2 líneas/2 formas (ajustable).", fuente: "Mini Molding", qty: 400, costoUSD: 8, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "4.13", equipo: "Herramental / tooling (2 sets)", descripcion: "1 set por cada forma de molde (lisa + hex).", fuente: "Mini Molding", qty: 2, costoUSD: 800, ventaUSD: 0 },

            // Empaque foil SOLO 1 línea (como acordamos)
            { id: uid(), activo: true, codigo: "4.14", equipo: "Envolvedora foil (foil wrapping machine)", descripcion: "1 sola línea de foil para tabletas lisas. Costo: 118,000 USD.", fuente: "Mini Molding", qty: 1, costoUSD: 118000, ventaUSD: 0 },
        ],
    },

    {
        id: "sec_hex",
        collapsed: false,
        summaryDesc: "",
        titulo: "5. Empaque de tabletas hexagonales · Encartonado hex",
        tag: "Pendiente de cotizar (tu otra presentación)",
        items: [
            { id: uid(), activo: true, codigo: "5.1", equipo: "Formadora/encartonadora de caja hexagonal", descripcion: "Formado y cierre de caja hex.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "5.2", equipo: "Alimentación/insertado de tableta + cierre", descripcion: "Inserta tableta, cierra y expulsa.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "5.3", equipo: "Etiquetado/impresión lote (si aplica)", descripcion: "Trazabilidad y presentación.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
        ],
    },

    {
        id: "sec_utilidades",
        collapsed: false,
        summaryDesc: "",
        titulo: "6. Utilidades mínimas (planta)",
        tag: "Pendiente (no inflar: queda en 0 hasta cotizar)",
        items: [
            { id: uid(), activo: true, codigo: "6.1", equipo: "Aire comprimido (compresor + secador + tanque)", descripcion: "Actuadores y empaque.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "6.2", equipo: "Extracción de polvo / filtros", descripcion: "Zona de mezcla de polvos e higiene.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
            { id: uid(), activo: true, codigo: "6.3", equipo: "HVAC / control de temperatura", descripcion: "Estabilidad del chocolate/áreas críticas.", fuente: "Pendiente", qty: 1, costoUSD: 0, ventaUSD: 0 },
        ],
    },
];

export default function MasterPlan() {
    const navigate = useNavigate();
    // Producción (header)
    const [horasDia, setHorasDia] = useState(16);
    const [kgLisas, setKgLisas] = useState(800);
    const [gLisas, setGLisas] = useState(20);

    const [kgHex, setKgHex] = useState(800);
    const [gHex, setGHex] = useState(90);

    const [kgPolvo, setKgPolvo] = useState(400);
    const [gBolsaPolvo, setGBolsaPolvo] = useState(400);

    // Finanzas
    const [tipoCambio, setTipoCambio] = useState(18.5);
    const [ivaPct, setIvaPct] = useState(16);

    // “Fórmula extra” opcional
    const [margenPct, setMargenPct] = useState(10);
    const [isAdmin, setIsAdmin] = useState(false);
    const { toast } = useToast();
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [colsLocked, setColsLocked] = useState(() => {
        return localStorage.getItem("solifood_masterplan_colsLocked") === "true";
    });
    const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem("solifood_masterplan_colsLocked", colsLocked);
    }, [colsLocked]);

    const [colWidths, setColWidths] = useState(() => {
        try {
            const saved = localStorage.getItem("solifood_masterplan_colWidths_v2");
            return saved ? JSON.parse(saved) : {
                ok: 50,
                equipo: 300,
                descripcion: 450,
                multimedia: 140,
                utilidad: 90,
                qty: 80,
                costo: 130,
                precioUnit: 130,
                totalCosto: 130,
                totalVenta: 130
            };
        } catch { return {}; }
    });

    useEffect(() => {
        localStorage.setItem("solifood_masterplan_colWidths_v2", JSON.stringify(colWidths));
    }, [colWidths]);

    const resizeRef = useRef({ col: null, startX: 0, startWidth: 0 });

    const startResize = (col, e) => {
        if (colsLocked) return;
        e.preventDefault();
        resizeRef.current = {
            col,
            startX: e.pageX,
            startWidth: colWidths[col] || 100
        };
        document.addEventListener("mousemove", handleResize);
        document.addEventListener("mouseup", stopResize);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleResize = (e) => {
        const { col, startX, startWidth } = resizeRef.current;
        if (!col) return;
        const diff = e.pageX - startX;
        setColWidths(prev => ({
            ...prev,
            [col]: Math.max(40, startWidth + diff)
        }));
    };

    const stopResize = () => {
        document.removeEventListener("mousemove", handleResize);
        document.removeEventListener("mouseup", stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeRef.current = { col: null, startX: 0, startWidth: 0 };
    };

    const resetView = () => {
        if (!confirm("¿Restablecer el tamaño de las columnas a los valores predeterminados?")) return;
        localStorage.removeItem("solifood_masterplan_colWidths_v2");
        setColWidths({
            ok: 50,
            equipo: 300,
            descripcion: 450,
            multimedia: 140,
            utilidad: 90,
            qty: 80,
            costo: 130,
            precioUnit: 130,
            totalCosto: 130,
            totalVenta: 130
        });
    };

    const handleMediaUpload = async (sectionId, itemId, file) => {
        if (!file) return;
        setUploadingId(itemId);
        try {
            const bucket = await getActiveBucket();
            const fileExt = file.name.split('.').pop();
            const fileName = `${sectionId}_${itemId}_${Date.now()}.${fileExt}`;
            const filePath = `masterplan/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            updateItem(sectionId, itemId, {
                media_url: publicUrl,
                media_type: file.type.startsWith('video') ? 'video' : 'image'
            });
        } catch (error) {
            console.error("Error uploading media:", error);
            alert("Error al subir archivo");
        } finally {
            setUploadingId(null);
        }
    };
    const [autoMargen, setAutoMargen] = useState(true);
    const [globalUtilidad, setGlobalUtilidad] = useState(10);

    const toggleAdmin = () => {
        if (isAdmin) {
            setIsAdmin(false);
        } else {
            const pwd = prompt("Ingrese clave de administrador:");
            if (pwd === "2020") {
                setIsAdmin(true);
            } else {
                alert("Clave incorrecta");
            }
        }
    };

    const applyGlobalUtility = () => {
        if (!confirm(`¿Aplicar ${globalUtilidad}% de utilidad a TODOS los equipos?`)) return;
        setSections(prev => prev.map(s => ({
            ...s,
            items: s.items.map(it => ({ ...it, utilidad: n(globalUtilidad) }))
        })));
    };

    function calcItem(it) {
        const costoUnit = n(it.costoUSD);
        const qty = n(it.qty);
        const util = n(it.utilidad);

        // Formula: Markup calculation (Requested by User)
        // Price = Cost * (1 + Util%)
        let ventaUnitFinal = 0;
        ventaUnitFinal = costoUnit * (1 + (util / 100));

        if (!Number.isFinite(ventaUnitFinal) || ventaUnitFinal < 0) ventaUnitFinal = 0;

        const totalCosto = costoUnit * qty;
        const totalVenta = ventaUnitFinal * qty;

        return {
            costoUnit,
            ventaUnitFinal,
            totalCosto,
            totalVenta
        };
    };



    const [sections, setSections] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return initialSections;
            const parsed = JSON.parse(raw);
            return parsed?.length ? parsed : initialSections;
        } catch {
            return initialSections;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    }, [sections]);

    // ... (rest of functions)

    const updateItem = (sectionId, itemId, patch) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
                };
            })
        );
    };

    const addItem = (sectionId) => {
        const it = {
            id: uid(),
            activo: true,
            codigo: "",
            equipo: "Nuevo equipo",
            descripcion: "",
            fuente: "Pendiente",
            utilidad: 10,
            qty: 1,
            costoUSD: 0,
            ventaUSD: 0,
        };
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, it] } : s))
        );
    };

    const removeItem = (sectionId, itemId) => {
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((x) => x.id !== itemId) } : s))
        );
    };

    const sectionTotals = useMemo(() => {
        return sections.map((s) => {
            let c = 0;
            let v = 0;
            s.items.forEach((it) => {
                if (!it.activo) return;
                const r = calcItem(it);
                c += r.totalCosto;
                v += r.totalVenta;
            });
            return { sectionId: s.id, totalCosto: c, totalVenta: v };
        });
    }, [sections, autoMargen, margenPct]);

    const grandTotals = useMemo(() => {
        const totalCosto = sectionTotals.reduce((acc, x) => acc + x.totalCosto, 0);
        const totalVenta = sectionTotals.reduce((acc, x) => acc + x.totalVenta, 0);

        const mxnSinIvaCosto = totalCosto * n(tipoCambio);
        const ivaCosto = mxnSinIvaCosto * (n(ivaPct) / 100);
        const mxnConIvaCosto = mxnSinIvaCosto + ivaCosto;

        const mxnSinIvaVenta = totalVenta * n(tipoCambio);
        const ivaVenta = mxnSinIvaVenta * (n(ivaPct) / 100);
        const mxnConIvaVenta = mxnSinIvaVenta + ivaVenta;

        return {
            totalCosto,
            totalVenta,
            mxnSinIvaCosto,
            ivaCosto,
            mxnConIvaCosto,
            mxnSinIvaVenta,
            ivaVenta,
            mxnConIvaVenta,
        };
    }, [sectionTotals, tipoCambio, ivaPct]);

    // Producción (cálculos)
    const piezasLisasDia = useMemo(() => (n(kgLisas) * 1000) / Math.max(1, n(gLisas)), [kgLisas, gLisas]);
    const piezasLisasHora = useMemo(() => piezasLisasDia / Math.max(1, n(horasDia)), [piezasLisasDia, horasDia]);

    const piezasHexDia = useMemo(() => (n(kgHex) * 1000) / Math.max(1, n(gHex)), [kgHex, gHex]);
    const piezasHexHora = useMemo(() => piezasHexDia / Math.max(1, n(horasDia)), [piezasHexDia, horasDia]);

    const bolsasPolvoDia = useMemo(() => (n(kgPolvo) * 1000) / Math.max(1, n(gBolsaPolvo)), [kgPolvo, gBolsaPolvo]);
    const bolsasPolvoHora = useMemo(() => bolsasPolvoDia / Math.max(1, n(horasDia)), [bolsasPolvoDia, horasDia]);

    const fileInputRef = useRef(null);

    const exportTemplate = () => {
        const rows = [];
        sections.forEach(s => {
            let prodName = s.titulo;
            // Extract clean product name from title (e.g. "1. Línea..." -> "Línea...")
            if (/^\d+\.\s*/.test(prodName)) {
                prodName = prodName.replace(/^\d+\.\s*/, "").split('·')[0].trim();
            }

            s.items.forEach(it => {
                const r = calcItem(it);
                rows.push({
                    "NUM.": it.codigo,
                    "PRODUCTO": prodName,
                    "QTY": it.qty,
                    "NOMBRE (ES)": it.equipo,
                    // Export raw numbers, avoiding very small decimals if they are practically zero
                    "COSTO (USD)": it.costoUSD > 0.01 ? it.costoUSD : 0,
                    // Export Utility as Value (e.g. 60 instead of 0.6) for better UX
                    "UTILIDAD": it.utilidad !== undefined ? it.utilidad : 10,
                    "UNITARIO": r.ventaUnitFinal > 0.01 ? r.ventaUnitFinal : 0,
                    "PRECIO (USD)": r.totalVenta > 0.01 ? r.totalVenta : 0
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla CDA");
        XLSX.writeFile(workbook, "PLANTILLA_IMPORTACION_CDA.xlsx");
    };

    const exportExcel = () => {
        const rows = [];
        sections.forEach(s => {
            s.items.forEach(it => {
                const r = calcItem(it);
                rows.push({
                    "SectionID": s.id,
                    "Sección": s.titulo,
                    "ID": it.id,
                    "Código": it.codigo,
                    "Equipo": it.equipo,
                    "Descripción": it.descripcion,
                    "Fuente/Utilidad": it.utilidad !== undefined ? it.utilidad : 10,
                    "QTY": it.qty,
                    "Costo Unitario (USD)": it.costoUSD,
                    "Venta Unitario (Calculado)": r.ventaUnitFinal,
                    "Total Venta (Calculado)": r.totalVenta
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Master Plan");
        XLSX.writeFile(workbook, "SOLIFOOD_MASTER_PLAN.xlsx");
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    alert("El archivo parece estar vacío o no tiene el formato correcto.");
                    return;
                }

                // DETECT MODE: Creation Mode if "PRODUCTO" column exists
                const isCreationMode = data.some(row => row["PRODUCTO"] !== undefined);

                if (isCreationMode) {
                    if (!confirm("⚠️ MODO CREACIÓN DETECTADO\n\nEste archivo REEMPLAZARÁ TODO el Master Plan con la estructura de secciones del Excel.\n\n¿Estás seguro de continuar?")) {
                        // Reset input if cancelled
                        e.target.value = null;
                        return;
                    }

                    // Group by PRODUCTO
                    const groups = {};
                    data.forEach(row => {
                        const prod = row["PRODUCTO"] || "SIN CATEGORIA";
                        if (!groups[prod]) groups[prod] = [];
                        groups[prod].push(row);
                    });

                    const newSections = Object.keys(groups).map((prodName, idx) => {
                        // Generate a clean ID for section
                        const secId = `sec_${prodName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uid()}`;

                        return {
                            id: secId,
                            collapsed: false,
                            summaryDesc: "",
                            titulo: `${idx + 1}. ${prodName}`,
                            tag: prodName.substring(0, 3).toUpperCase(),
                            items: groups[prodName].map(row => {
                                // Logic to respect Excel prices ("UNITARIO") over "UTILIDAD" column
                                const costVal = row["COSTO (USD)"] ? n(row["COSTO (USD)"]) : 0;
                                const saleVal = row["UNITARIO"] ? n(row["UNITARIO"]) : 0;

                                // Calculate utility needed to hit the target sale price
                                // Formula: Markup calculation
                                // Price = Cost * (1 + Markup%)
                                // Markup% = (Price / Cost) - 1
                                let calculatedUtil = 10; // Default 10%
                                if (saleVal > 0 && costVal > 0 && saleVal > costVal) {
                                    calculatedUtil = ((saleVal / costVal) - 1) * 100;
                                } else if (row["UTILIDAD"] !== undefined && n(row["UTILIDAD"]) !== 0) { // Check for existence and non-zero value
                                    // Fallback to Excel column if price logic fails (e.g. 0.6 -> 60%)
                                    // But be careful if 0.6 means 60% or something else. Assuming 0.6 = 60%.
                                    calculatedUtil = n(row["UTILIDAD"]) < 1 ? n(row["UTILIDAD"]) * 100 : n(row["UTILIDAD"]);
                                } else {
                                    // If no saleVal, costVal, or UTILIDAD, default to 10%
                                    calculatedUtil = 10;
                                }

                                return {
                                    id: uid(), // Always fresh ID
                                    activo: true,
                                    codigo: row["NUM."] ? String(row["NUM."]) : "",
                                    equipo: row["NOMBRE (ES)"] || "Sin nombre",
                                    descripcion: "",
                                    fuente: "Pendiente",
                                    utilidad: calculatedUtil,
                                    qty: row["QTY"] ? n(row["QTY"]) : 1,
                                    costoUSD: costVal,
                                    ventaUSD: 0 // Not actually used by calcItem, but part of schema
                                };
                            })
                        };
                    });

                    setSections(newSections);
                    alert("Master Plan reconstruido exitosamente.");

                } else {
                    // Update Mode (old logic)
                    setSections(prev => prev.map(s => {
                        const sectionItems = data.filter(row => row.SectionID === s.id);
                        if (sectionItems.length === 0) return s;

                        const updatedItems = s.items.map(it => {
                            const row = sectionItems.find(r => r.ID === it.id);
                            if (!row) return it;

                            // Actualizar campos permitidos
                            return {
                                ...it,
                                equipo: row["Equipo"] || it.equipo,
                                descripcion: row["Descripción"] || it.descripcion,
                                utilidad: row["Fuente/Utilidad"] !== undefined ? n(row["Fuente/Utilidad"]) : it.utilidad,
                                qty: row["QTY"] !== undefined ? n(row["QTY"]) : it.qty,
                                costoUSD: row["Costo Unitario (USD)"] !== undefined ? n(row["Costo Unitario (USD)"]) : it.costoUSD
                            };
                        });

                        return { ...s, items: updatedItems };
                    }));
                    alert("Master Plan actualizado (Modo Edición/IDs).");
                }

            } catch (error) {
                console.error("Error importando Excel:", error);
                alert("Error al procesar el archivo Excel.");
            }
        };
        reader.readAsBinaryString(file);
        // Reset input
        e.target.value = null;
    };

    const reset = () => {
        if (!confirm("¿Restablecer MASTER PLAN a valores iniciales?")) return;
        localStorage.removeItem(STORAGE_KEY);
        setSections(initialSections);
    };



    const toggleSection = (sectionId) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s));
    };

    const updateSectionDesc = (sectionId, newDesc) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, summaryDesc: newDesc } : s));
    };

    return (
        <div className="min-h-screen bg-black text-white px-8 md:px-16 lg:px-32 py-12 pb-32 bg-[url('https://horizons-cdn.hostinger.com/0f98fff3-e5cd-4ceb-b0fd-55d6f1d7dd5c/dcea69d21f8fa04833cff852034084fb.png')] bg-cover bg-fixed bg-center relative">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-[2px] z-0" />

            <div className="relative z-10 w-full max-w-[1920px] mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div>
                        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors mr-4 group" title="Regresar al inicio">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(255,214,10,0.5)]" />
                    <div>
                        <div className="font-extrabold text-2xl tracking-tight text-white uppercase flex items-center gap-4">
                            SOLIFOOD <span className="text-primary">MASTER PLAN</span>
                            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black border border-white/10 shadow-[0_0_20px_rgba(0,0,0,1)]">
                                <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />
                                <span className="text-[10px] font-mono font-bold text-gray-300 tracking-[0.2em]">Ver 2.21</span>
                            </div>
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                            Proyecto desde grano + 2 líneas de tabletas + polvo bebida + empaque.
                        </div>
                    </div>

                    <div className="ml-auto flex gap-3 items-center">
                        <button
                            onClick={toggleAdmin}
                            className={`px-4 py-2 rounded-full border transition-colors text-sm font-bold flex items-center gap-2 ${isAdmin ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title={isAdmin ? "Cerrar modo editor" : "Activar modo editor para modificar montos"}
                        >
                            {isAdmin ? "EDITOR (ACTIVO)" : "EDITOR"}
                        </button>

                        {/* Parámetros Iniciales en Header */}
                        <Dialog open={isParamsModalOpen} onOpenChange={setIsParamsModalOpen}>
                            <DialogTrigger asChild>
                                <button
                                    className="px-4 py-2 rounded-full bg-white/5 border border-primary/30 text-primary font-bold hover:bg-primary/10 transition-all flex items-center gap-2 group text-sm"
                                >
                                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                                    PARÁMETROS INICIALES
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-950/90 backdrop-blur-2xl border border-white/20 text-white p-0 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                                <div className="overflow-y-auto max-h-[90vh] p-8 custom-scrollbar">
                                    <DialogHeader className="mb-8 relative z-10">
                                        <DialogTitle className="text-3xl font-black text-primary tracking-tighter uppercase flex items-center gap-3">
                                            <Settings size={28} />
                                            Configuración del Sistema
                                        </DialogTitle>
                                        <p className="text-gray-500 font-medium tracking-wide">Ajusta los parámetros globales de producción y finanzas.</p>
                                    </DialogHeader>

                                    <div className="space-y-10 relative z-10">
                                        {/* Producción */}
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-8 h-[1px] bg-gray-800"></div>
                                                Parámetros de Producción
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <Field label="Horas/día" value={horasDia} onChange={setHorasDia} />
                                                <div className="col-span-1" />
                                                <div className="col-span-1" />
                                                <div className="col-span-1" />

                                                <Field label="Kg/día lisas" value={kgLisas} onChange={setKgLisas} />
                                                <Field label="g por tableta lisa" value={gLisas} onChange={setGLisas} />
                                                <Field label="Kg/día hex" value={kgHex} onChange={setKgHex} />
                                                <Field label="g por tableta hex" value={gHex} onChange={setGHex} />
                                                <Field label="Kg/día polvo" value={kgPolvo} onChange={setKgPolvo} />
                                                <Field label="g por bolsa polvo" value={gBolsaPolvo} onChange={setGBolsaPolvo} />
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
                                                <KPI label="Lisas (pzas/día)" value={fmt0(piezasLisasDia)} />
                                                <KPI label="Lisas (pzas/h)" value={fmt0(piezasLisasHora)} />
                                                <KPI label="Hex (pzas/día)" value={fmt0(piezasHexDia)} />
                                                <KPI label="Hex (pzas/h)" value={fmt0(piezasHexHora)} />
                                                <KPI label="Polvo (bolsas/día)" value={fmt0(bolsasPolvoDia)} />
                                                <KPI label="Polvo (bolsas/h)" value={fmt1(bolsasPolvoHora)} />
                                            </div>
                                        </div>

                                        {/* Finanzas */}
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="w-8 h-[1px] bg-gray-800"></div>
                                                Parámetros Financieros
                                            </h4>
                                            <div className="flex gap-6 flex-wrap items-end bg-white/5 p-6 rounded-2xl border border-white/5">
                                                <FieldDark label="Tipo de cambio (MXN/USD)" value={tipoCambio} onChange={setTipoCambio} />
                                                <FieldDark label="IVA (%)" value={ivaPct} onChange={setIvaPct} />

                                                <div className="flex gap-2 items-end">
                                                    <FieldDark label="Utilidad Global (%)" value={globalUtilidad} onChange={setGlobalUtilidad} compact />
                                                    <button
                                                        onClick={() => {
                                                            applyGlobalUtility();
                                                            toast({ title: "Utilidad aplicada", description: "Se ha actualizado la utilidad en todos los ítems activos." });
                                                        }}
                                                        className="mb-[2px] px-6 py-2.5 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all text-sm border border-white/10"
                                                    >
                                                        Actualizar todo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={() => {
                                                setIsParamsModalOpen(false);
                                                toast({
                                                    title: "Cambios guardados",
                                                    description: "Los parámetros de producción y finanzas se han actualizado correctamente.",
                                                    variant: "default",
                                                });
                                            }}
                                            className="px-10 py-4 bg-primary text-black font-black rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,214,10,0.3)] uppercase tracking-widest text-sm flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                            GUARDAR CAMBIOS
                                        </button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {isAdmin && (
                            <>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleImportExcel}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors text-sm"
                                >
                                    Importar Excel
                                </button>
                                <button
                                    onClick={exportTemplate}
                                    className="px-4 py-2 rounded-full border border-gray-500/30 bg-gray-800/50 text-gray-300 font-bold hover:bg-gray-700/50 transition-colors text-sm"
                                    title="Descargar formato para llenar precios"
                                >
                                    Descargar Formato
                                </button>
                                <button
                                    onClick={exportExcel}
                                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors text-sm"
                                >
                                    Exportar Todo
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-full bg-primary text-black font-extrabold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-900/20 text-sm"
                        >
                            Exportar a PDF
                        </button>

                        {isAdmin && (
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 rounded-full border border-red-900/30 bg-red-950/20 text-red-500 font-bold hover:bg-red-900/30 transition-colors text-sm"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setColsLocked(!colsLocked)}
                                    className={`px-4 py-2 rounded-full border transition-colors text-sm font-bold flex items-center gap-2 ${colsLocked ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}
                                    title={colsLocked ? "Desbloquear redimensionado" : "Bloquear redimensionado de celdas"}
                                >
                                    {colsLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                    {colsLocked ? "CELDAS BLOQUEADAS" : "BLOQUEAR CELDAS"}
                                </button>
                                <button
                                    onClick={resetView}
                                    className="px-4 py-2 rounded-full border border-blue-900/30 bg-blue-950/20 text-blue-400 font-bold hover:bg-blue-900/30 transition-colors text-sm"
                                    title="Restablecer ancho de columnas"
                                >
                                    Restablecer Vista
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Cerrar Master Plan"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>


                {/* Secciones */}
                <div className="space-y-8">
                    {sections.map((s) => {
                        const totals = sectionTotals.find((x) => x.sectionId === s.id);

                        return (
                            <div key={s.id} className="animate-in fade-in duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => toggleSection(s.id)}
                                        className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {s.collapsed ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        )}
                                    </button>

                                    <div className="text-xl font-extrabold text-white tracking-tight">
                                        <span className="text-primary mr-2 opacity-80">{s.titulo.split('.')[0]}.</span>
                                        {s.titulo.split('.').slice(1).join('.')}
                                    </div>
                                    <div className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                        {s.tag}
                                    </div>

                                    {!s.collapsed && (
                                        <button
                                            onClick={() => addItem(s.id)}
                                            className="ml-auto px-4 py-2 rounded-full border border-dashed border-white/20 bg-transparent text-gray-400 font-bold hover:bg-white/5 hover:text-white hover:border-white/40 transition-all text-sm flex items-center gap-2"
                                        >
                                            <span className="text-lg leading-none">+</span> Agregar equipo
                                        </button>
                                    )}
                                </div>

                                {s.collapsed ? (
                                    <div className="border border-white/10 rounded-xl bg-zinc-900/50 backdrop-blur-sm p-6 flex items-start gap-8 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción del Sistema</div>
                                            {isAdmin ? (
                                                <textarea
                                                    value={s.summaryDesc || ""}
                                                    onChange={(e) => updateSectionDesc(s.id, e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-gray-300 focus:text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm resize-none"
                                                    placeholder="Escribe una breve descripción de esta sección..."
                                                    rows={3}
                                                />
                                            ) : ( /* Read-only view */
                                                <div className="text-gray-400 text-sm leading-relaxed">
                                                    {s.summaryDesc || "Sin descripción."}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-64 text-right">
                                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Sistema</div>
                                            <div className="text-3xl font-black text-primary tracking-tight">
                                                {fmt(totals?.totalVenta || 0)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">USD</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/30 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-full table-fixed">
                                                <thead>
                                                    <tr className="sticky top-0 z-30 bg-primary/95 backdrop-blur-md text-black font-extrabold uppercase text-[10px] tracking-wider border-b border-primary/20 shadow-[inset_0_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.1)]">
                                                        <th style={{ width: colWidths.ok }} className="p-4 text-center text-black/80 relative group/th">
                                                            OK
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('ok', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        <th style={{ width: colWidths.equipo }} className="p-4 text-black text-center relative group/th">
                                                            Equipo
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('equipo', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        <th style={{ width: colWidths.descripcion }} className="p-4 text-black text-center relative group/th">
                                                            Descripción
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('descripcion', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        <th style={{ width: colWidths.multimedia }} className="p-4 text-black text-center relative group/th">
                                                            Foto/Video
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('multimedia', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        {isAdmin && (
                                                            <th style={{ width: colWidths.utilidad }} className="p-4 text-black text-center relative group/th">
                                                                % Utilidad
                                                                {!colsLocked && <div onMouseDown={(e) => startResize('utilidad', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                            </th>
                                                        )}
                                                        <th style={{ width: colWidths.qty }} className="p-4 text-black text-center relative group/th">
                                                            QTY
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('qty', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        {isAdmin && (
                                                            <th style={{ width: colWidths.costo }} className="p-4 text-black text-center relative group/th">
                                                                Costo (USD)
                                                                {!colsLocked && <div onMouseDown={(e) => startResize('costo', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                            </th>
                                                        )}
                                                        <th style={{ width: colWidths.precioUnit }} className="p-4 text-black text-center relative group/th">
                                                            Precio Unit. (USD)
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('precioUnit', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        {isAdmin && (
                                                            <th style={{ width: colWidths.totalCosto }} className="p-4 text-right text-black relative group/th">
                                                                Total Costo
                                                                {!colsLocked && <div onMouseDown={(e) => startResize('totalCosto', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                            </th>
                                                        )}
                                                        <th style={{ width: colWidths.totalVenta }} className="p-4 text-right text-black relative group/th">
                                                            Total Venta
                                                            {!colsLocked && <div onMouseDown={(e) => startResize('totalVenta', e)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/20 z-10" />}
                                                        </th>
                                                        <th className="p-4 w-12 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {s.items.map((it) => {
                                                        const r = calcItem(it);
                                                        return (
                                                            <tr key={it.id} className="group hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-4 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={it.activo}
                                                                        onChange={(e) => updateItem(s.id, it.id, { activo: e.target.checked })}
                                                                        className="w-4 h-4 rounded border-gray-600 bg-transparent text-primary focus:ring-offset-black accent-primary"
                                                                    />
                                                                </td>

                                                                <td className="p-4 align-top">
                                                                    <div className="text-[10px] text-primary/70 font-black mb-1.5 px-px">{it.codigo}</div>
                                                                    <textarea
                                                                        value={it.equipo}
                                                                        onChange={(e) => updateItem(s.id, it.id, { equipo: e.target.value })}
                                                                        readOnly={!isAdmin}
                                                                        className={`w-full bg-transparent border-none p-2 -ml-2 text-white font-bold text-sm focus:ring-0 placeholder-gray-700 resize-none field-sizing-content leading-tight rounded-lg transition-all duration-200 overflow-hidden ${!it.activo ? 'line-through opacity-40' : ''} ${isAdmin ? 'hover:bg-white/5 focus:bg-white/5' : 'cursor-default'}`}
                                                                        placeholder="Nombre del equipo"
                                                                        rows={2}
                                                                        style={{ minHeight: "2.8rem" }}
                                                                    />
                                                                </td>

                                                                <td className="p-4 align-top">
                                                                    <textarea
                                                                        value={it.descripcion}
                                                                        onChange={(e) => updateItem(s.id, it.id, { descripcion: e.target.value })}
                                                                        readOnly={!isAdmin}
                                                                        className={`w-full bg-transparent border-none p-2 -ml-2 text-gray-400 text-sm focus:ring-0 placeholder-gray-800 resize-none field-sizing-content leading-relaxed rounded-lg transition-all duration-200 overflow-hidden ${!it.activo ? 'line-through opacity-40' : ''} ${isAdmin ? 'hover:bg-white/5 focus:bg-white/5' : 'cursor-default'}`}
                                                                        placeholder="Descripción..."
                                                                        rows={4}
                                                                        style={{ minHeight: "6rem" }}
                                                                    />
                                                                </td>

                                                                <td className="p-4 text-center align-top">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        {it.media_url ? (
                                                                            <div className="relative group/media w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-lg cursor-pointer transition-transform hover:scale-105">
                                                                                {it.media_type === 'video' ? (
                                                                                    <div
                                                                                        className="w-full h-full flex flex-col items-center justify-center p-2"
                                                                                        onClick={() => setSelectedMedia({ url: it.media_url, type: 'video' })}
                                                                                    >
                                                                                        <Video size={24} className="text-primary mb-1" />
                                                                                        <span className="text-[10px] text-primary/70 font-bold uppercase truncate w-full px-1">Video</span>
                                                                                        <video src={it.media_url} className="hidden" />
                                                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-opacity">
                                                                                            <Play size={24} className="text-white fill-white" />
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <img
                                                                                        src={it.media_url}
                                                                                        alt="Preview"
                                                                                        className="w-full h-full object-cover"
                                                                                        onClick={() => setSelectedMedia({ url: it.media_url, type: 'image' })}
                                                                                    />
                                                                                )}

                                                                                {isAdmin && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            updateItem(s.id, it.id, { media_url: null, media_type: null });
                                                                                        }}
                                                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 opacity-0 group-hover/media:opacity-100 transition-opacity"
                                                                                    >
                                                                                        <X size={12} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            isAdmin && (
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*,video/*"
                                                                                        name={`media-${it.id}`}
                                                                                        id={`media-${it.id}`}
                                                                                        className="hidden"
                                                                                        onChange={(e) => handleMediaUpload(s.id, it.id, e.target.files[0])}
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`media-${it.id}`}
                                                                                        className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group/upload"
                                                                                    >
                                                                                        {uploadingId === it.id ? (
                                                                                            <Loader2 size={24} className="text-primary animate-spin" />
                                                                                        ) : (
                                                                                            <>
                                                                                                <Upload size={20} className="text-gray-600 group-hover/upload:text-primary mb-1 transition-colors" />
                                                                                                <span className="text-[10px] text-gray-500 group-hover/upload:text-primary/70 font-bold uppercase">Subir</span>
                                                                                            </>
                                                                                        )}
                                                                                    </label>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {isAdmin && (
                                                                    <td className="p-4">
                                                                        <input
                                                                            type="number"
                                                                            value={it.utilidad !== undefined ? it.utilidad : 10}
                                                                            onChange={(e) => updateItem(s.id, it.id, { utilidad: n(e.target.value) })}
                                                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-primary font-bold focus:border-primary/50 focus:outline-none hover:border-primary hover:text-primary transition-colors text-center"
                                                                        />
                                                                    </td>
                                                                )}

                                                                <td className="p-4">
                                                                    <input
                                                                        type="number"
                                                                        value={it.qty}
                                                                        min={0}
                                                                        step={1}
                                                                        readOnly={!isAdmin}
                                                                        onChange={(e) => updateItem(s.id, it.id, { qty: n(e.target.value) })}
                                                                        className={`w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-right font-mono focus:border-primary/50 focus:outline-none transition-colors ${isAdmin ? 'hover:border-primary hover:text-primary' : 'cursor-default pointer-events-none'}`}
                                                                    />
                                                                </td>

                                                                {isAdmin && (
                                                                    <td className="p-4">
                                                                        <input
                                                                            type="number"
                                                                            value={it.costoUSD}
                                                                            min={0}
                                                                            step={100}
                                                                            onChange={(e) => updateItem(s.id, it.id, { costoUSD: n(e.target.value) })}
                                                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300 text-right font-mono text-sm focus:border-primary/50 focus:outline-none hover:border-primary hover:text-primary transition-colors"
                                                                        />
                                                                    </td>
                                                                )}

                                                                <td className="p-4">
                                                                    <input
                                                                        type="text"
                                                                        value={money(r.ventaUnitFinal)}
                                                                        disabled
                                                                        className={`w-full bg-transparent border-none px-2 py-1 text-primary text-right font-mono text-sm font-bold cursor-default ${!it.activo ? 'line-through opacity-40' : ''}`}
                                                                    />
                                                                </td>

                                                                {isAdmin && (
                                                                    <td className="p-4 text-right font-mono text-gray-400 text-sm">
                                                                        {money(r.totalCosto)}
                                                                    </td>
                                                                )}
                                                                <td className={`p-4 text-right font-mono text-primary font-bold text-sm ${!it.activo ? 'line-through opacity-40' : ''}`}>
                                                                    {money(r.totalVenta)}
                                                                </td>

                                                                <td className="p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => removeItem(s.id, it.id)}
                                                                        className="text-gray-600 hover:text-red-500 transition-colors bg-white/5 p-1 rounded hover:bg-white/10"
                                                                        title="Eliminar"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Subtotales */}
                                                    <tr className="bg-white/[0.03] font-bold border-t border-white/10">
                                                        <td colSpan={7} className="p-4 text-right text-xs uppercase tracking-wider text-gray-500">
                                                            Subtotal sección
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-gray-300">{money(totals.totalCosto)}</td>
                                                        <td className="p-4 text-right font-mono text-primary text-lg">{money(totals.totalVenta)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Resumen final */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 mb-12">
                    {/* Costos */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Costo Estimado (USD)</div>
                        <div className="text-4xl font-extrabold text-white tracking-tighter mb-6">{money(grandTotals.totalCosto)}</div>

                        <div className="space-y-3 pt-6 border-t border-white/10 text-sm">
                            <Row label="Tipo de cambio" value={`${n(tipoCambio).toFixed(4)} MXN/USD`} />
                            <Row label="Subtotal MXN (sin IVA)" value={fmtMXN(grandTotals.mxnSinIvaCosto)} />
                            <Row label={`IVA ${n(ivaPct).toFixed(0)}% (MXN)`} value={fmtMXN(grandTotals.ivaCosto)} />
                            <Row label="Total MXN (con IVA)" value={fmtMXN(grandTotals.mxnConIvaCosto)} strong color="text-gray-300" />
                        </div>
                    </div>

                    {/* Venta */}
                    <div className="p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Total Precio de Venta (USD)</div>
                        <div className="text-5xl font-extrabold text-primary tracking-tighter mb-6 shadow-glow">{money(grandTotals.totalVenta)}</div>

                        <div className="space-y-3 pt-6 border-t border-white/10 text-sm relative z-10">
                            <Row label="Tipo de cambio" value={`${n(tipoCambio).toFixed(4)} MXN/USD`} />
                            <Row label="Subtotal MXN (sin IVA)" value={fmtMXN(grandTotals.mxnSinIvaVenta)} />
                            <Row label={`IVA ${n(ivaPct).toFixed(0)}% (MXN)`} value={fmtMXN(grandTotals.ivaVenta)} />
                            <Row label="Total MXN (con IVA)" value={fmtMXN(grandTotals.mxnConIvaVenta)} strong color="text-primary" />
                        </div>
                    </div>
                </div>

                <div className="text-center text-gray-600 text-xs py-10 border-t border-white/5 mt-10">
                    <p>Nota: Los rubros “Pendiente” están en $0 hasta que se actualice la cotización. Los totales reflejan solo los equipos activos.</p>
                </div>

                <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .min-h-screen { min-height: 0 !important; height: auto !important; background: white !important; }
          .bg-black { background: white !important; }
          .text-white { color: black !important; }
          .text-gray-400 { color: #444 !important; }
          .border-white\\/10 { border-color: #ddd !important; }
          .bg-white\\/5 { background: #f9f9f9 !important; border-color: #eee !important; }
          
          /* Hide buttons */
          button { display: none !important; }
          
          /* Simplify inputs for print */
          input { 
            background: transparent !important; 
            border: none !important; 
            color: black !important;
            padding: 0 !important;
          }
          
          /* Colors */
          .text-primary { color: black !important; font-weight: bold !important; }
          .bg-primary { background: #eee !important; color: black !important; }
          
          /* Structural */
          .glass-panel { border: 1px solid #ccc !important; box-shadow: none !important; background: white !important; }
          
          th { color: black !important; border-bottom: 2px solid #000 !important; }
        }
      `}</style>
            </div>

            {/* Modal de Zoom Multimedia */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-10"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        onClick={() => setSelectedMedia(null)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[110] border border-white/10 hover:rotate-90"
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative max-w-5xl w-full max-h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedMedia.type === 'video' ? (
                            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ) : (
                            <img
                                src={selectedMedia.url}
                                alt="Zoom"
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                            />
                        )}

                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            Vista previa del equipo
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange }) {
    return (
        <div className="min-w-[140px]">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-primary/60 focus:ring-1 focus:ring-primary/60 hover:border-primary hover:shadow-[0_0_15px_rgba(255,214,10,0.15)] outline-none transition-all placeholder-gray-700"
            />
        </div>
    );
}

function FieldDark({ label, value, onChange, compact }) {
    return (
        <div className={compact ? "w-24" : "min-w-[180px]"}>
            <div className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-2">{label}</div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-primary focus:ring-1 focus:ring-primary hover:border-primary hover:shadow-[0_0_15px_rgba(255,214,10,0.15)] outline-none transition-all"
            />
        </div>
    );
}

function KPI({ label, value }) {
    return (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xl font-bold text-white tracking-tight">{value}</div>
        </div>
    );
}

function Row({ label, value, strong, color }) {
    return (
        <div className={`flex justify-between items-center gap-4 ${strong ? 'font-extrabold text-base' : 'font-medium'}`}>
            <span className={strong ? "text-gray-300" : "text-gray-500"}>{label}</span>
            <span className={color || (strong ? "text-white" : "text-gray-300")}>{value}</span>
        </div>
    );
}

function fmt0(v) {
    return Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmt1(v) {
    return Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
}
function fmtMXN(v) {
    return v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
