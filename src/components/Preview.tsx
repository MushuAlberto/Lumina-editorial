/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { X, Download, Printer, BookOpen, Share2 } from 'lucide-react';
import { BookProject } from '../types';

interface PreviewProps {
  project: BookProject | null;
  onClose: () => void;
}

export default function Preview({ project, onClose }: PreviewProps) {
  if (!project) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <header className="px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold italic text-ink line-clamp-1">{project.title}</h2>
              <p className="text-[9px] uppercase tracking-widest text-stone-400 font-black">Previsualización de Galera Editorial</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="p-2.5 text-stone-400 hover:text-amber-600 transition-colors bg-stone-50 rounded-xl"
              title="Imprimir"
            >
              <Printer size={18} />
            </button>
            <button 
              className="p-2.5 text-stone-400 hover:text-amber-600 transition-colors bg-stone-50 rounded-xl"
              title="Exportar PDF"
            >
              <Download size={18} />
            </button>
            <button 
              className="p-2.5 text-stone-400 hover:text-amber-600 transition-colors bg-stone-50 rounded-xl"
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
            <div className="w-px h-6 bg-stone-100 mx-1" />
            <button 
              onClick={onClose}
              className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 md:p-20 bg-paper/30">
          <div className="max-w-2xl mx-auto space-y-20 bg-white p-16 md:p-24 shadow-[0_0_50px_rgba(0,0,0,0.05)] rounded-sm min-h-screen">
            {/* Cover Content in Preview Mode */}
            <div className="text-center space-y-8 py-12">
              <div className="w-16 h-px bg-stone-200 mx-auto" />
              <h1 className="text-6xl font-serif font-black italic tracking-tighter text-ink leading-none">
                {project.title}
              </h1>
              <p className="text-xl font-serif italic text-stone-400">Una obra de Artes del Libro</p>
              <div className="w-16 h-px bg-stone-200 mx-auto" />
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-amber-600/50 block text-center">Sinopsis</span>
                <p className="text-xl font-serif leading-relaxed text-stone-600 text-center italic max-w-lg mx-auto">
                  {project.synopsis}
                </p>
              </div>

              <div className="pt-20 space-y-12">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink pb-2 border-b border-stone-100 italic">Estructura del Manuscrito</h3>
                  <div className="grid gap-4">
                    {project.plot?.map((point, i) => (
                      <div key={i} className="flex justify-between items-baseline group">
                        <span className="text-lg font-serif italic text-stone-800">{point.title}</span>
                        <div className="flex-1 border-b border-dotted border-stone-200 mx-4" />
                        <span className="text-sm font-mono text-stone-400">{i + 1}</span>
                      </div>
                    )) || (
                      <p className="text-sm italic text-stone-300">No se han definido capítulos aún.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-8 pt-12">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-ink pb-2 border-b border-stone-100 italic">Primeras Páginas</h3>
                  <div className="prose prose-stone max-w-none">
                    <p className="text-lg font-serif leading-relaxed text-stone-800 dropcap">
                      {project.initialContent || "El manuscrito está siendo refinado en el editor creativo. Pronto aparecerá aquí la versión maquetada."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-32 text-center text-[10px] uppercase tracking-[0.3em] text-stone-300 font-bold">
              © {new Date().getFullYear()} • Lumina Editorial Studio • Todos los derechos reservados
            </footer>
          </div>
        </main>
      </motion.div>
    </motion.div>
  );
}
