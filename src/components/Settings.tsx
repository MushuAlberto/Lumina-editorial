/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, AlertCircle, Trash2, Book, Tag, AlignLeft } from 'lucide-react';
import { BookProject } from '../types';

interface SettingsProps {
  project: BookProject | null;
  onUpdate: (project: BookProject) => void;
  onDelete: () => void;
}

export default function Settings({ project, onUpdate, onDelete }: SettingsProps) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    genre: project?.genre || '',
    synopsis: project?.synopsis || ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    onUpdate({
      ...project,
      title: formData.title,
      genre: formData.genre,
      synopsis: formData.synopsis,
      lastEdited: Date.now()
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
          <Book size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-bold text-ink">No hay proyecto activo</h2>
          <p className="text-stone-400 text-sm italic">Crea o selecciona un proyecto en el Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-600 rounded-full" />
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-600">Configuración Editorial</span>
        </div>
        <h1 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Ajustes del Proyecto</h1>
        <p className="text-sm text-stone-400 italic">Refina los cimientos de tu obra para que la IA pueda asistirte mejor.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 p-8 bg-white border border-stone-100 rounded-3xl shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black text-stone-400 tracking-widest pl-1">
                <Book size={12} className="text-amber-600" />
                Título del Manuscrito
              </label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition-all"
                placeholder="Escribe el título provisional..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black text-stone-400 tracking-widest pl-1">
                <Tag size={12} className="text-amber-600" />
                Género Literario
              </label>
              <input 
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition-all"
                placeholder="Ej: Fantasía Épica, Thriller Noir, Realismo Mágico..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black text-stone-400 tracking-widest pl-1">
                <AlignLeft size={12} className="text-amber-600" />
                Sinopsis Argumental
              </label>
              <textarea 
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium min-h-[160px] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition-all resize-none"
                placeholder="Describe brevemente el conflicto central y el mundo de tu historia..."
                required
              />
              <p className="text-[10px] text-stone-400 italic pl-1">Esta información es clave para que el Consejo Editorial entienda el contexto de tu obra.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button 
              type="submit"
              className="px-8 py-3.5 bg-ink text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-3 shadow-lg shadow-stone-200"
            >
              <Save size={16} />
              Guardar Cambios
            </button>

            {isSaved && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-green-600"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cambios aplicados</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <h3 className="text-xs font-black uppercase tracking-widest">Zona Peligrosa</h3>
            </div>
            <p className="text-[11px] text-red-700/60 font-medium">Acciones irreversibles relacionadas con los datos del proyecto.</p>
          </div>
          
          {!showConfirmDelete ? (
            <button 
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all cursor-pointer"
            >
              <Trash2 size={14} />
              Eliminar Proyecto Completo
            </button>
          ) : (
            <div className="bg-white border border-red-200 rounded-2xl p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm font-medium text-stone-800">
                ¿Estás completamente seguro de que deseas borrar este proyecto? Esta acción eliminará permanentemente todos tus manuscritos, análisis e historial, y no se puede deshacer.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                  Sí, Eliminar Proyecto
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
