import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = ({ notifications, onMarkRead, onSelectNotification }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = (id) => {
    onMarkRead(id);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onSelectNotification={onSelectNotification}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;