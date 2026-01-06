import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Mail,
  Filter,
  Download,
  Eye,
  Loader2,
  Shield,
  User,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: string;
  email_verified: boolean;
  created_at: string;
  phone?: string;
  country?: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400';
      case 'user': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'suspended': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'admin') return user.role === 'admin';
    if (filter === 'user') return user.role === 'user';
    if (filter === 'verified') return user.email_verified;
    if (filter === 'unverified') return !user.email_verified;
    return true;
  });

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
              <p className="text-gray-400">Total Users: {users.length}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-700 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'admin', label: 'Admins' },
                  { id: 'user', label: 'Regular Users' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'unverified', label: 'Unverified' },
                ].map(f => (
                  <Button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    variant={filter === f.id ? 'default' : 'outline'}
                    className={filter === f.id ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300'}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {f.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Verified</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No users found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <p className="font-medium text-white">{user.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getRoleColor(user.role)}`}>
                              {user.role === 'admin' ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                              <span className="capitalize text-sm">{user.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(user.status)}`}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                              <span className="capitalize text-sm">{user.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.email_verified ? (
                              <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-yellow-400">
                                <Ban className="w-4 h-4" />
                                <span className="text-sm">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-500 hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Admins</p>
                <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'admin').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Verified</p>
                <p className="text-2xl font-bold text-green-400">{users.filter(u => u.email_verified).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-2">Unverified</p>
                <p className="text-2xl font-bold text-yellow-400">{users.filter(u => !u.email_verified).length}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
