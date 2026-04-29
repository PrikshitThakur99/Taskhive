import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('user:join', user._id);
    });

    socket.on('users:online', (users) => setOnlineUsers(users));

    socket.on('bid:new', (data) => {
      setNotifications(prev => [{ id: Date.now(), type: 'bid', ...data }, ...prev]);
    });

    socket.on('bid:accepted', (data) => {
      setNotifications(prev => [{ id: Date.now(), type: 'bid_accepted', ...data }, ...prev]);
    });

    socket.on('task:completed', (data) => {
      setNotifications(prev => [{ id: Date.now(), type: 'completed', ...data }, ...prev]);
    });

    socket.on('message:new', (msg) => {
      setNotifications(prev => [{ id: Date.now(), type: 'message', msg }, ...prev]);
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  const clearNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      notifications,
      clearNotification,
      clearAll,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
