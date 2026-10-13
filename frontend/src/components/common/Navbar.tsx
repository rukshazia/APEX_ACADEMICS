import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Database, CheckCheck, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

export const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotes, setShowNotes] = useState(false);

  const fetchNotes = async () => {
    try {
      const data = await api.services.getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.services.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-16 bg-white border-b border-brd px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Left: Environment & Institutional Status */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-bg-highlight border border-brd text-xs text-txt-secondary">
          <Database className="w-3.5 h-3.5 text-status-success" />
          <span className="font-semibold text-txt-primary">DB:</span>
          <span>SQLite Persistent</span>
          <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse inline-block"></span>
        </div>
        <span className="text-xs text-brd hidden sm:inline">|</span>
        <span className="text-xs text-txt-secondary hidden sm:inline font-medium">
          Academic Year 2025–2026 • Semester 4
        </span>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="p-2 rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-bg-highlight relative transition-colors border border-transparent hover:border-brd"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-status-danger text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotes && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-brd py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-brd flex items-center justify-between">
                <span className="text-xs font-semibold text-txt-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-brand-blue hover:underline flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-brd-subtle">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-txt-muted">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-xs hover:bg-bg-highlight transition-colors ${
                        !n.is_read ? 'bg-bg-highlight/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-txt-primary">{n.title}</p>
                        <span className="text-[10px] text-txt-muted">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-txt-secondary mt-1 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex items-center space-x-3 pl-3 border-l border-brd">
          <div className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
            {user?.full_name?.slice(0, 2) || 'AP'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-txt-primary leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-txt-muted capitalize font-medium">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
