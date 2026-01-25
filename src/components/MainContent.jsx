import React from 'react';
import { motion } from 'framer-motion';

const MainContent = ({
  activeSection,
  setActiveSection,
  quotationData,
  aiQuery,
  setAiQuery,
  sections,
  allSections,
  allSectionsData, // Add this
  isEditorMode,
  setIsEditorMode,
  activeTheme,
  onSectionContentUpdate,
  onVideoUrlUpdate,
  activeTabMap, // Receive activeTabMap
  triggerHeroVideo,
  handleHeroVideoUpload,
  isUploadingHero,
  isAdminAuthenticated,
  heroVideoConfig,
  isHeroVideoActive,
  setIsHeroVideoActive
}) => {

  const handleContentChange = (sectionId, newContent) => {
    const sourceList = Array.isArray(allSectionsData)
      ? allSectionsData
      : (allSectionsData?.sections || sections);

    const newSections = sourceList.map(sec => {
      if (sec.id !== sectionId) return sec;

      // [FIX] ARRAY PERSISTENCE: If newContent or current content is an array, do NOT merge as object.
      // Also for 'propuesta' which manages its own full state object.
      const shouldAssignDirectly = Array.isArray(newContent) || Array.isArray(sec.content) || sec.id === 'propuesta';

      return {
        ...sec,
        content: shouldAssignDirectly
          ? newContent
          : { ...(sec.content || {}), ...newContent }
      };
    });
    onSectionContentUpdate(newSections);
  };

  const handleSectionContentChange = (sectionId, newContent) => {
    const sourceList = Array.isArray(allSectionsData)
      ? allSectionsData
      : (allSectionsData?.sections || sections);

    const newSections = sourceList.map(sec =>
      sec.id === sectionId ? { ...sec, content: newContent } : sec
    );
    onSectionContentUpdate(newSections);
  };

  const handleSectionDataChange = (sectionId, newSectionData) => {
    const sourceList = Array.isArray(allSectionsData)
      ? allSectionsData
      : (allSectionsData?.sections || sections);

    const newSections = sourceList.map(sec =>
      sec.id === sectionId ? { ...sec, ...newSectionData } : sec
    );
    onSectionContentUpdate(newSections);
  };

  return (
    <main className="relative px-4"> {/* Moved px-4 here */}
      {sections.map(section => {
        if (!section.isVisible) return null;

        const Component = section.Component;
        if (!Component) return null;

        // Since 'sections' prop (menuItems) is already merged with 'sections_config' in QuotationViewer,
        // we can use section directly.
        const sectionDataWithContent = section;

        const props = {
          sectionData: sectionDataWithContent,
          quotationData,
          isEditorMode,
          setIsEditorMode,
          activeTheme,
          onContentChange: (newContent) => handleContentChange(section.id, newContent),
          onDataChange: (newData) => handleSectionDataChange(section.id, newData),
          activeTab: activeTabMap ? activeTabMap[section.id] : undefined, // Pass activeTab
          ...(section.id === 'propuesta' && { sections: allSections }),
          ...(section.id === 'video' && { onVideoUrlUpdate }),
          ...(section.id === 'portada' && {
            triggerHeroVideo,
            handleHeroVideoUpload,
            isUploadingHero,
            isAdminAuthenticated,
            heroVideoConfig,
            isHeroVideoActive,
            setIsHeroVideoActive
          }),
        };

        return (
          <section id={section.id} key={section.id}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <Component {...props} />
            </motion.div>
          </section>
        );
      })}
    </main>
  );
};

export default MainContent;