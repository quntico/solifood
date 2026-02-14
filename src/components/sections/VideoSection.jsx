import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Film, Play, ChevronRight, Save } from "lucide-react";

function getYouTubeEmbedUrl(input) {
  if (!input || typeof input !== 'string') return { id: null, embedUrl: null };
  const url = input.trim();
  if (!url) return { id: null, embedUrl: null };

  let id = null;
  if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) id = parts[1].split(/[?&]/)[0];
  }
  if (!id && url.includes("/embed/")) {
    const parts = url.split("/embed/");
    if (parts[1]) id = parts[1].split(/[?&]/)[0];
  }
  if (!id && url.includes("watch?")) {
    const match = url.match(/[?&]v=([^&]+)/);
    if (match && match[1]) id = match[1];
  }
  if (!id && /^[a-zA-Z0-9_-]{6,}$/.test(url)) {
    id = url;
  }

  if (!id) return { id: null, embedUrl: null };
  return { id, embedUrl: `https://www.youtube.com/embed/${id}?rel=0` };
}

export default function VideoSection({ quotationData, sectionData, onContentChange, isEditorMode }) {
  // Priority: 1. Section Content Gallery, 2. Legacy video_url
  const gallery = sectionData?.content?.videoGallery || [];
  const legacyUrl = quotationData?.video_url || "";

  // Local state for the viewer
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  // Local state for the editor
  const [editableGallery, setEditableGallery] = useState([]);

  useEffect(() => {
    if (gallery.length > 0) {
      setEditableGallery(gallery);
    } else if (legacyUrl) {
      setEditableGallery([{ title: "Video Industrial", url: legacyUrl }]);
    } else {
      setEditableGallery([]);
    }
  }, [gallery.length, legacyUrl]);

  const handleSaveGallery = () => {
    onContentChange({ videoGallery: editableGallery });
  };

  const addVideo = () => {
    setEditableGallery([...editableGallery, { title: "Nuevo Video", url: "" }]);
  };

  const removeVideo = (index) => {
    const newGallery = editableGallery.filter((_, i) => i !== index);
    setEditableGallery(newGallery);
  };

  const updateVideo = (index, field, value) => {
    const newGallery = [...editableGallery];
    newGallery[index] = { ...newGallery[index], [field]: value };
    setEditableGallery(newGallery);
  };

  const currentVideos = gallery.length > 0 ? gallery : (legacyUrl ? [{ title: "Demostración", url: legacyUrl }] : []);
  const activeVideo = currentVideos[activeVideoIdx];
  const { embedUrl } = activeVideo ? getYouTubeEmbedUrl(activeVideo.url) : { embedUrl: null };

  return (
    <section id="video" className="py-16 sm:py-24 bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 lg:px-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Maquinaria en <span className="text-primary text-glow">Acción</span>
          </h2>
          <p className="mt-2 text-gray-400 max-w-xl mx-auto italic">
            Visualiza el corazón del proceso industrial
          </p>
        </motion.div>

        {/* Video Selector Tabs */}
        {currentVideos.length > 1 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {currentVideos.map((vid, idx) => (
              <button
                key={idx}
                onClick={() => setActiveVideoIdx(idx)}
                className={`px-4 py-2 rounded-full border transition-all text-xs font-bold flex items-center gap-2 ${activeVideoIdx === idx
                    ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
              >
                {activeVideoIdx === idx ? <Play className="w-3 h-3 fill-current" /> : <Film className="w-3 h-3" />}
                {vid.title}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">

          {/* Main player area */}
          <div className={isEditorMode ? "lg:col-span-12 xl:col-span-8" : "lg:col-span-12"}>
            <motion.div
              layout
              className="aspect-video w-full max-w-4xl mx-auto bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group"
            >
              {embedUrl ? (
                <iframe
                  className="w-full h-full"
                  src={embedUrl}
                  title={activeVideo?.title || "Video"}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Film className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="font-bold tracking-widest uppercase text-xs">
                    {isEditorMode ? 'Configura la galería en el panel lateral' : 'Sección sin video configurado'}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Editor Sidebar */}
          {isEditorMode && (
            <div className="lg:col-span-12 xl:col-span-4 bg-zinc-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-primary font-black uppercase text-sm tracking-widest flex items-center gap-2">
                  <Film className="w-4 h-4" /> Gestor de Galería
                </h3>
                <button
                  onClick={handleSaveGallery}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold"
                >
                  <Save className="w-3 h-3" /> GUARDAR
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {editableGallery.map((vid, idx) => (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={idx}
                    className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <span className="w-5 h-5 bg-white/5 rounded flex items-center justify-center">{idx + 1}</span>
                        TÍTULO
                      </div>
                      <button onClick={() => removeVideo(idx)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      value={vid.title}
                      onChange={(e) => updateVideo(idx, 'title', e.target.value)}
                      placeholder="Ej: Proceso de Empaque"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                    />

                    <div className="text-xs font-bold text-gray-400 flex items-center gap-2">LINK YOUTUBE</div>
                    <input
                      value={vid.url}
                      onChange={(e) => updateVideo(idx, 'url', e.target.value)}
                      placeholder="Pega la URL de YouTube..."
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                    />
                  </motion.div>
                ))}

                <button
                  onClick={addVideo}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary/50 hover:text-primary transition-all group"
                >
                  <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Añadir Otro Video</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}