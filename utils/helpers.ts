

import { Participant, Winner, WinPattern, PatternKey } from '../types.ts';

/**
 * Generates a classic 5x5 Bingo card distribution.
 * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75.
 * Returns an array of 25 integers, ordered ROW by ROW for easy rendering.
 * The center (index 12) is 0.
 */
export const generateBingoCardNumbers = (): number[] => {
  const getNums = (count: number, min: number, max: number) => {
    const nums = new Set<number>();
    while (nums.size < count) {
      nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return Array.from(nums); // Not sorted, to keep randomness in column
  };

  const colB = getNums(5, 1, 15);
  const colI = getNums(5, 16, 30);
  const colN = getNums(4, 31, 45); // Only 4 numbers for N column
  const colG = getNums(5, 46, 60);
  const colO = getNums(5, 61, 75);

  // Insert the "free space" placeholder (0) into the middle of N column
  // colN indices: 0, 1, (insert here), 2, 3
  const colNFull = [colN[0], colN[1], 0, colN[2], colN[3]];

  // Construct rows
  // Row 0: B[0], I[0], N[0], G[0], O[0]
  const grid: number[] = [];
  for (let row = 0; row < 5; row++) {
    grid.push(colB[row]);
    grid.push(colI[row]);
    grid.push(colNFull[row]);
    grid.push(colG[row]);
    grid.push(colO[row]);
  }

  return grid;
};

export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(-4)}`.toUpperCase();
};

// --- WINNING PATTERNS DEFINITION ---

const ALL_INDICES = Array.from({ length: 25 }, (_, i) => i);
const ROW_0 = [0, 1, 2, 3, 4];
const ROW_2 = [10, 11, 12, 13, 14];
const ROW_4 = [20, 21, 22, 23, 24];
const COL_0 = [0, 5, 10, 15, 20];
const COL_2 = [2, 7, 12, 17, 22]; // Center Column
const COL_4 = [4, 9, 14, 19, 24];
const DIAG_MAIN = [0, 6, 12, 18, 24]; // TL to BR
const DIAG_ANTI = [4, 8, 12, 16, 20]; // TR to BL

export const WIN_PATTERNS: Record<PatternKey, WinPattern> = {
  NONE: {
    key: 'NONE',
    label: '--- Seleccione Patrón ---',
    indices: []
  },
  FULL: {
    key: 'FULL',
    label: 'Cartón Lleno (Apagón)',
    indices: ALL_INDICES
  },
  X: {
    key: 'X',
    label: 'Letra X',
    indices: [0, 6, 12, 18, 24, 4, 8, 16, 20] // 12 is center (shared)
  },
  L: {
    key: 'L',
    label: 'Letra L',
    indices: [...COL_0, ...ROW_4] // Left Column + Bottom Row
  },
  FRAME: {
    key: 'FRAME',
    label: 'Marco / Cuadrado',
    indices: [...new Set([...ROW_0, ...ROW_4, ...COL_0, ...COL_4])]
  },
  CORNERS: {
    key: 'CORNERS',
    label: '4 Esquinas',
    indices: [0, 4, 20, 24]
  },
  LETTER_E: {
    key: 'LETTER_E',
    label: 'Letra E',
    indices: [...new Set([...COL_0, ...ROW_0, ...ROW_2, ...ROW_4])]
  },
  LETTER_H: {
    key: 'LETTER_H',
    label: 'Letra H',
    indices: [...new Set([...COL_0, ...COL_4, ...ROW_2])]
  },
  CENTER: {
    key: 'CENTER',
    label: 'Cruz Pequeña (Centro)',
    indices: [7, 11, 12, 13, 17]
  },
  // --- NEW PATTERNS ---
  LETTER_N: {
    key: 'LETTER_N',
    label: 'Letra N',
    indices: [...new Set([...COL_0, ...COL_4, ...DIAG_MAIN])]
  },
  LETTER_I: {
    key: 'LETTER_I',
    label: 'Letra I',
    indices: [...new Set([...ROW_0, ...ROW_4, ...COL_2])]
  },
  LETTER_Z: {
    key: 'LETTER_Z',
    label: 'Letra Z',
    indices: [...new Set([...ROW_0, ...ROW_4, ...DIAG_ANTI])]
  },
  FRAME_SMALL: {
    key: 'FRAME_SMALL',
    label: 'Marco Pequeño',
    indices: [6, 7, 8, 11, 13, 16, 17, 18]
  },
  CROSS: {
    key: 'CROSS',
    label: 'Cruz Grande',
    indices: [...new Set([...ROW_2, ...COL_2])]
  },
  DIAGONAL: {
    key: 'DIAGONAL',
    label: 'Diagonal Principal',
    indices: DIAG_MAIN
  },
  ARROW: {
    key: 'ARROW',
    label: 'Flecha Diagonal',
    // Diagonal (BL to TR) + arrow head at top right
    indices: [20, 16, 12, 8, 4, 3, 9]
  },
  DIAMOND: {
    key: 'DIAMOND',
    label: 'Diamante',
    indices: [2, 6, 8, 10, 14, 16, 18, 22]
  }
};

export const checkWinners = (
  participants: Participant[], 
  drawnBalls: number[], 
  existingWinners: Winner[],
  patternKey: PatternKey,
  currentRound: number = 1
): Winner[] => {
  const newWinners: Winner[] = [];
  
  // Get the required indices for the current pattern
  const patternIndices = WIN_PATTERNS[patternKey].indices;

  // SAFETY CHECK: If pattern is NONE or has no indices, no one can win.
  // JS [].every() returns true, so we must block this.
  if (patternIndices.length === 0) {
    return [];
  }

  // La bolilla ganadora es la última que se añadió a la lista
  const winningBall = drawnBalls[drawnBalls.length - 1];
  
  participants.forEach(p => {
    p.cards.forEach(c => {
      
      // Check ONLY the indices defined by the pattern
      const isWinner = patternIndices.every(index => {
        const numberAtPos = c.numbers[index];
        // It matches if:
        // 1. It is the free space (0) - AND the pattern requires index 12 (implied in logic, 0 is always matched)
        // 2. OR the number has been drawn
        if (numberAtPos === 0) return true; 
        return drawnBalls.includes(numberAtPos);
      });
      
      if (isWinner) {
        // Check if already recorded as winner for THIS card, THIS PATTERN AND THIS ROUND.
        // - Same Round + Same Pattern = DUPLICATE (Block)
        // - Different Round (Reset balls) = NEW WIN (Allow)
        // - Same Round + Different Pattern = NEW WIN (Allow)
        const isAlreadyWinner = existingWinners.some(w => 
          w.cardId === c.id && 
          w.winningPattern === patternKey &&
          (w.round || 1) === currentRound // Check round, default to 1 if undefined
        );
        
        if (!isAlreadyWinner) {
          newWinners.push({
            participantId: p.id,
            participantName: `${p.name} ${p.surname}`,
            cardId: c.id,
            timestamp: Date.now(),
            winningNumber: winningBall,
            winningPattern: patternKey, // Persist the pattern that caused the win
            drawnBalls: [...drawnBalls], // Persist the balls drawn (Snapshot)
            cardSnapshot: { ...c }, // Persist the card layout (Snapshot) so we can view it even if deleted later
            round: currentRound // Persist the round
          });
        }
      }
    });
  });
  
  return newWinners;
};