/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Section = 'dashboard' | 'structure' | 'editor' | 'tips' | 'assets' | 'settings';

export interface HistoryVersion {
  id: string;
  timestamp: number;
  content: string;
  wordCount: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  suggestion?: string;
}

export interface BookProject {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  lastEdited: number;
  initialContent?: string;
  characters?: Character[];
  plot?: PlotPoint[];
  versions?: HistoryVersion[];
  chatHistory?: ChatMessage[];
  currentChapter?: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  type: 'chapter' | 'character' | 'climax' | 'plot_point' | 'other';
  label: string;
  offset: number;
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  order: number;
  tension?: number; // 1-100
}
