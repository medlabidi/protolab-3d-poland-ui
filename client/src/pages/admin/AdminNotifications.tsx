import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Mail,
  Trash2,
} from "lucide-react";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Order Completed',
      message: 'Order #12345 has been successfully delivered',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'alert',
      title: 'Printer Offline',
      message: 'Printer "Anycubic i3 Mega" has gone offline',
      time: '4 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'Low Stock Alert',
      message: 'PLA White material stock is running low (0.5kg remaining)',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'success',
      title: 'New User Registration',
      message: 'New user john.doe@example.com has signed up',
      time: '1 day ago',
      read: true,
    },
    {
      id: 5,
      type: 'info',
      title: 'System Update',
      message: 'System maintenance scheduled for tomorrow at 2 AM',
      time: '2 days ago',
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'alert': return 'bg-red-500/10 border-red-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
              <p className="text-gray-400">
                {unreadCount} unread notifications
              </p>
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Mail className="w-4 h-4 mr-2" />
              Notification Settings
            </Button>
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{notifications.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Unread</p>
                <p className="text-2xl font-bold text-blue-400">{unreadCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Alerts</p>
                <p className="text-2xl font-bold text-red-400">{notifications.filter(n => n.type === 'alert').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Success</p>
                <p className="text-2xl font-bold text-green-400">{notifications.filter(n => n.type === 'success').length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800">
              <CardTitle className="text-white">Recent Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-white"
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              >
                Mark all as read
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${getTypeColor(notification.type)} ${
                        !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                      }`}
                    >
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white">{notification.title}</h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-400 ml-auto"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Order Updates', description: 'Receive notifications when orders change status' },
                { name: 'Printer Alerts', description: 'Get alerted when printers go offline or encounter issues' },
                { name: 'Low Stock Warnings', description: 'Receive warnings when materials run low' },
                { name: 'New User Registration', description: 'Be notified of new user signups' },
              ].map((pref, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0">
                  <div>
                    <p className="font-medium text-white">{pref.name}</p>
                    <p className="text-sm text-gray-400">{pref.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-600 text-blue-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
