const onlineUsers = new Map();

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('user:join', (userId) => {
      if (userId) {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });

    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('typing:start', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('typing:stop', { userId });
    });

    socket.on('disconnect', () => {
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) { onlineUsers.delete(uid); break; }
      }
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = { setupSocketIO, getOnlineUsers: () => Array.from(onlineUsers.keys()) };
