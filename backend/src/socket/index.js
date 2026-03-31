const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

/**
 * Initialize Socket.io with authentication and room-based events.
 * @param {Object} io - Socket.io server instance
 */
const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // Join the user's tenant room for scoped events
    socket.join(socket.user.tenantId);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};

module.exports = initializeSocket;
