import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, MessageSquare, CheckCircle, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DesignRequest {
  id: string;
  user_id: string;
  user_email?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  budget?: number;
  deadline?: string;
  files?: string[];
}

const AdminDesignAssistance = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DesignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDesignRequests();
  }, []);

  const fetchDesignRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/design-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        // For now, use mock data if endpoint doesn't exist
        setRequests([
          {
            id: '1',
            user_id: 'user1',
            user_email: 'client@example.com',
            title: 'Custom phone case design',
            description: 'Need a custom phone case with logo',
            status: 'pending',
            priority: 'high',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            budget: 150,
          },
          {
            id: '2',
            user_id: 'user2',
            user_email: 'test@example.com',
            title: 'Mechanical part modification',
            description: 'Modify existing STL file for better fit',
            status: 'in_progress',
            priority: 'urgent',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString(),
            budget: 300,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching design requests:', error);
      toast.error('Error loading design requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'En attente' },
      in_progress: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'En cours' },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Terminé' },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Annulé' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.color} border`}>
        {variant.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-gray-500/20 text-gray-400', label: 'Basse' },
      medium: { color: 'bg-blue-500/20 text-blue-400', label: 'Moyenne' },
      high: { color: 'bg-orange-500/20 text-orange-400', label: 'Haute' },
      urgent: { color: 'bg-red-500/20 text-red-400', label: 'Urgent' },
    };

    const variant = variants[priority] || variants.medium;
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading design requests...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Pencil className="w-8 h-8 text-purple-500" />
                Design Assistance
              </h1>
              <p className="text-gray-400 mt-1">Manage custom design requests and assistance</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-800 text-white w-64"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{requests.length}</div>
                  <p className="text-sm text-gray-400 mt-1">Total Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">
                    {requests.filter(r => r.status === 'pending').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {requests.filter(r => r.status === 'in_progress').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {requests.filter(r => r.status === 'completed').length}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">All Design Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Pencil className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No design requests found</p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{request.title}</h3>
                              {getStatusBadge(request.status)}
                              {getPriorityBadge(request.priority)}
                            </div>
                            
                            <p className="text-gray-400 text-sm mb-4">{request.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <span>👤</span>
                                <span>{request.user_email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(request.created_at)}</span>
                              </div>
                              {request.budget && (
                                <div className="flex items-center gap-2">
                                  <span>💰</span>
                                  <span className="font-semibold text-green-400">{request.budget} PLN</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-purple-500/20 text-purple-400"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-500/20 text-blue-400"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            {request.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-green-500/20 text-green-400"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDesignAssistance;
