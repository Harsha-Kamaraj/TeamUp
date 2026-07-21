import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createSocket } from '@/lib/socket';

const SocketContext = createContext({ socket: null, onlineUsers: new Set(), isOnline: () => false });

/**
 * SocketProvider — owns the single Socket.IO connection for the app.
 * Connects when the user is authenticated, tracks online presence, and keeps
 * the conversations list fresh by invalidating it on incoming activity.
 */
export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const s = createSocket();
    s.connect();

    s.on('presence:init', ({ online }) => setOnlineUsers(new Set(online)));
    s.on('presence:online', ({ userId }) =>
      setOnlineUsers((prev) => new Set(prev).add(userId))
    );
    s.on('presence:offline', ({ userId }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      })
    );

    // Keep the conversation list + unread badge in sync globally.
    const refreshConversations = () =>
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    s.on('message:new', refreshConversations);
    s.on('conversation:read', refreshConversations);

    // Keep the notification bell (and dashboard stats) in sync in real time.
    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };
    s.on('notification:new', refreshNotifications);
    s.on('notifications:updated', refreshNotifications);

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({ socket, onlineUsers, isOnline: (id) => onlineUsers.has(id) }),
    [socket, onlineUsers]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
