import { PlayerColor, Token, Player, MatchRule } from '../types/ludo';

// 52 Main Path coordinates on the 15x15 board
export const MAIN_PATH: Array<{ row: number; col: number }> = [
  { row: 6, col: 1 },  // 0: Red Start (Safe)
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8: Safe Star (Green side)
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11
  { row: 0, col: 8 },  // 12
  { row: 1, col: 8 },  // 13: Green Start (Safe)
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21: Safe Star (Yellow side)
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 8, col: 14 }, // 25
  { row: 8, col: 13 }, // 26: Yellow Start (Safe)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34: Safe Star (Blue side)
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37
  { row: 14, col: 6 }, // 38
  { row: 13, col: 6 }, // 39: Blue Start (Safe)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47: Safe Star (Red side)
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50
  { row: 6, col: 0 },  // 51
];

export const STARTING_GLOBAL_INDEX: Record<PlayerColor, number> = {
  red: 0,    // Red Start at Left arm (row 6, col 1)
  green: 13, // Green Start at Top arm (row 1, col 8)
  yellow: 26,// Yellow Start at Right arm (row 8, col 13)
  blue: 39,  // Blue Start at Bottom arm (row 13, col 6)
};

export const SAFE_GLOBAL_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Exact base socket coordinates matching reference photo:
// Red Top-Left, Green Top-Right, Blue Bottom-Left, Yellow Bottom-Right
export const BASE_SOCKETS: Record<PlayerColor, Array<{ row: number; col: number }>> = {
  red: [
    { row: 1.5, col: 1.5 },
    { row: 1.5, col: 3.5 },
    { row: 3.5, col: 1.5 },
    { row: 3.5, col: 3.5 },
  ],
  green: [
    { row: 1.5, col: 10.5 },
    { row: 1.5, col: 12.5 },
    { row: 3.5, col: 10.5 },
    { row: 3.5, col: 12.5 },
  ],
  blue: [
    { row: 10.5, col: 1.5 },
    { row: 10.5, col: 3.5 },
    { row: 12.5, col: 1.5 },
    { row: 12.5, col: 3.5 },
  ],
  yellow: [
    { row: 10.5, col: 10.5 },
    { row: 10.5, col: 12.5 },
    { row: 12.5, col: 10.5 },
    { row: 12.5, col: 12.5 },
  ],
};

// Home run paths (steps 51..55) matching reference photo
export const HOME_RUN_PATHS: Record<PlayerColor, Array<{ row: number; col: number }>> = {
  red: [
    { row: 7, col: 1 }, // 51
    { row: 7, col: 2 }, // 52
    { row: 7, col: 3 }, // 53
    { row: 7, col: 4 }, // 54
    { row: 7, col: 5 }, // 55 (Enters Left Red Triangle)
  ],
  green: [
    { row: 1, col: 7 }, // 51
    { row: 2, col: 7 }, // 52
    { row: 3, col: 7 }, // 53
    { row: 4, col: 7 }, // 54
    { row: 5, col: 7 }, // 55 (Enters Top Green Triangle)
  ],
  yellow: [
    { row: 7, col: 13 }, // 51
    { row: 7, col: 12 }, // 52
    { row: 7, col: 11 }, // 53
    { row: 7, col: 10 }, // 54
    { row: 7, col: 9 },  // 55 (Enters Right Yellow Triangle)
  ],
  blue: [
    { row: 13, col: 7 }, // 51
    { row: 12, col: 7 }, // 52
    { row: 11, col: 7 }, // 53
    { row: 10, col: 7 }, // 54
    { row: 9, col: 7 },  // 55 (Enters Bottom Blue Triangle)
  ],
};

// Center finish coordinates for step 56 matching photo
export const HOME_FINISH_COORDS: Record<PlayerColor, { row: number; col: number }> = {
  red: { row: 7, col: 6 },    // Left Red Triangle
  green: { row: 6, col: 7 },  // Top Green Triangle
  yellow: { row: 7, col: 8 }, // Right Yellow Triangle
  blue: { row: 8, col: 7 },   // Bottom Blue Triangle
};

/**
 * Get board coordinate for a token based on its step (-1 to 56)
 */
export function getTokenCoordinate(color: PlayerColor, tokenId: number, step: number): { row: number; col: number } {
  if (step === -1) {
    return BASE_SOCKETS[color][tokenId];
  }
  if (step >= 0 && step <= 50) {
    const startIndex = STARTING_GLOBAL_INDEX[color];
    const globalIdx = (startIndex + step) % 52;
    return MAIN_PATH[globalIdx];
  }
  if (step >= 51 && step <= 55) {
    return HOME_RUN_PATHS[color][step - 51];
  }
  if (step >= 56) {
    return HOME_FINISH_COORDS[color];
  }
  return BASE_SOCKETS[color][tokenId];
}

/**
 * Get the intermediate sequence of step numbers from currentStep to targetStep
 */
export function getStepSequence(fromStep: number, toStep: number): number[] {
  if (fromStep === -1) {
    return [0];
  }
  const steps: number[] = [];
  for (let s = fromStep + 1; s <= toStep; s++) {
    steps.push(s);
  }
  return steps;
}

export function isSafePosition(globalIndex: number): boolean {
  return SAFE_GLOBAL_INDICES.includes(globalIndex);
}

export function isSafeStep(color: PlayerColor, step: number): boolean {
  if (step === 0) return true; // Start square
  if (step >= 0 && step <= 50) {
    const startIndex = STARTING_GLOBAL_INDEX[color];
    const globalIdx = (startIndex + step) % 52;
    return SAFE_GLOBAL_INDICES.includes(globalIdx);
  }
  if (step >= 51 && step <= 56) {
    return true; // Home path & finish
  }
  return false;
}

export function isStarSpace(color: PlayerColor, step: number): boolean {
  if (step >= 0 && step <= 50) {
    const startIndex = STARTING_GLOBAL_INDEX[color];
    const globalIdx = (startIndex + step) % 52;
    // Stars are at 8, 21, 34, 47 (and base start spots 0, 13, 26, 39 are safe)
    return [8, 21, 34, 47].includes(globalIdx);
  }
  return false;
}

export function getValidMoves(player: Player, diceRoll: number): number[] {
  const validIds: number[] = [];

  player.tokens.forEach((token) => {
    if (token.inBase) {
      if (diceRoll === 6) {
        validIds.push(token.id);
      }
      return;
    }

    if (token.isHome || token.step >= 56) {
      return;
    }

    if (token.step + diceRoll <= 56) {
      validIds.push(token.id);
    }
  });

  return validIds;
}

export function checkTokenCapture(
  movingColor: PlayerColor,
  targetStep: number,
  allPlayers: Player[]
): { capturedPlayerId: string; capturedTokenId: number; capturedColor: PlayerColor } | null {
  if (targetStep < 0 || targetStep > 50) {
    return null;
  }

  const movingStartIndex = STARTING_GLOBAL_INDEX[movingColor];
  const targetGlobalIndex = (movingStartIndex + targetStep) % 52;

  if (isSafePosition(targetGlobalIndex)) {
    return null;
  }

  for (const player of allPlayers) {
    if (player.color === movingColor) continue;

    for (const token of player.tokens) {
      if (!token.inBase && !token.isHome && token.step >= 0 && token.step <= 50) {
        const opponentStartIndex = STARTING_GLOBAL_INDEX[player.color];
        const opponentGlobalIndex = (opponentStartIndex + token.step) % 52;

        if (opponentGlobalIndex === targetGlobalIndex) {
          return {
            capturedPlayerId: player.id,
            capturedTokenId: token.id,
            capturedColor: player.color,
          };
        }
      }
    }
  }

  return null;
}

export function selectBestBotMove(player: Player, diceRoll: number, allPlayers: Player[], validMoveIds: number[]): number {
  if (validMoveIds.length === 1) {
    return validMoveIds[0];
  }

  let bestMoveId = validMoveIds[0];
  let highestScore = -9999;

  for (const tokenId of validMoveIds) {
    const token = player.tokens[tokenId];
    let score = 0;

    if (token.inBase) {
      score += 150;
      const activeCount = player.tokens.filter((t) => !t.inBase && !t.isHome).length;
      if (activeCount === 0) score += 200;
    } else {
      const nextStep = token.step + diceRoll;

      if (nextStep === 56) {
        score += 300;
      }

      if (token.step <= 50 && nextStep >= 51) {
        score += 180;
      }

      const capture = checkTokenCapture(player.color, nextStep, allPlayers);
      if (capture) {
        score += 250;
      }

      if (nextStep <= 50) {
        const globalIdx = (STARTING_GLOBAL_INDEX[player.color] + nextStep) % 52;
        if (isSafePosition(globalIdx)) {
          score += 90;
        }
      }

      if (token.step <= 50) {
        const currentGlobalIdx = (STARTING_GLOBAL_INDEX[player.color] + token.step) % 52;
        if (!isSafePosition(currentGlobalIdx)) {
          for (const opp of allPlayers) {
            if (opp.color === player.color) continue;
            for (const oppToken of opp.tokens) {
              if (!oppToken.inBase && !oppToken.isHome && oppToken.step <= 50) {
                const oppGlobal = (STARTING_GLOBAL_INDEX[opp.color] + oppToken.step) % 52;
                const distanceBehind = (currentGlobalIdx - oppGlobal + 52) % 52;
                if (distanceBehind >= 1 && distanceBehind <= 6) {
                  score += 120;
                }
              }
            }
          }
        }
      }

      score += nextStep * 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMoveId = tokenId;
    }
  }

  return bestMoveId;
}

export function createPlayerTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    step: -1,
    position: BASE_SOCKETS[color][id],
    isHome: false,
    inBase: true,
  }));
}

export function checkPlayerWin(player: Player, matchRule: MatchRule): boolean {
  const homeCount = player.tokens.filter((t) => t.isHome || t.step >= 56).length;
  if (matchRule === 'quick') {
    return homeCount >= 1;
  }
  return homeCount === 4;
}

/**
 * Fair Dice Algorithm (Ludo King standard):
 * - If all 4 tokens of the player are in the base yard:
 *   - Rolls 1 to 3: Pure random 1..6 (standard 1/6 chance)
 *   - Roll 4: 50% chance of rolling a 6
 *   - Roll 5: 80% chance of rolling a 6
 *   - Roll 6+: 100% guaranteed 6 to prevent frustrating dry spells
 * - Once any token is out of base, or during bonus rolls awarded after rolling 6:
 *   - Pure random 1..6 (no forced rolls)
 */
export interface PlayerDiceTracker {
  baseRollCount: number;      // Rolls while all 4 tokens are in base (Niyam 1)
  midGameRollCount: number;   // Rolls during mid-game (Niyam 2)
  lastTokenRollCount: number; // Rolls when 3 tokens home, 1 token left (Niyam 3)
}

export const initialDiceTracker: Record<PlayerColor, PlayerDiceTracker> = {
  red: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
  green: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
  yellow: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
  blue: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
};

/**
 * FINAL 3 NIYAM - Aapka Ludo
 *
 * Niyam 1 - Shuru me (4 gote ghar me band ho):
 * - 1st roll = 40% 6 ayega
 * - 2nd roll = 70% 6 ayega
 * - 3rd roll = 100% pakka 6 ayega
 * - Sab player ke liye same
 *
 * Niyam 2 - Beech ka khel (1 gota bahar nikal gaya):
 * - 1 se 4 roll tak normal
 * - 5th roll = 80% 6 ayega
 * - 6th roll = 100% pakka 6 ayega
 * - Phir se 1 se ginti shuru
 *
 * Niyam 3 - Last gota wala (3 gote andar chale gaye, bas 1 bacha hai):
 * - 1st roll = jo chahiye uske aas paas ka number do
 * - 2nd roll = exact ya uske kareeb do
 * - 3rd roll = 100% pakka finish, matlab jitna number chahiye utna hi de do
 */
export function calculateSmartLudoDiceRoll(
  player: Player,
  tracker: PlayerDiceTracker,
  consecutiveSixes: number = 0
): { roll: number; newTracker: PlayerDiceTracker } {
  const allInBase = player.tokens.every((t) => t.inBase);
  const homeCount = player.tokens.filter((t) => t.isHome || t.step >= 56).length;

  // NIYAM 1: Shuru me (4 gote ghar me band ho)
  if (allInBase) {
    const count = tracker.baseRollCount + 1;
    let roll: number;

    if (count === 1) {
      // 1st roll = 40% 6 ayega
      roll = Math.random() < 0.4 ? 6 : Math.floor(Math.random() * 5) + 1;
    } else if (count === 2) {
      // 2nd roll = 70% 6 ayega
      roll = Math.random() < 0.7 ? 6 : Math.floor(Math.random() * 5) + 1;
    } else {
      // 3rd roll = 100% pakka 6 ayega
      roll = 6;
    }

    if (consecutiveSixes >= 2 && roll === 6) {
      roll = Math.floor(Math.random() * 5) + 1;
    }

    return {
      roll,
      newTracker: {
        ...tracker,
        baseRollCount: roll === 6 ? 0 : count,
        midGameRollCount: 0,
      },
    };
  }

  // Last 1 goti rule: Jab 3 gote home me finish ho chuke hon aur sirf 1 gota bacha ho -> Pure random 1..6 (Naseeb pe)
  if (homeCount === 3) {
    let roll = Math.floor(Math.random() * 6) + 1;
    if (consecutiveSixes >= 2 && roll === 6) {
      roll = Math.floor(Math.random() * 5) + 1;
    }
    return {
      roll,
      newTracker: {
        ...tracker,
        baseRollCount: 0,
        midGameRollCount: 0,
        lastTokenRollCount: 0,
      },
    };
  }

  // NIYAM 2: Beech ka khel (1 gota bahar nikal gaya)
  // - 1 se 4 roll tak normal
  // - 5th roll = 80% 6 ayega
  // - 6th roll = 100% pakka 6 ayega
  // - Phir se 1 se ginti shuru
  const count = tracker.midGameRollCount + 1;
  let roll: number;

  if (count <= 4) {
    // 1 se 4 roll tak normal
    roll = Math.floor(Math.random() * 6) + 1;
  } else if (count === 5) {
    // 5th roll = 80% 6 ayega
    roll = Math.random() < 0.8 ? 6 : Math.floor(Math.random() * 5) + 1;
  } else {
    // 6th roll = 100% pakka 6 ayega
    roll = 6;
  }

  if (consecutiveSixes >= 2 && roll === 6) {
    roll = Math.floor(Math.random() * 5) + 1;
  }

  const resetMidGame = roll === 6 || count >= 6;

  return {
    roll,
    newTracker: {
      ...tracker,
      baseRollCount: 0,
      midGameRollCount: resetMidGame ? 0 : count,
      lastTokenRollCount: 0,
    },
  };
}

export function calculateFairDiceRoll(
  allInBase: boolean,
  currentBaseRollCount: number
): { roll: number; newBaseRollCount: number } {
  if (!allInBase) {
    return {
      roll: Math.floor(Math.random() * 6) + 1,
      newBaseRollCount: 0,
    };
  }

  const newCount = currentBaseRollCount + 1;
  let roll: number;

  if (newCount === 1) {
    roll = Math.random() < 0.4 ? 6 : Math.floor(Math.random() * 5) + 1;
  } else if (newCount === 2) {
    roll = Math.random() < 0.7 ? 6 : Math.floor(Math.random() * 5) + 1;
  } else {
    roll = 6;
  }

  return {
    roll,
    newBaseRollCount: roll === 6 ? 0 : newCount,
  };
}

