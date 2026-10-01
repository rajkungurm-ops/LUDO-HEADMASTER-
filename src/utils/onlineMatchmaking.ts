import { io, Socket } from 'socket.io-client';
import { PlayerColor } from '../types/ludo';
import { getPublicBaseUrl } from './publicUrl';

export interface OnlineMatchPlayer {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isBot: boolean;
  level?: number;
  vipLevel?: number;
  diceSkin?: string;
  tokenSkin?: string;
  boardSkin?: string;
}

export interface MatchFoundPayload {
  gameId: string;
  playerCount: number;
  myColor: PlayerColor;
  myName: string;
  myAvatar: string;
  players: OnlineMatchPlayer[];
  firstTurn: PlayerColor;
}

class OnlineMatchmakingManager {
  private socket: Socket | null = null;
  private currentPollingInterval: NodeJS.Timeout | null = null;
  private matchTimeoutTimer: NodeJS.Timeout | null = null;
  private activeGameId: string | null = null;

  public getSocket(): Socket {
    if (!this.socket) {
      const baseUrl = getPublicBaseUrl();
      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect_error', () => {
        // Fallback silently if websocket has issues
      });
    }
    return this.socket;
  }

  /**
   * Start auto-matchmaking:
   * Supports 2P, 3P, 4P modes with 10s auto-bot filling
   */
  public startMatchmaking(
    playerId: string,
    name: string,
    avatar: string,
    playerCount: 2 | 3 | 4,
    callbacks: {
      onMatchFound: (data: MatchFoundPayload) => void;
      onTimeout: () => void;
      onError?: (err: any) => void;
    },
    skins?: {
      diceSkin?: string;
      tokenSkin?: string;
      boardSkin?: string;
      playerLevel?: number;
      playerVipLevel?: number;
    }
  ) {
    this.cancelMatchmaking(playerId);

    const socket = this.getSocket();
    let isMatched = false;

    const handleMatch = (data: MatchFoundPayload) => {
      if (isMatched) return;
      isMatched = true;
      this.clearTimers();
      this.activeGameId = data.gameId;
      callbacks.onMatchFound(data);
    };

    // Listen on socket
    socket.off('match_found');
    socket.on('match_found', handleMatch);

    // Emit queue join
    const diceSkin = skins?.diceSkin || localStorage.getItem('ludo_equipped_dice') || 'normal';
    const tokenSkin = skins?.tokenSkin || localStorage.getItem('ludo_equipped_token') || 'normal';
    const boardSkin = skins?.boardSkin || localStorage.getItem('ludo_equipped_board') || 'classic';
    const level = skins?.playerLevel || (parseInt(localStorage.getItem('ludo_wins') || '0', 10) + 1);
    const vipLevel = skins?.playerVipLevel || 1;
    socket.emit('find_online_match', { playerId, name, avatar, playerCount, diceSkin, tokenSkin, boardSkin, level, vipLevel });

    // Also notify REST endpoint for universal relay
    fetch('/api/online/find-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, name, avatar, playerCount, diceSkin, tokenSkin, boardSkin, level, vipLevel }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'matched') {
          handleMatch(resData);
        }
      })
      .catch(() => {});

    // Polling fallback every 1.5s
    this.currentPollingInterval = setInterval(() => {
      if (isMatched) return;
      fetch('/api/online/poll-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'matched' && !isMatched) {
            handleMatch(data);
          }
        })
        .catch(() => {});
    }, 1500);

    // 10 Seconds Match Timeout Rule -> fallback trigger if socket was offline
    this.matchTimeoutTimer = setTimeout(() => {
      if (!isMatched) {
        // Double check polling one last time
        fetch('/api/online/poll-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status === 'matched' && !isMatched) {
              handleMatch(data);
            } else if (!isMatched) {
              this.cancelMatchmaking(playerId);
              callbacks.onTimeout();
            }
          })
          .catch(() => {
            if (!isMatched) {
              this.cancelMatchmaking(playerId);
              callbacks.onTimeout();
            }
          });
      }
    }, 11000);
  }

  public cancelMatchmaking(playerId?: string) {
    this.clearTimers();
    if (this.socket) {
      this.socket.off('match_found');
      if (playerId) {
        this.socket.emit('cancel_online_match', { playerId });
      }
    }
    if (playerId) {
      fetch('/api/online/cancel-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      }).catch(() => {});
    }
  }

  private clearTimers() {
    if (this.currentPollingInterval) {
      clearInterval(this.currentPollingInterval);
      this.currentPollingInterval = null;
    }
    if (this.matchTimeoutTimer) {
      clearTimeout(this.matchTimeoutTimer);
      this.matchTimeoutTimer = null;
    }
  }

  public joinGameRoom(gameId: string, playerId: string) {
    this.activeGameId = gameId;
    const socket = this.getSocket();
    socket.emit('join_online_room', { gameId, playerId });
  }

  public sendDiceRoll(gameId: string, playerColor: PlayerColor, diceValue: number) {
    const socket = this.getSocket();
    socket.emit('online_dice_roll', { gameId, playerColor, diceValue });
  }

  public sendTokenMove(
    gameId: string,
    playerColor: PlayerColor,
    tokenId: number,
    roll: number,
    nextTurn: PlayerColor,
    playersState?: any
  ) {
    const socket = this.getSocket();
    socket.emit('online_token_move', {
      gameId,
      playerColor,
      tokenId,
      roll,
      nextTurn,
      playersState,
    });
  }

  public sendChatMessage(gameId: string, sender: string, text: string, type: 'text' | 'quick' | 'emoji') {
    const socket = this.getSocket();
    socket.emit('online_chat_message', { gameId, sender, text, type });
  }

  public requestRematch(gameId: string, playerId: string, name: string) {
    const socket = this.getSocket();
    socket.emit('request_rematch', { gameId, playerId, name });
  }

  public declineRematch(gameId: string, playerId: string) {
    const socket = this.getSocket();
    socket.emit('decline_rematch', { gameId, playerId });
  }

  public listenRematchEvents(
    gameId: string,
    callbacks: {
      onProgress: (data: { readyCount: number; totalCount: number; requesterName: string }) => void;
      onStart: (data: MatchFoundPayload) => void;
      onOpponentDeclined: (data?: any) => void;
    }
  ): () => void {
    const socket = this.getSocket();

    const handleProgress = (data: any) => callbacks.onProgress(data);
    const handleStart = (data: any) => callbacks.onStart(data);
    const handleDeclined = (data: any) => callbacks.onOpponentDeclined(data);

    socket.on('rematch_progress', handleProgress);
    socket.on('start_rematch_game', handleStart);
    socket.on('opponent_declined_rematch', handleDeclined);

    return () => {
      socket.off('rematch_progress', handleProgress);
      socket.off('start_rematch_game', handleStart);
      socket.off('opponent_declined_rematch', handleDeclined);
    };
  }

  public leaveGame(gameId: string, playerId: string) {
    const socket = this.getSocket();
    socket.emit('leave_online_game', { gameId, playerId });
    this.activeGameId = null;
  }

  public sendPlayerTimeout(gameId: string, playerColor: PlayerColor) {
    const socket = this.getSocket();
    socket.emit('online_player_timeout', { gameId, playerColor });
  }

  public listenGameEvents(
    gameId: string,
    callbacks: {
      onOpponentDice: (data: { playerColor: PlayerColor; diceValue: number }) => void;
      onOpponentMove: (data: {
        playerColor: PlayerColor;
        tokenId: number;
        roll: number;
        nextTurn: PlayerColor;
        playersState?: any;
      }) => void;
      onOpponentChat?: (data: { sender: string; text: string; type: 'text' | 'quick' | 'emoji' }) => void;
      onOpponentLeave: (data?: any) => void;
      onOpponentTimeout?: (data: { playerColor: PlayerColor }) => void;
    }
  ): () => void {
    const socket = this.getSocket();

    const handleDice = (data: any) => callbacks.onOpponentDice(data);
    const handleMove = (data: any) => callbacks.onOpponentMove(data);
    const handleChat = (data: any) => callbacks.onOpponentChat && callbacks.onOpponentChat(data);
    const handleLeave = (data: any) => callbacks.onOpponentLeave(data);
    const handleTimeout = (data: any) => callbacks.onOpponentTimeout && callbacks.onOpponentTimeout(data);

    socket.on('opponent_dice_rolled', handleDice);
    socket.on('opponent_token_moved', handleMove);
    socket.on('opponent_chat_message', handleChat);
    socket.on('opponent_left_game', handleLeave);
    socket.on('opponent_timed_out', handleTimeout);

    return () => {
      socket.off('opponent_dice_rolled', handleDice);
      socket.off('opponent_token_moved', handleMove);
      socket.off('opponent_chat_message', handleChat);
      socket.off('opponent_left_game', handleLeave);
      socket.off('opponent_timed_out', handleTimeout);
    };
  }
}

export const onlineMatchManager = new OnlineMatchmakingManager();
