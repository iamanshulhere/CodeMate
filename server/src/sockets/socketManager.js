let ioInstance = null;

export const setSocketServer = (io) => {
  ioInstance = io;
};

export const getSocketServer = () => ioInstance;

export const getUserRoom = (userId) => `user:${userId}`;
