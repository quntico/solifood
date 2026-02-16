import React, { useState } from 'react';
import { Search, Menu, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import Banner from '@/components/Banner';
import MobileMenu from '@/components/MobileMenu';
import { BRANDS, DEFAULT_BRAND } from '@/lib/brands';

import ExportCenterModal from '@/components/ExportCenterModal';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';

const Header = ({
  quotationData,
  onLogoClick,
  onSearchClick,
  isBannerVisible,
  isEditorMode,
  isAdminView,
  // Props needed for MobileMenu
  sections,
  activeSection,
  onSectionSelect,
  onHomeClick,
  isAdminAuthenticated,
  onAdminLogin,
  onAdminLogout,
  onCotizadorClick,
  onSubItemSelect,
  activeTabMap,
  setIsEditorMode,
  onAdminClick,
  isScrolled,
  onQuotationUpdate
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const location = useLocation();
  if (!quotationData) return null; // Prevent crash if data is not yet loaded

  const { company, project, client, logo, logo_size, banner_text, banner_scale, banner_direction, hide_banner, brand_color } = quotationData;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportingMP, setIsExportingMP] = useState(false);
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false);



  // Determine Brand Logo
  const brandId = brand_color || DEFAULT_BRAND;
  const brandConfig = BRANDS[brandId] || BRANDS[DEFAULT_BRAND];

  // Force fallback if logo is the generic favicon and we want the brand logo
  let potentialLogo = logo;
  if (potentialLogo && potentialLogo.includes('favicon.png') && brandId === 'solimaq') {
    potentialLogo = null;
  }

  const finalLogoUrl = potentialLogo || brandConfig.defaultLogo;

  // Show banner if not hidden in settings, and if the idle/initial timer says it should be visible.
  const showBanner = !hide_banner && isBannerVisible;

  // 1) Agranda el logo SMQ: Use a larger default size if not specified.
  const finalLogoSize = logo_size && logo_size > 0 ? logo_size : 250; // Larger default
  const logoContainerStyle = {
    '--logo-width': `${finalLogoSize}px`
  };

  return (
    <>
      <header className={`transition-all duration-500 z-30 ${isScrolled ? 'sticky top-4 mx-4 sm:mx-8 z-[200] !p-1 !mb-4 !gap-4 !rounded-2xl shadow-2xl scale-[0.98] border-white/20 !bg-zinc-950/50 backdrop-blur-3xl ring-1 ring-white/10' : 'relative bg-black text-white'}`}>
        <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'p-2 sm:p-3 h-14 sm:h-16' : 'p-3 sm:p-4 border-b border-gray-800 h-16 sm:h-20'}`}>
          {/* Left section: Hamburger (Mobile) & Logo */}
          <div className="flex-1 flex items-center justify-start gap-2">
            <div className="lg:hidden">
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                sections={sections || []}
                activeSection={activeSection}
                onSectionSelect={onSectionSelect}
                onHomeClick={onHomeClick}
                isAdminView={isAdminView}
                isAdminAuthenticated={isAdminAuthenticated}
                onAdminLogin={onAdminLogin}
                onAdminLogout={onAdminLogout}
                onCotizadorClick={onCotizadorClick}
                onSubItemSelect={onSubItemSelect}
                activeTabMap={activeTabMap}
                isEditorMode={isEditorMode}
                setIsEditorMode={setIsEditorMode}
                onAdminClick={onAdminClick}
              />
            </div>

            {finalLogoUrl && (
              <div className="relative flex items-center">
                <button onClick={onLogoClick} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
                  <div className={`header-logo-container transition-all duration-500 origin-left ${isScrolled ? 'scale-[0.5] sm:scale-[0.8]' : 'scale-[0.6] sm:scale-100'}`} style={logoContainerStyle}>
                    <img
                      src={finalLogoUrl}
                      alt={`${company} Logo`}
                      className="header-logo"
                    />
                  </div>
                </button>
                {/* Refined Version Badge: Píldora con LED Online */}
                <div
                  onDoubleClick={onAdminLogin}
                  className="absolute -bottom-1 -right-4 translate-x-full hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/80 border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm cursor-pointer select-none hover:border-primary/50 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#39ff14] shadow-[0_0_12px_#39ff14] animate-pulse" />
                  <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 tracking-widest">VER 6.2</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-[3] sm:flex-[2] flex flex-col items-center justify-center text-center px-1 sm:px-4 overflow-hidden">
            <h1 className={`font-bold text-gray-200 leading-tight truncate w-full transition-all duration-500 ${isScrolled ? 'text-sm sm:text-xl md:text-2xl' : 'text-base sm:text-2xl md:text-3xl'}`}>
              {project}
            </h1>
            {!isScrolled && (
              <p className="text-[10px] sm:text-base text-gray-400 mt-0.5 truncate w-full hidden sm:block">
                {client}
              </p>
            )}
          </div>

          {/* Right section: Language selector and Search button */}
          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
            <div className="scale-90 sm:scale-100 origin-right flex items-center gap-1 sm:gap-2">

              {/* Unified PDF Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExportCenterOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 gap-2 h-9 border border-white/10 px-3 transition-all hover:border-primary/50"
              >
                <div className="relative flex items-center gap-2">
                  {quotationData.sections_config?.export_center_items?.length > 0 && (
                    <span className="w-2 h-2 bg-[#39ff14] rounded-full animate-pulse shadow-[0_0_8px_#39ff14]" />
                  )}
                  <FileDown className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline font-bold text-xs">PDF & DOCS</span>
              </Button>

              <LanguageSelector />
            </div>
            {isAdminView && (
              <Button variant="ghost" size="icon" onClick={onSearchClick} className="text-gray-400 hover:text-white hover:bg-gray-800 hidden sm:flex">
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <Banner
          isVisible={showBanner}
          text={banner_text}
          direction={banner_direction}
          scale={banner_scale}
          company={company}
          client={client}
          project={project}
          isEditorMode={isEditorMode}
          isAdminView={isAdminView}
        />
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        sections={sections || []}
        activeSection={activeSection}
        onSectionSelect={onSectionSelect}
        onHomeClick={onHomeClick}
        isAdminView={isAdminView}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
        onCotizadorClick={onCotizadorClick}
        onSubItemSelect={onSubItemSelect}
        activeTabMap={activeTabMap}
        isEditorMode={isEditorMode}
        setIsEditorMode={setIsEditorMode}
        onAdminClick={onAdminClick}
      />

      <ExportCenterModal
        isOpen={isExportCenterOpen}
        onClose={() => setIsExportCenterOpen(false)}
        quotationData={quotationData}
        isEditorMode={isEditorMode}
        onUpdate={onQuotationUpdate}
      />
    </>
  );
};

export default Header;