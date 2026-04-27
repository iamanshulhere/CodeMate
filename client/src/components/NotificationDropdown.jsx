import { useEffect, useRef } from "react";
import { X, MessageCircle, Users, Heart, Bell } from "lucide-react";

const NotificationDropdown = ({ notifications, onMarkRead, onSelectNotification, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const getIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageCircle size={16} className="text-blue-500" />;
      case "project":
      case "project_invite":
        return <Users size={16} className="text-green-500" />;
      case "connection":
        return <Users size={16} className="text-sky-500" />;
      case "match":
        return <Heart size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Notifications</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                !notification.isRead ? "bg-blue-50" : ""
              }`}
              onClick={() => {
                if (typeof onSelectNotification === "function") {
                  onSelectNotification(notification);
                } else {
                  onMarkRead(notification._id);
                }
                onClose();
              }}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">{notification.content}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;