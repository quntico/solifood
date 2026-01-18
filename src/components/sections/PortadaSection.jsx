import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FolderKanban, User, Video, Loader2, X } from 'lucide-react';
import { useRef } from 'react';

const InfoCard = ({ icon: Icon, label, value, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
    className="bg-[#111111] p-6 rounded-2xl flex-1 min-w-[280px] sm:min-w-0"
  >
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-primary font-semibold uppercase tracking-wider">{label}</span>
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <p className="text-2xl font-bold text-white tracking-wide">{value}</p>
  </motion.div>
);

const PortadaSection = ({
  quotationData,
  triggerHeroVideo,
  handleHeroVideoUpload,
  isUploadingHero,
  isAdminAuthenticated,
  heroVideoConfig,
  isHeroVideoActive,
  setIsHeroVideoActive
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const cardData = [
    {
      icon: Building2,
      label: t('sections.portadaDetails.empresa'),
      value: quotationData.company,
    },
    {
      icon: FolderKanban,
      label: t('sections.portadaDetails.proyecto'),
      value: quotationData.project,
    },
    {
      icon: User,
      label: t('sections.portadaDetails.cliente'),
      value: quotationData.client,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-black px-4 py-16">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-16">
        {/* Title and Subtitle */}
        <div className="space-y-4">
          <div className="relative inline-block group">
            <AnimatePresence mode="wait">
              {!isHeroVideoActive ? (
                <motion.h1
                  key="title-static"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  onDoubleClick={triggerHeroVideo}
                  className="text-4xl md:text-8xl font-black text-primary tracking-tighter cursor-pointer select-none"
                >
                  {quotationData.title}
                </motion.h1>
              ) : (
                <motion.div
                  key="hero-video-active"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: (heroVideoConfig?.scale || 100) / 100
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative mx-auto flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]"
                  style={{
                    borderRadius: `${heroVideoConfig?.borderRadius || 20}px`,
                  }}
                >
                  <video
                    src={quotationData.video_url}
                    autoPlay
                    onEnded={() => setIsHeroVideoActive(false)}
                    className="max-w-full max-h-[60vh] object-cover"
                  />
                  {/* Close button for integrated video */}
                  <button
                    onClick={() => setIsHeroVideoActive(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-red-500/80 transition-all backdrop-blur-md border border-white/10 z-10"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {isAdminAuthenticated && (
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/mp4,video/*"
                  onChange={(e) => handleHeroVideoUpload(e.target.files[0])}
                />
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingHero}
                  className="p-3 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 shadow-xl backdrop-blur-md transition-all hover:bg-blue-500/20"
                  title="Subir Video del Hero"
                >
                  {isUploadingHero ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            )}
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-7xl font-bold text-white tracking-tight"
          >
            {quotationData.subtitle}
          </motion.h2>
        </div>

        {/* Info Cards */}
        <div className="w-full flex flex-col md:flex-row justify-center gap-6">
          {cardData.map((card, index) => (
            <InfoCard key={index} {...card} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortadaSection;