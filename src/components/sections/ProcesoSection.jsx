import React, { useState, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Layers, Edit, Settings, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SectionHeader from '@/components/SectionHeader';
import { iconMap } from '@/lib/iconMap';
import ProcessEditorModal from '@/components/ProcessEditorModal';
import { Button } from '@/components/ui/button';

const defaultContent = {
  steps: [
    {
      id: 'extrusion',
      title: '01 - Extrusión de Alta Precisión',
      icon: 'Layers',
      details: [
        '- Extrusora SJ120/38 con tornillo único',
        '- Capacidad de fusión hasta 600kg/h',
        '- Control de temperatura avanzado',
        '- Homogeneización perfecta del material',
      ],
    },
    {
      id: 'formado',
      title: '02 - Sistema de Formado',
      icon: 'LayoutTemplate',
      details: [
        '- Molde T de acero 5CrNiMo',
        '- Ancho efectivo 1300mm',
        '- Calibración automática',
        '- Enfriamiento controlado por agua',
      ],
    },
    {
      id: 'corte',
      title: '03 - Corte y Acabado',
      icon: 'Scissors',
      details: [
        '- Cortadora de precisión automática',
        '- Dimensiones exactas 900mm x 6mm',
        '- Sistema neumático de ajuste',
        '- Control de velocidad variable',
      ],
    },
    {
      id: 'apilado',
      title: '04 - Apilado Automático',
      icon: 'Package',
      details: [
        '- Sistema de apilado de 3 metros',
        '- Organización automática',
        '- Capacidad 200-300 piezas por hora',
        '- Listo para empaque inmediato',
      ],
    },
  ],
};

const ProcesoSection = ({ sectionData, isEditorMode, onContentChange }) => {
  const { toast } = useToast();

  const content = { ...defaultContent, ...sectionData.content };
  const steps = content.steps || defaultContent.steps;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileModes, setMobileModes] = useState({}); // { [stepId]: 'info' | 'image' }
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"]
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleModalSave = (newSteps) => {
    onContentChange({ steps: newSteps });
    toast({ title: 'Flujo actualizado', description: 'Los cambios se han guardado correctamente.' });
  };

  return (
    <div className="py-16 sm:py-24 bg-black text-white relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          <SectionHeader
            sectionData={sectionData}
            isEditorMode={isEditorMode}
            onContentChange={onContentChange}
          />

          {isEditorMode && (
            <div className="absolute top-0 right-0 z-20">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20"
              >
                <Settings className="w-4 h-4" />
                Editar Flujo
              </Button>
            </div>
          )}
        </div>

        <div ref={timelineRef} className="relative mt-16 max-w-5xl mx-auto">
          {/* Animated Vertical line */}
          <motion.div
            className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-0.5 bg-primary origin-top"
            style={{ scaleY, transformOrigin: 'top', translateX: '-50%' }}
          />

          <div className="space-y-16">
            {steps.map((step, index) => {
              const IconComponent = iconMap[step.icon] || Layers;
              const isEven = index % 2 === 0;

              return (
                <div key={step.id} className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_auto_1fr] items-stretch gap-x-6 sm:gap-x-12">
                  {/* Left Column (Desktop) */}
                  <div className="hidden sm:block">
                    <motion.div
                      initial={{ x: isEven ? -50 : 50, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6 }}
                      className={isEven
                        ? "bg-gray-900/50 p-6 rounded-xl border border-primary/40 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full flex flex-col justify-center"
                        : "h-full flex flex-col justify-center"
                      }
                    >
                      {isEven ? (
                        <TimelineCardContent step={step} index={index} onStepsChange={(newSteps) => onContentChange({ steps: newSteps })} steps={steps} isEditorMode={isEditorMode} />
                      ) : (
                        <StepImage step={step} isEditorMode={isEditorMode} onOpenModal={() => setIsModalOpen(true)} />
                      )}
                    </motion.div>
                  </div>

                  {/* Icon Column */}
                  <div className="flex flex-col items-center justify-start pt-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="z-10 p-3 sm:p-4 bg-gray-900 rounded-full border-2 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.4)] relative group cursor-pointer"
                      onClick={() => isEditorMode && setIsModalOpen(true)}
                    >
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                      {isEditorMode && (
                        <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Edit className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                    {/* Connective line segment for desktop */}
                    {index < steps.length - 1 && (
                      <div className="hidden sm:block w-0.5 h-full bg-primary/20 mt-4" />
                    )}
                  </div>

                  {/* Right Column (Desktop) / Main Column (Mobile) */}
                  <div className="sm:block min-h-[14rem] flex flex-col">
                    <AnimatePresence mode="wait">
                      {/* Mobile Toggle Control */}
                      <div className="sm:hidden flex bg-gray-900/80 p-1 rounded-lg mb-4 border border-primary/20">
                        <button
                          onClick={() => setMobileModes(prev => ({ ...prev, [step.id]: 'info' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${(!mobileModes[step.id] || mobileModes[step.id] === 'info') ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          <FileText size={14} /> FICHA TÉCNICA
                        </button>
                        <button
                          onClick={() => setMobileModes(prev => ({ ...prev, [step.id]: 'image' }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${(mobileModes[step.id] === 'image') ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          <ImageIcon size={14} /> IMAGEN
                        </button>
                      </div>

                      <motion.div
                        key={`${step.id}-${mobileModes[step.id] === 'image' ? 'image' : 'info'}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1"
                      >
                        {/* Contenido Principal en Móvil: O TEXTO O IMAGEN */}
                        <div className="sm:hidden">
                          {(!mobileModes[step.id] || mobileModes[step.id] === 'info') ? (
                            <div className="bg-gray-900/50 p-6 rounded-xl border border-primary/40 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.15)] hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full flex flex-col justify-center">
                              <TimelineCardContent step={step} index={index} onStepsChange={(newSteps) => onContentChange({ steps: newSteps })} steps={steps} isEditorMode={isEditorMode} />
                            </div>
                          ) : (
                            <StepImage step={step} isEditorMode={isEditorMode} onOpenModal={() => setIsModalOpen(true)} />
                          )}
                        </div>

                        {/* Desktop Right Column Content */}
                        <div className="hidden sm:block h-full">
                          <motion.div
                            initial={{ opacity: 0.8 }}
                            whileHover={{ opacity: 1 }}
                            className={!isEven
                              ? "bg-gray-900/50 p-6 rounded-xl border border-primary/40 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.15)] transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full flex flex-col justify-center"
                              : "h-full flex flex-col justify-center"
                            }
                          >
                            {!isEven ? (
                              <TimelineCardContent step={step} index={index} onStepsChange={(newSteps) => onContentChange({ steps: newSteps })} steps={steps} isEditorMode={isEditorMode} />
                            ) : (
                              <StepImage step={step} isEditorMode={isEditorMode} onOpenModal={() => setIsModalOpen(true)} />
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ProcessEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSteps={steps}
        onSave={handleModalSave}
      />
    </div>
  );
};

import EditableField from '@/components/EditableField';

const TimelineCardContent = ({ step, index, onStepsChange, steps, isEditorMode }) => {
  const alignment = step.align || 'left';

  const handleTitleSave = (newTitle) => {
    const newSteps = [...steps];
    newSteps[index] = { ...step, title: newTitle };
    onStepsChange(newSteps);
  };

  const handleDetailSave = (detailIndex, newValue) => {
    const newSteps = [...steps];
    const newDetails = [...step.details];
    newDetails[detailIndex] = newValue;
    newSteps[index] = { ...step, details: newDetails };
    onStepsChange(newSteps);
  };

  return (
    <div className="flex flex-col h-full justify-center">
      <h3
        className="text-base font-bold text-white mb-4 sm:text-lg uppercase tracking-tight"
        style={{ textAlign: alignment === 'justify' ? 'left' : alignment }}
      >
        <EditableField
          value={step.title}
          onSave={handleTitleSave}
          isEditorMode={isEditorMode}
          className="bg-transparent border-none p-0 focus:ring-0"
          inputClassName="bg-black/40"
        />
      </h3>
      <ul
        className="space-y-3 text-gray-400 text-sm flex flex-col"
        style={{ textAlign: alignment }}
      >
        {step.details.map((detail, detailIndex) => (
          <li
            key={detailIndex}
            className={`leading-relaxed ${alignment === 'center' ? 'items-center' : alignment === 'right' ? 'items-end' : 'items-start'}`}
          >
            <EditableField
              value={detail}
              onSave={(val) => handleDetailSave(detailIndex, val)}
              isEditorMode={isEditorMode}
              className="bg-transparent border-none p-0 focus:ring-0"
              inputClassName="bg-black/40"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

const StepImage = ({ step, isEditorMode, onOpenModal }) => {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden relative group flex items-center justify-center">
      {step.image_url ? (
        <>
          <img
            src={step.image_url}
            alt={step.title}
            className="w-full h-full object-contain opacity-40 group-hover:opacity-100 transition-all duration-700 ease-in-out"
          />
          {/* LED Indicator */}
          <div className="absolute bottom-6 right-8 w-10 h-1 bg-green-500/20 rounded-full group-hover:bg-green-400 group-hover:shadow-[0_0_10px_#4ade80] transition-all duration-700" />
          {isEditorMode && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button size="sm" variant="outline" onClick={onOpenModal}>Cambiar</Button>
            </div>
          )}
        </>
      ) : isEditorMode && (
        <div onClick={onOpenModal} className="w-full h-full border-2 border-dashed border-gray-800 bg-gray-900/20 flex flex-col items-center justify-center text-gray-500 gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
          <ImageIcon size={24} />
          <span className="text-xs font-bold uppercase tracking-widest">Subir Imagen</span>
        </div>
      )}
    </div>
  );
};

export default ProcesoSection;