/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PenTool, 
  ChevronRight,
  ChevronLeft,
  Menu,
  Settings,
  X,
  Palette
} from 'lucide-react';
import { Section, BookProject } from './types';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import Assets from './components/Assets';
import SettingsView from './components/Settings';
import Preview from './components/Preview';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentProject, setCurrentProject] = useState<BookProject | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Persistence (Simplified for now)
  useEffect(() => {
    const saved = localStorage.getItem('lumina_project');
    if (saved) {
      setCurrentProject(JSON.parse(saved));
    }
  }, []);

  const handleSetProject = (project: BookProject) => {
    setCurrentProject(project);
    localStorage.setItem('lumina_project', JSON.stringify(project));
  };

  const handleDeleteProject = () => {
    setCurrentProject(null);
    localStorage.removeItem('lumina_project');
    setActiveSection('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor', label: 'Editor Creativo', icon: PenTool },
    { id: 'assets', label: 'Artes del Libro', icon: Palette },
  ];

  return (
    <div className="flex h-screen bg-paper overflow-hidden text-ink font-sans">
      {/* Drawer / Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="relative bg-sidebar text-white overflow-hidden flex-shrink-0 z-30 flex flex-col border-r border-border-sep"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center text-white font-serif italic font-bold">L</div>
            <div>
              <h1 className="text-xl font-serif font-bold italic tracking-tight">Editorial Studio</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-0.5">Creative & Professional</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="hidden lg:flex p-1 text-white/20 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentProject && (
             <div className="text-[10px] uppercase tracking-widest text-white/30 px-3 mb-4">
               Proyecto: {currentProject.title}
             </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as Section)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group ${
                activeSection === item.id 
                  ? 'bg-white/10 text-white font-medium shadow-sm' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? 'text-amber-500' : ''} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          {currentProject && (
            <div className="bg-amber-600/10 border border-amber-600/20 rounded-lg p-4">
              <p className="text-[11px] text-amber-200 font-bold uppercase tracking-wider">Progreso de la Obra</p>
              <div className="h-1.5 w-full bg-white/10 rounded-full mt-2.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '68%' }}
                  className="h-full bg-amber-500 rounded-full" 
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2 italic font-serif">68% - Fase de Pulido Avanzado</p>
            </div>
          )}
          <button 
            onClick={() => setActiveSection('settings')}
            className={`flex items-center gap-3 px-3 py-2 transition-colors w-full group rounded-md ${activeSection === 'settings' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Settings size={16} className={`${activeSection === 'settings' ? 'text-amber-500' : 'group-hover:rotate-45'} transition-transform`} />
            <span className="text-xs font-bold uppercase tracking-widest">Ajustes</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border-sep px-8 min-h-[64px] flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center h-full gap-8">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="hidden lg:flex p-2 bg-sidebar text-white rounded-lg hover:bg-stone-800 transition-all mr-2"
              >
                <Menu size={18} />
              </button>
            )}
            <NavItem 
              active={activeSection === 'editor'} 
              onClick={() => setActiveSection('editor')} 
              label="Escribir y Editar" 
            />
            <NavItem 
              active={activeSection === 'assets'} 
              onClick={() => setActiveSection('assets')} 
              label="Artes del Libro" 
            />
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-stone-400 italic font-serif uppercase tracking-widest hidden md:block">
              {currentProject ? '42,840 Palabras' : 'Nuevo Manuscrito'}
            </span>
            <button 
              onClick={() => setShowPreview(true)}
              className="bg-ink text-white text-[10px] font-bold uppercase tracking-[0.15em] px-5 py-2.5 rounded shadow-sm hover:bg-stone-800 transition-colors"
            >
              Previsualizar Libro
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-paper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-8 md:p-12 lg:p-16 max-w-[1400px] mx-auto"
            >
              {activeSection === 'dashboard' && <Dashboard setProject={handleSetProject} currentProject={currentProject} onSectionChange={setActiveSection} />}
              {activeSection === 'editor' && <Editor project={currentProject} onUpdate={handleSetProject} />}
              {activeSection === 'assets' && <Assets project={currentProject} />}
              {activeSection === 'settings' && <SettingsView project={currentProject} onUpdate={handleSetProject} onDelete={handleDeleteProject} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {showPreview && (
            <Preview project={currentProject} onClose={() => setShowPreview(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-8 left-8 z-50 w-12 h-12 bg-ink text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-stone-800 transition-all md:hidden"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
}

function NavItem({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`text-sm font-medium h-full flex items-center px-1 border-b-2 transition-all duration-300 ${active ? 'border-amber-600 text-ink' : 'border-transparent text-stone-400 hover:text-ink'}`}
    >
      {label}
    </button>
  );
}
