import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const CloneModal = ({ isOpen, onClose, themes, setThemes, activeTheme, onCloneSuccess }) => {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [sourceThemeData, setSourceThemeData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (activeTheme && themes[activeTheme]) {
        // Clone from the currently active theme
        setSourceThemeData(themes[activeTheme]);
      } else {
        // Fallback to template if no active theme (shouldn't happen in normal flow)
        const template = Object.values(themes).find(theme => theme.is_template);
        setSourceThemeData(template || Object.values(themes)[0]);
      }
    }
  }, [isOpen, themes, activeTheme]);

  const handleClone = async () => {
    if (!clientName || !projectName) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, introduce el nombre del cliente y del proyecto.",
        variant: "destructive",
      });
      return;
    }

    if (!sourceThemeData) {
      toast({
        title: "Error de Clonación",
        description: "No hay una cotización base desde la cual clonar.",
        variant: "destructive",
      });
      return;
    }

    setIsCloning(true);
    try {
      const sourceThemeKey = sourceThemeData.theme_key;
      const newThemeKey = `${sourceThemeKey.split('_')[0]}_${slugify(clientName)}_${slugify(projectName)}`.slice(0, 50);
      const newSlug = slugify(projectName);

      const { data: existing, error: checkError } = await supabase
        .from('quotations')
        .select('theme_key, slug')
        .or(`theme_key.eq.${newThemeKey},slug.eq.${newSlug}`);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const isThemeKeyDuplicate = existing.some(e => e.theme_key === newThemeKey);
        const isSlugDuplicate = existing.some(e => e.slug === newSlug);
        let errorMessage = "Ya existe una cotización con datos similares.";
        if (isThemeKeyDuplicate && isSlugDuplicate) {
          errorMessage = "Ya existen una cotización con la misma clave y slug. Por favor, elige un nombre de cliente o proyecto diferente.";
        } else if (isThemeKeyDuplicate) {
          errorMessage = "Ya existe una cotización con una clave similar. Por favor, elige un nombre de cliente o proyecto diferente.";
        } else if (isSlugDuplicate) {
          errorMessage = "Ya existe una cotización con un slug similar (URL pública). Por favor, elige un nombre de proyecto diferente.";
        }

        toast({
          title: "Error: Cotización ya existe",
          description: errorMessage,
          variant: "destructive",
        });
        setIsCloning(false);
        return;
      }

      const newQuotationData = {
        ...sourceThemeData,
        client: clientName,
        project: projectName,
        title: projectName, // Sync title with Project Name
        subtitle: clientName, // Sync subtitle with Client Name
        theme_key: newThemeKey,
        slug: newSlug,
        is_template: false,
        is_home: false,
      };

      delete newQuotationData.id;
      delete newQuotationData.bannerScale;
      newQuotationData.created_at = new Date().toISOString();
      newQuotationData.updated_at = new Date().toISOString();

      const { data: newRecord, error } = await supabase
        .from('quotations')
        .insert(newQuotationData)
        .select()
        .single();

      if (error) throw error;

      const newQuotationId = newRecord.id;

      // --- DEEP CLONE: MASTER PLAN (Separate Record) ---
      try {
        const { data: sourceMp } = await supabase
          .from('quotations')
          .select('*')
          .eq('slug', `mp-${sourceThemeKey}`)
          .single();

        if (sourceMp) {
          const newMpData = {
            ...sourceMp,
            theme_key: `mp_${Math.random().toString(36).substring(2, 9)}_${newThemeKey}`.slice(0, 50),
            slug: `mp-${newThemeKey}`,
            is_home: false,
            is_template: false,
            client: clientName,
            project: projectName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          delete newMpData.id;
          await supabase.from('quotations').insert(newMpData);
          console.log("[CloneModal] Master Plan cloned successfully");
        }
      } catch (mpError) {
        console.warn("[CloneModal] Master Plan clone skipped or failed:", mpError);
      }

      // --- DEEP CLONE: RELATED TABLES ---
      const relatedTables = [
        { name: 'machines', matchKey: 'theme_key', matchVal: sourceThemeKey },
        { name: 'images', matchKey: 'theme_key', matchVal: sourceThemeKey },
        { name: 'pdf_quotations', matchKey: 'theme_key', matchVal: sourceThemeKey },
        { name: 'process_conditions', matchKey: 'quotation_id', matchVal: sourceThemeData.id }
      ];

      for (const table of relatedTables) {
        try {
          const { data: sourceItems } = await supabase
            .from(table.name)
            .select('*')
            .eq(table.matchKey, table.matchVal);

          if (sourceItems && sourceItems.length > 0) {
            const newItems = sourceItems.map(item => {
              const newItem = { ...item };
              delete newItem.id;
              newItem.created_at = new Date().toISOString();
              // Update links
              if (newItem.hasOwnProperty('theme_key')) newItem.theme_key = newThemeKey;
              if (newItem.hasOwnProperty('quotation_id')) newItem.quotation_id = newQuotationId;
              return newItem;
            });
            await supabase.from(table.name).insert(newItems);
            console.log(`[CloneModal] Cloned ${newItems.length} items from ${table.name}`);
          }
        } catch (tableError) {
          console.warn(`[CloneModal] Error cloning table ${table.name}:`, tableError);
        }
      }

      setThemes(prev => ({ ...prev, [newThemeKey]: newRecord }));
      if (onCloneSuccess) onCloneSuccess(newThemeKey);

      toast({
        title: "¡Clonación exitosa! 🎉",
        description: `Se ha creado la cotización para ${clientName}.`,
      });
      onClose();
    } catch (error) {
      console.error('Error cloning quotation:', error);
      toast({
        title: "¡Error al clonar! 😭",
        description: `No se pudo clonar la cotización: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCloning(false);
      setClientName('');
      setProjectName('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-[#0a0a0a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 pb-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4 border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                  <Copy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-primary">Clonar desde Plantilla Base</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Crea una nueva cotización basada en la plantilla actual.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-primary font-semibold">Nombre del Cliente</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Nuevo Cliente S.A. de C.V."
                  className="bg-gray-900 border-gray-700 text-white focus:border-primary focus:ring-primary placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-primary font-semibold">Nombre del Proyecto/Máquina</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Línea de Empaque 5000"
                  className="bg-gray-900 border-gray-700 text-white focus:border-primary focus:ring-primary placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-800 bg-[#0f0f0f]">
              <Button variant="outline" onClick={onClose} disabled={isCloning} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Cancelar</Button>
              <Button onClick={handleClone} disabled={isCloning || !sourceThemeData} className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
                {isCloning ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {isCloning ? 'Clonando...' : 'Clonar'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CloneModal;