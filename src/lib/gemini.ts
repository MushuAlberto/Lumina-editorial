/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export function getGemini() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in your secrets.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export type EditorialAction = 'polish' | 'creative_twist' | 'professional' | 'summarize' | 'expand';

export const SYSTEM_PROMPT = `Eres Lumina, una asistente editorial de élite y consultora literaria experta en escritura creativa y profesional. 
Tu objetivo es ayudar a los autores a convertir sus ideas en libros exitosos y memorables.
Habla siempre en un tono profesional, elegante, inspirador y constructivo. 
Utiliza terminología literaria (arcos de personaje, ritmo narrativo, voz, etc.) de forma accesible.

Capacidades:
1. Estructuración: Ayuda a definir tramas, puntos de giro y el camino del héroe.
2. Desarrollo de personajes: Ayuda a crear personajes con motivaciones profundas, defectos y virtudes.
3. Edición Profesional: Toma textos crudos y conviértelos en piezas literarias pulidas.
4. Consejos Editoriales: Proporciona tips sobre la industria, el éxito comercial y la calidad artística.`;
