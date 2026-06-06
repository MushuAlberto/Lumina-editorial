/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  BookImage, 
  Sparkles, 
  Download, 
  RefreshCw,
  Info,
  Layers,
  Trash2,
  ChevronRight,
  Globe
} from 'lucide-react';
import { BookProject } from '../types';
import { getGemini } from '../lib/gemini';

type AssetType = 'cover' | 'back' | 'illustration' | 'lore';

export default function Assets({ project }: { project: BookProject | null }) {
  const [activeTab, setActiveTab] = useState<AssetType>('cover');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [style, setStyle] = useState('Cinematográfico, óleo profesional, estilo editorial premium');
  const [gallery, setGallery] = useState<{url: string, type: AssetType, title: string}[]>([]);
  
  // Lore Bible State
  const [loreItems, setLoreItems] = useState<{id: string, name: string, category: string, description: string}[]>([]);
  const [isLoreLoading, setIsLoreLoading] = useState(false);

  const downloadImage = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.title || 'Obra'}-${activeTab}-${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAsset = async () => {
    if (!project) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const ai = getGemini();
      
      const typeLabel = activeTab === 'lore' ? 'Concepto de Mundo' : activeTab === 'cover' ? 'Portada' : activeTab === 'back' ? 'Contraportada (diseño visual)' : 'Ilustración Narrativa';
      
      let typeInstructions = '';
      if (activeTab === 'cover') {
        typeInstructions = 'Enfócate en una imagen icónica y central que defina el tema principal de la obra.';
      } else if (activeTab === 'back') {
        typeInstructions = 'Diseña una composición que sea la continuación armónica de la portada. Utiliza texturas, colores y motivos similares, pero deja espacio equilibrado (espacio negativo) para el texto de la contraportada. La imagen debe sugerir sutilmente el misterio o la resolución de la trama descrita en la sinopsis.';
      }

      const fullPrompt = `Libro: "${project.title}". Género: ${project.genre}. Sinopsis: ${project.synopsis}.
      
      Tarea: Genera una imagen artística para la ${typeLabel}.
      Estilo Visual: ${style}.
      Directrices de Tipo: ${typeInstructions}
      
      REGLA DE ORO: Sin texto legible. Composición artística pura y evocadora.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: activeTab === 'illustration' ? '16:9' : '3:4'
          }
        }
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImage(imgUrl);
          setGallery(prev => [{
            url: imgUrl, 
            type: activeTab, 
            title: `${typeLabel} - ${new Date().toLocaleTimeString()}`
          }, ...prev]);
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) {
        console.error("No se generó ninguna imagen en la respuesta.");
      }
    } catch (error) {
      console.error("Error al generar imagen:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const extractLore = async () => {
    if (!project) return;
    setIsLoreLoading(true);
    try {
      const ai = getGemini();
      const prompt = `Basado en la obra "${project.title}", identifica 4 elementos clave del mundo (lugares, objetos mágicos, leyes sociales o facciones). 
      Responde con un JSON array: [{"name": "...", "category": "...", "description": "..."}]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const cleanedText = response.text?.replace(/```json|```/g, '').trim() || '[]';
      const extracted = JSON.parse(cleanedText);
      setLoreItems(prev => [...prev, ...extracted.map((e: any) => ({ ...e, id: Math.random().toString() }))]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoreLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
          <BookImage size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-ink">Artes del Libro</h2>
          <p className="text-stone-400 max-w-sm italic">Primero debes definir o seleccionar un proyecto para comenzar a crear su identidad visual.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4 border-b border-border-sep pb-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-amber-600 rounded-full" />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400">Atelier Visual y Diseño</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-serif font-black tracking-tight text-ink italic leading-none">Estudio de Activos</h2>
        <p className="text-stone-500 text-xl font-serif italic max-w-2xl leading-relaxed">
          Genera la identidad visual de tu obra. Desde portadas icónicas hasta ilustraciones que dan vida a tus palabras.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls Panel */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl border border-border-sep shadow-xl p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400 block">Tipo de Arte</label>
              <div className="grid grid-cols-1 gap-2">
                <TabButton 
                  active={activeTab === 'cover'} 
                  onClick={() => setActiveTab('cover')} 
                  icon={<BookImage size={18} />} 
                  label="Portada Principal" 
                  description="Imágenes de alto impacto para el frente."
                />
                <TabButton 
                  active={activeTab === 'back'} 
                  onClick={() => setActiveTab('back')} 
                  icon={<Layers size={18} />} 
                  label="Reverso / Contraportada" 
                  description="Composiciones visuales para la parte trasera."
                />
                <TabButton 
                  active={activeTab === 'lore'} 
                  onClick={() => setActiveTab('lore')} 
                  icon={<Globe size={18} />} 
                  label="Biblia del Mundo" 
                  description="Lore, lugares y objetos clave."
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400 block">Filtro de Estilo</label>
              <select 
                className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 ring-amber-500/10 cursor-pointer text-sm font-medium transition-all"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Cinematográfico, óleo profesional, estilo editorial premium">Cinematográfico Premium</option>
                <option value="Minimalista, diseño plano moderno, elegante, simbólico">Minimalismo Moderno</option>
                <option value="Ilustración de fantasía épica, detallado, colores vibrantes">Fantasía Épica</option>
                <option value="Fotorealista, misterio, novela negra, iluminación dramática">Noir Fotorealista</option>
                <option value="Acuarela delicada, estilo literario, soñador">Acuarela Artística</option>
                <option value="Estilo grabado antiguo, clásico, atemporal">Clásico Grabado</option>
              </select>
            </div>

            <button 
              onClick={generateAsset}
              disabled={isGenerating}
              className="w-full bg-sidebar text-white py-6 rounded-2xl shadow-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              {isGenerating ? "Imaginando..." : "Generar Arte Literario"}
            </button>
          </div>

          <div className="bg-amber-600/5 border border-amber-600/10 p-6 rounded-2xl flex gap-4 items-start">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-1" />
            <p className="text-xs text-amber-900/70 italic leading-relaxed">
              Lumina utiliza el contexto de tu género y sinopsis para asegurar que el arte generado sea coherente con tu narrativa.
            </p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'lore' ? (
              <motion.div 
                key="lore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden">
                  <div className="bg-sidebar p-8 text-white flex items-center justify-between">
                     <div>
                        <h3 className="text-2xl font-serif font-black italic">Archivos del Mundo</h3>
                        <p className="text-white/50 text-xs uppercase tracking-widest mt-1">Conocimiento acumulado de la obra</p>
                     </div>
                     <button 
                       onClick={extractLore}
                       disabled={isLoreLoading}
                       className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all"
                     >
                       {isLoreLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                       Revelar Lore
                     </button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 min-h-[400px]">
                    {loreItems.length > 0 ? loreItems.map((item) => (
                      <div key={item.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-amber-600/30 transition-all group">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-black text-amber-600 tracking-tighter italic">{item.category}</span>
                            <button onClick={() => setLoreItems(p => p.filter(i => i.id !== item.id))} className="text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                               <Trash2 size={14} />
                            </button>
                         </div>
                         <h4 className="text-xl font-serif font-black italic text-ink mb-2">{item.name}</h4>
                         <p className="text-sm text-stone-500 font-serif leading-relaxed italic">{item.description}</p>
                      </div>
                    )) : (
                      <div className="col-span-2 flex flex-col items-center justify-center text-stone-300 py-20 space-y-4">
                         <Globe size={64} className="opacity-10" />
                         <p className="font-serif italic text-lg">Tu mundo aún no tiene registros oficiales.</p>
                         <p className="text-[10px] uppercase tracking-widest text-stone-400">Usa el botón de 'Revelar Lore' para comenzar</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="visuals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="bg-[#F0EEE9] rounded-[3rem] p-10 lg:p-16 border border-border-sep shadow-inner flex items-center justify-center min-h-[600px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 text-stone-600/5 group-hover:text-stone-600/10 transition-all pointer-events-none -rotate-12">
                     <Palette size={400} />
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {generatedImage ? (
                      <motion.div 
                        key={generatedImage}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="relative flex flex-col items-center"
                      >
                        <div className={`relative bg-white shadow-2xl ${activeTab === 'illustration' ? 'aspect-video w-full max-w-2xl' : 'aspect-[3/4] h-[500px]'} overflow-hidden rounded-lg ring-1 ring-black/5`}>
                           <img 
                             src={generatedImage} 
                             alt="Generated" 
                             className="w-full h-full object-cover"
                             referrerPolicy="no-referrer"
                           />
                           {activeTab === 'cover' && (
                             <div className="absolute inset-0 p-10 flex flex-col items-center justify-between text-center bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none">
                                <h1 className="text-white font-serif font-black text-4xl drop-shadow-2xl uppercase tracking-tighter italic">{project.title}</h1>
                                <div className="space-y-1">
                                   <p className="text-white/80 font-serif italic text-lg drop-shadow-md">Autor de Lumina</p>
                                   <p className="text-white/40 text-[9px] uppercase tracking-widest">Editorial de Elite</p>
                                </div>
                             </div>
                           )}
                           {activeTab === 'back' && (
                             <div className="absolute inset-0 p-12 bg-black/10 backdrop-blur-[2px] flex flex-col justify-start pointer-events-none">
                                <div className="w-full h-1/2 bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col gap-3">
                                   <div className="w-1/3 h-1 bg-white/20 rounded-full" />
                                   <div className="w-full h-1 bg-white/10 rounded-full" />
                                   <div className="w-full h-1 bg-white/10 rounded-full" />
                                   <div className="w-2/3 h-1 bg-white/10 rounded-full" />
                                   <div className="mt-4 flex gap-2">
                                     <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                     <div className="w-20 h-2 bg-white/10 rounded-full" />
                                   </div>
                                </div>
                                <div className="mt-auto ml-auto bg-white p-2 rounded shadow-lg opacity-80">
                                   <div className="w-12 h-8 bg-[repeating-linear-gradient(90deg,black,black_1px,transparent_1px,transparent_3px)]" />
                                </div>
                             </div>
                           )}
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                          <button 
                            className="bg-white text-ink px-6 py-3 rounded-full shadow-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-stone-50 transition-all border border-stone-100" 
                            onClick={() => downloadImage(generatedImage, 'Master')}
                          >
                            <Download size={16} /> Descargar Master (HD)
                          </button>
                          <button 
                            onClick={() => setGeneratedImage(null)}
                            className="bg-white/50 backdrop-blur-md text-red-600 px-6 py-3 rounded-full shadow-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} /> Descartar
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center space-y-6 max-w-xs relative z-10"
                      >
                        <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-amber-600 shadow-xl ring-4 ring-white">
                          <Sparkles size={32} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-serif font-bold italic">Esperando tu Visión</h3>
                          <p className="text-sm text-stone-400 leading-relaxed italic">Configura las directivas en el panel lateral y deja que Lumina materialice la esencia visual de tu obra.</p>
                        </div>
                        {isGenerating && (
                          <div className="flex flex-col items-center gap-4 mt-8">
                             <div className="w-48 h-1.5 bg-white/50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ x: '-100%' }}
                                  animate={{ x: '100%' }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  className="w-1/2 h-full bg-amber-600 rounded-full"
                                />
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Interpretando sinopsis...</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {gallery.length > 0 && (
                  <div className="space-y-6">
                     <h4 className="text-[10px] uppercase tracking-widest font-black text-stone-400 border-b border-stone-100 pb-2">Galería de Conceptos</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {gallery.map((img, i) => (
                         <motion.div 
                           layout
                           key={i} 
                           className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-md group cursor-pointer border border-stone-100"
                         >
                           <img 
                             src={img.url} 
                             className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                             referrerPolicy="no-referrer" 
                             onClick={() => setGeneratedImage(img.url)}
                           />
                           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[9px] text-white/80 font-medium uppercase tracking-tighter truncate mb-2">{img.title}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(img.url, img.title);
                                }}
                                className="w-full bg-white/20 hover:bg-white/40 text-white text-[8px] font-black uppercase tracking-widest py-1.5 rounded backdrop-blur-md transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Download size={10} /> Descargar
                              </button>
                           </div>
                         </motion.div>
                       ))}
                     </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, description }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, description: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active ? 'bg-sidebar text-white border-sidebar shadow-xl translate-x-1' : 'bg-white text-stone-400 border-stone-50 hover:border-stone-200'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-white/10 text-amber-500' : 'bg-stone-50 text-stone-300'}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-black uppercase tracking-tight ${active ? 'text-white' : 'text-ink'}`}>{label}</p>
        <p className={`text-[10px] italic leading-tight ${active ? 'text-white/40' : 'text-stone-400'}`}>{description}</p>
      </div>
      <div className={`ml-auto transition-all ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
        <ChevronRight size={18} />
      </div>
    </button>
  );
}
