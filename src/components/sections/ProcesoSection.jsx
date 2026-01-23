import React, { useState, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Layers, Edit, Settings } from 'lucide-react';
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
              const isLeft = index % 2 === 0;

              return (
                <div key={step.id} className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_auto_1fr] items-stretch gap-x-6 sm:gap-x-12">
                  {/* Left Column (Desktop) */}
                  <div className="hidden sm:block">
                    {isLeft ? (
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6 }}
                        className="bg-gray-900/50 p-6 rounded-xl border border-primary/40 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.15)] hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full flex flex-col justify-center"
                      >
                        <TimelineCardContent step={step} isLeft={isLeft} />
                      </motion.div>
                    ) : (
                      step.image_url && (
                        <motion.div
                          initial={{ opacity: 0.4 }}
                          whileHover={{ opacity: 1 }}
                          className="w-full h-full min-h-[12rem] rounded-xl overflow-hidden border border-primary/20 bg-black/40 shadow-2xl transition-all duration-500"
                        >
                          <img
                            src={step.image_url}
                            alt={step.title}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )
                    )}
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
                  </div>

                  {/* Right Column (Desktop) / Main Column (Mobile) */}
                  <div className="sm:block">
                    {!isLeft ? (
                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.6 }}
                        className="bg-gray-900/50 p-6 rounded-xl border border-primary/40 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.15)] hover:border-primary transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full flex flex-col justify-center"
                      >
                        <TimelineCardContent step={step} isLeft={isLeft} />
                      </motion.div>
                    ) : (
                      <div className="hidden sm:block">
                        {step.image_url && (
                          <motion.div
                            initial={{ opacity: 0.4 }}
                            whileHover={{ opacity: 1 }}
                            className="w-full h-full min-h-[12rem] rounded-xl overflow-hidden border border-primary/20 bg-black/40 shadow-2xl transition-all duration-500"
                          >
                            <img
                              src={step.image_url}
                              alt={step.title}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Mobile Image (shown below card for better visibility) */}
                    <div className="sm:hidden mt-4">
                      {step.image_url && (
                        <div className="w-full h-40 rounded-xl overflow-hidden border border-primary/20 bg-black/40 shadow-xl">
                          <img
                            src={step.image_url}
                            alt={step.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
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

const TimelineCardContent = ({ step, isLeft }) => {
  const alignment = step.align || 'left';

  return (
    <div className="flex flex-col h-full justify-center">
      <h3
        className="text-base font-bold text-white mb-4 sm:text-lg uppercase tracking-tight"
        style={{ textAlign: alignment === 'justify' ? 'left' : alignment }}
      >
        {step.title}
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
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProcesoSection;