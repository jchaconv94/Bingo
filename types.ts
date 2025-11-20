

export interface BingoCard {
  id: string;
  numbers: number[]; // Array of 25 items (index 12 is 0/placeholder)
}

export interface Participant {
  id: string;
  name: string;
  surname: string;
  dni: string;
  phone?: string;
  cards: BingoCard[];
}

export interface Winner {
  participantId: string;
  participantName: string;
  cardId: string;
  timestamp: number;
  winningNumber: number;
  winningPattern?: PatternKey; // The pattern used when this win occurred
  drawnBalls?: number[]; // Snapshot of balls drawn at the moment of win
  // Snapshot of the prize won at that moment
  prizeId?: string;
  prizeName?: string;
  prizeDescription?: string;
  round?: number; // The game round index (1, 2, 3...) this win belongs to
}

export interface Prize {
  id: string;
  name: string;
  description: string; // e.g. "S/ 100.00"
  isAwarded: boolean;
}

export type PatternKey = 
  | 'NONE'
  | 'FULL' 
  | 'X' 
  | 'L' 
  | 'FRAME' 
  | 'CORNERS' 
  | 'LETTER_E' 
  | 'LETTER_H' 
  | 'CENTER'
  | 'LETTER_N'
  | 'LETTER_I'
  | 'LETTER_Z'
  | 'FRAME_SMALL'
  | 'CROSS'
  | 'DIAGONAL'
  | 'DIAMOND'
  | 'ARROW';

export interface WinPattern {
  key: PatternKey;
  label: string;
  indices: number[]; // Indices 0-24 required to win
}

export interface GameState {
  drawnBalls: number[];
  history: string[];
  lastCardSequence: number;
  selectedPattern: PatternKey;
  roundLocked?: boolean;
  gameRound: number; // Tracks the current round sequence (increments on partial reset)
}

export const TOTAL_BALLS = 75;
export const CARDS_PER_USER_LIMIT = 100;
export const NUMBERS_PER_CARD = 24; // 24 numbers + 1 free space