import { Participant, Winner } from '../types.ts';

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

export const checkWinners = (participants: Participant[], drawnBalls: number[], existingWinners: Winner[]): Winner[] => {
  const newWinners: Winner[] = [];
  
  // La bolilla ganadora es la última que se añadió a la lista
  const winningBall = drawnBalls[drawnBalls.length - 1];
  
  participants.forEach(p => {
    p.cards.forEach(c => {
      // Filter out the center zero (0) and check if remaining numbers are in drawnBalls
      const numbersToCheck = c.numbers.filter(n => n !== 0);
      const hasAll = numbersToCheck.every(n => drawnBalls.includes(n));
      
      if (hasAll) {
        // Check if already recorded as winner
        const isAlreadyWinner = existingWinners.some(w => w.cardId === c.id);
        
        if (!isAlreadyWinner) {
          newWinners.push({
            participantId: p.id,
            participantName: `${p.name} ${p.surname}`,
            cardId: c.id,
            timestamp: Date.now(),
            winningNumber: winningBall
          });
        }
      }
    });
  });
  
  return newWinners;
};
