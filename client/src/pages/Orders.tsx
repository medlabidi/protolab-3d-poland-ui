import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Package, Loader2, MoreHorizontal, Pencil, Trash2, Download, Copy, FolderOpen, ChevronDown, ChevronRight, FileText, Plus, Files, Settings2, Archive, ArchiveRestore, Trash, Search, Filter, X, Calendar, MessageCircle, CreditCard, RefreshCw, Palette, Printer, Truck, History } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  created_at: string;
  material: string;
  color: string;
  price: number;
  file_name: string;
  file_url?: string;
  project_name?: string;
  is_archived?: boolean;
  deleted_at?: string | null;
  has_unread_messages?: boolean;
  order_type?: string;
  design_status?: string;
  shipping_method?: string;
}

type OrderTab = 'active' | 'archived' | 'deleted';

const Orders = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Preview dialog state
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.tokens.accessToken;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    
    // Refresh failed, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders('active'),
        fetchOrders('archived'),
        fetchOrders('deleted'),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (filter: OrderTab, retry = true) => {
    try {
      let token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      let response = await fetch(`${API_URL}/orders/my?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchOrders(filter, false); // Retry with new token
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      if (filter === 'active') {
        setOrders(data.orders || []);
      } else if (filter === 'archived') {
        setArchivedOrders(data.orders || []);
      } else if (filter === 'deleted') {
        setDeletedOrders(data.orders || []);
      }
    } catch (err) {
      console.error(`Error fetching ${filter} orders:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to archive order');
      }

      toast.success('Order moved to archive');
      fetchAllOrders();
    } catch (err) {
      console.error('Error archiving order:', err);
      toast.error('Failed to archive order');
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to restore order');
      }

      toast.success('Order restored');
      fetchAllOrders();
    } catch (err) {
      console.error('Error restoring order:', err);
      toast.error('Failed to restore order');
    }
  };

  const handleSoftDeleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/soft`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Order moved to trash');
      fetchAllOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Failed to delete order');
    }
  };

  const handlePermanentDeleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete order');
      }

      toast.success('Order permanently deleted');
      fetchAllOrders();
    } catch (err) {
      console.error('Error permanently deleting order:', err);
      toast.error('Failed to permanently delete order');
    }
  };

  // Group orders by project
  const groupOrdersByProject = (orderList: Order[]) => {
    const projects: Record<string, Order[]> = {};
    const standaloneOrders: Order[] = [];

    orderList.forEach(order => {
      if (order.project_name) {
        if (!projects[order.project_name]) {
          projects[order.project_name] = [];
        }
        projects[order.project_name].push(order);
      } else {
        standaloneOrders.push(order);
      }
    });

    return { projects, standaloneOrders };
  };

  // Filter orders based on search and filters
  const filterOrders = (orderList: Order[]) => {
    return orderList.filter(order => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.id.toLowerCase().includes(query) ||
          order.file_name?.toLowerCase().includes(query) ||
          order.project_name?.toLowerCase().includes(query) ||
          order.material?.toLowerCase().includes(query) ||
          order.color?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Material filter
      if (materialFilter !== 'all' && order.material !== materialFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
        }
      }

      return true;
    });
  };

  // Get unique materials from all orders for filter dropdown
  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    [...orders, ...archivedOrders, ...deletedOrders].forEach(order => {
      if (order.material) materials.add(order.material);
    });
    return Array.from(materials).sort();
  }, [orders, archivedOrders, deletedOrders]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || materialFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all' || searchQuery !== '';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMaterialFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

  // Filtered and grouped orders
  const filteredOrders = useMemo(() => filterOrders(orders), [orders, searchQuery, statusFilter, materialFilter, paymentFilter, dateFilter]);
  const filteredArchivedOrders = useMemo(() => filterOrders(archivedOrders), [archivedOrders, searchQuery, statusFilter, materialFilter, paymentFilter, dateFilter]);
  const filteredDeletedOrders = useMemo(() => filterOrders(deletedOrders), [deletedOrders, searchQuery, statusFilter, materialFilter, paymentFilter, dateFilter]);

  const groupedOrders = useMemo(() => groupOrdersByProject(filteredOrders), [filteredOrders]);
  const groupedArchivedOrders = useMemo(() => groupOrdersByProject(filteredArchivedOrders), [filteredArchivedOrders]);
  const groupedDeletedOrders = useMemo(() => groupOrdersByProject(filteredDeletedOrders), [filteredDeletedOrders]);

  // Split filtered orders by type
  const filteredPrintOrders = useMemo(() => filteredOrders.filter(o => !o.order_type || o.order_type === 'print'), [filteredOrders]);
  const filteredDesignOrders = useMemo(() => filteredOrders.filter(o => o.order_type === 'design'), [filteredOrders]);
  const filteredArchivedPrintOrders = useMemo(() => filteredArchivedOrders.filter(o => !o.order_type || o.order_type === 'print'), [filteredArchivedOrders]);
  const filteredArchivedDesignOrders = useMemo(() => filteredArchivedOrders.filter(o => o.order_type === 'design'), [filteredArchivedOrders]);
  const filteredDeletedPrintOrders = useMemo(() => filteredDeletedOrders.filter(o => !o.order_type || o.order_type === 'print'), [filteredDeletedOrders]);
  const filteredDeletedDesignOrders = useMemo(() => filteredDeletedOrders.filter(o => o.order_type === 'design'), [filteredDeletedOrders]);

  // Group only print orders by project
  const groupedPrintOrders = useMemo(() => groupOrdersByProject(filteredPrintOrders), [filteredPrintOrders]);
  const groupedArchivedPrintOrders = useMemo(() => groupOrdersByProject(filteredArchivedPrintOrders), [filteredArchivedPrintOrders]);
  const groupedDeletedPrintOrders = useMemo(() => groupOrdersByProject(filteredDeletedPrintOrders), [filteredDeletedPrintOrders]);

  // Get project status based on its orders
  const getProjectStatus = (projectOrders: Order[]): OrderStatus => {
    const statuses = projectOrders.map(o => o.status);
    if (statuses.every(s => s === 'delivered')) return 'delivered';
    if (statuses.every(s => s === 'finished' || s === 'delivered')) return 'finished';
    if (statuses.some(s => s === 'printing')) return 'printing';
    if (statuses.some(s => s === 'in_queue')) return 'in_queue';
    if (statuses.some(s => s === 'on_hold')) return 'on_hold';
    if (statuses.every(s => s === 'suspended')) return 'suspended';
    return 'submitted';
  };

  // Get project payment status
  const getProjectPaymentStatus = (projectOrders: Order[]): PaymentStatus | null => {
    const statuses = projectOrders.map(o => o.payment_status).filter(Boolean);
    if (statuses.length === 0) return null;
    if (statuses.every(s => s === 'paid')) return 'paid';
    if (statuses.some(s => s === 'on_hold')) return 'on_hold';
    if (statuses.some(s => s === 'refunded')) return 'refunded';
    return 'on_hold';
  };

  // Get project total price
  const getProjectTotal = (projectOrders: Order[]): number => {
    return projectOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  };

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  const handleRenameProject = async () => {
    if (!selectedProject || !newProjectName.trim()) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const projectOrders = groupedOrders.projects[selectedProject];
      
      if (!projectOrders || projectOrders.length === 0) {
        toast.error(t('orders.toasts.projectNotFound'));
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      // Update all orders in the project with the new name
      for (const order of projectOrders) {
        const response = await fetch(`${API_URL}/orders/${order.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ project_name: newProjectName.trim() }),
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          const error = await response.json();
          console.error('Failed to update order:', order.id, error);
        }
      }
      
      if (failCount > 0 && successCount === 0) {
        toast.error(t('orders.toasts.renameProjectFailed'));
      } else if (failCount > 0) {
        toast.warning(t('orders.toasts.partiallyRenamed').replace('{success}', String(successCount)).replace('{failed}', String(failCount)));
      } else {
        toast.success(t('orders.toasts.projectRenamed').replace('{name}', newProjectName.trim()));
      }
      
      setRenameDialogOpen(false);
      setSelectedProject(null);
      setNewProjectName('');
      fetchAllOrders();
    } catch (error) {
      toast.error(t('orders.toasts.renameProjectError'));
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const projectOrders = groupedOrders.projects[selectedProject];
      
      if (!projectOrders || projectOrders.length === 0) {
        toast.error(t('orders.toasts.projectNotFound'));
        return;
      }
      
      // Check if any orders are still active
      const activeOrders = projectOrders.filter(o => 
        ['submitted', 'in_queue', 'printing'].includes(o.status)
      );
      
      if (activeOrders.length > 0) {
        toast.error(t('orders.toasts.cannotDeleteActiveOrders').replace('{count}', String(activeOrders.length)));
        setDeleteDialogOpen(false);
        setSelectedProject(null);
        return;
      }
      
      let successCount = 0;
      let failCount = 0;
      
      // Soft delete all orders in the project
      for (const order of projectOrders) {
        const response = await fetch(`${API_URL}/orders/${order.id}/soft`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          console.error('Failed to delete order:', order.id);
        }
      }
      
      if (failCount > 0 && successCount === 0) {
        toast.error(t('orders.toasts.deleteProjectFailed'));
      } else if (failCount > 0) {
        toast.warning(t('orders.toasts.partiallyDeleted').replace('{success}', String(successCount)).replace('{failed}', String(failCount)));
      } else {
        toast.success(t('orders.toasts.projectDeleted').replace('{name}', selectedProject));
      }
      
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchAllOrders();
    } catch (error) {
      toast.error(t('orders.toasts.deleteProjectError'));
    }
  };

  // Helper to check if an order can be deleted/archived (not actively processing)
  const canDeleteOrder = (status: OrderStatus): boolean => {
    const activeStatuses = ['submitted', 'in_queue', 'printing'];
    return !activeStatuses.includes(status);
  };

  // Helper to check if a project can be deleted (all orders are non-active)
  const canDeleteProject = (projectOrders: Order[]): boolean => {
    return projectOrders.every(order => canDeleteOrder(order.status));
  };

  const handleAddPartToProject = (projectName: string) => {
    navigate('/new-print', { state: { projectName, addToProject: true } });
  };

  const handleDuplicateProject = async (projectName: string) => {
    toast.info(t('orders.toasts.duplicateComingSoon'));
  };

  const handleDownloadAllFiles = async (projectName: string) => {
    const projectOrders = groupedOrders.projects[projectName];
    for (const order of projectOrders) {
      if (order.file_url) {
        window.open(order.file_url, '_blank');
      }
    }
    toast.success(t('orders.toasts.downloadingFiles').replace('{count}', String(projectOrders.length)));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    const numPrice = Number(price);
    if (price === null || price === undefined || isNaN(numPrice)) {
      return '0.00 PLN';
    }
    return `${numPrice.toFixed(2)} PLN`;
  };

  const capitalizeFirst = (str: string | null | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="flex min-h-screen" style={{backgroundColor: 'rgb(3 7 18 / var(--tw-bg-opacity, 1))'}}>
      <DashboardSidebar />
      
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 gradient-text">Order History</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Track all your print jobs and design orders</p>
          </div>

          <Card className="shadow-xl border-2 border-transparent hover:border-primary/10 transition-all animate-slide-up bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                    <History className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Order History
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? 'bg-primary/10' : ''}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {t('orders.filters')}
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {[statusFilter !== 'all', materialFilter !== 'all', paymentFilter !== 'all', dateFilter !== 'all'].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('orders.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg animate-slide-up">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">{t('orders.filters.status')}</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                          <SelectValue placeholder={t('orders.filters.allStatuses')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('orders.filters.allStatuses')}</SelectItem>
                          <SelectItem value="submitted">{t('orders.statuses.submitted')}</SelectItem>
                          <SelectItem value="in_queue">{t('orders.statuses.inQueue')}</SelectItem>
                          <SelectItem value="printing">{t('orders.statuses.printing')}</SelectItem>
                          <SelectItem value="finished">{t('orders.statuses.finished')}</SelectItem>
                          <SelectItem value="delivered">{t('orders.statuses.delivered')}</SelectItem>
                          <SelectItem value="on_hold">{t('orders.statuses.onHold')}</SelectItem>
                          <SelectItem value="suspended">{t('orders.statuses.suspended')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">{t('orders.filters.material')}</Label>
                      <Select value={materialFilter} onValueChange={setMaterialFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                          <SelectValue placeholder={t('orders.filters.allMaterials')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('orders.filters.allMaterials')}</SelectItem>
                          {uniqueMaterials.map(material => (
                            <SelectItem key={material} value={material}>{material}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">{t('orders.filters.payment')}</Label>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                          <SelectValue placeholder={t('orders.filters.allPayments')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('orders.filters.allPayments')}</SelectItem>
                          <SelectItem value="pending">{t('orders.paymentStatuses.pending')}</SelectItem>
                          <SelectItem value="paid">{t('orders.paymentStatuses.paid')}</SelectItem>
                          <SelectItem value="refunded">{t('orders.paymentStatuses.refunded')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">{t('orders.filters.date')}</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                          <SelectValue placeholder={t('orders.filters.allTime')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('orders.filters.allTime')}</SelectItem>
                          <SelectItem value="today">{t('orders.filters.today')}</SelectItem>
                          <SelectItem value="week">{t('orders.filters.last7Days')}</SelectItem>
                          <SelectItem value="month">{t('orders.filters.last30Days')}</SelectItem>
                          <SelectItem value="quarter">{t('orders.filters.last90Days')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                          <X className="w-4 h-4 mr-1" />
                          {t('orders.filters.clearAll')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Filters Summary */}
                {hasActiveFilters && !showFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">{t('orders.filters.activeFilters')}:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        {t('orders.filters.searchLabel')}: "{searchQuery}"
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('orders.filters.status')}: {statusFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                      </Badge>
                    )}
                    {materialFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('orders.filters.material')}: {materialFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setMaterialFilter('all')} />
                      </Badge>
                    )}
                    {paymentFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('orders.filters.payment')}: {paymentFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setPaymentFilter('all')} />
                      </Badge>
                    )}
                    {dateFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {t('orders.filters.date')}: {dateFilter}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setDateFilter('all')} />
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                      {t('orders.filters.clearAll')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">{t('orders.loading')}</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p>{error}</p>
                  <Button onClick={fetchAllOrders} variant="outline" className="mt-4">
                    {t('common.tryAgain')}
                  </Button>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderTab)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t('orders.tabs.orders')} ({filteredOrders.length}{hasActiveFilters ? `/${orders.length}` : ''})
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      {t('orders.tabs.archived')} ({filteredArchivedOrders.length}{hasActiveFilters ? `/${archivedOrders.length}` : ''})
                    </TabsTrigger>
                    <TabsTrigger value="deleted" className="flex items-center gap-2">
                      <Trash className="w-4 h-4" />
                      {t('orders.tabs.deleted')} ({filteredDeletedOrders.length}{hasActiveFilters ? `/${deletedOrders.length}` : ''})
                    </TabsTrigger>
                  </TabsList>

                  {/* Active Orders Tab */}
                  <TabsContent value="active">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        {hasActiveFilters ? (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.noMatchingOrders')}</p>
                            <p className="mt-2">{t('orders.empty.tryAdjustingFilters')}</p>
                            <Button onClick={clearFilters} variant="outline" className="mt-4">
                              {t('orders.filters.clearFilters')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.noOrdersYet')}</p>
                            <p className="mt-2">{t('orders.empty.startByCreating')}</p>
                            <Button onClick={() => navigate('/new-print')} className="mt-4">
                              {t('orders.empty.createNewOrder')}
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* ===== PRINT JOBS SECTION ===== */}
                        {filteredPrintOrders.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-primary/10">
                              <Printer className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-bold text-foreground">Print Jobs ({filteredPrintOrders.length})</h3>
                            </div>

                            {/* Projects Section */}
                            {Object.keys(groupedPrintOrders.projects).length > 0 && (
                              <div className="space-y-3">
                                <div className="text-sm font-bold text-muted-foreground px-4 flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4" />
                                  {t('orders.sections.projects')} ({Object.keys(groupedPrintOrders.projects).length})
                                </div>

                                {Object.entries(groupedPrintOrders.projects).map(([projectName, projectOrders]) => (
                                  <Collapsible
                                    key={projectName}
                                    open={expandedProjects.has(projectName)}
                                    onOpenChange={() => toggleProject(projectName)}
                                  >
                                    <div className="border-2 border-primary/20 rounded-xl overflow-x-auto bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10">
                                      <div className="min-w-[700px]">
                                      <div className="grid grid-cols-7 gap-4 items-center p-4 hover:bg-primary/5 transition-colors">
                                        <CollapsibleTrigger className="flex items-center gap-3 col-span-1">
                                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FolderOpen className="w-5 h-5 text-primary" />
                                          </div>
                                          <div className="text-left min-w-0">
                                            <p className="font-bold text-primary truncate">{projectName}</p>
                                            <p className="text-xs text-muted-foreground">{projectOrders.length} files</p>
                                          </div>
                                        </CollapsibleTrigger>
                                        <div>
                                          <StatusBadge status={getProjectStatus(projectOrders)} />
                                        </div>
                                        <div>
                                          {getProjectPaymentStatus(projectOrders) && (
                                            <PaymentStatusBadge status={getProjectPaymentStatus(projectOrders)!} />
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {formatDate(projectOrders[0].created_at)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {t('orders.materials.mixed')}
                                        </div>
                                        <div className="font-bold gradient-text">
                                          {formatPrice(getProjectTotal(projectOrders))}
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                              <Button variant="outline" size="sm" className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50">
                                                <MoreHorizontal className="w-4 h-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                              <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/projects/${encodeURIComponent(projectName)}/edit`);
                                              }}>
                                                <Settings2 className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.editProject')}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProject(projectName);
                                                setNewProjectName(projectName);
                                                setRenameDialogOpen(true);
                                              }}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.renameProject')}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddPartToProject(projectName);
                                              }}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.addPart')}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateProject(projectName);
                                              }}>
                                                <Files className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.duplicateProject')}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadAllFiles(projectName);
                                              }}>
                                                <Download className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.downloadAllFiles')}
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className={canDeleteProject(projectOrders) ? "text-destructive focus:text-destructive" : "text-muted-foreground cursor-not-allowed"}
                                                disabled={!canDeleteProject(projectOrders)}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (canDeleteProject(projectOrders)) {
                                                    setSelectedProject(projectName);
                                                    setDeleteDialogOpen(true);
                                                  } else {
                                                    toast.error(t('orders.toasts.cannotDeleteActiveProject'));
                                                  }
                                                }}
                                              >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                {t('orders.projectActions.deleteProject')}
                                                {!canDeleteProject(projectOrders) && (
                                                  <span className="text-xs ml-auto">({t('orders.projectActions.active')})</span>
                                                )}
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                          <CollapsibleTrigger>
                                            {expandedProjects.has(projectName) ? (
                                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                            ) : (
                                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            )}
                                          </CollapsibleTrigger>
                                        </div>
                                      </div>
                                      <CollapsibleContent>
                                        <div className="border-t border-primary/10 bg-muted/50">
                                          <div className="grid grid-cols-7 gap-4 text-xs font-bold text-muted-foreground py-2 px-4 bg-muted/30">
                                            <div className="pl-14">{t('orders.table.fileName')}</div>
                                            <div>{t('orders.table.status')}</div>
                                            <div>{t('orders.table.payment')}</div>
                                            <div>{t('orders.table.date')}</div>
                                            <div>{t('orders.table.material')}</div>
                                            <div>{t('orders.table.price')}</div>
                                            <div className="text-right">{t('orders.table.actions')}</div>
                                          </div>
                                          {projectOrders.map((order) => (
                                            <div
                                              key={order.id}
                                              className={`grid grid-cols-7 gap-4 items-center py-3 px-4 transition-colors border-t border-primary/5 cursor-pointer ${
                                                order.has_unread_messages
                                                  ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500'
                                                  : 'hover:bg-primary/5'
                                              }`}
                                              onClick={() => {
                                                setPreviewOrder(order);
                                                setShowPreview(true);
                                              }}
                                            >
                                              <div className="flex items-center gap-3 pl-4">
                                                {order.has_unread_messages && (
                                                  <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse flex-shrink-0" />
                                                )}
                                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <span className={`font-medium text-sm truncate ${
                                                  order.has_unread_messages ? 'text-orange-700 font-bold' : ''
                                                }`}>
                                                  {order.file_name}
                                                </span>
                                              </div>
                                              <div>
                                                <StatusBadge status={order.status} />
                                              </div>
                                              <div>
                                                {order.payment_status && (
                                                  <PaymentStatusBadge status={order.payment_status} />
                                                )}
                                              </div>
                                              <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                              <div className="text-sm">
                                                <span className="font-semibold">{capitalizeFirst(order.material)}</span>
                                                <span className="text-muted-foreground ml-1">({capitalizeFirst(order.color)})</span>
                                              </div>
                                              <div className="font-bold text-primary">{formatPrice(order.price)}</div>
                                              <div className="text-right">
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                                      <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                                                      <Eye className="w-4 h-4 mr-2" />
                                                      {t('orders.orderActions.viewDetails')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                                      <Pencil className="w-4 h-4 mr-2" />
                                                      {t('orders.orderActions.editOrder')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                      className={canDeleteOrder(order.status) ? "" : "text-muted-foreground cursor-not-allowed"}
                                                      disabled={!canDeleteOrder(order.status)}
                                                      onClick={() => canDeleteOrder(order.status) && handleArchiveOrder(order.id)}
                                                    >
                                                      <Archive className="w-4 h-4 mr-2" />
                                                      {t('orders.orderActions.moveToArchive')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                      className={canDeleteOrder(order.status) ? "text-destructive focus:text-destructive" : "text-muted-foreground cursor-not-allowed"}
                                                      disabled={!canDeleteOrder(order.status)}
                                                      onClick={() => canDeleteOrder(order.status) && handleSoftDeleteOrder(order.id)}
                                                    >
                                                      <Trash2 className="w-4 h-4 mr-2" />
                                                      {t('orders.orderActions.deleteOrder')}
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CollapsibleContent>
                                      </div>
                                    </div>
                                  </Collapsible>
                                ))}
                              </div>
                            )}

                            {/* Individual Print Orders */}
                            {groupedPrintOrders.standaloneOrders.length > 0 && (
                              <div className="space-y-2">
                                {Object.keys(groupedPrintOrders.projects).length > 0 && (
                                  <div className="text-sm font-bold text-muted-foreground px-4 pt-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {t('orders.sections.individualOrders')} ({groupedPrintOrders.standaloneOrders.length})
                                  </div>
                                )}

                                <div>
                                {/* Desktop header */}
                                <div className="hidden md:grid grid-cols-7 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                                  <div>{t('orders.table.fileName')}</div>
                                  <div>{t('orders.table.status')}</div>
                                  <div>{t('orders.table.payment')}</div>
                                  <div>Shipping</div>
                                  <div>{t('orders.table.material')}</div>
                                  <div>{t('orders.table.price')}</div>
                                  <div className="text-right">{t('orders.table.actions')}</div>
                                </div>

                                {groupedPrintOrders.standaloneOrders.map((order, index) => (
                                  <div key={order.id}>
                                  {/* Desktop row */}
                                  <div
                                    className={`hidden md:grid grid-cols-7 gap-4 items-center py-4 px-4 rounded-xl hover:bg-primary/5 transition-all hover-lift border animate-scale-in cursor-pointer ${
                                      order.has_unread_messages
                                        ? 'bg-orange-50 border-orange-400'
                                        : 'border-transparent hover:border-primary/20'
                                    }`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    onClick={() => {
                                      setPreviewOrder(order);
                                      setShowPreview(true);
                                    }}
                                  >
                                    <div className={`font-bold text-primary truncate flex items-center gap-2 ${order.has_unread_messages ? 'font-extrabold' : ''}`} title={order.file_name}>
                                      {order.has_unread_messages && (
                                        <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse flex-shrink-0" />
                                      )}
                                      {order.file_name}
                                    </div>
                                    <div>
                                      <StatusBadge status={order.status} />
                                    </div>
                                    <div>
                                      {order.payment_status && (
                                        <PaymentStatusBadge status={order.payment_status} />
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {order.shipping_method ? capitalizeFirst(order.shipping_method) : '-'}
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-semibold">{capitalizeFirst(order.material)}</span>
                                      <span className="text-muted-foreground ml-1">({capitalizeFirst(order.color)})</span>
                                    </div>
                                    <div className="font-bold gradient-text">{formatPrice(order.price)}</div>
                                    <div className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            {t('orders.orderActions.viewDetails')}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            {t('orders.orderActions.editOrder')}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            navigator.clipboard.writeText(order.id);
                                            toast.success(t('orders.toasts.orderIdCopied'));
                                          }}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            {t('orders.orderActions.copyOrderId')}
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          {(order.payment_status === 'pending' || order.payment_status === 'on_hold') && (
                                            <DropdownMenuItem onClick={() => navigate(`/checkout?orderId=${order.id}`)}>
                                              <CreditCard className="w-4 h-4 mr-2" />
                                              Complete Payment
                                            </DropdownMenuItem>
                                          )}
                                          {order.payment_status === 'paid' && (
                                            <DropdownMenuItem onClick={() => navigate(`/refund?orderId=${order.id}`)}>
                                              <RefreshCw className="w-4 h-4 mr-2" />
                                              Request Refund
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className={canDeleteOrder(order.status) ? "" : "text-muted-foreground cursor-not-allowed"}
                                            disabled={!canDeleteOrder(order.status)}
                                            onClick={() => canDeleteOrder(order.status) && handleArchiveOrder(order.id)}
                                          >
                                            <Archive className="w-4 h-4 mr-2" />
                                            {t('orders.orderActions.moveToArchive')}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className={canDeleteOrder(order.status) ? "text-destructive focus:text-destructive" : "text-muted-foreground cursor-not-allowed"}
                                            disabled={!canDeleteOrder(order.status)}
                                            onClick={() => canDeleteOrder(order.status) && handleSoftDeleteOrder(order.id)}
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {t('orders.orderActions.deleteOrder')}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                  {/* Mobile card */}
                                  <div
                                    className={`md:hidden p-3 rounded-xl border animate-scale-in cursor-pointer ${
                                      order.has_unread_messages
                                        ? 'bg-orange-50 border-orange-400'
                                        : 'border-transparent hover:border-primary/20'
                                    }`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {order.has_unread_messages && <MessageCircle className="w-3 h-3 text-orange-500 animate-pulse flex-shrink-0" />}
                                        <span className="font-bold text-primary text-sm truncate">{order.file_name}</span>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}><Eye className="w-4 h-4 mr-2" />{t('orders.orderActions.viewDetails')}</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}><Pencil className="w-4 h-4 mr-2" />{t('orders.orderActions.editOrder')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <StatusBadge status={order.status} />
                                      {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-sm">
                                      <span><span className="font-semibold">{capitalizeFirst(order.material)}</span> <span className="text-muted-foreground">({capitalizeFirst(order.color)})</span></span>
                                      <span className="font-bold gradient-text">{formatPrice(order.price)}</span>
                                    </div>
                                  </div>
                                  </div>
                                ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ===== DESIGN ASSISTANCE SECTION ===== */}
                        {filteredDesignOrders.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-purple-500/20">
                              <Palette className="w-5 h-5 text-purple-500" />
                              <h3 className="text-lg font-bold text-foreground">Design Assistance ({filteredDesignOrders.length})</h3>
                            </div>

                            <div className="space-y-2">
                              <div>
                              {/* Desktop header */}
                              <div className="hidden md:grid grid-cols-6 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                                <div>Project Name</div>
                                <div>Design Status</div>
                                <div>{t('orders.table.payment')}</div>
                                <div>{t('orders.table.date')}</div>
                                <div>{t('orders.table.price')}</div>
                                <div className="text-right">{t('orders.table.actions')}</div>
                              </div>

                              {filteredDesignOrders.map((order, index) => (
                                <div key={order.id}>
                                {/* Desktop row */}
                                <div
                                  className={`hidden md:grid grid-cols-6 gap-4 items-center py-4 px-4 rounded-xl hover:bg-purple-500/5 transition-all hover-lift border animate-scale-in cursor-pointer ${
                                    order.has_unread_messages
                                      ? 'bg-orange-50 border-orange-400'
                                      : 'border-transparent hover:border-purple-500/20'
                                  }`}
                                  style={{ animationDelay: `${index * 0.05}s` }}
                                  onClick={() => {
                                    setPreviewOrder(order);
                                    setShowPreview(true);
                                  }}
                                >
                                  <div className={`font-bold text-purple-500 truncate flex items-center gap-2 ${order.has_unread_messages ? 'font-extrabold' : ''}`} title={order.project_name || order.file_name}>
                                    {order.has_unread_messages && (
                                      <MessageCircle className="w-4 h-4 text-orange-500 animate-pulse flex-shrink-0" />
                                    )}
                                    {order.project_name || order.file_name}
                                  </div>
                                  <div>
                                    {order.design_status ? (
                                      <Badge className={`text-xs ${
                                        order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                        order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                        order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                        order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                        'bg-yellow-500/20 text-yellow-600'
                                      }`}>
                                        {capitalizeFirst(order.design_status.replace('_', ' '))}
                                      </Badge>
                                    ) : (
                                      <StatusBadge status={order.status} />
                                    )}
                                  </div>
                                  <div>
                                    {order.payment_status && (
                                      <PaymentStatusBadge status={order.payment_status} />
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                  <div className="font-bold gradient-text">{formatPrice(order.price)}</div>
                                  <div className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hover-lift shadow-sm hover:shadow-md hover:border-purple-500/50"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => navigate('/design-assistance')}>
                                          <Palette className="w-4 h-4 mr-2" />
                                          View in Design Assistance
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          navigator.clipboard.writeText(order.id);
                                          toast.success(t('orders.toasts.orderIdCopied'));
                                        }}>
                                          <Copy className="w-4 h-4 mr-2" />
                                          {t('orders.orderActions.copyOrderId')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {(order.payment_status === 'pending' || order.payment_status === 'on_hold') && order.price > 0 && (
                                          <DropdownMenuItem onClick={() => navigate(`/checkout?orderId=${order.id}`)}>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Complete Payment
                                          </DropdownMenuItem>
                                        )}
                                        {order.payment_status === 'paid' && (
                                          <DropdownMenuItem onClick={() => navigate(`/refund?orderId=${order.id}`)}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Request Refund
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className={canDeleteOrder(order.status) ? "" : "text-muted-foreground cursor-not-allowed"}
                                          disabled={!canDeleteOrder(order.status)}
                                          onClick={() => canDeleteOrder(order.status) && handleArchiveOrder(order.id)}
                                        >
                                          <Archive className="w-4 h-4 mr-2" />
                                          {t('orders.orderActions.moveToArchive')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className={canDeleteOrder(order.status) ? "text-destructive focus:text-destructive" : "text-muted-foreground cursor-not-allowed"}
                                          disabled={!canDeleteOrder(order.status)}
                                          onClick={() => canDeleteOrder(order.status) && handleSoftDeleteOrder(order.id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          {t('orders.orderActions.deleteOrder')}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                {/* Mobile card */}
                                <div
                                  className={`md:hidden p-3 rounded-xl border animate-scale-in cursor-pointer ${
                                    order.has_unread_messages
                                      ? 'bg-orange-50 border-orange-400'
                                      : 'border-transparent hover:border-purple-500/20'
                                  }`}
                                  style={{ animationDelay: `${index * 0.05}s` }}
                                  onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {order.has_unread_messages && <MessageCircle className="w-3 h-3 text-orange-500 animate-pulse flex-shrink-0" />}
                                      <span className="font-bold text-purple-500 text-sm truncate">{order.project_name || order.file_name}</span>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => navigate('/design-assistance')}><Palette className="w-4 h-4 mr-2" />View in Design Assistance</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {order.design_status ? (
                                      <Badge className={`text-xs ${
                                        order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                        order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                        order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                        order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                        'bg-yellow-500/20 text-yellow-600'
                                      }`}>{capitalizeFirst(order.design_status.replace('_', ' '))}</Badge>
                                    ) : (
                                      <StatusBadge status={order.status} />
                                    )}
                                    {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                  </div>
                                  <div className="flex items-center justify-between mt-2 text-sm">
                                    <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                                    <span className="font-bold gradient-text">{formatPrice(order.price)}</span>
                                  </div>
                                </div>
                                </div>
                              ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Archived Orders Tab */}
                  <TabsContent value="archived">
                    {filteredArchivedOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Archive className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        {hasActiveFilters ? (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.noMatchingArchived')}</p>
                            <p className="mt-2">{t('orders.empty.tryAdjustingFilters')}</p>
                            <Button onClick={clearFilters} variant="outline" className="mt-4">
                              {t('orders.filters.clearFilters')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.noArchivedOrders')}</p>
                            <p className="mt-2">{t('orders.empty.archivedWillAppear')}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Archived Print Jobs */}
                        {filteredArchivedPrintOrders.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-primary/10">
                              <Printer className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-bold text-foreground">Print Jobs ({filteredArchivedPrintOrders.length})</h3>
                            </div>
                            <div>
                            {/* Desktop header */}
                            <div className="hidden md:grid grid-cols-7 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                              <div>{t('orders.table.fileName')}</div>
                              <div>{t('orders.table.status')}</div>
                              <div>{t('orders.table.payment')}</div>
                              <div>{t('orders.table.date')}</div>
                              <div>{t('orders.table.material')}</div>
                              <div>{t('orders.table.price')}</div>
                              <div className="text-right">{t('orders.table.actions')}</div>
                            </div>
                            {filteredArchivedPrintOrders.map((order, index) => (
                              <div key={order.id}>
                              {/* Desktop row */}
                              <div
                                className="hidden md:grid grid-cols-7 gap-4 items-center py-4 px-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-muted animate-scale-in opacity-75 cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="font-medium text-muted-foreground truncate" title={order.file_name}>{order.file_name}</div>
                                <div><StatusBadge status={order.status} /></div>
                                <div>{order.payment_status && <PaymentStatusBadge status={order.payment_status} />}</div>
                                <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                <div className="text-sm">
                                  <span className="font-semibold">{capitalizeFirst(order.material)}</span>
                                  <span className="text-muted-foreground ml-1">({capitalizeFirst(order.color)})</span>
                                </div>
                                <div className="font-bold text-muted-foreground">{formatPrice(order.price)}</div>
                                <div className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}><Eye className="w-4 h-4 mr-2" />{t('orders.orderActions.viewDetails')}</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleSoftDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deleteOrder')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {/* Mobile card */}
                              <div
                                className="md:hidden p-3 rounded-xl border animate-scale-in opacity-75 cursor-pointer border-transparent hover:border-muted"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate flex-1 text-muted-foreground">{order.file_name}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}><Eye className="w-4 h-4 mr-2" />{t('orders.orderActions.viewDetails')}</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleSoftDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deleteOrder')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <StatusBadge status={order.status} />
                                  {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                  <span><span className="font-semibold">{capitalizeFirst(order.material)}</span> <span className="text-muted-foreground">({capitalizeFirst(order.color)})</span></span>
                                  <span className="font-bold text-muted-foreground">{formatPrice(order.price)}</span>
                                </div>
                              </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        )}

                        {/* Archived Design Orders */}
                        {filteredArchivedDesignOrders.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-purple-500/20">
                              <Palette className="w-5 h-5 text-purple-500" />
                              <h3 className="text-lg font-bold text-foreground">Design Assistance ({filteredArchivedDesignOrders.length})</h3>
                            </div>
                            <div>
                            {/* Desktop header */}
                            <div className="hidden md:grid grid-cols-6 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                              <div>Project Name</div>
                              <div>Design Status</div>
                              <div>{t('orders.table.payment')}</div>
                              <div>{t('orders.table.date')}</div>
                              <div>{t('orders.table.price')}</div>
                              <div className="text-right">{t('orders.table.actions')}</div>
                            </div>
                            {filteredArchivedDesignOrders.map((order, index) => (
                              <div key={order.id}>
                              {/* Desktop row */}
                              <div
                                className="hidden md:grid grid-cols-6 gap-4 items-center py-4 px-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-muted animate-scale-in opacity-75 cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="font-medium text-muted-foreground truncate" title={order.project_name || order.file_name}>{order.project_name || order.file_name}</div>
                                <div>
                                  {order.design_status ? (
                                    <Badge className={`text-xs ${
                                      order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                      order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                      order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                      order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                      'bg-yellow-500/20 text-yellow-600'
                                    }`}>{capitalizeFirst(order.design_status.replace('_', ' '))}</Badge>
                                  ) : (
                                    <StatusBadge status={order.status} />
                                  )}
                                </div>
                                <div>{order.payment_status && <PaymentStatusBadge status={order.payment_status} />}</div>
                                <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                <div className="font-bold text-muted-foreground">{formatPrice(order.price)}</div>
                                <div className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => navigate('/design-assistance')}><Palette className="w-4 h-4 mr-2" />View in Design Assistance</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleSoftDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deleteOrder')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {/* Mobile card */}
                              <div
                                className="md:hidden p-3 rounded-xl border animate-scale-in opacity-75 cursor-pointer border-transparent hover:border-muted"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate flex-1 text-muted-foreground">{order.project_name || order.file_name}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => navigate('/design-assistance')}><Palette className="w-4 h-4 mr-2" />View in Design Assistance</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleSoftDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deleteOrder')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {order.design_status ? (
                                    <Badge className={`text-xs ${
                                      order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                      order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                      order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                      order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                      'bg-yellow-500/20 text-yellow-600'
                                    }`}>{capitalizeFirst(order.design_status.replace('_', ' '))}</Badge>
                                  ) : (
                                    <StatusBadge status={order.status} />
                                  )}
                                  {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                  <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                                  <span className="font-bold text-muted-foreground">{formatPrice(order.price)}</span>
                                </div>
                              </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Deleted Orders Tab */}
                  <TabsContent value="deleted">
                    {filteredDeletedOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Trash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        {hasActiveFilters ? (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.noMatchingDeleted')}</p>
                            <p className="mt-2">{t('orders.empty.tryAdjustingFilters')}</p>
                            <Button onClick={clearFilters} variant="outline" className="mt-4">
                              {t('orders.filters.clearFilters')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-semibold">{t('orders.empty.trashEmpty')}</p>
                            <p className="mt-2">{t('orders.empty.deletedWillAppear')}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Deleted Print Jobs */}
                        {filteredDeletedPrintOrders.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-primary/10">
                              <Printer className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-bold text-foreground">Print Jobs ({filteredDeletedPrintOrders.length})</h3>
                            </div>
                            <div>
                            {/* Desktop header */}
                            <div className="hidden md:grid grid-cols-7 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                              <div>{t('orders.table.fileName')}</div>
                              <div>{t('orders.table.status')}</div>
                              <div>{t('orders.table.payment')}</div>
                              <div>{t('orders.table.date')}</div>
                              <div>{t('orders.table.material')}</div>
                              <div>{t('orders.table.price')}</div>
                              <div className="text-right">{t('orders.table.actions')}</div>
                            </div>
                            {filteredDeletedPrintOrders.map((order, index) => (
                              <div key={order.id}>
                              {/* Desktop row */}
                              <div
                                className="hidden md:grid grid-cols-7 gap-4 items-center py-4 px-4 rounded-xl hover:bg-destructive/5 transition-all border border-transparent hover:border-destructive/20 animate-scale-in opacity-50 cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="font-medium text-muted-foreground truncate line-through" title={order.file_name}>{order.file_name}</div>
                                <div><StatusBadge status={order.status} /></div>
                                <div>{order.payment_status && <PaymentStatusBadge status={order.payment_status} />}</div>
                                <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                <div className="text-sm">
                                  <span className="font-semibold">{capitalizeFirst(order.material)}</span>
                                  <span className="text-muted-foreground ml-1">({capitalizeFirst(order.color)})</span>
                                </div>
                                <div className="font-bold text-muted-foreground">{formatPrice(order.price)}</div>
                                <div className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handlePermanentDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deletePermanently')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {/* Mobile card */}
                              <div
                                className="md:hidden p-3 rounded-xl border animate-scale-in opacity-50 cursor-pointer border-transparent hover:border-destructive/20"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate flex-1 text-muted-foreground line-through">{order.file_name}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handlePermanentDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deletePermanently')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <StatusBadge status={order.status} />
                                  {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                  <span><span className="font-semibold">{capitalizeFirst(order.material)}</span> <span className="text-muted-foreground">({capitalizeFirst(order.color)})</span></span>
                                  <span className="font-bold text-muted-foreground">{formatPrice(order.price)}</span>
                                </div>
                              </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        )}

                        {/* Deleted Design Orders */}
                        {filteredDeletedDesignOrders.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-4 pb-2 border-b border-purple-500/20">
                              <Palette className="w-5 h-5 text-purple-500" />
                              <h3 className="text-lg font-bold text-foreground">Design Assistance ({filteredDeletedDesignOrders.length})</h3>
                            </div>
                            <div>
                            {/* Desktop header */}
                            <div className="hidden md:grid grid-cols-6 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                              <div>Project Name</div>
                              <div>Design Status</div>
                              <div>{t('orders.table.payment')}</div>
                              <div>{t('orders.table.date')}</div>
                              <div>{t('orders.table.price')}</div>
                              <div className="text-right">{t('orders.table.actions')}</div>
                            </div>
                            {filteredDeletedDesignOrders.map((order, index) => (
                              <div key={order.id}>
                              {/* Desktop row */}
                              <div
                                className="hidden md:grid grid-cols-6 gap-4 items-center py-4 px-4 rounded-xl hover:bg-destructive/5 transition-all border border-transparent hover:border-destructive/20 animate-scale-in opacity-50 cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="font-medium text-muted-foreground truncate line-through" title={order.project_name || order.file_name}>{order.project_name || order.file_name}</div>
                                <div>
                                  {order.design_status ? (
                                    <Badge className={`text-xs ${
                                      order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                      order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                      order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                      order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                      'bg-yellow-500/20 text-yellow-600'
                                    }`}>{capitalizeFirst(order.design_status.replace('_', ' '))}</Badge>
                                  ) : (
                                    <StatusBadge status={order.status} />
                                  )}
                                </div>
                                <div>{order.payment_status && <PaymentStatusBadge status={order.payment_status} />}</div>
                                <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                                <div className="font-bold text-muted-foreground">{formatPrice(order.price)}</div>
                                <div className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handlePermanentDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deletePermanently')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {/* Mobile card */}
                              <div
                                className="md:hidden p-3 rounded-xl border animate-scale-in opacity-50 cursor-pointer border-transparent hover:border-destructive/20"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => { setPreviewOrder(order); setShowPreview(true); }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm truncate flex-1 text-muted-foreground line-through">{order.project_name || order.file_name}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleRestoreOrder(order.id)}><ArchiveRestore className="w-4 h-4 mr-2" />{t('orders.orderActions.restoreOrder')}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handlePermanentDeleteOrder(order.id)}><Trash2 className="w-4 h-4 mr-2" />{t('orders.orderActions.deletePermanently')}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {order.design_status ? (
                                    <Badge className={`text-xs ${
                                      order.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                                      order.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                                      order.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                                      order.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                                      'bg-yellow-500/20 text-yellow-600'
                                    }`}>{capitalizeFirst(order.design_status.replace('_', ' '))}</Badge>
                                  ) : (
                                    <StatusBadge status={order.status} />
                                  )}
                                  {order.payment_status && <PaymentStatusBadge status={order.payment_status} />}
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                  <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                                  <span className="font-bold text-muted-foreground">{formatPrice(order.price)}</span>
                                </div>
                              </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rename Project Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('orders.dialogs.renameProject')}</DialogTitle>
              <DialogDescription>
                {t('orders.dialogs.enterNewName')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">{t('orders.dialogs.projectName')}</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('orders.dialogs.enterProjectName')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleRenameProject} disabled={!newProjectName.trim()}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Project Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('orders.dialogs.deleteProject')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('orders.dialogs.deleteProjectDescription').replace('{count}', String(selectedProject && groupedOrders.projects[selectedProject]?.length || 0)).replace('{name}', selectedProject || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('orders.dialogs.moveToTrash')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Preview Dialog — Print Jobs */}
        <Dialog open={showPreview && previewOrder?.order_type !== 'design'} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-2xl flex items-center gap-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                {previewOrder?.file_name}
              </DialogTitle>
              <DialogDescription>
                Order ID: {previewOrder?.id}
              </DialogDescription>
            </DialogHeader>

            {previewOrder && (
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Left Column - 3D Model Preview */}
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 h-[250px] sm:h-[400px] flex items-center justify-center">
                    {previewOrder.file_url ? (
                      <ModelViewerUrl
                        url={previewOrder.file_url}
                        fileName={previewOrder.file_name || 'model.stl'}
                        height="100%"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Package className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p>No 3D model preview available</p>
                      </div>
                    )}
                  </div>

                  {previewOrder.project_name && (
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold text-primary">{previewOrder.project_name}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Order Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <StatusBadge status={previewOrder.status} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      {previewOrder.payment_status && (
                        <PaymentStatusBadge status={previewOrder.payment_status} />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Material</p>
                    <p className="font-semibold">
                      {capitalizeFirst(previewOrder.material)} ({capitalizeFirst(previewOrder.color)})
                    </p>
                  </div>

                  {previewOrder.shipping_method && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        {capitalizeFirst(previewOrder.shipping_method)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(previewOrder.price)}</p>
                    {previewOrder.paid_amount && previewOrder.paid_amount > 0 && (
                      <p className="text-sm text-green-600">
                        Paid: {formatPrice(previewOrder.paid_amount)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(previewOrder.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  if (previewOrder) {
                    navigator.clipboard.writeText(previewOrder.id);
                    toast.success(t('orders.toasts.orderIdCopied'));
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  if (previewOrder) navigate(`/orders/${previewOrder.id}/edit`);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Order
              </Button>
              <Button
                onClick={() => {
                  setShowPreview(false);
                  if (previewOrder) navigate(`/orders/${previewOrder.id}`);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Preview Dialog — Design Requests */}
        <Dialog open={showPreview && previewOrder?.order_type === 'design'} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-2xl flex items-center gap-2">
                <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                {previewOrder?.project_name || previewOrder?.file_name}
              </DialogTitle>
              <DialogDescription>
                Design Request &middot; {previewOrder?.id}
              </DialogDescription>
            </DialogHeader>

            {previewOrder && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Design Status</p>
                    {previewOrder.design_status ? (
                      <Badge className={`text-xs mt-1 ${
                        previewOrder.design_status === 'completed' ? 'bg-green-500/20 text-green-600' :
                        previewOrder.design_status === 'in_progress' ? 'bg-blue-500/20 text-blue-600' :
                        previewOrder.design_status === 'in_review' ? 'bg-orange-500/20 text-orange-600' :
                        previewOrder.design_status === 'cancelled' ? 'bg-red-500/20 text-red-600' :
                        'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {capitalizeFirst(previewOrder.design_status.replace('_', ' '))}
                      </Badge>
                    ) : (
                      <StatusBadge status={previewOrder.status} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    {previewOrder.payment_status && (
                      <PaymentStatusBadge status={previewOrder.payment_status} />
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-purple-500">{formatPrice(previewOrder.price)}</p>
                  {previewOrder.paid_amount && previewOrder.paid_amount > 0 && (
                    <p className="text-sm text-green-600">
                      Paid: {formatPrice(previewOrder.paid_amount)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(previewOrder.created_at)}</p>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-center">
                  <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    View the conversation with our design team in Design Assistance
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  if (previewOrder) {
                    navigator.clipboard.writeText(previewOrder.id);
                    toast.success(t('orders.toasts.orderIdCopied'));
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy ID
              </Button>
              <Button
                onClick={() => {
                  setShowPreview(false);
                  navigate('/design-assistance');
                }}
              >
                <Palette className="w-4 h-4 mr-2" />
                Go to Design Assistance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Orders;
