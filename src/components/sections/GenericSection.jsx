import React from 'react';
import { Edit, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PropuestaEconomicaSection from '@/components/sections/PropuestaEconomicaSection';

const GenericSection = ({ sectionData = {}, isEditorMode, onContentChange, ...props }) => {
  const type = sectionData.type?.toLowerCase() || '';
  const id = sectionData.id?.toLowerCase() || '';
  const title = sectionData.title?.toLowerCase() || '';

  const isPropuestaEconomica =
    type === 'propuesta_economica' ||
    type === 'propuesta-economica' ||
    id.includes('propuesta') ||
    title.includes('propuesta económica');

  if (isPropuestaEconomica) {
    return (
      <PropuestaEconomicaSection
        sectionData={sectionData}
        isEditorMode={isEditorMode}
        onContentChange={onContentChange}
        {...props}
      />
    );
  }

  if (sectionData.items && Array.isArray(sectionData.items)) {
    return (
      <section className="w-full bg-black py-20 border-t border-white/5 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{sectionData.label || sectionData.titulo}</h2>
              <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest">{sectionData.tag || 'Módulo de Producción'}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sectionData.items.filter(item => item.activo !== false).map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-white/10 p-6 rounded-[2rem] hover:border-primary/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase">{item.codigo || (idx + 1)}</span>
                  {item.media_url && (
                    <img src={item.media_url} alt={item.equipo} className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                  )}
                </div>
                <h3 className="text-white font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors">{item.equipo}</h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{item.descripcion}</p>
                {item.qty > 1 && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-white/40 font-bold text-[10px] uppercase">
                    <span>Cantidad</span>
                    <span>{item.qty} Unidades</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-black text-center px-4 py-20 border-t border-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-lg"
      >
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-gray-900/80 p-6 rounded-2xl border-2 border-dashed border-gray-800 group-hover:border-gray-700 transition-colors">
            <Edit className="w-12 h-12 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Sección en Construcción</h2>
        <p className="text-gray-500 text-lg leading-relaxed mb-8">
          Este es un espacio reservado para tu nuevo contenido. {isEditorMode ? 'Puedes empezar a editar esta sección.' : 'Contacta al administrador para más detalles.'}
        </p>
      </motion.div>
    </section>
  );
};

export default GenericSection;