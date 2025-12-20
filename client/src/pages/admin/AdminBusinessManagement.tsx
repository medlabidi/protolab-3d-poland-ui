import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Search,
  Edit,
  Eye,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { useNavigate } from "react-router-dom";

interface UserBusiness {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  created_at: string;
  orderCount: number;
  totalSpent: number;
}

interface Invoice {
  id: string;
  order_id: string;
  order_number: string;
  amount: number;
  status: string;
  created_at: string;
}

const AdminBusinessManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<UserBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<UserBusiness | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip_code: '',
    country: ''
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    // Filter businesses based on search query
    if (searchQuery.trim() === '') {
      setFilteredBusinesses(businesses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = businesses.filter(business =>
        business.name.toLowerCase().includes(query) ||
        business.email.toLowerCase().includes(query) ||
        (business.phone && business.phone.toLowerCase().includes(query))
      );
      setFilteredBusinesses(filtered);
    }
  }, [searchQuery, businesses]);

  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
        setFilteredBusinesses(data);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load businesses');
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/businesses/${userId}/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        toast.error('Failed to load invoices');
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
    }
  };

  const handleEditBusiness = (business: UserBusiness) => {
    setSelectedBusiness(business);
    setEditFormData({
      name: business.name,
      email: business.email,
      phone: business.phone || '',
      address: business.address || '',
      city: business.city || '',
      zip_code: business.zip_code || '',
      country: business.country || ''
    });
    setShowEditDialog(true);
  };

  const handleViewInvoices = async (business: UserBusiness) => {
    setSelectedBusiness(business);
    await fetchInvoices(business.id);
    setShowInvoicesDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBusiness) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/users/${selectedBusiness.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Business information updated successfully');
        setShowEditDialog(false);
        fetchBusinesses(); // Refresh the list
      } else {
        toast.error('Failed to update business information');
      }
    } catch (error) {
      console.error('Failed to update business:', error);
      toast.error('Failed to update business information');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading businesses...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2 gradient-text">Business Management</h1>
            <p className="text-muted-foreground text-lg">Manage business customers and their invoices</p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{businesses.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {businesses.reduce((sum, b) => sum + b.totalSpent, 0).toFixed(2)} PLN
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {businesses.reduce((sum, b) => sum + b.orderCount, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Business List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Customers
              </CardTitle>
              <CardDescription>View and manage business customer information</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery ? 'No businesses found matching your search' : 'No businesses found'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBusinesses.map((business) => (
                    <div 
                      key={business.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{business.name}</h3>
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {business.email}
                              </div>
                              {business.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {business.phone}
                                </div>
                              )}
                              {(business.city || business.country) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {[business.city, business.country].filter(Boolean).join(', ')}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                {business.orderCount} orders • {business.totalSpent.toFixed(2)} PLN
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewInvoices(business)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Invoices
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBusiness(business)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/admin/users/${business.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Business Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
            <DialogDescription>
              Update customer information for {selectedBusiness?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zip">Zip Code</Label>
                <Input
                  id="edit-zip"
                  value={editFormData.zip_code}
                  onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoices Dialog */}
      <Dialog open={showInvoicesDialog} onOpenChange={setShowInvoicesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice History</DialogTitle>
            <DialogDescription>
              All invoices for {selectedBusiness?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found for this business</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">Order #{invoice.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{invoice.amount.toFixed(2)} PLN</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBusinessManagement;
