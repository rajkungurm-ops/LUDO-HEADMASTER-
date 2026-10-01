import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, *');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));

// Explicit high-priority routes for PWA Service Worker & Manifest to guarantee Chrome WebAPK Direct Install
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=UTF-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

app.use(express.static(path.resolve(__dirname, 'public')));

// ONLINE MATCHMAKING (2P, 3P, 4P) & GAME STORE
interface WaitingPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  playerCount: 2 | 3 | 4;
  level?: number;
  vipLevel?: number;
  diceSkin?: string;
  tokenSkin?: string;
  boardSkin?: string;
  timestamp: number;
}

interface OnlineGameRoom {
  gameId: string;
  playerCount: 2 | 3 | 4;
  players: {
    id: string;
    socketId?: string;
    name: string;
    avatar: string;
    color: 'blue' | 'red' | 'green' | 'yellow';
    isBot: boolean;
    level?: number;
    vipLevel?: number;
    diceSkin?: string;
    tokenSkin?: string;
    boardSkin?: string;
  }[];
  currentTurn: 'blue' | 'red' | 'green' | 'yellow';
  boardState: any;
  lastMove?: any;
  status: 'playing' | 'finished';
  createdAt: number;
  lastActive: number;
}

const waitingQueues: Record<2 | 3 | 4, Record<string, WaitingPlayer>> = {
  2: {},
  3: {},
  4: {},
};

const onlineGames: Record<string, OnlineGameRoom> = {};

const BOT_ROSTER = [
  { name: 'Bot Raja 🤖', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', level: 12, vipLevel: 1, diceSkin: 'normal', tokenSkin: 'normal' },
  { name: 'Bot Rani 🤖', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', level: 9, vipLevel: 1, diceSkin: 'normal', tokenSkin: 'normal' },
  { name: 'Bot Sher 🤖', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', level: 15, vipLevel: 1, diceSkin: 'normal', tokenSkin: 'normal' },
  { name: 'Bot Sikandar 🤖', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', level: 18, vipLevel: 1, diceSkin: 'normal', tokenSkin: 'normal' },
];

function getColorsForCount(count: 2 | 3 | 4): ('blue' | 'red' | 'green' | 'yellow')[] {
  if (count === 2) return ['red', 'yellow'];
  if (count === 3) return ['red', 'yellow', 'blue'];
  return ['blue', 'red', 'green', 'yellow'];
}

// Check matchmaking: match enough real players OR fallback to Bots after 10s
function processMatchmaking() {
  const now = Date.now();
  const counts: (2 | 3 | 4)[] = [2, 3, 4];

  for (const count of counts) {
    const queue = waitingQueues[count];
    const playerList = Object.values(queue).sort((a, b) => a.timestamp - b.timestamp);
    if (playerList.length === 0) continue;

    const colors = getColorsForCount(count);

    // Case 1: Enough real players available immediately
    if (playerList.length >= count) {
      const matchedPlayers = playerList.slice(0, count);
      matchedPlayers.forEach((p) => delete queue[p.id]);

      const gameId = Math.floor(100000 + Math.random() * 900000).toString();
      const gamePlayers = matchedPlayers.map((p, idx) => ({
        id: p.id,
        socketId: p.socketId,
        name: p.name,
        avatar: p.avatar,
        color: colors[idx],
        isBot: false,
        level: p.level || 1,
        vipLevel: p.vipLevel || 1,
        diceSkin: p.diceSkin || 'normal',
        tokenSkin: p.tokenSkin || 'normal',
        boardSkin: p.boardSkin || 'classic',
      }));

      const game: OnlineGameRoom = {
        gameId,
        playerCount: count,
        players: gamePlayers,
        currentTurn: colors[0],
        boardState: null,
        status: 'playing',
        createdAt: now,
        lastActive: now,
      };
      onlineGames[gameId] = game;

      // Broadcast match to all real players
      gamePlayers.forEach((p) => {
        if (p.socketId) {
          io.to(p.socketId).emit('match_found', {
            gameId,
            playerCount: count,
            myColor: p.color,
            myName: p.name,
            myAvatar: p.avatar,
            players: gamePlayers.map((gp) => ({
              id: gp.id,
              name: gp.name,
              avatar: gp.avatar,
              color: gp.color,
              isBot: gp.isBot,
              level: gp.level,
              vipLevel: gp.vipLevel,
              diceSkin: gp.diceSkin || 'normal',
              tokenSkin: gp.tokenSkin || 'normal',
            })),
            firstTurn: colors[0],
          });
        }
      });
      continue;
    }

    // Case 2: Oldest player in queue has waited >= 10 seconds -> Fill with Bots!
    const oldest = playerList[0];
    if (now - oldest.timestamp >= 10000) {
      const realTakeCount = Math.min(playerList.length, count);
      const matchedReals = playerList.slice(0, realTakeCount);
      matchedReals.forEach((p) => delete queue[p.id]);

      const gameId = Math.floor(100000 + Math.random() * 900000).toString();
      const gamePlayers: any[] = [];

      // Add real players first
      matchedReals.forEach((p, idx) => {
        gamePlayers.push({
          id: p.id,
          socketId: p.socketId,
          name: p.name,
          avatar: p.avatar,
          color: colors[idx],
          isBot: false,
          level: p.level || 1,
          vipLevel: p.vipLevel || 1,
          diceSkin: p.diceSkin || 'normal',
          tokenSkin: p.tokenSkin || 'normal',
          boardSkin: p.boardSkin || 'classic',
        });
      });

      // Fill remaining slots with strong Computer Bots
      let botIdx = 0;
      while (gamePlayers.length < count) {
        const color = colors[gamePlayers.length];
        const bot = BOT_ROSTER[botIdx % BOT_ROSTER.length];
        gamePlayers.push({
          id: `bot_${color}_${gameId}`,
          name: bot.name,
          avatar: bot.avatar,
          color,
          isBot: true,
          level: bot.level,
          vipLevel: bot.vipLevel,
          diceSkin: bot.diceSkin || 'normal',
          tokenSkin: bot.tokenSkin || 'normal',
        });
        botIdx++;
      }

      const game: OnlineGameRoom = {
        gameId,
        playerCount: count,
        players: gamePlayers,
        currentTurn: colors[0],
        boardState: null,
        status: 'playing',
        createdAt: now,
        lastActive: now,
      };
      onlineGames[gameId] = game;

      // Broadcast match to all real players
      gamePlayers.forEach((p) => {
        if (!p.isBot && p.socketId) {
          io.to(p.socketId).emit('match_found', {
            gameId,
            playerCount: count,
            myColor: p.color,
            myName: p.name,
            myAvatar: p.avatar,
            players: gamePlayers.map((gp) => ({
              id: gp.id,
              name: gp.name,
              avatar: gp.avatar,
              color: gp.color,
              isBot: gp.isBot,
              level: gp.level,
              vipLevel: gp.vipLevel,
              diceSkin: gp.diceSkin || 'normal',
              tokenSkin: gp.tokenSkin || 'normal',
              boardSkin: gp.boardSkin || 'classic',
            })),
            firstTurn: colors[0],
          });
        }
      });
    }
  }
}

// Run matchmaking ticker every 1 second
setInterval(processMatchmaking, 1000);

// Clean up stale waiting players (>30s) and stale games (>2 hours)
setInterval(() => {
  const now = Date.now();
  for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
    for (const [id, p] of Object.entries(waitingQueues[c])) {
      if (now - p.timestamp > 30000) {
        delete waitingQueues[c][id];
      }
    }
  }
  for (const [gid, g] of Object.entries(onlineGames)) {
    if (now - g.lastActive > 2 * 3600 * 1000) {
      delete onlineGames[gid];
    }
  }
}, 10000);

// Socket Connection Handler
io.on('connection', (socket: Socket) => {
  // Matchmaking: Join Queue (2P, 3P, 4P)
  socket.on('find_online_match', (data: { playerId: string; name: string; avatar: string; playerCount?: number; diceSkin?: string; tokenSkin?: string; boardSkin?: string; level?: number; vipLevel?: number }) => {
    const { playerId, name, avatar, diceSkin, tokenSkin, boardSkin, level, vipLevel } = data;
    if (!playerId) return;
    const count = (data.playerCount === 3 ? 3 : data.playerCount === 4 ? 4 : 2) as 2 | 3 | 4;

    // Remove from other queues if present
    for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
      delete waitingQueues[c][playerId];
    }

    waitingQueues[count][playerId] = {
      id: playerId,
      socketId: socket.id,
      name: name || 'Player',
      avatar: avatar || '',
      playerCount: count,
      level: typeof level === 'number' ? level : 1,
      vipLevel: typeof vipLevel === 'number' ? vipLevel : 1,
      diceSkin: diceSkin || 'normal',
      tokenSkin: tokenSkin || 'normal',
      boardSkin: boardSkin || 'classic',
      timestamp: Date.now(),
    };

    processMatchmaking();
  });

  // Matchmaking: Cancel
  socket.on('cancel_online_match', (data: { playerId: string }) => {
    if (data?.playerId) {
      for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
        delete waitingQueues[c][data.playerId];
      }
    }
  });

  // Online Game: Join Game Room
  socket.on('join_online_room', (data: { gameId: string; playerId: string }) => {
    if (data?.gameId) {
      socket.join(`game_${data.gameId}`);
      const game = onlineGames[data.gameId];
      if (game) {
        game.lastActive = Date.now();
        const p = game.players.find((pl) => pl.id === data.playerId);
        if (p) p.socketId = socket.id;
      }
    }
  });

  // Online Game: Dice Rolled (Human or Bot)
  socket.on(
    'online_dice_roll',
    (data: { gameId: string; playerColor: 'blue' | 'red' | 'green' | 'yellow'; diceValue: number }) => {
      const { gameId, playerColor, diceValue } = data;
      const game = onlineGames[gameId];
      if (game) {
        game.lastActive = Date.now();
        socket.to(`game_${gameId}`).emit('opponent_dice_rolled', {
          playerColor,
          diceValue,
        });
      }
    }
  );

  // Online Game: Token Moved (Human or Bot)
  socket.on(
    'online_token_move',
    (data: {
      gameId: string;
      playerColor: 'blue' | 'red' | 'green' | 'yellow';
      tokenId: number;
      roll: number;
      nextTurn: 'blue' | 'red' | 'green' | 'yellow';
      playersState?: any;
    }) => {
      const { gameId, playerColor, tokenId, roll, nextTurn, playersState } = data;
      const game = onlineGames[gameId];
      if (game) {
        game.lastActive = Date.now();
        game.currentTurn = nextTurn;
        if (playersState) game.boardState = playersState;
        socket.to(`game_${gameId}`).emit('opponent_token_moved', {
          playerColor,
          tokenId,
          roll,
          nextTurn,
          playersState,
        });
      }
    }
  );

  // Online Game: Chat / Quick Message
  socket.on('online_chat_message', (data: { gameId: string; sender: string; text: string; type: string }) => {
    if (data?.gameId) {
      socket.to(`game_${data.gameId}`).emit('opponent_chat_message', data);
    }
  });

  // Online Game: Player Timeout (15s Inactivity Auto-Out)
  socket.on('online_player_timeout', (data: { gameId: string; playerColor: 'blue' | 'red' | 'green' | 'yellow' }) => {
    if (data?.gameId) {
      const game = onlineGames[data.gameId];
      if (game) {
        game.lastActive = Date.now();
      }
      socket.to(`game_${data.gameId}`).emit('opponent_timed_out', {
        playerColor: data.playerColor,
      });
    }
  });

  // Online Game: Request Rematch with Same Players
  socket.on('request_rematch', (data: { gameId: string; playerId: string; name: string }) => {
    const { gameId, playerId, name } = data;
    const game = onlineGames[gameId];
    if (game) {
      game.lastActive = Date.now();
      const anyGame: any = game;
      anyGame.rematches = anyGame.rematches || {};
      anyGame.rematches[playerId] = true;

      const realPlayers = game.players.filter((p) => !p.isBot);
      const totalReal = realPlayers.length;
      const agreedReal = realPlayers.filter((p) => anyGame.rematches[p.id]).length;

      if (agreedReal >= totalReal) {
        anyGame.rematches = {};
        game.currentTurn = 'blue';
        game.boardState = null;
        game.status = 'playing';

        io.to(`game_${gameId}`).emit('start_rematch_game', {
          gameId,
          playerCount: game.playerCount,
          players: game.players,
          firstTurn: 'blue',
        });
      } else {
        io.to(`game_${gameId}`).emit('rematch_progress', {
          gameId,
          readyCount: agreedReal,
          totalCount: totalReal,
          requesterName: name,
        });
      }
    }
  });

  // Online Game: Decline Rematch / Go Home
  socket.on('decline_rematch', (data: { gameId: string; playerId: string }) => {
    if (data?.gameId) {
      socket.to(`game_${data.gameId}`).emit('opponent_declined_rematch', {
        gameId: data.gameId,
        playerId: data.playerId,
      });
      delete onlineGames[data.gameId];
    }
  });

  // Online Game: Player Left / Disconnected
  socket.on('leave_online_game', (data: { gameId: string; playerId: string }) => {
    if (data?.gameId) {
      socket.to(`game_${data.gameId}`).emit('opponent_left_game', {
        gameId: data.gameId,
        playerId: data.playerId,
      });
      delete onlineGames[data.gameId];
    }
  });

  socket.on('disconnect', () => {
    // Remove from waiting queues if disconnected
    for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
      for (const [id, p] of Object.entries(waitingQueues[c])) {
        if (p.socketId === socket.id) {
          delete waitingQueues[c][id];
        }
      }
    }
    // Notify active game rooms
    for (const [gid, g] of Object.entries(onlineGames)) {
      const p = g.players.find((pl) => pl.socketId === socket.id && !pl.isBot);
      if (p) {
        socket.to(`game_${gid}`).emit('opponent_left_game', {
          gameId: gid,
          playerId: p.id,
          reason: 'disconnected',
        });
      }
    }
  });
});

// REST Fallback for Matchmaking (2P, 3P, 4P)
app.post('/api/online/find-match', (req, res) => {
  const { playerId, name, avatar, diceSkin, tokenSkin, level, vipLevel } = req.body;
  const count = (req.body?.playerCount === 3 ? 3 : req.body?.playerCount === 4 ? 4 : 2) as 2 | 3 | 4;
  if (!playerId) return res.status(400).json({ error: 'Missing playerId' });

  for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
    delete waitingQueues[c][playerId];
  }

  waitingQueues[count][playerId] = {
    id: playerId,
    socketId: '',
    name: name || 'Player',
    avatar: avatar || '',
    playerCount: count,
    level: typeof level === 'number' ? level : 1,
    vipLevel: typeof vipLevel === 'number' ? vipLevel : 1,
    diceSkin: diceSkin || 'normal',
    tokenSkin: tokenSkin || 'normal',
    timestamp: Date.now(),
  };

  processMatchmaking();
  return res.json({ status: 'waiting' });
});

app.post('/api/online/poll-match', (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'Missing playerId' });

  // Check if player has been matched into a game
  for (const game of Object.values(onlineGames)) {
    const me = game.players.find((p) => p.id === playerId);
    if (me) {
      return res.json({
        status: 'matched',
        gameId: game.gameId,
        playerCount: game.playerCount,
        myColor: me.color,
        myName: me.name,
        myAvatar: me.avatar,
        players: game.players.map((gp) => ({
          id: gp.id,
          name: gp.name,
          avatar: gp.avatar,
          color: gp.color,
          isBot: gp.isBot,
          level: gp.level,
          vipLevel: gp.vipLevel,
          diceSkin: gp.diceSkin || 'normal',
          tokenSkin: gp.tokenSkin || 'normal',
        })),
        firstTurn: 'blue',
      });
    }
  }

  for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
    if (waitingQueues[c][playerId]) {
      return res.json({ status: 'waiting' });
    }
  }

  return res.json({ status: 'not_found' });
});

app.post('/api/online/cancel-match', (req, res) => {
  const { playerId } = req.body;
  if (playerId) {
    for (const c of [2, 3, 4] as (2 | 3 | 4)[]) {
      delete waitingQueues[c][playerId];
    }
  }
  res.json({ success: true });
});

// Production static or Vite middleware with complete SPA routing fallback for all routes
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      ws: false,
      hmr: false,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  // Serve transformed index.html for all non-file routes including /remote
  app.use('*', async (req, res, next) => {
    // Skip API, websocket, or static asset requests
    const url = req.originalUrl.split('?')[0];
    if (
      url.startsWith('/api') ||
      url.startsWith('/socket.io') ||
      url.endsWith('.webmanifest') ||
      url.endsWith('.json') ||
      url.endsWith('.js') ||
      url.endsWith('.png') ||
      url.endsWith('.svg') ||
      url.endsWith('.ico') ||
      url.endsWith('.css') ||
      url.endsWith('.mp3') ||
      url.endsWith('.wav')
    ) {
      return next();
    }
    try {
      const indexPath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(indexPath, 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Ludo King Server running at http://0.0.0.0:${PORT}`);
});
