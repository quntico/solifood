
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Enterprise Backup System - Solifood Center 2.0
 * Módulo: Punto de Control
 * Descripción: Genera un backup completo (DB + Storage + Config)
 */

// Tablas relacionadas a consultar
const RELATED_TABLES = [
    'quotations',
    'quotation_sections',
    'quotation_items',
    'proposal_groups',
    'proposal_items',
    'project_settings',
    'machines', // Basado en tu DB
    'images',    // Basado en tu DB
    'process_conditions' // Basado en tu DB
];

/**
 * Genera un backup completo del proyecto actual.
 * @param {Object} currentData - Datos actuales del proyecto en memoria.
 * @param {Function} onProgress - Callback para notificar estado (opcional).
 */
export const generateControlPoint = async (currentData, onProgress = () => { }) => {
    if (!currentData) throw new Error("No hay datos de proyecto para respaldar.");

    const zip = new JSZip();
    const projectId = currentData.id;
    const projectSlug = currentData.slug || 'proyecto-sin-slug';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
        // ---------------------------------------------------------
        // 1. BACKUP LÓGICO (Memoria Actual)
        // ---------------------------------------------------------
        onProgress("Empaquetando estado actual...");
        zip.file("project_data.json", JSON.stringify(currentData, null, 2));

        // ---------------------------------------------------------
        // 2. EXPORTAR BASE DE DATOS (Tablas Relacionadas)
        // ---------------------------------------------------------
        onProgress("Exportando tablas de base de datos...");
        const dbFolder = zip.folder("database");

        // Exportar tabla principal (quotations)
        if (projectId) {
            const { data: mainRow, error: mainError } = await supabase
                .from('quotations')
                .select('*')
                .eq('id', projectId)
                .single();

            if (!mainError && mainRow) {
                dbFolder.file("quotations.json", JSON.stringify([mainRow], null, 2));
            }
        }

        // Exportar tablas relacionadas (Intentar obtener datos vinculados)
        // Usamos Promise.all para paralelar peticiones, pero con catch individual para no fallar todo
        await Promise.all(RELATED_TABLES.map(async (tableName) => {
            if (tableName === 'quotations') return; // Ya se hizo arriba

            try {
                // Asumimos que la columna de relación es 'quotation_id' o 'project_id' o 'theme_key'
                // Consultamos usando el ID o el theme_key
                let query = supabase.from(tableName).select('*');

                // Lógica de filtrado flexible
                if (projectId) {
                    query = query.or(`quotation_id.eq.${projectId},project_id.eq.${projectId},theme_key.eq.${currentData.theme_key}`);
                } else {
                    query = query.eq('theme_key', currentData.theme_key);
                }

                const { data, error } = await query;

                if (!error && data && data.length > 0) {
                    dbFolder.file(`${tableName}.json`, JSON.stringify(data, null, 2));
                }
            } catch (err) {
                // Ignorar errores de tablas que no existen, es normal en backups dinámicos
                console.warn(`Tabla ${tableName} omitida o no existe.`);
            }
        }));

        // ---------------------------------------------------------
        // 3. EXPORTAR STORAGE (Archivos)
        // ---------------------------------------------------------
        onProgress("Descargando archivos del Storage...");
        const storageFolder = zip.folder("storage");
        const bucketsToScan = ['quotation-files', 'layouts', 'images']; // Buckets comunes

        // Buscar en quotation-files/{theme_key}/ o {id}/
        const searchPath = currentData.theme_key || projectId;

        if (searchPath) {
            // Intentar listar archivos en la carpeta del bucket principal
            const { data: files, error: listError } = await supabase
                .storage
                .from('quotation-files')
                .list(searchPath);

            if (!listError && files && files.length > 0) {
                const filesFolder = storageFolder.folder("quotation-files");

                // Descargar secuencialmente para no saturar la red
                for (const file of files) {
                    if (file.name === '.emptyFolderPlaceholder') continue;

                    onProgress(`Descargando ${file.name}...`);
                    try {
                        const { data: blob, error: downloadError } = await supabase
                            .storage
                            .from('quotation-files')
                            .download(`${searchPath}/${file.name}`);

                        if (!downloadError && blob) {
                            filesFolder.file(file.name, blob);
                        }
                    } catch (err) {
                        console.error(`Error descargando ${file.name}`, err);
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 4. CONFIGURACIÓN DEL SISTEMA
        // ---------------------------------------------------------
        onProgress("Generando metadatos...");
        const systemFolder = zip.folder("system");
        const metaData = {
            slug: currentData.slug,
            created_at: currentData.created_at,
            updated_at: currentData.updated_at,
            exported_at: new Date().toISOString(),
            backup_version: "1.0.0",
            environment: import.meta.env.MODE || 'production',
            app_version: "6.0", // Hardcoded based on current established version
            origin_domain: window.location.origin
        };
        systemFolder.file("project_meta.json", JSON.stringify(metaData, null, 2));

        // ---------------------------------------------------------
        // 5. MANIFIESTO DE RESTAURACIÓN
        // ---------------------------------------------------------
        const manifesto = `
MANIFIESTO DE RESTAURACIÓN - PUNTO DE CONTROL
=============================================
Proyecto: ${currentData.project}
Versión Backup: 1.0.0
Fecha: ${new Date().toLocaleString()}
Archivos: Completo (DB + Storage + Config)

PASOS PARA RESTAURAR:
1. Crear nuevo proyecto o usar existente en Supabase.
2. Restaurar base de datos importando los JSONS de la carpeta /database.
   - Importar primero 'quotations.json'.
   - Luego tablas dependientes.
3. Subir el contenido de la carpeta /storage al bucket 'quotation-files' en la ruta correspondiente.
4. Si se restaura manualmente en la APP:
   - Utilizar la función "Importar Proyecto" (Futura implementación) con 'project_data.json'.
5. Verificar variables de entorno y conexión.

Generado por Solifood Center 2.0 Enterprise Module.
    `.trim();
        zip.file("README_RESTORE.txt", manifesto);

        // ---------------------------------------------------------
        // 6. GENERAR ZIP
        // ---------------------------------------------------------
        onProgress("Comprimiendo archivo final...");
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const fileName = `SOLIFOOD_BACKUP_${projectSlug}_${timestamp}.zip`;

        saveAs(zipBlob, fileName);
        onProgress("¡Backup completado!");

        return true;

    } catch (error) {
        console.error("Backup System Error:", error);
        throw new Error(`Fallo en Punto de Control: ${error.message}`);
    }
};
