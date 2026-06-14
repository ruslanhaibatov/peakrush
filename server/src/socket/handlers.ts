import { Server, Socket } from 'socket.io'

interface PlayerPosition {
  userId: string
  username: string
  x: number; y: number; z: number
  rx: number; ry: number; rz: number
  speed: number
  sport: string
  animState: string
}

const sessionPlayers = new Map<string, Map<string, PlayerPosition>>()

export function initSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const { sessionId, userId, username } = socket.handshake.query as Record<string, string>

    if (!sessionId || !userId) {
      socket.disconnect()
      return
    }

    socket.join(sessionId)

    if (!sessionPlayers.has(sessionId)) {
      sessionPlayers.set(sessionId, new Map())
    }

    console.log(`[Socket] ${username} joined session ${sessionId}`)

    // Broadcast join to room
    socket.to(sessionId).emit('player:joined', { userId, username })

    // Send existing players to new joiner
    const players = sessionPlayers.get(sessionId)!
    socket.emit('session:state', { players: Array.from(players.values()) })

    // Position update (high frequency ~20Hz)
    socket.on('player:move', (data: Omit<PlayerPosition, 'userId' | 'username'>) => {
      const pos: PlayerPosition = { userId, username, ...data }
      players.set(userId, pos)
      socket.to(sessionId).emit('player:moved', pos)
    })

    // Trick landed
    socket.on('trick:landed', (data: { trickName: string; score: number; combo: number }) => {
      io.to(sessionId).emit('trick:broadcast', { userId, username, ...data })
    })

    // Chat
    socket.on('chat:message', (msg: string) => {
      if (msg.length > 200) return
      io.to(sessionId).emit('chat:message', {
        userId,
        username,
        message: msg,
        timestamp: Date.now(),
      })
    })

    // Ghost challenge
    socket.on('ghost:request', (targetUserId: string) => {
      socket.to(sessionId).emit('ghost:challenge', { from: userId, target: targetUserId })
    })

    // Disconnect
    socket.on('disconnect', () => {
      players.delete(userId)
      socket.to(sessionId).emit('player:left', { userId, username })
      if (players.size === 0) sessionPlayers.delete(sessionId)
      console.log(`[Socket] ${username} left session ${sessionId}`)
    })
  })
}
