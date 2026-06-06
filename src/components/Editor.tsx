/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as mammoth from 'mammoth';
import { 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Maximize2, 
  Trash2,
  Highlighter,
  Check,
  RefreshCw,
  Type,
  Scissors,
  Maximize,
  Download,
  Upload,
  FileText,
  X,
  Plus,
  Edit3,
  SearchCheck,
  Volume2,
  List,
  Wand2,
  Compass,
  Flame,
  Image as ImageIcon,
  BookOpen,
  Shuffle,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGemini } from '../lib/gemini';
import { BookProject } from '../types';

// Defensive parser to safely handle extra backticks or markdown text around JSON blocks
const safelyExtractAndParseJSON = (text: string | null | undefined): any => {
  if (!text) return {};
  const cleanedText = text.trim();
  
  // 1. Try to parse directly
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    // Continue
  }

  // 2. Try removing markdown wrap blocks
  try {
    const withoutMarkdown = cleanedText.replace(/^\s*```json\s*|\s*```\s*$/g, '').replace(/```json|```/g, '').trim();
    return JSON.parse(withoutMarkdown);
  } catch (e) {
    // Continue
  }

  // 3. Extract boundary block starting from first '{' to last '}'
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleanedText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted);
    } catch (e) {
      console.warn("Fallo secundario al parsear subsegmento JSON de límites:", e);
    }
  }

  // 4. Try basic replacements for escaped control symbols if still failing
  try {
    const basicUnescape = cleanedText.replace(/\\n/g, ' ').replace(/\\r/g, '').trim();
    return JSON.parse(basicUnescape);
  } catch (e) {
    // Return empty fallback or bubble up error cleanly
  }

  throw new Error("No se pudo extraer una estructura JSON válida de la respuesta del modelo de lenguaje.");
};

interface EditorProps {
  project: BookProject | null;
  onUpdate?: (p: BookProject) => void;
}

export default function Editor({ project, onUpdate }: EditorProps) {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  
  // Style / Presentation States
  const [fontFamily, setFontFamily] = useState('font-serif');
  const [fontSize, setFontSize] = useState('text-xl');
  const [textColor, setTextColor] = useState('text-stone-700');
  const [lineHeight, setLineHeight] = useState('leading-relaxed');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Selection States
  const [selection, setSelection] = useState({ text: '', start: 0, end: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  
  // ToC / Navigation State
  const [showToC, setShowToC] = useState(false);

  // Sound TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Selection-based Editorial Corrector
  const [showSelectionEditorial, setShowSelectionEditorial] = useState(false);
  const [isAnalyzingSelectionEditorial, setIsAnalyzingSelectionEditorial] = useState(false);
  const [selectedImprovementTab, setSelectedImprovementTab] = useState<'polish' | 'creative' | 'elevate' | 'emotivity'>('polish');
  const [selectionEditorialData, setSelectionEditorialData] = useState<{
    originalText: string;
    spellingGrammar: { original: string; errorType: string; explanation: string; suggestion: string }[];
    styleOverview: string;
    suggestions: {
      polish: string;
      creative: string;
      elevate: string;
      emotivity: string;
    };
  } | null>(null);

  const [showVisuals, setShowVisuals] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(project?.currentChapter || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Success Blueprint States
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [activeFormulaId, setActiveFormulaId] = useState<string>('hero');
  const [selectedBeatIndex, setSelectedBeatIndex] = useState<number | null>(null);
  const [generatingBeatIndex, setGeneratingBeatIndex] = useState<number | null>(null);
  const [beatinspiration, setBeatInspiration] = useState<{[key: string]: string}>({});

  // Hook Analyzer States
  const [showHookAnalyzer, setShowHookAnalyzer] = useState(false);
  const [isAnalyzingHook, setIsAnalyzingHook] = useState(false);
  const [hookAnalysis, setHookAnalysis] = useState<{
    curiosityScore: number;
    sensoryScore: number;
    stakesScore: number;
    voiceScore: number;
    globalScore: number;
    diagnosis: string;
    strengths: string[];
    improvements: string[];
    rewriteProposal: string;
  } | null>(null);

  // Synonym States
  const [showSynonyms, setShowSynonyms] = useState(false);
  const [isSearchingSynonyms, setIsSearchingSynonyms] = useState(false);
  const [synonymsData, setSynonymsData] = useState<{
    word: string;
    contextExplanation: string;
    synonyms: { word: string; tone: string; explanation: string }[];
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedContent = useRef('');

  const closeAllPanels = () => {
    setShowToC(false);
    setShowSelectionEditorial(false);
    setShowVisuals(false);
    setShowBlueprints(false);
    setShowHookAnalyzer(false);
    setShowSynonyms(false);
    setShowFormatDropdown(false);
  };

  const generateBeatSuggestion = async (formulaId: string, beatIndex: number, beatName: string, beatDesc: string) => {
    if (!project) return;
    setGeneratingBeatIndex(beatIndex);
    
    try {
      const ai = getGemini();
      const prompt = `Actúa como un estratega literario de best sellers y editor del más alto nivel.
      Estás diseñando la estructura de la obra titulada "${project.title}" (Género: ${project.genre}). Sinopsis actual: "${project.synopsis}".
      
      TAREA:
      Genera una idea narrativa de alta gama, creativa, original e irresistible para el hito estructural "${beatName}" (${beatDesc}) dentro de la fórmula de estructuración narratológica seleccionada.
      
      PAUTAS ESPECÍFICAS:
      - Adapta la idea perfectamente al género "${project.genre}" y a la sinopsis proporcionada.
      - Ofrece un giro dramático o un matiz psicológico sumamente tenso y comercial (tipo best-seller).
      - Escribe en un tono formal, literario, entusiasta e inspirador. Suministra ideas específicas sobre acciones del protagonista, la atmósfera y el impacto temático de este hito.
      - Responde directamente con la recomendación literaria de un párrafo y medio sin saludos ni preámbulos.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const text = response.text || "No se pudo generar la idea estructural.";
      setBeatInspiration(prev => ({
        ...prev,
        [`${formulaId}_${beatIndex}`]: text
      }));
    } catch (error) {
      console.error("Error al generar inspiración de hito:", error);
      alert("Ocurrió un error al contactar al motor de IA.");
    } finally {
      setGeneratingBeatIndex(null);
    }
  };

  const addBeatAsChapter = (beatName: string, text: string) => {
    const defaultPrefix = `Hito: ${beatName}`;
    const chapterName = prompt("Introduce el nombre final para este capítulo inspirado en el hito:", defaultPrefix);
    if (!chapterName) return;

    const markdownHeader = `\n\n# ${chapterName.trim()}\n\n*Nota del Estratega sobre este hito de la trama:\n${text}*\n\nComienza a desarrollar la narración de este punto clave aquí...\n`;
    
    const appendOffset = content.length;
    const newContent = content.trimEnd() + markdownHeader;
    setContent(newContent);
    closeAllPanels();
    
    setTimeout(() => {
      scrollToHeader({ text: chapterName.trim(), offset: appendOffset + 2 });
    }, 150);
  };

  const analyzeHook = async () => {
    const textToAnalyze = selection.text || content.substring(0, 1000);
    if (!textToAnalyze || !textToAnalyze.trim()) {
      alert("Por favor escribe prosa o ingresa fragmentos para poder auditar el gancho.");
      return;
    }

    setIsAnalyzingHook(true);
    setHookAnalysis(null);
    closeAllPanels();
    setShowHookAnalyzer(true);

    try {
      const ai = getGemini();
      const prompt = `Eres un editor literario de prestigio supremo, cazatalentos literarios y especialista en Best-sellers de la lista de New York Times.
      Tu misión es realizar una auditoría técnica implacable pero constructiva del primer plano o gancho inicial ("initial hook") suministrado abajo.
      
      TEXTO A AUDITAR:
      """
      ${textToAnalyze}
      """
      
      EVALÚA LOS SIGUIENTES 4 CRITERIOS (de 0 a 100 cada uno):
      1. curiosityScore (Brecha de Curiosidad): ¿Instaura una pregunta crucial o misterio sin dar explicaciones aburridas?
      2. sensoryScore (Evocación Sensorial): ¿Sumerge al lector mediante texturas, olores, sonidos o imágenes viscerales en vez de relatar pasivamente ("show, don't tell")?
      3. stakesScore (Apuestas de Tensión): ¿Insinúa peligro, un secreto, tensión o lo que el personaje tiene por perder inmediatamente?
      4. voiceScore (Voz Narrativa/Estilo): ¿Tiene una identidad fuerte, ritmo excelente y un léxico elegante/vibrante en lugar de genérico?
      
      REGLAS DE RESPUESTA CRÍTICAS:
      - Responde ÚNICAMENTE con un objeto estructurado en formato JSON.
      - RESPOND CON EL SIGUIENTE ESQUEMA EXACTO:
      {
        "curiosityScore": número entre 0 y 100,
        "sensoryScore": número entre 0 y 100,
        "stakesScore": número entre 0 y 100,
        "voiceScore": número entre 0 y 100,
        "globalScore": promedio de los anteriores de 1 a 100,
        "diagnosis": "Diagnóstico detallado de 1-2 párrafos sobre por qué funciona o decae el gancho",
        "strengths": ["fortaleza 1 del fragmento", "fortaleza 2 del fragmento"],
        "improvements": ["acción correctiva 1 de estilo", "acción correctiva 2 de estilo"],
        "rewriteProposal": "El fragmento completo reescrito meticulosamente por ti aplicando el máximo potencial estético del show-dont-tell y brecha de curiosidad comercial"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = safelyExtractAndParseJSON(response.text);

      setHookAnalysis({
        curiosityScore: parsed.curiosityScore || 50,
        sensoryScore: parsed.sensoryScore || 50,
        stakesScore: parsed.stakesScore || 50,
        voiceScore: parsed.voiceScore || 50,
        globalScore: parsed.globalScore || 50,
        diagnosis: parsed.diagnosis || "No se pudo generar un diagnóstico.",
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        rewriteProposal: parsed.rewriteProposal || "No se generó propuesta de reescritura."
      });
      
    } catch (error) {
      console.error("Error al analizar gancho:", error);
      alert("No se pudo completar la auditoría del gancho inicial.");
      setShowHookAnalyzer(false);
    } finally {
      setIsAnalyzingHook(false);
    }
  };

  const applyHookRewrite = () => {
    if (!hookAnalysis) return;
    
    if (selection.text) {
      const start = selection.start;
      const end = selection.end;
      const newContent = 
        content.substring(0, start) + 
        hookAnalysis.rewriteProposal + 
        content.substring(end);
      setContent(newContent);
    } else {
      const initialCharactersLength = Math.min(content.length, 1000);
      const newContent = hookAnalysis.rewriteProposal + content.substring(initialCharactersLength);
      setContent(newContent);
    }
    
    setHookAnalysis(null);
    setShowHookAnalyzer(false);
    setShowContextMenu(false);
  };

  useEffect(() => {
    if (project?.initialContent) {
      setContent(project.initialContent);
      lastSavedContent.current = project.initialContent;
    }
  }, [project?.id]);

  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Robust Autosave system
  useEffect(() => {
    if (!project || !onUpdate) return;

    const inactivityTimer = setTimeout(() => {
      if (content !== lastSavedContent.current && content.trim() !== "") {
        saveProgress();
      }
    }, 3000);

    return () => clearTimeout(inactivityTimer);
  }, [content]);

  useEffect(() => {
    if (!project || !onUpdate) return;

    const periodicTimer = setInterval(() => {
      if (contentRef.current !== lastSavedContent.current && contentRef.current.trim() !== "") {
        saveProgress(contentRef.current);
      }
    }, 90000);

    return () => clearInterval(periodicTimer);
  }, [project?.id]);

  const saveProgress = (manualContent?: string) => {
    if (!project || !onUpdate) return;
    const contentToSave = manualContent || contentRef.current;
    
    if (contentToSave === lastSavedContent.current && project.currentChapter === currentChapter) return;
    
    setIsAutoSaving(true);
    lastSavedContent.current = contentToSave;
    
    onUpdate({
      ...project,
      initialContent: contentToSave,
      currentChapter: currentChapter,
      lastEdited: Date.now()
    });

    setLastSaved(Date.now());
    setTimeout(() => setIsAutoSaving(false), 2000);
  };

  const toggleListen = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = selection.text || content;
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const visualizeScene = async () => {
    const textToVisualize = selection.text || content.substring(0, 800);
    if (!textToVisualize) {
      alert("Por favor escribe prosa o ingresa fragmentos para poder generar una representación visual.");
      return;
    }

    setIsProcessing(true);
    try {
      const ai = getGemini();
      const prompt = `Actúa como un artista conceptual de portadas y literatura de prestigio. Basado en este fragmento, genera una imagen inspiradora que capture la atmósfera, el simbolismo y el tono.
      FRAGMENTO: "${textToVisualize}"
      ESTILO: Cinematográfico, óleo profesional, alta gama, iluminación dramática artística. Sin texto legible.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: prompt }]
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imgUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImage(imgUrl);
          closeAllPanels();
          setShowVisuals(true);
          break;
        }
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo generar la ilustración de escena en este momento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = async () => {
    if (!editorRef.current || !project) return;
    
    setIsProcessing(true);
    try {
      const buttons = editorRef.current.querySelectorAll('button');
      buttons.forEach(b => (b as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(editorRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${project.title.replace(/\s+/g, '_')}_manuscrito.pdf`);
      
      buttons.forEach(b => (b as HTMLElement).style.display = '');
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      if (file.name.endsWith('.pages')) {
        alert("El formato .pages es propietario y complejo. Por favor, exporta tu obra a .docx (Word) para leer con precisión.");
        return;
      }
      
      const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      if (res.value) {
        setContent(res.value);
        closeAllPanels();
        setShowToC(true);
      }
    } catch (error) {
      console.error("Error cargando el archivo:", error);
      alert("No se pudo leer el archivo. Asegúrate de que sea un archivo .docx válido.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelection = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const selectedText = value.substring(selectionStart, selectionEnd).trim();

    if (selectedText.length > 0) {
      setSelection({ text: selectedText, start: selectionStart, end: selectionEnd });
      setShowContextMenu(true);
    } else {
      setShowContextMenu(false);
    }
  };

  const fetchSynonyms = async () => {
    const selectedWord = selection.text;
    if (!selectedWord || !selectedWord.trim()) {
      alert("Por favor, selecciona una palabra o frase del texto para buscar sinónimos.");
      return;
    }

    setIsSearchingSynonyms(true);
    setSynonymsData(null);
    closeAllPanels();
    setShowSynonyms(true);

    try {
      const ai = getGemini();
      const contextSentence = content.substring(
        Math.max(0, selection.start - 120),
        Math.min(content.length, selection.end + 120)
      );

      const prompt = `Actúas como un tesauro literario y filólogo de élite para novelistas de best sellers. He seleccionado la palabra o frase "${selectedWord}" en el siguiente contexto:
      "...${contextSentence}..."
      
      TAREA:
      Proporciona de 5 a 8 sinónimos o alternativas estilísticamente superiores para la selección "${selectedWord}".
      Los sinónimos deben encajar perfectamente en el contexto proporcionado en términos de género, género gramatical, número, y tono artístico o literario.
      Además, proporciona una mini explicación rápida de 1 línea de por qué cada sinónimo aportaría un matiz único y qué "vibra" o impacto evoca (e.g. sofisticado, melancólico, arcaico, dinámico).
      
      REGLAS CRÍTICAS DE RESPUESTA:
      - Responde EXCLUSIVAMENTE con un objeto estructurado en formato JSON. No incluyas explicaciones preliminares ni envoltorios fuera del objeto.
      - RESPOND CON EL SIGUIENTE ESQUEMA EXACTO:
      {
        "word": "${selectedWord}",
        "contextExplanation": "breve diagnóstico de cómo funciona la palabra actual en la oración",
        "synonyms": [
          {
            "word": "Sinónimo 1",
            "tone": "Lírico / Sofisticado / Evocativo",
            "explanation": "Por qué usarlo en este contexto"
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = safelyExtractAndParseJSON(response.text);

      setSynonymsData({
        word: parsed.word || selectedWord,
        contextExplanation: parsed.contextExplanation || "Palabra seleccionada para enriquecimiento.",
        synonyms: parsed.synonyms || []
      });

    } catch (error) {
      console.error("Error al buscar sinónimos:", error);
      alert("No se pudieron buscar los sinónimos en este momento.");
      setShowSynonyms(false);
    } finally {
      setIsSearchingSynonyms(false);
    }
  };

  const replaceSelectionWithSynonym = (synonymWord: string) => {
    const start = selection.start;
    const end = selection.end;
    const newContent = 
      content.substring(0, start) + 
      synonymWord + 
      content.substring(end);
    setContent(newContent);
    
    setSelection(prev => ({
      ...prev,
      text: synonymWord,
      end: start + synonymWord.length
    }));
  };

  const applyFormatSelection = (format: 'title' | 'chapter' | 'subtitle' | 'body' | 'quote' | 'bold' | 'italic') => {
    if (!selection.text) return;
    const start = selection.start;
    const end = selection.end;
    const trimmed = selection.text.trim();
    
    // Clean out existing block-level prefix characters (like #, ##, ###, >)
    let cleanRaw = trimmed.replace(/^(#{1,6}\s+|>\s+)/gm, '').trim();
    
    let formatted = '';
    switch (format) {
      case 'title':
        formatted = `\n\n# ${cleanRaw}\n\n`;
        break;
      case 'chapter':
        formatted = `\n\n## ${cleanRaw}\n\n`;
        break;
      case 'subtitle':
        formatted = `\n\n### ${cleanRaw}\n\n`;
        break;
      case 'body':
        formatted = `\n\n${cleanRaw}\n\n`;
        break;
      case 'quote':
        formatted = `\n\n> ${cleanRaw}\n\n`;
        break;
      case 'bold':
        formatted = `**${selection.text}**`;
        break;
      case 'italic':
        formatted = `*${selection.text}*`;
        break;
      default:
        formatted = selection.text;
    }
    
    const newContent = 
      content.substring(0, start) + 
      formatted + 
      content.substring(end);
      
    setContent(newContent);
    setShowContextMenu(false);
    setShowFormatDropdown(false);
    
    // If we changed to Title or Chapter, we can also set the current chapter heading focus
    if (format === 'title' || format === 'chapter') {
      setCurrentChapter(cleanRaw);
    }
  };

  const processText = async (action: 'polish' | 'emotion' | 'summarize' | 'expand') => {
    const textToProcess = selection.text || content;
    if (!textToProcess) return;
    
    setIsProcessing(true);
    try {
      const ai = getGemini();
      let prompt = '';

      switch (action) {
        case 'polish':
          prompt = `Como editor literario del más alto prestigio, pule, estiliza e incrementa la fluidez poética y rítmica del siguiente fragmento. Elimina redundancia y eleva el vocabulario:\n\n"${textToProcess}"`;
          break;
        case 'emotion':
          prompt = `Como Novelista Consagrado, reescribe el siguiente fragmento para intensificar sustancialmente la atmósfera psicológica, la tensión dramática y la expresividad sensorial y emocional:\n\n"${textToProcess}"`;
          break;
        case 'summarize':
          prompt = `Logra una síntesis perfecta y condensada de este fragmento sin perder su peso trágico y lírico:\n\n"${textToProcess}"`;
          break;
        case 'expand':
          prompt = `Expande este fragmento literario aportando ricas descripciones espaciales, matices ambientales, texturas sensoriales y monólogo interior:\n\n"${textToProcess}"`;
          break;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setResult(response.text || "No se pudo procesar.");
    } catch (error) {
      console.error(error);
      setResult("Error en la conexión con el motor de IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyChanges = () => {
    if (!result) return;

    if (selection.text) {
      const newContent = 
        content.substring(0, selection.start) + 
        result + 
        content.substring(selection.end);
      setContent(newContent);
    } else {
      setContent(result);
    }
    setResult(null);
    setShowContextMenu(false);
  };

  const analyzeSelectionEditorial = async () => {
    const textToAnalyze = selection.text;
    if (!textToAnalyze || !textToAnalyze.trim() || isAnalyzingSelectionEditorial) return;
    
    setIsAnalyzingSelectionEditorial(true);
    setSelectionEditorialData(null);
    closeAllPanels();
    setShowSelectionEditorial(true);

    try {
      const ai = getGemini();
      const prompt = `Actúa como un corrector de estilo premium e intelectual técnico filológico de altísimo nivel. Estás ayudando a pulir una obra titulada "${project?.title || 'Sin Título'}" (${project?.genre ? `Género: ${project.genre}` : ''}).
      
      TAREA:
      1. Realiza una curación minuciosa de ortografía, gramática, puntuación, vicios del lenguaje (cacofonía, queísmo, etc.) y debilidades estilísticas sobre el fragmento de texto proporcionado.
      2. Genera una apreciación o diagnóstico del estilo literario actual de este fragmento en 1 o 2 párrafos.
      3. Ofrece cuatro versiones reescritas impecables, respetando las intenciones subyacentes del autor pero transformadas mediante distintos enfoques creativos para aportarle personalidad:
         - Pulido Integral (polish): Un texto depurado, ágil, sin redundancias, donde cada palabra cuenta. El ritmo es fluido y orgánico.
         - Matiz Creativo (creative): Una versión que aporta metáforas ricas, figuras literarias sensoriales, colores, sonoridades y texturas para alimentar la imaginación.
         - Elevar Tono (elevate): Una prosa magnánima, con vocabulario prestigioso, giros construidos para otorgarle madurez literaria y distinción clásica.
         - Mejorar Emotividad (emotivity): Una reescritura que intensifica los sentimientos latentes, elevando el dramatismo, la resonancia melancólica, el suspenso interior o la efusividad poética del pasaje.

      REGLAS CRÍTICAS DE RESPUESTA:
      - Responde EXCLUSIVAMENTE con un único objeto estructurado en formato JSON. No incluyas explicaciones preliminares ni envoltorios fuera del objeto.
      - Ajústate rigurosamente al siguiente esquema TypeScript:
      {
        "spellingGrammar": [
          {
            "original": "palabra o frase exacta con falla o error identificable (debe existir literalmente en el texto original)",
            "errorType": "ortografía" | "gramática" | "estilo",
            "explanation": "explicación de la debilidad ortográfica, gramatical o de estilo identificada",
            "suggestion": "corrección precisa para subsanar dicha debilidad"
          }
        ],
        "styleOverview": "comentario estilístico general",
        "suggestions": {
          "polish": "Texto entero reescrito bajo Pulido Integral",
          "creative": "Texto entero reescrito bajo Matiz Creativo",
          "elevate": "Texto entero reescrito bajo Elevar Tono",
          "emotivity": "Texto entero reescrito bajo Mejorar Emotividad"
        }
      }

      TEXTO DE SELECCIÓN A ANALIZAR:
      """
      ${textToAnalyze}
      """`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const analysis = safelyExtractAndParseJSON(response.text);
      
      setSelectionEditorialData({
        originalText: textToAnalyze,
        spellingGrammar: analysis.spellingGrammar || [],
        styleOverview: analysis.styleOverview || 'Se ha completado el análisis de estilo y voz lírica de la selección.',
        suggestions: analysis.suggestions || {
          polish: textToAnalyze,
          creative: textToAnalyze,
          elevate: textToAnalyze,
          emotivity: textToAnalyze
        }
      });
      setSelectedImprovementTab('polish');
    } catch (error) {
      console.error("Error al realizar el análisis editorial contextual:", error);
    } finally {
      setIsAnalyzingSelectionEditorial(false);
    }
  };

  const applySelectionEditorialImprovement = (improvedText: string) => {
    if (!selectionEditorialData) return;
    const start = selection.start;
    const end = selection.end;
    const newContent = 
      content.substring(0, start) + 
      improvedText + 
      content.substring(end);
    setContent(newContent);
    
    setSelectionEditorialData(null);
    setShowSelectionEditorial(false);
    setShowContextMenu(false);
  };

  const correctSelectionEditorialSpelling = (originalTerm: string, suggestedTerm: string) => {
    if (!selectionEditorialData) return;
    
    const selectedTextSegment = selectionEditorialData.originalText;
    const updatedSelectedText = selectedTextSegment.replace(originalTerm, suggestedTerm);
    
    const start = selection.start;
    const newContent = 
      content.substring(0, start) + 
      updatedSelectedText + 
      content.substring(selection.end);
    
    setContent(newContent);
    
    const updatedSpellingGrammar = selectionEditorialData.spellingGrammar.filter(
      item => item.original !== originalTerm
    );
    
    setSelection(prev => ({
      ...prev,
      text: updatedSelectedText,
      end: start + updatedSelectedText.length
    }));

    setSelectionEditorialData({
      ...selectionEditorialData,
      originalText: updatedSelectedText,
      spellingGrammar: updatedSpellingGrammar
    });
  };

  const makeSelectionChapter = () => {
    if (!selection.text || !selection.text.trim()) return;
    const start = selection.start;
    const end = selection.end;
    
    const trimmed = selection.text.trim();
    const isHeadingAlready = trimmed.startsWith('#');
    const formattedChapter = isHeadingAlready ? `\n\n${trimmed}\n\n` : `\n\n# ${trimmed}\n\n`;
    
    const newContent = 
      content.substring(0, start) + 
      formattedChapter + 
      content.substring(end);
      
    setContent(newContent);
    setShowContextMenu(false);
    
    const cleanTitle = isHeadingAlready ? trimmed.replace(/^#+\s+/, '') : trimmed;
    setCurrentChapter(cleanTitle);
  };

  const addNewChapter = () => {
    const chapterName = prompt("Introduce el nombre o título para el nuevo capítulo:");
    if (!chapterName || !chapterName.trim()) return;
    
    const lvl1Count = toc.filter(t => t.level === 1).length;
    const defaultPrefix = `Capítulo ${lvl1Count + 1}: `;
    
    let finalTitle = chapterName.trim();
    if (!/^(cap[íi]tulo|chapter|escena|scene)\b/i.test(finalTitle)) {
      finalTitle = `${defaultPrefix}${finalTitle}`;
    }
    
    const chapterHeading = `\n\n# ${finalTitle}\n\nEscribe la narración del nuevo capítulo aquí...\n`;
    
    const appendOffset = content.length;
    const newContent = content.trimEnd() + chapterHeading;
    setContent(newContent);
    
    setTimeout(() => {
      scrollToHeader({ text: finalTitle, offset: appendOffset + 2 });
    }, 150);
  };

  const renameChapterInText = (entry: { text: string, level: number, offset: number }) => {
    const newName = prompt(`Cambiar nombre del capítulo "${entry.text}" a:`, entry.text);
    if (!newName || !newName.trim() || newName.trim() === entry.text) return;
    
    const lines = content.split('\n');
    let updated = false;
    
    const updatedLines = lines.map(line => {
      if (updated) return line;
      
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch && headerMatch[2].trim() === entry.text) {
        updated = true;
        return `${headerMatch[1]} ${newName.trim()}`;
      }
      
      const labelMatch = line.match(/^(cap[íi]tulo|chapter|escena|scene)\s\s*([\w\d\s]+)/i);
      if (labelMatch && line.trim() === entry.text) {
        updated = true;
        return newName.trim();
      }
      return line;
    });
    
    if (updated) {
      setContent(updatedLines.join('\n'));
      if (currentChapter === entry.text) {
        setCurrentChapter(newName.trim());
      }
    }
  };

  const deleteChapterFromText = (entry: { text: string, level: number, offset: number }) => {
    const confirmDelete = confirm(`¿Estás seguro de que deseas quitar el capítulo "${entry.text}" de la estructura del libro?\n\nEsto removerá la marca de título de la estructura del índice.`);
    if (!confirmDelete) return;
    
    const lines = content.split('\n');
    let deleted = false;
    
    const updatedLines = lines.filter(line => {
      if (deleted) return true;
      
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch && headerMatch[2].trim() === entry.text) {
        deleted = true;
        return false;
      }
      
      const labelMatch = line.match(/^(cap[íi]tulo|chapter|escena|scene)\s\s*([\w\d\s]+)/i);
      if (labelMatch && line.trim() === entry.text) {
        deleted = true;
        return false;
      }
      
      return true;
    });
    
    if (deleted) {
      setContent(updatedLines.join('\n'));
      if (currentChapter === entry.text) {
        setCurrentChapter('');
      }
    }
  };

  const toc = (() => {
    const lines = content.split('\n');
    const entries: { text: string, level: number, offset: number }[] = [];
    let currentOffset = 0;
    lines.forEach((line) => {
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      const labelMatch = line.match(/^(cap[íi]tulo|chapter|escena|scene)\s+([\w\d\s]+)/i);
      
      if (headerMatch) {
        entries.push({
          level: headerMatch[1].length,
          text: headerMatch[2].trim(),
          offset: currentOffset
        });
      } else if (labelMatch) {
        entries.push({
          level: 2,
          text: line.trim(),
          offset: currentOffset
        });
      }
      currentOffset += line.length + 1;
    });
    return entries;
  })();

  const scrollToHeader = (entry: { text: string, offset: number }) => {
    if (!textareaRef.current) return;
    setCurrentChapter(entry.text);
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(entry.offset, entry.offset);
    const lineHeightPx = 28;
    const linesBefore = content.substring(0, entry.offset).split('\n').length;
    textareaRef.current.scrollTop = (linesBefore * lineHeightPx) - 100;
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles size={64} className="text-stone-200 mb-6" />
        <h2 className="text-2xl font-serif font-bold text-stone-400 font-medium">Inicia un proyecto para acceder al Editor Creativo.</h2>
      </div>
    );
  }

  const isAnySidebarOpen = showToC || showSelectionEditorial || showVisuals || showBlueprints || showHookAnalyzer || showSynonyms;

  return (
    <div className={`flex flex-col lg:flex-row gap-12 min-h-full ${fullScreen ? 'fixed inset-0 z-50 bg-paper p-8 overflow-y-auto' : ''}`}>
      {/* Manuscript Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {!fullScreen && (
          <header className="mb-12 flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700">Edición limpia de alta gama</h3>
              <h2 className="text-4xl font-serif font-bold italic leading-tight">Manuscrito de la Obra</h2>
            </div>
            <div className="flex gap-2 items-center">
              {toc.length > 0 && (
                <div className="relative group mr-4">
                  <button 
                    className="flex items-center gap-2 px-3 py-2 bg-stone-100/50 hover:bg-stone-100 rounded-lg transition-all text-stone-600"
                    title="Navegación de Capítulos"
                  >
                    <List size={16} className="text-amber-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest max-w-[120px] truncate">
                      {currentChapter || 'Capítulos'}
                    </span>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border-sep shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                    {toc.map((entry, i) => (
                      <button 
                        key={i}
                        onClick={() => scrollToHeader(entry)}
                        className="w-full text-left p-3 hover:bg-amber-50 border-b border-stone-50 flex items-start gap-3 transition-colors"
                      >
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.level === 1 ? 'bg-amber-600' : 'bg-stone-300'}`} />
                        <span className={`text-[11px] font-serif leading-tight ${entry.text === currentChapter ? 'text-amber-700 font-bold' : 'text-stone-600'}`}>
                          {entry.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="cursor-pointer p-2 text-stone-300 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-all" title="Importar Manuscrito (.docx)">
                <Upload size={18} />
                <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={exportToPDF}
                className="p-2 text-stone-300 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-all"
                title="Exportar a PDF"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={toggleListen}
                className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-amber-100 text-amber-700 animate-pulse' : 'text-stone-300 hover:text-amber-600 hover:bg-stone-100'}`}
                title={isSpeaking ? "Detener Narración" : "Escuchar Manuscrito (TTS)"}
              >
                <Volume2 size={18} />
              </button>
              <button 
                onClick={() => {
                  const nextState = !showBlueprints;
                  closeAllPanels();
                  setShowBlueprints(nextState);
                }}
                className={`p-2 rounded-lg transition-all ${showBlueprints ? 'bg-amber-100 text-amber-700' : 'text-stone-300 hover:text-amber-600 hover:bg-stone-100'}`}
                title="Fórmulas Bestseller"
              >
                <Compass size={18} />
              </button>
              <button 
                onClick={() => {
                  const nextState = !showHookAnalyzer;
                  closeAllPanels();
                  setShowHookAnalyzer(nextState);
                }}
                className={`p-2 rounded-lg transition-all ${showHookAnalyzer ? 'bg-amber-100 text-amber-700' : 'text-stone-300 hover:text-amber-600 hover:bg-stone-100'}`}
                title="Auditoría de Ganchos"
              >
                <Flame size={18} />
              </button>
              <button 
                onClick={() => {
                  const nextState = !showVisuals;
                  closeAllPanels();
                  setShowVisuals(nextState);
                }}
                className={`p-2 rounded-lg transition-all ${showVisuals ? 'bg-amber-100 text-amber-700' : 'text-stone-300 hover:text-amber-600 hover:bg-stone-100'}`}
                title="Ilustración de Escena AI"
              >
                <ImageIcon size={18} />
              </button>
              <button 
                onClick={() => {
                  const nextState = !showToC;
                  closeAllPanels();
                  setShowToC(nextState);
                }}
                className={`p-2 rounded-lg transition-all ${showToC ? 'bg-amber-100 text-amber-700' : 'text-stone-300 hover:text-ink hover:bg-stone-100'}`}
                title="Índice de Capítulos"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className={`p-2 rounded-lg transition-all ${showStyleMenu ? 'bg-amber-100 text-amber-700' : 'text-stone-300 hover:text-ink hover:bg-stone-100'}`}
                title="Ajustes Tipográficos"
              >
                <Type size={18} />
              </button>
              <button 
                onClick={() => setFullScreen(!fullScreen)}
                className="p-2 text-stone-300 hover:text-ink hover:bg-stone-100 rounded-lg transition-all"
                title="Pantalla Completa"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </header>
        )}

        <div className="relative mb-6">
          <AnimatePresence>
            {showStyleMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 right-0 z-30 bg-white border border-border-sep shadow-2xl rounded-2xl p-6 flex flex-wrap gap-8 items-start min-w-[300px]"
              >
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block">Tipografía</span>
                  <div className="flex gap-2">
                    <StyleToggle active={fontFamily === 'font-serif'} onClick={() => setFontFamily('font-serif')} label="Serif" />
                    <StyleToggle active={fontFamily === 'font-sans'} onClick={() => setFontFamily('font-sans')} label="Sans" />
                    <StyleToggle active={fontFamily === 'font-mono'} onClick={() => setFontFamily('font-mono')} label="Mono" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block">Tamaño</span>
                  <div className="flex gap-2">
                    <StyleToggle active={fontSize === 'text-lg'} onClick={() => setFontSize('text-lg')} label="A-" />
                    <StyleToggle active={fontSize === 'text-xl'} onClick={() => setFontSize('text-xl')} label="Normal" />
                    <StyleToggle active={fontSize === 'text-2xl'} onClick={() => setFontSize('text-2xl')} label="A+" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block">Color de Prosa</span>
                  <div className="flex gap-2">
                    <ColorToggle active={textColor === 'text-stone-700'} onClick={() => setTextColor('text-stone-700')} color="bg-stone-700" />
                    <ColorToggle active={textColor === 'text-stone-900'} onClick={() => setTextColor('text-stone-900')} color="bg-stone-900" />
                    <ColorToggle active={textColor === 'text-amber-900/90'} onClick={() => setTextColor('text-amber-900/90')} color="bg-amber-900" />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block">Interlineado</span>
                  <div className="flex gap-2">
                    <StyleToggle active={lineHeight === 'leading-normal'} onClick={() => setLineHeight('leading-normal')} label="Simple" />
                    <StyleToggle active={lineHeight === 'leading-relaxed'} onClick={() => setLineHeight('leading-relaxed')} label="Relajado" />
                    <StyleToggle active={lineHeight === 'leading-loose'} onClick={() => setLineHeight('leading-loose')} label="Espacioso" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={editorRef} className={`w-full flex-grow relative ${fontFamily} ${fontSize} ${textColor} ${lineHeight} flex flex-col`}>
          <textarea
            ref={textareaRef}
            className="w-full h-[65vh] bg-transparent outline-none border-none resize-none overflow-y-auto scroll-smooth custom-scrollbar pr-4 text-justify select-text focus:ring-0"
            placeholder="Escribe las páginas de tu obra legendaria aquí... Selecciona cualquier segmento para desplegar las opciones editoriales tácticas del Atelier del Libro."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleSelection}
            id="editor-manuscript-canvas"
          />

          <AnimatePresence>
            {showContextMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-border-sep shadow-2xl rounded-xl p-2 flex gap-1 z-30 ring-4 ring-amber-500/5 items-center"
              >
                <div className="px-3 py-1 mr-2 border-r border-stone-100 flex items-center gap-2">
                  <Highlighter size={14} className="text-amber-600" />
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-tighter">Selección</span>
                </div>
                <ContextButton icon={<SearchCheck size={14} className="text-amber-600 animate-pulse" />} onClick={analyzeSelectionEditorial} title="Editor Táctico (Ortografía, Reescrituras)" />
                <ContextButton icon={<BookOpen size={14} className="text-amber-800 animate-pulse" />} onClick={fetchSynonyms} title="Buscar Sinónimos de Precisión" />
                
                {/* Word-style Format Selector Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-stone-600 hover:bg-amber-50 rounded-lg hover:text-amber-700 font-sans font-bold transition-all ${showFormatDropdown ? 'bg-amber-50 text-amber-700' : ''}`}
                    title="Estilos de Formato (como en Word)"
                  >
                    <Type size={14} className="text-amber-700" />
                    <span>Estilos</span>
                    <ChevronDown size={10} className="text-stone-400" />
                  </button>
                  
                  <AnimatePresence>
                    {showFormatDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-stone-200/80 shadow-2xl rounded-2xl p-2.5 z-50 flex flex-col gap-0.5 ring-4 ring-black/5"
                      >
                        <div className="px-2 py-1 mb-1 border-b border-stone-100">
                          <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest font-sans">Estilos tipo Word</span>
                        </div>
                        <button 
                          onClick={() => applyFormatSelection('title')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans font-bold flex items-center gap-2 group transition-colors"
                        >
                          <Heading1 size={13} className="text-amber-700 group-hover:scale-110 transition-transform" />
                          Título Principal (#)
                        </button>
                        <button 
                          onClick={() => applyFormatSelection('chapter')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans font-bold flex items-center gap-2 group transition-colors"
                        >
                          <Heading2 size={13} className="text-amber-700 group-hover:scale-110 transition-transform" />
                          Capítulo (##)
                        </button>
                        <button 
                          onClick={() => applyFormatSelection('subtitle')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans font-semibold flex items-center gap-2 group transition-colors"
                        >
                          <Heading3 size={13} className="text-amber-600 group-hover:scale-110 transition-transform" />
                          Subtítulo (###)
                        </button>
                        <button 
                          onClick={() => applyFormatSelection('body')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans flex items-center gap-2 group transition-colors"
                        >
                          <Type size={13} className="text-stone-500 group-hover:scale-110 transition-transform" />
                          Cuerpo (Normal)
                        </button>
                        <button 
                          onClick={() => applyFormatSelection('quote')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans italic flex items-center gap-2 group transition-colors"
                        >
                          <Quote size={13} className="text-stone-500 group-hover:scale-110 transition-transform" />
                          Cita Destacada
                        </button>
                        <div className="h-px bg-stone-100 my-1" />
                        <button 
                          onClick={() => applyFormatSelection('bold')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans font-bold flex items-center gap-2 group transition-colors"
                        >
                          <Bold size={13} className="text-stone-700 group-hover:scale-110 transition-transform" />
                          Negrita (Word)
                        </button>
                        <button 
                          onClick={() => applyFormatSelection('italic')}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-stone-850 hover:text-amber-800 text-xs font-sans italic flex items-center gap-2 group transition-colors"
                        >
                          <Italic size={13} className="text-stone-700 group-hover:scale-110 transition-transform" />
                          Cursiva (Word)
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ContextButton icon={<Flame size={14} className="text-amber-700 animate-pulse" />} onClick={analyzeHook} title="Auditar Gancho" />
                <ContextButton icon={<List size={14} className="text-amber-700" />} onClick={makeSelectionChapter} title="Convertir en Capítulo (#)" />
                <ContextButton icon={<Sparkles size={14} />} onClick={() => processText('polish')} title="Pulir Selección" />
                <ContextButton icon={<Wand2 size={14} />} onClick={() => processText('emotion')} title="Intensificar Emoción" />
                <ContextButton icon={<Scissors size={14} />} onClick={() => processText('summarize')} title="Resumir" />
                <ContextButton icon={<Maximize size={14} />} onClick={() => processText('expand')} title="Ampliar Detalle" />
                <div className="h-4 w-px bg-stone-100 mx-1" />
                <button 
                  onClick={() => setShowContextMenu(false)}
                  className="p-2 text-stone-300 hover:text-stone-600"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-8 border-t border-stone-50 flex items-center justify-between text-[10px] text-stone-300 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <span>{content.split(/\s+/).filter(Boolean).length} Palabras</span>
            {isAutoSaving && (
              <span className="text-amber-600 animate-pulse flex items-center gap-1 lowercase">
                <RotateCcw size={10} className="animate-spin" /> sincronizando...
              </span>
            )}
            {lastSaved && !isAutoSaving && (
              <span className="text-stone-400 lowercase flex items-center gap-1.5">
                <CheckCircle2 size={10} className="text-green-500" />
                Garantizado en la nube: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          <button 
            onClick={() => {
              saveProgress();
            }}
            className="text-stone-300 hover:text-amber-600 transition-all flex items-center gap-1.5 hover:bg-stone-50 px-3 py-1 rounded-full border border-transparent hover:border-stone-100"
          >
            <CheckCircle2 size={12} />
            Sincronizar Manualmente
          </button>
        </div>

        {/* Rapid Change Suggestion Box */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="mt-6 bg-white border border-border-sep p-5 rounded-2xl shadow-xl relative ring-1 ring-amber-500/10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {selection.text ? "Edición Rápida de Selección" : "Mejora Propuesta"}
                </span>
                <button onClick={() => setResult(null)} className="text-stone-300 hover:text-ink"><X size={12} /></button>
              </div>
              <div className="markdown-body prose-sm font-serif text-sm italic mb-4 max-h-[300px] overflow-y-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              <button 
                onClick={applyChanges}
                className="w-full bg-ink text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={12} /> {selection.text ? "Reemplazar Selección" : "Aplicar Cambios"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Right Sidebar Panels */}
      <AnimatePresence mode="wait">
        {isAnySidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 440, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative lg:border-l border-stone-100 flex-shrink-0 flex flex-col select-none h-[82vh] bg-white rounded-3xl"
          >
            <div className="flex items-center justify-between pb-6 border-b border-stone-50 p-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 font-sans tracking-widest">
                  {showToC ? "Estructura del Libro" : 
                   showSelectionEditorial ? "Análisis Editorial" : 
                   showVisuals ? "Inspiración Visual AI" : 
                   showBlueprints ? "Fórmulas Bestseller" : 
                   showSynonyms ? "Diccionario de Sinónimos" :
                   "Auditoría de Ganchos"}
                </span>
              </div>
              <button onClick={closeAllPanels} className="text-stone-300 hover:text-ink transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 scroll-smooth custom-scrollbar">
              <AnimatePresence mode="wait">
                {showVisuals && (
                  <motion.div
                    key="visuals"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="space-y-6"
                  >
                    {generatedImage ? (
                      <div className="space-y-6">
                        <div className="aspect-[3/4] bg-stone-100 rounded-3xl overflow-hidden shadow-2xl relative">
                          <img 
                            src={generatedImage} 
                            alt="Inspiración AI" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                            <p className="text-[10px] text-white/60 mb-1 uppercase font-bold tracking-widest">Atelier del Libro</p>
                            <h4 className="text-white font-serif italic text-lg leading-tight">{project.title}</h4>
                          </div>
                        </div>
                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-xs text-amber-900/70 font-serif italic leading-relaxed">
                          Esta proyección visual de la atmósfera de tu manuscrito te ayudará a mantener la consistencia estética y tonal de tu historia.
                        </div>
                        <button 
                          onClick={visualizeScene}
                          disabled={isProcessing}
                          className="w-full py-4 bg-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
                          Regenerar Visión
                        </button>
                      </div>
                    ) : (
                      <div className="py-20 text-center space-y-6 flex flex-col items-center">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                          <ImageIcon size={32} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-serif font-bold italic">Visualiza la Escena</h4>
                          <p className="text-xs text-stone-400 italic">Materializa una representación visual basada en la atmósfera descrita en tu prosa.</p>
                        </div>
                        <button 
                          onClick={visualizeScene}
                          className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200"
                        >
                          Generar Inspiración Visual
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {showToC && (
                  <motion.div 
                    key="toc"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest">Estructura del Libro</span>
                      <button
                        onClick={addNewChapter}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                      >
                        <Plus size={10} /> Nuevo Capítulo
                      </button>
                    </div>

                    <div className="space-y-1 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {toc.length > 0 ? toc.map((entry, i) => (
                        <div 
                          key={i}
                          className={`w-full group/chapter flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100/50 ${entry.level === 1 ? 'pl-2' : 'pl-6'}`}
                        >
                          <button 
                            onClick={() => scrollToHeader(entry)}
                            className="flex-grow text-left flex items-start gap-2.5 min-w-0 cursor-pointer"
                          >
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.level === 1 ? 'bg-amber-600' : 'bg-stone-300'}`} />
                            <span className={`text-[12px] font-serif leading-tight truncate group-hover/chapter:text-amber-700 ${entry.level === 1 ? 'font-bold text-stone-800' : 'text-stone-500'}`} title={entry.text}>
                              {entry.text}
                            </span>
                          </button>
                          
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/chapter:opacity-100 focus-within:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                renameChapterInText(entry);
                              }}
                              className="p-1 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Renombrar capítulo"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapterFromText(entry);
                              }}
                              className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Eliminar marca de capítulo"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-stone-300 opacity-50 space-y-4">
                          <FileText size={48} strokeWidth={1} />
                          <p className="text-xs font-serif italic text-stone-500">Ningún capítulo detectado en el manuscrito.</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50/20 border border-amber-100/30 rounded-2xl p-4 text-[10.5px] text-stone-500 leading-relaxed font-serif">
                      Toda línea precedida de un hashtag (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600 font-mono font-bold">#</code>) o con nombres clave como <strong className="text-stone-700">Capítulo</strong> es detectada automáticamente como una sección/capítulo para un índice ordenado.
                    </div>
                  </motion.div>
                )}

                {showSelectionEditorial && (
                  <motion.div
                    key="selection-editorial"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {isAnalyzingSelectionEditorial ? (
                      <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-75">
                        <RefreshCw size={32} className="animate-spin text-amber-600" />
                        <div className="text-center space-y-1">
                          <p className="text-[11px] uppercase font-black tracking-widest text-stone-600">Atelier Editorial...</p>
                          <p className="text-[9px] text-stone-400">Analizando ortografía, tono y estilos estilísticos</p>
                        </div>
                      </div>
                    ) : selectionEditorialData ? (
                      <div className="space-y-6">
                        <div className="bg-stone-50 p-4 border border-stone-100 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-stone-400">
                            <Highlighter size={12} />
                            <span className="text-[9px] uppercase font-black tracking-wider">Fragmento Seleccionado</span>
                          </div>
                          <p className="text-[11px] font-serif italic text-stone-650 leading-relaxed line-clamp-3">
                            "{selectionEditorialData.originalText}"
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Apreciación del Estilo</span>
                          <div className="bg-amber-50/15 border border-amber-100/20 rounded-xl p-4 font-serif text-[12px] text-stone-800 leading-relaxed">
                            {selectionEditorialData.styleOverview}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-55 pb-2">
                            <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">Corrector Filológico</span>
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 rounded-full border border-amber-100/50">
                              {selectionEditorialData.spellingGrammar.length} Hallazgos
                            </span>
                          </div>
                          {selectionEditorialData.spellingGrammar.length === 0 ? (
                            <div className="bg-green-50/20 border border-green-100/30 rounded-xl p-4 text-[11px] text-green-800 leading-normal font-serif">
                              El fragmento goza de una gramática e impecabilidad sobresalientes. No hay anomalías detectadas.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                              {selectionEditorialData.spellingGrammar.map((err, idx) => (
                                <div key={idx} className="bg-white border border-stone-100 rounded-xl p-4 space-y-2 hover:border-amber-200 transition-all">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-150">
                                      {err.errorType}
                                    </span>
                                    <button
                                      onClick={() => correctSelectionEditorialSpelling(err.original, err.suggestion)}
                                      className="px-2 py-0.5 bg-amber-55 hover:bg-amber-600 hover:text-white text-amber-800 rounded text-[9px] font-black uppercase tracking-wider transition-all"
                                    >
                                      Corregir
                                    </button>
                                  </div>
                                  <p className="text-xs text-stone-700 font-serif leading-relaxed">
                                    <span className="font-bold font-sans text-[9px] text-stone-400 uppercase mr-1">Inconsistencia:</span> "{err.original}"
                                  </p>
                                  <p className="text-[11px] text-stone-500 font-serif">{err.explanation}</p>
                                  <p className="text-[11px] text-green-700 font-serif font-bold">Sugerencia: "{err.suggestion}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-stone-100">
                          <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Reescrituras Avanzadas</span>
                          
                          <div className="grid grid-cols-4 gap-1 bg-stone-50 p-1 rounded-xl">
                            {(['polish', 'creative', 'elevate', 'emotivity'] as const).map(tabKey => (
                              <button
                                key={tabKey}
                                onClick={() => setSelectedImprovementTab(tabKey)}
                                className={`py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                                  selectedImprovementTab === tabKey 
                                    ? 'bg-white text-amber-700 shadow-sm' 
                                    : 'text-stone-400 hover:text-stone-600'
                                }`}
                              >
                                {tabKey === 'polish' ? 'Pulido' :
                                 tabKey === 'creative' ? 'Creativo' :
                                 tabKey === 'elevate' ? 'Elevar' : 'Emotivo'}
                              </button>
                            ))}
                          </div>

                          <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-4 space-y-4">
                            <p className="text-xs font-serif leading-relaxed text-stone-700 italic bg-white p-4 border border-stone-100 rounded-xl max-h-[160px] overflow-y-auto">
                              "{selectedImprovementTab === 'polish' ? selectionEditorialData.suggestions.polish :
                                selectedImprovementTab === 'creative' ? selectionEditorialData.suggestions.creative :
                                selectedImprovementTab === 'elevate' ? selectionEditorialData.suggestions.elevate :
                                selectionEditorialData.suggestions.emotivity}"
                            </p>

                            <button
                              onClick={() => applySelectionEditorialImprovement(
                                selectedImprovementTab === 'polish' ? selectionEditorialData.suggestions.polish :
                                selectedImprovementTab === 'creative' ? selectionEditorialData.suggestions.creative :
                                selectedImprovementTab === 'elevate' ? selectionEditorialData.suggestions.elevate :
                                selectionEditorialData.suggestions.emotivity
                              )}
                              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              Aplicar e Intercambiar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 opacity-50 space-y-4">
                        <Highlighter size={48} className="mx-auto text-stone-300" strokeWidth={1} />
                        <p className="text-xs font-serif italic text-stone-500">Selecciona algún fragmento en tu manuscrito y cliquea el icono de lupa para realizar un análisis editorial.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {showBlueprints && (
                  <motion.div 
                    key="blueprints"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-amber-700 tracking-widest font-sans font-bold">Atelier de Estructuración</p>
                      <h4 className="text-xl font-serif font-black italic">Hitos de Éxito</h4>
                      <p className="text-xs text-stone-400 italic font-serif leading-normal">Alinea tu obra con las estructuras de mayor impacto comercial y enganche.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-sans font-bold">Seleccionar Estructura</label>
                      <div className="grid grid-cols-3 gap-1 bg-stone-50 p-1 rounded-xl font-sans text-[8.5px]">
                        {BESTSELLER_FORMULAS.map(formula => (
                          <button
                            key={formula.id}
                            onClick={() => {
                              setActiveFormulaId(formula.id);
                              setSelectedBeatIndex(null);
                            }}
                            className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer font-sans font-bold ${
                              activeFormulaId === formula.id 
                                ? 'bg-white text-amber-700 shadow-sm border border-stone-100' 
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            {formula.id === 'hero' ? 'Héroe' : formula.id === 'three_act' ? '3 Actos' : 'Cat!'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-stone-500 italic mt-1 font-serif leading-relaxed px-1">
                        {BESTSELLER_FORMULAS.find(f => f.id === activeFormulaId)?.tagline}
                      </p>
                    </div>

                    <div className="space-y-2 mt-4">
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-bold font-sans">Puntos de Giro clave (Beats)</span>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 pb-4">
                        {BESTSELLER_FORMULAS.find(f => f.id === activeFormulaId)?.beats.map((beat, idx) => {
                          const inspirationKey = `${activeFormulaId}_${idx}`;
                          const hasInspiration = !!beatinspiration[inspirationKey];
                          const isSelected = selectedBeatIndex === idx;

                          return (
                            <div 
                              key={idx}
                              className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                                isSelected 
                                  ? 'bg-amber-50/50 border-amber-200 shadow-sm' 
                                  : 'bg-white border-stone-100 hover:border-stone-200'
                              }`}
                              onClick={() => setSelectedBeatIndex(idx)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-serif font-black text-stone-850 font-bold">{idx + 1}. {beat.name}</span>
                                {hasInspiration && (
                                  <span className="text-[8px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100/50 font-bold uppercase tracking-tight font-sans">Estructurado</span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 font-serif italic mt-1 leading-normal">{beat.desc}</p>
                              
                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-dashed border-stone-200 space-y-3" onClick={(e) => e.stopPropagation()}>
                                  {hasInspiration ? (
                                    <div className="space-y-3">
                                      <div className="p-3 bg-white border border-stone-150 rounded-lg text-[11px] font-serif italic text-stone-700 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {beatinspiration[inspirationKey]}
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => generateBeatSuggestion(activeFormulaId, idx, beat.name, beat.desc)}
                                          disabled={generatingBeatIndex !== null}
                                          className="flex-1 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all font-sans font-bold"
                                        >
                                          {generatingBeatIndex === idx ? 'Inspirando...' : 'Re-Inspirar'}
                                        </button>
                                        <button
                                          onClick={() => addBeatAsChapter(beat.name, beatinspiration[inspirationKey])}
                                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm font-sans font-bold"
                                        >
                                          Crear Capítulo
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => generateBeatSuggestion(activeFormulaId, idx, beat.name, beat.desc)}
                                      disabled={generatingBeatIndex !== null}
                                      className="w-full py-2 bg-stone-900 text-white font-black uppercase tracking-[0.1em] text-[9px] rounded-lg shadow hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 font-sans font-bold"
                                    >
                                      {generatingBeatIndex === idx ? (
                                        <RefreshCw size={10} className="animate-spin" />
                                      ) : (
                                        <Sparkles size={10} />
                                      )}
                                      {generatingBeatIndex === idx ? "Tejiendo Trama..." : "Inspirar Hito con IA"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {showHookAnalyzer && (
                  <motion.div 
                    key="hook-analyzer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-amber-700 tracking-widest font-sans font-bold">Auditoría Editorial de Alto Impacto</p>
                      <h4 className="text-xl font-serif font-black italic">Gancho de Best Seller</h4>
                      <p className="text-xs text-stone-400 italic font-serif leading-normal font-medium">Evalúa y perfecciona el magnetismo inicial de tu obra para atrapar al lector desde la página uno.</p>
                    </div>

                    {isAnalyzingHook ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans text-stone-500 font-bold text-xs uppercase">
                        <RefreshCw size={32} className="animate-spin text-amber-600" />
                        <div className="text-center">
                          <p className="text-[11px] uppercase font-black tracking-widest text-stone-600 font-bold font-sans">Analizando el Magnetismo...</p>
                          <p className="text-[9px] text-stone-400 mt-1 font-serif">Midiendo brecha de curiosidad y tensión inmediata</p>
                        </div>
                      </div>
                    ) : hookAnalysis ? (
                      <div className="space-y-5">
                        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-full border border-stone-100 shadow-sm shrink-0">
                            <span className="text-xl font-serif font-black text-amber-700 leading-none">{hookAnalysis.globalScore}</span>
                            <span className="absolute bottom-1.5 text-[7px] text-stone-400 font-bold uppercase tracking-widest font-sans">Ptos.</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-amber-600 tracking-tight block font-sans font-bold">Fuerza del Gancho Comercial</span>
                            <p className="text-[11px] text-stone-600 leading-relaxed font-serif italic mt-1">
                              {hookAnalysis.globalScore >= 80 ? "Tu gancho posee un imán comercial formidable. ¡Listo para imprentas de alto calibre!" :
                               hookAnalysis.globalScore >= 60 ? "Estructura sólida, pero requiere potenciar la evocación sensorial o el misterio inicial." :
                               "Gancho en desarrollo. El comienzo abusa de la explicación; requiere show-don't-tell activo."}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-stone-50/40 p-4 border border-stone-100/50 rounded-xl">
                          <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-bold font-sans">Pilares Técnicos del Éxito</span>
                          
                          <AttributeBar label="Brecha de Curiosidad" score={hookAnalysis.curiosityScore} />
                          <AttributeBar label="Evocación Sensorial" score={hookAnalysis.sensoryScore} />
                          <AttributeBar label="Apuestas / Stakes" score={hookAnalysis.stakesScore} />
                          <AttributeBar label="Identidad y Voz" score={hookAnalysis.voiceScore} />
                        </div>

                        <div className="space-y-2">
                          <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-bold font-sans">Evaluación Integral</span>
                          <p className="text-[12px] font-serif text-stone-700 leading-relaxed bg-amber-50/15 border border-amber-100/30 p-4 rounded-xl italic">
                            {hookAnalysis.diagnosis}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-4">
                          <div className="space-y-1.5 font-sans">
                            <span className="text-[9px] uppercase font-black text-green-700 tracking-wider block font-bold">Fortalezas</span>
                            <ul className="space-y-1">
                              {hookAnalysis.strengths.map((str, i) => (
                                <li key={i} className="text-[10px] text-stone-600 leading-tight font-serif flex items-start gap-1">
                                  <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1.5 font-sans">
                            <span className="text-[9px] uppercase font-black text-amber-700 tracking-wider block font-bold">Mejoras</span>
                            <ul className="space-y-1">
                              {hookAnalysis.improvements.map((imp, i) => (
                                <li key={i} className="text-[10px] text-stone-600 leading-tight font-serif flex items-start gap-1">
                                  <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-stone-100 pt-4">
                          <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-bold font-sans">Propuesta de Inicio Alternativo</span>
                          <div className="bg-white border border-stone-150 p-4 rounded-xl shadow-inner text-xs font-serif italic text-stone-850 leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar">
                            "{hookAnalysis.rewriteProposal}"
                          </div>
                          <button
                            onClick={applyHookRewrite}
                            className="w-full py-2.5 bg-stone-900 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow shadow-stone-200 flex items-center justify-center gap-1.5 cursor-pointer font-sans font-bold"
                          >
                            <CheckCircle2 size={12} />
                            Aplicar Gancho Reescrito
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto">
                          <Flame size={28} />
                        </div>
                        <p className="text-xs font-serif italic text-stone-500 max-w-xs mx-auto text-center leading-relaxed">
                          Audita el gancho comercial de tu obra. Analizaremos automáticamente el inicio de tu prosa para asegurar que atrape inmediatamente al lector desde el primer renglón.
                        </p>
                        <button
                          onClick={analyzeHook}
                          className="px-6 py-2.5 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md cursor-pointer inline-block mx-auto font-sans font-bold"
                        >
                          Comenzar Auditoría
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {showSynonyms && (
                  <motion.div 
                    key="synonyms"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-amber-700 tracking-widest font-sans font-bold">Inspiración de Vocabulario de Precisión</p>
                      <h4 className="text-xl font-serif font-black italic">Sinónimos Contextuales</h4>
                      <p className="text-xs text-stone-400 italic font-serif leading-normal font-medium">Sustituye términos por opciones sofisticadas adaptadas a tu oración exacta.</p>
                    </div>

                    {isSearchingSynonyms ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans text-stone-500 font-bold text-xs uppercase">
                        <RefreshCw size={32} className="animate-spin text-amber-600" />
                        <div className="text-center">
                          <p className="text-[11px] uppercase font-black tracking-widest text-stone-600 font-bold font-sans">Escudriñando el Tesauro...</p>
                          <p className="text-[9px] text-stone-400 mt-1 font-serif">Alineando registros filológicos y matices líricos</p>
                        </div>
                      </div>
                    ) : synonymsData ? (
                      <div className="space-y-5">
                        <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-1">
                          <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider font-sans font-bold">Término elegido:</span>
                          <span className="text-base font-serif font-black text-amber-700 block italic">"{synonymsData.word}"</span>
                          <p className="text-[11px] text-stone-500 font-serif leading-relaxed italic mt-1 bg-white p-3 rounded-xl border border-stone-100/50 shadow-inner">
                            {synonymsData.contextExplanation}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[9px] uppercase font-black text-stone-400 tracking-widest block font-bold font-sans">Alternativas Recomendadas (Clic para cambiar)</span>
                          <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1 pb-4">
                            {synonymsData.synonyms.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => replaceSelectionWithSynonym(item.word)}
                                className="w-full p-3 bg-white border border-stone-100 rounded-xl hover:border-amber-300 hover:shadow-md transition-all text-left group cursor-pointer block text-stone-800"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-serif font-bold text-stone-850 group-hover:text-amber-700 transition-colors">{item.word}</span>
                                  <span className="text-[8px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100/30 font-sans">{item.tone}</span>
                                </div>
                                <p className="text-[10px] text-stone-500 font-serif leading-relaxed italic">{item.explanation}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mx-auto">
                          <BookOpen size={28} />
                        </div>
                        <p className="text-xs font-serif italic text-stone-500 max-w-xs mx-auto text-center leading-relaxed">
                          Enriquece tu vocabulario seleccionando cualquier palabra o frase en el manuscrito, y presiona el botón de sinónimos inteligentes en el menú de selección.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sidebar/80 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 border-2 border-amber-600/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="font-serif italic text-2xl text-white">Procesando por el motor de Atelier...</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Refinando tu legado literario</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleToggle({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
        active 
          ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
          : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
      }`}
    >
      {label}
    </button>
  );
}

function ColorToggle({ active, onClick, color }: { active: boolean, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-all ${color} ${
        active ? 'ring-2 ring-amber-500 ring-offset-2 border-white' : 'border-transparent'
      }`}
    />
  );
}

function ContextButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
      title={title}
    >
      {icon}
    </button>
  );
}

function AttributeBar({ label, score }: { label: string, score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-sans font-bold text-stone-700">
        <span>{label}</span>
        <span className="text-amber-700">{score}/100</span>
      </div>
      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-600 rounded-full transition-all duration-1000" 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const BESTSELLER_FORMULAS = [
  {
    id: 'hero',
    name: "El Viaje del Héroe",
    tagline: "Estructura mítica y universal para tramas de transformación profunda.",
    beats: [
      { name: "Mundo Ordinario", desc: "Muestra la vida común del protagonista, sus defectos, anhelos y su zona de confort antes de la tormenta." },
      { name: "Llamado a la Aventura", desc: "Un evento perturbador o una invitación sacude sus cimientos obligándole a plantearse un cambio." },
      { name: "Cruce del Umbral", desc: "El protagonista deja atrás su mundo conocido, adentrándose en el territorio inexplorado lleno de peligros." },
      { name: "Prueba Suprema / Clímax", desc: "La crisis de mayor tensión psicológica o física donde se enfrenta cara a cara con su antagonista o mayor sombra." },
      { name: "El Retorno con el Elíxir", desc: "La vuelta al hogar transformado, portando la verdad o sabiduría que sanará su mundo ordinario." }
    ]
  },
  {
    id: 'three_act',
    name: "Estructura en 3 Actos",
    tagline: "Balance, tensión creciente y clímax cinematográfico infalible.",
    beats: [
      { name: "Planteamiento e Incidente Detonador", desc: "Sienta las coordenadas del mundo, el conflicto primordial y engancha al lector con el incidente que rompe el equilibrio." },
      { name: "Confrontación y Punto Medio", desc: "Obstáculos ascendentes. En el punto medio, ocurre una revelación crítica que cambia por completo el enfoque del protagonista." },
      { name: "Desenlace / Clímax de Tensión Máxima", desc: "La confrontación decisiva donde todos los hilos narrativos convergen en un final electrizante." }
    ]
  },
  {
    id: 'save_cat',
    name: "Save the Cat!",
    tagline: "La fórmula de ritmo perfecto comercial y dosificación de clímax preferida por Hollywood.",
    beats: [
      { name: "Declaración Temática / Stasis", desc: "Un personaje secundario le plantea al héroe el dilema central de su vida (antes de que lo entienda)." },
      { name: "Catalizador y Debate", desc: "Se rompe el equilibrio y el héroe entra en pánico o debate interno sobre si debería afrontar el reto." },
      { name: "La Subtrama B (Amor/Amistad)", desc: "Aparece un personaje que simboliza el tema de la novela, ofreciendo un oasis emocional." },
      { name: "La Noche Oscura del Alma", desc: "El momento de total desesperanza cuando el héroe cree que todo ha terminado y debe reconstruirse." },
      { name: "La Síntesis y Triunfo", desc: "Se fusiona lo que el héroe quería con lo que realmente necesitaba para derrotar el conflicto de forma triunfadora." }
    ]
  }
];
