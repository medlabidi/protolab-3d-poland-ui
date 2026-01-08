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
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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

interface UserDetails {
  user: User;
  statistics: {
    orders: {
      total: number;
      paid: number;
      pending: number;
      failed: number;
      refunded: number;
    };
    amounts: {
      total_spent: number;
      pending_amount: number;
      average_order: number;
    };
    payment: {
      methods_used: string[];
      has_payment_account: boolean;
      payment_account_verified: boolean;
      payment_account_type: string | null;
      category: string;
    };
  };
  recent_orders: any[];
  payment_history: any[];
  payment_account: any;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
    status: 'pending',
    email_verified: false,
    phone: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [viewingUserDetails, setViewingUserDetails] = useState<UserDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Close export menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isExportMenuOpen && !target.closest('.export-menu-container')) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 401) {
        toast({ variant: "destructive", title: "Session expirée", description: "Reconnectez-vous" });
        navigate('/admin/login');
      } else {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les utilisateurs" });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ variant: "destructive", title: "Erreur réseau", description: "Vérifiez votre connexion" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user',
        status: 'pending',
        email_verified: false,
        phone: '',
        country: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'pending',
      email_verified: false,
    });
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast({ variant: "destructive", title: "Erreur", description: "Nom et email sont requis" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const method = editingUser ? 'PATCH' : 'POST';
      const body = editingUser ? { id: editingUser.id, ...formData } : formData;

      const response = await fetch(`${API_URL}/admin/users`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: "Succès", description: `Utilisateur ${editingUser ? 'modifié' : 'créé'} avec succès` });
        fetchUsers();
        handleCloseDialog();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Erreur", description: data.error || "Une erreur est survenue" });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast({ variant: "destructive", title: "Erreur réseau", description: "Impossible de sauvegarder" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      if (response.ok) {
        toast({ title: "Succès", description: "Utilisateur supprimé" });
        fetchUsers();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Erreur", description: data.error || "Impossible de supprimer" });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ variant: "destructive", title: "Erreur réseau", description: "Impossible de supprimer" });
    }
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = ['Name', 'Email', 'Role', 'Status', 'Email Verified', 'Phone', 'Country', 'Created At'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.role,
      user.status,
      user.email_verified ? 'Yes' : 'No',
      user.phone || '',
      user.country || '',
      formatDate(user.created_at || ''),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export réussi", description: `${filteredUsers.length} utilisateurs exportés en CSV` });
    setIsExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    // Prepare JSON data
    const jsonData = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.email_verified,
      phone: user.phone || null,
      country: user.country || null,
      createdAt: user.created_at,
    }));

    // Download JSON file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export réussi", description: `${filteredUsers.length} utilisateurs exportés en JSON` });
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    // Create HTML table for Excel
    const headers = ['Name', 'Email', 'Role', 'Status', 'Email Verified', 'Phone', 'Country', 'Created At'];
    const rows = filteredUsers.map(user => [
      user.name,
      user.email,
      user.role,
      user.status,
      user.email_verified ? 'Yes' : 'No',
      user.phone || '',
      user.country || '',
      formatDate(user.created_at || ''),
    ]);

    let html = '<html><head><meta charset="utf-8"></head><body><table border="1">';
    html += '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table></body></html>';

    // Download as Excel file
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export réussi", description: `${filteredUsers.length} utilisateurs exportés en Excel` });
    setIsExportMenuOpen(false);
  };

  const handleViewUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    setIsDetailsDialogOpen(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/user-details?id=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setViewingUserDetails(data);
      } else {
        const error = await response.json();
        toast({ variant: "destructive", title: "Erreur", description: error.error || "Impossible de charger les détails" });
        setIsDetailsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({ variant: "destructive", title: "Erreur réseau", description: "Impossible de charger les détails" });
      setIsDetailsDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getPaymentCategoryBadge = (category: string) => {
    const badges: { [key: string]: { color: string; label: string } } = {
      premium: { color: 'bg-purple-500/20 text-purple-400', label: '👑 Premium' },
      regular: { color: 'bg-blue-500/20 text-blue-400', label: '⭐ Regular' },
      occasional: { color: 'bg-green-500/20 text-green-400', label: '✓ Occasional' },
      no_purchases: { color: 'bg-gray-500/20 text-gray-400', label: '○ No Purchases' },
      new: { color: 'bg-yellow-500/20 text-yellow-400', label: '🆕 New' },
    };
    return badges[category] || badges.new;
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
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
              
              {/* Export Menu */}
              <div className="relative export-menu-container">
                <Button 
                  variant="outline" 
                  className="border-gray-700 text-gray-300"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="py-1">
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Export as CSV
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export as Excel
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Export as JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewUserDetails(user.id!)}
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details & statistics</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenDialog(user)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit user</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.id!, user.name)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete user</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingUser ? 'Modify user information and permissions' : 'Create a new user account with role and status'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="john@example.com"
                  disabled={!!editingUser}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role || 'user'}
                  onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="+48 123 456 789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Poland"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="email_verified"
                checked={formData.email_verified || false}
                onChange={(e) => setFormData({ ...formData, email_verified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-700"
              />
              <Label htmlFor="email_verified" className="cursor-pointer">
                Email Verified
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="border-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete user profile with order statistics, payment information, and activity history
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : viewingUserDetails ? (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium">{viewingUserDetails.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {viewingUserDetails.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getRoleColor(viewingUserDetails.user.role)}`}>
                        {viewingUserDetails.user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        <span className="capitalize text-sm">{viewingUserDetails.user.role}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(viewingUserDetails.user.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <span className="capitalize text-sm">{viewingUserDetails.user.status}</span>
                      </div>
                    </div>
                    {viewingUserDetails.user.phone && (
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium">{viewingUserDetails.user.phone}</p>
                      </div>
                    )}
                    {viewingUserDetails.user.country && (
                      <div>
                        <p className="text-sm text-gray-400">Country</p>
                        <p className="font-medium">{viewingUserDetails.user.country}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Category */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Customer Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold ${getPaymentCategoryBadge(viewingUserDetails.statistics.payment.category).color}`}>
                    {getPaymentCategoryBadge(viewingUserDetails.statistics.payment.category).label}
                  </div>
                </CardContent>
              </Card>

              {/* Orders Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Orders</p>
                        <p className="text-2xl font-bold text-white">{viewingUserDetails.statistics.orders.total}</p>
                      </div>
                      <ShoppingCart className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Paid Orders</p>
                        <p className="text-2xl font-bold text-green-400">{viewingUserDetails.statistics.orders.paid}</p>
                      </div>
                      <BadgeCheck className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Pending</p>
                        <p className="text-2xl font-bold text-yellow-400">{viewingUserDetails.statistics.orders.pending}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Statistics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Total Spent</p>
                      <p className="text-xl font-bold text-green-400">
                        {viewingUserDetails.statistics.amounts.total_spent.toFixed(2)} PLN
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Pending Amount</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {viewingUserDetails.statistics.amounts.pending_amount.toFixed(2)} PLN
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Average Order</p>
                      <p className="text-xl font-bold text-blue-400">
                        {viewingUserDetails.statistics.amounts.average_order.toFixed(2)} PLN
                      </p>
                    </div>
                  </div>

                  {viewingUserDetails.statistics.orders.failed > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-400">
                        {viewingUserDetails.statistics.orders.failed} failed order(s)
                      </p>
                    </div>
                  )}

                  {viewingUserDetails.statistics.orders.refunded > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <p className="text-sm text-orange-400">
                        {viewingUserDetails.statistics.orders.refunded} refunded order(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods & Account */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Payment Methods Used</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingUserDetails.statistics.payment.methods_used.length > 0 ? (
                        viewingUserDetails.statistics.payment.methods_used.map((method, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {method}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No payment methods recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-400">Payment Account</p>
                      <p className={`font-semibold ${viewingUserDetails.statistics.payment.has_payment_account ? 'text-green-400' : 'text-red-400'}`}>
                        {viewingUserDetails.statistics.payment.has_payment_account ? '✓ Exists' : '✗ Not Set Up'}
                      </p>
                    </div>
                    
                    {viewingUserDetails.statistics.payment.has_payment_account && (
                      <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400">Account Verified</p>
                        <p className={`font-semibold ${viewingUserDetails.statistics.payment.payment_account_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                          {viewingUserDetails.statistics.payment.payment_account_verified ? '✓ Verified' : '⧗ Pending'}
                        </p>
                      </div>
                    )}
                  </div>

                  {viewingUserDetails.payment_account && (
                    <div className="p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Payment Account Details</p>
                      <div className="space-y-2 text-sm">
                        {viewingUserDetails.payment_account.account_type && (
                          <p><span className="text-gray-400">Type:</span> <span className="text-white">{viewingUserDetails.payment_account.account_type}</span></p>
                        )}
                        {viewingUserDetails.payment_account.account_number && (
                          <p><span className="text-gray-400">Number:</span> <span className="text-white font-mono">****{viewingUserDetails.payment_account.account_number.slice(-4)}</span></p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Orders */}
              {viewingUserDetails.recent_orders.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Recent Orders ({viewingUserDetails.recent_orders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {viewingUserDetails.recent_orders.map((order, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div>
                            <p className="font-medium">{order.project_name || order.file_name || `Order #${order.id.substring(0, 8)}`}</p>
                            <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{(order.paid_amount || order.price || 0).toFixed(2)} PLN</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              order.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {order.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-700 hover:bg-gray-600">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
