import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users,
  Search,
  Mail,
  Phone,
  Loader2,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  createdAt: string | Date;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform users to split name into firstName and lastName
        const transformedUsers = (data.users || []).map((user: any) => {
          const nameParts = (user.name || '').split(' ');
          return {
            ...user,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            createdAt: user.created_at
          };
        });
        setUsers(transformedUsers);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-500' : 'bg-blue-500';
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('User role updated successfully');
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

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
              <p className="text-gray-400">View and manage customer accounts</p>
            </div>
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                    <p className="text-sm text-gray-400">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                    <p className="text-sm text-gray-400">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <UserIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {users.filter(u => u.role === 'user').length}
                    </p>
                    <p className="text-sm text-gray-400">Customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Phone</TableHead>
                      <TableHead className="text-gray-400">Role</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow 
                          key={user.id}
                          className="border-gray-800 hover:bg-gray-800/50"
                        >
                          <TableCell className="text-white font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <span>{user.firstName} {user.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {user.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-gray-600">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className={`w-28 ${getRoleBadgeColor(user.role)} text-white border-0`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                              className="border-gray-700 text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                            >
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
