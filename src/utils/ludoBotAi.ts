import { Player, PlayerColor, Token } from '../types/ludo';
import { checkTokenCapture, isStarSpace } from './ludoEngine';

export interface BotProfile {
  name: string;
  avatar: string;
}

export const BOT_PROFILES: BotProfile[] = [
  {
    name: 'Bot Raja 🤖',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bot Rani 🤖',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bot Sher 🤖',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bot Sikandar 🤖',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

/**
 * Intelligent "Tagra Bot" decision engine for Ludo
 * Calculates strategic weight for every valid move and picks the optimal play:
 * 1. Capture Opponent Token (Top Priority)
 * 2. Reach Home / Finish Line (High Priority)
 * 3. Bring Token onto Board on 6 (High Priority)
 * 4. Land on Safe Star space
 * 5. Escape Danger / Avoid entering Danger
 * 6. Advance tokens closest to finish
 */
export function chooseBestBotMove(
  botPlayer: Player,
  roll: number,
  validTokenIds: number[],
  allPlayers: Player[]
): number | null {
  if (validTokenIds.length === 0) return null;
  if (validTokenIds.length === 1) return validTokenIds[0];

  let bestTokenId = validTokenIds[0];
  let highestScore = -Infinity;

  for (const tokenId of validTokenIds) {
    const token = botPlayer.tokens.find((t) => t.id === tokenId);
    if (!token) continue;

    let score = 0;

    // 1. Bringing token out of base on 6
    if (token.inBase && roll === 6) {
      // Prioritize having at least 1-2 tokens on board
      const tokensOnBoard = botPlayer.tokens.filter((t) => !t.inBase && !t.isHome).length;
      score += tokensOnBoard === 0 ? 600 : tokensOnBoard === 1 ? 450 : 250;
    } else {
      const startStep = token.step;
      const targetStep = startStep + roll;

      // 2. Reaching Home (Step 56)
      if (targetStep === 56) {
        score += 1000;
      }

      // 3. Capturing opponent token (Kill)
      const captureResult = checkTokenCapture(botPlayer.color, targetStep, allPlayers);
      if (captureResult) {
        // High priority kill bonus + reward based on how far the opponent token had progressed
        score += 850;
      }

      // 4. Landing on Safe Star Space
      if (isStarSpace(botPlayer.color, targetStep)) {
        score += 320;
      }

      // 5. Entering Safe Home Runway (Steps 51-55)
      if (targetStep >= 51 && startStep < 51) {
        score += 280;
      }

      // 6. Escape from danger (if an opponent is currently 1-6 steps behind this token)
      const isCurrentlyInDanger = isTokenInDanger(botPlayer.color, startStep, allPlayers);
      if (isCurrentlyInDanger) {
        score += 220;
      }

      // 7. Avoid stepping into danger if target space is unsafe and opponents are behind
      const wouldBeInDanger = isTokenInDanger(botPlayer.color, targetStep, allPlayers);
      if (wouldBeInDanger && !isStarSpace(botPlayer.color, targetStep) && targetStep < 51) {
        score -= 120;
      }

      // 8. Progress weight: Favor moving tokens that are closer to home
      score += targetStep * 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}

function isTokenInDanger(
  myColor: PlayerColor,
  myStep: number,
  allPlayers: Player[]
): boolean {
  if (myStep < 0 || myStep >= 51 || isStarSpace(myColor, myStep)) {
    return false;
  }

  // Check if any opponent token can hit this space in 1-6 steps
  for (const player of allPlayers) {
    if (player.color === myColor) continue;
    for (const oppToken of player.tokens) {
      if (oppToken.inBase || oppToken.isHome || oppToken.step < 0 || oppToken.step >= 51) {
        continue;
      }
      // Simple distance check along shared main track
      const diff = (myStep - oppToken.step + 52) % 52;
      if (diff >= 1 && diff <= 6) {
        return true;
      }
    }
  }

  return false;
}
