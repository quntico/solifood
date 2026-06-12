import io

with open('src/pages/MasterPlan.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State variable
state_var = """    const [exportConfig, setExportConfig] = useState({
        isOpen: false,
        type: null,
        module: null,
        fileName: '',
        currency: 'USD',
        tc: 17.50
    });

    const triggerExport = (type, module = null) => {
        let defaultFileName = projectName;
        if (type === 'pdf_nophotos') defaultFileName = `DETALLE_MODULOS_${projectName}`;
        if (type === 'excel_active') defaultFileName = `LISTADO_EQUIPOS_${projectName}`;
        if (type === 'excel_master') defaultFileName = `MASTER_PLAN_${projectName}`;
        if (module) defaultFileName = `MODULO_${module.titulo.substring(0, 30)}`;
        
        setExportConfig({
            isOpen: true,
            type,
            module,
            fileName: defaultFileName.replace(/\\s+/g, '_').toUpperCase(),
            currency: 'USD',
            tc: 17.50
        });
    };

    const confirmExport = () => {
        const conf = exportConfig;
        setExportConfig({ ...exportConfig, isOpen: false });
        setTimeout(() => {
            if (conf.type === 'pdf') handleExportPDF(conf);
            if (conf.type === 'pdf_nophotos') handleExportPDFNoPhotos(conf);
            if (conf.type === 'pdf_module') handleExportSingleModulePDF(conf.module, conf);
            if (conf.type === 'excel_module') handleExportSectionExcel(conf.module, conf);
            if (conf.type === 'excel_active') handleExportActiveExcel(conf);
            if (conf.type === 'excel_master') handleMasterExportExcel(conf);
        }, 100);
    };

"""

content = content.replace("const [isFooterHovered, setIsFooterHovered] = useState(false);", "const [isFooterHovered, setIsFooterHovered] = useState(false);\n" + state_var)

# 2. Add Export Modal JSX just before the main Return </div>
# The main return is at the bottom, before export default. Let's find "return ("
# We'll just insert it right after the Hero Video Overlay AnimatePresence closes.

modal_jsx = """
            {/* EXPORT DIALOG MODAL */}
            <AnimatePresence>
                {exportConfig.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -20 }}
                            className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black text-primary tracking-tight">EXPORTAR DATOS</h3>
                                <button onClick={() => setExportConfig({ ...exportConfig, isOpen: false })} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Archivo</label>
                                    <input 
                                        type="text" 
                                        value={exportConfig.fileName}
                                        onChange={(e) => setExportConfig({ ...exportConfig, fileName: e.target.value.toUpperCase() })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Moneda</label>
                                        <select
                                            value={exportConfig.currency}
                                            onChange={(e) => setExportConfig({ ...exportConfig, currency: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all appearance-none"
                                        >
                                            <option value="USD" className="bg-black text-white">DÓLARES (USD)</option>
                                            <option value="MXN" className="bg-black text-white">PESOS (MXN)</option>
                                        </select>
                                    </div>
                                    <div className={`space-y-2 transition-all ${exportConfig.currency === 'USD' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">T.C. (Pesos)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={exportConfig.tc}
                                            onChange={(e) => setExportConfig({ ...exportConfig, tc: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-primary/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 flex gap-3">
                                <button 
                                    onClick={() => setExportConfig({ ...exportConfig, isOpen: false })}
                                    className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmExport}
                                    className="flex-1 py-3 px-4 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
"""

content = content.replace("{/* Hero Video Overlay", modal_jsx + "\n            {/* Hero Video Overlay")

# 3. Modify handleExportPDF
def replace_export(func_name, content, is_pdf=True, is_module=False):
    if is_module:
        old_def = f"const {func_name} = (s) => {{"
        new_def = f"const {func_name} = (s, config) => {{\n        const isMXN = config.currency === 'MXN';\n        const tc = isMXN ? config.tc : 1;\n        const exportMoney = (val) => new Intl.NumberFormat('en-US', {{ style: 'currency', currency: config.currency }}).format(val * tc);"
    else:
        old_def = f"const {func_name} = () => {{"
        new_def = f"const {func_name} = (config) => {{\n        const isMXN = config.currency === 'MXN';\n        const tc = isMXN ? config.tc : 1;\n        const exportMoney = (val) => new Intl.NumberFormat('en-US', {{ style: 'currency', currency: config.currency }}).format(val * tc);"
    
    # We find the bounds of the function.
    start_idx = content.find(old_def)
    if start_idx == -1: return content
    
    end_idx = content.find("};\n", start_idx) + 2
    func_body = content[start_idx:end_idx]
    
    # Replace the def
    func_body = func_body.replace(old_def, new_def)
    
    if is_pdf:
        # replace money(
        func_body = func_body.replace("money(", "exportMoney(")
        # replace texts
        func_body = func_body.replace('"TOTAL DEL PROYECTO"', '`TOTAL DEL PROYECTO (${config.currency})`')
        func_body = func_body.replace('`TOTAL DEL MÓDULO`', '`TOTAL DEL MÓDULO (${config.currency})`')
        func_body = func_body.replace('"RESUMEN DE INVERSIÓN TOTAL"', '`RESUMEN DE INVERSIÓN TOTAL (${config.currency})`')
        # replace save filename
        func_body = func_body.replace("doc.save(`SOLIFOOD_MP_${projectName.replace(/\\s+/g, '_')}.pdf`);", "doc.save(`${config.fileName}.pdf`);")
        func_body = func_body.replace("doc.save(`SOLIFOOD_DETALLE_MODULOS_${projectName.replace(/\\s+/g, '_')}.pdf`);", "doc.save(`${config.fileName}.pdf`);")
        func_body = func_body.replace("doc.save(`SOLIFOOD_MODULO_${s.titulo.substring(0, 30).replace(/\\s+/g, '_')}.pdf`);", "doc.save(`${config.fileName}.pdf`);")
    else:
        if func_name == "handleExportSectionExcel":
            func_body = func_body.replace('"COSTO (USD)": Number(Number(it.costoUSD || 0).toFixed(2))', '[`COSTO (${config.currency})`]: Number((Number(it.costoUSD || 0) * tc).toFixed(2))')
            func_body = func_body.replace('"PRECIO (USD)": precio', '[`PRECIO (${config.currency})`]: Number((precio * tc).toFixed(2))')
            func_body = func_body.replace('XLSX.writeFile(wb, `${section.titulo.substring(0, 30)}.xlsx`);', 'XLSX.writeFile(wb, `${config.fileName}.xlsx`);')
        elif func_name == "handleMasterExportExcel":
            func_body = func_body.replace('"COSTO (USD)": Number(Number(it.costoUSD || 0).toFixed(2))', '[`COSTO (${config.currency})`]: Number((Number(it.costoUSD || 0) * tc).toFixed(2))')
            func_body = func_body.replace('"PRECIO (USD)": precio', '[`PRECIO (${config.currency})`]: Number((precio * tc).toFixed(2))')
            func_body = func_body.replace("XLSX.writeFile(wb, `MASTER_PLAN_${new Date().toISOString().split('T')[0]}.xlsx`);", "XLSX.writeFile(wb, `${config.fileName}.xlsx`);")
        elif func_name == "handleExportActiveExcel":
            func_body = func_body.replace('"UNITARIO (USD)": Number(Number(r.ventaUnitFinal).toFixed(2))', '[`UNITARIO (${config.currency})`]: Number((Number(r.ventaUnitFinal) * tc).toFixed(2))')
            func_body = func_body.replace('"TOTAL (USD)": Number(Number(r.totalVenta).toFixed(2))', '[`TOTAL (${config.currency})`]: Number((Number(r.totalVenta) * tc).toFixed(2))')
            func_body = func_body.replace("XLSX.writeFile(wb, `LISTADO_EQUIPOS_${new Date().toISOString().split('T')[0]}.xlsx`);", "XLSX.writeFile(wb, `${config.fileName}.xlsx`);")
            
    content = content[:start_idx] + func_body + content[end_idx:]
    return content

content = replace_export("handleExportPDF", content, True, False)
content = replace_export("handleExportPDFNoPhotos", content, True, False)
content = replace_export("handleExportSingleModulePDF", content, True, True)
content = replace_export("handleExportSectionExcel", content, False, True)
content = replace_export("handleMasterExportExcel", content, False, False)
content = replace_export("handleExportActiveExcel", content, False, False)

# 4. Replace button onClick handlers
content = content.replace("onClick={handleExportPDF}", "onClick={() => triggerExport('pdf')}")
content = content.replace("onClick={handleExportPDFNoPhotos}", "onClick={() => triggerExport('pdf_nophotos')}")
content = content.replace("onClick={() => handleExportSingleModulePDF(s)}", "onClick={() => triggerExport('pdf_module', s)}")
content = content.replace("onClick={() => handleExportSectionExcel(s)}", "onClick={() => triggerExport('excel_module', s)}")
content = content.replace("onClick={handleExportActiveExcel}", "onClick={() => triggerExport('excel_active')}")
content = content.replace("onClick={handleMasterExportExcel}", "onClick={() => triggerExport('excel_master')}")

with open('src/pages/MasterPlan.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
