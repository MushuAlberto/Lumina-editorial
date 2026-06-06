/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, BookOpen, Clock, Star, ArrowRight, Upload } from 'lucide-react';
import * as mammoth from 'mammoth';
import { BookProject, Section } from '../types';

interface DashboardProps {
  currentProject: BookProject | null;
  setProject: (project: BookProject) => void;
  onSectionChange: (section: Section) => void;
}

export default function Dashboard({ currentProject, setProject, onSectionChange }: DashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', genre: '', synopsis: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: BookProject = {
      id: Date.now().toString(),
      ...formData,
      lastEdited: Date.now(),
    };
    setProject(newProject);
    setIsCreating(false);
  };

  return (
    <div className="space-y-16">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-amber-600 rounded-full" />
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">Escritorio del Autor</h3>
        </div>
        <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter leading-none text-ink italic">
          {currentProject ? `Bienvenido de nuevo, Maestro.` : "El principio de tu próximo legado."}
        </h2>
        <p className="text-stone-500 text-xl max-w-2xl font-serif italic border-l-2 border-stone-100 pl-6 py-2">
          Donde las ideas crudas se transforman en piezas literarias de impacto. Lumina refina tu visión.
        </p>
      </header>

      {currentProject ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <motion.div 
            whileHover={{ y: -8 }}
            className="xl:col-span-2 editorial-card p-0 flex flex-col relative overflow-hidden group min-h-[400px]"
          >
            <div className="absolute top-0 right-0 p-12 text-stone-50/50 group-hover:text-stone-100/50 transition-colors -rotate-12 pointer-events-none">
              <BookOpen size={240} />
            </div>
            
            <div className="p-12 relative z-10 flex flex-col h-full bg-white/40 backdrop-blur-[2px]">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-700 bg-amber-50 px-3 py-1 rounded">Manuscrito en curso</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-300 italic">ID: {currentProject.id}</span>
              </div>
              
              <h3 className="text-5xl font-serif font-bold text-ink mb-6 tracking-tight line-clamp-2 italic underline decoration-amber-100 underline-offset-8 decoration-4">
                {currentProject.title}
              </h3>
              
              <p className="text-stone-500 font-serif text-lg line-clamp-3 mb-12 max-w-xl leading-relaxed">
                {currentProject.synopsis}
              </p>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex gap-3">
                  <span className="px-4 py-1.5 bg-stone-100 text-[9px] uppercase font-bold tracking-[0.15em] rounded shadow-sm text-stone-600">
                    {currentProject.genre}
                  </span>
                  <span className="px-4 py-1.5 bg-ink text-white text-[9px] uppercase font-bold tracking-[0.15em] rounded shadow-lg">
                    Calidad Profesional: Alta
                  </span>
                </div>
                <button className="flex items-center gap-3 text-amber-700 font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  Continuar Redacción <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-6">
            <div className="editorial-card p-10 flex flex-col justify-center gap-6 bg-[#F0EEE9] border-border-sep/40">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-amber-600 shadow-xl ring-4 ring-white">
                <Star size={24} />
              </div>
              <div>
                <h4 className="font-serif font-black text-2xl italic tracking-tight mb-2">Hito de Escritura</h4>
                <p className="text-sm text-stone-500 leading-relaxed">Tu segundo acto tiene un ritmo cinematográfico excepcional.</p>
              </div>
            </div>
            
            <div className="editorial-card p-10 bg-sidebar text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl font-serif" />
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500 mb-6">Nota del Editor AI</h4>
              <p className="text-lg font-serif italic text-white/90 leading-snug">
                "La brevedad es el alma del ingenio, pero la profundidad es el corazón de la literatura."
              </p>
              <div className="mt-8 border-t border-white/10 pt-4 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/30">Análisis del mercado: Activo</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-12 py-20 items-center">
          {!isCreating ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreating(true)}
                className="group flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-300 group-hover:text-amber-600 group-hover:border-amber-600 transition-all duration-500">
                  <Plus size={40} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-serif font-bold text-ink">Comenzar un nuevo libro</p>
                  <p className="text-sm text-stone-400 uppercase tracking-widest mt-1">Tu viaje comienza aquí</p>
                </div>
              </motion.button>

              <div className="w-px h-24 bg-stone-100 hidden md:block" />

              <div className="flex flex-col items-center gap-6">
                <label className="cursor-pointer group flex flex-col items-center gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-24 h-24 rounded-full bg-amber-600/5 border border-amber-600/20 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-amber-600/5 group-hover:shadow-amber-600/20"
                  >
                    <Upload size={36} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xl font-serif font-bold text-ink whitespace-nowrap">Carga tu libro</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-bold">Juntos lo mejoraremos</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".docx" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        if (result.value) {
                          const newProject: BookProject = {
                            id: Date.now().toString(),
                            title: file.name.replace('.docx', ''),
                            genre: 'Sin definir',
                            synopsis: 'Manuscrito importado desde archivo externo.',
                            lastEdited: Date.now(),
                            initialContent: result.value
                          };
                          setProject(newProject);
                          onSectionChange('editor');
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Error al cargar el archivo .docx");
                      }
                    }} 
                  />
                </label>
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="editorial-card p-10 w-full max-w-xl"
            >
              <h3 className="text-2xl font-serif font-bold mb-8">Nuevo Proyecto Literario</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Título de la obra</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ej. El Silencio de las Estrellas"
                    className="w-full bg-stone-50 border-b border-stone-200 py-3 focus:border-gold outline-none transition-colors font-serif text-lg"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Género</label>
                    <select 
                      className="w-full bg-stone-50 border-b border-stone-200 py-3 focus:border-gold outline-none transition-colors"
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Novela">Novela</option>
                      <option value="Ciencia Ficción">Ciencia Ficción</option>
                      <option value="Fantasía">Fantasía</option>
                      <option value="Ensayo">Ensayo</option>
                      <option value="Poesía">Poesía</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Sinopsis Breve</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe el alma de tu historia..."
                    className="w-full bg-stone-50 border border-stone-200 p-4 rounded-lg focus:border-gold outline-none transition-colors font-serif text-lg"
                    value={formData.synopsis}
                    onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-grow bg-gold text-white font-bold py-4 rounded-lg hover:bg-gold/90 transition-colors uppercase tracking-widest text-xs"
                  >
                    Crear Proyecto
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-8 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
