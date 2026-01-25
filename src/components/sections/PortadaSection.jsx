import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FolderKanban, User, Video, Loader2, X } from 'lucide-react';
import { useRef } from 'react';
import ReactPlayer from 'react-player';

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
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-8xl font-black text-primary tracking-tighter select-none"
            >
              {quotationData.title}
            </motion.h1>
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