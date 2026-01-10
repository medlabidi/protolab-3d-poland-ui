import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, OrderStatus } from "@/components/StatusBadge";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Package, DollarSign, Clock, Eye, Loader2, MoreHorizontal, Pencil, Trash2, Download, Copy, FolderOpen, ChevronDown, ChevronRight, FileText, Plus, Files, Wallet, Boxes, Palette } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/config/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [designJobs, setDesignJobs] = useState<any[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedPrints: 0,
    totalSpent: `0 ${t('common.pln')}`,
    printJobsCount: 0,
    designJobsCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchCreditBalance();
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
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    return null;
  };

  const fetchDashboardData = async (retry = true) => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch user orders
      let response = await fetch(`${API_URL}/orders/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchDashboardData(false);
        }
        return;
      }

      if (!response.ok) {
        console.error('❌ Failed to fetch orders:', response.status, response.statusText);
        toast.error(`Failed to load orders: ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('📦 Raw API Response:', data);
      
      const userOrders = data.orders || [];
      console.log('📊 User Orders Count:', userOrders.length);
      
      setAllOrders(userOrders); // Store all orders for operations
      setOrders(userOrders.slice(0, 5)); // Display only recent 5 orders

      // Séparer les orders par type (compatible avec le dashboard admin)
      const printOrders = userOrders.filter((o: any) => {
        if (o.order_type) {
          return o.order_type === 'print';
        }
        // Fallback: les orders sans order_type sont considérés comme print jobs
        const fileName = (o.file_name || '').toLowerCase();
        return !fileName.includes('design') && !fileName.includes('assistance');
      });
      
      const designOrders = userOrders.filter((o: any) => {
        if (o.order_type) {
          return o.order_type === 'design';
        }
        // Fallback: détecter par file_name
        const fileName = (o.file_name || '').toLowerCase();
        return fileName.includes('design') || fileName.includes('assistance');
      });

      setPrintJobs(printOrders.slice(0, 5));
      setDesignJobs(designOrders.slice(0, 5));

      // Calculate stats from real data
      const active = userOrders.filter((o: any) => 
        ['submitted', 'in_queue', 'printing', 'on_hold'].includes(o.status)
      ).length;
      
      const completed = userOrders.filter((o: any) => 
        o.status === 'finished' || o.status === 'delivered'
      ).length;
      
      // Calculate total spent, excluding cancelled/suspended orders
      // Use paid_amount if available, otherwise use price
      const total = userOrders
        .filter((o: any) => o.status !== 'suspended' && o.payment_status !== 'refunded')
        .reduce((sum: number, o: any) => {
          const amount = parseFloat(o.paid_amount) || parseFloat(o.price) || 0;
          return sum + amount;
        }, 0);

      setStats({
        activeOrders: active,
        completedPrints: completed,
        totalSpent: `${total.toFixed(2)} ${t('common.pln')}`,
        printJobsCount: printOrders.length,
        designJobsCount: designOrders.length,
      });

      console.log('📊 Dashboard Data:', {
        total: userOrders.length,
        printJobs: printOrders.length,
        designJobs: designOrders.length,
        active,
        completed
      });
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      toast.error('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditBalance = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  // Group orders by project (use allOrders for complete project data)
  const groupedOrders = useMemo(() => {
    const allProjects: Record<string, any[]> = {};
    const standaloneOrders: any[] = [];

    // Group ALL orders for project operations
    allOrders.forEach(order => {
      if (order.project_name) {
        if (!allProjects[order.project_name]) {
          allProjects[order.project_name] = [];
        }
        allProjects[order.project_name].push(order);
      }
    });

    // Only show recent standalone orders (from the limited set)
    orders.forEach(order => {
      if (!order.project_name) {
        standaloneOrders.push(order);
      }
    });

    // Sort projects by most recent order and limit to 5 for display
    const sortedProjectEntries = Object.entries(allProjects)
      .sort((a, b) => {
        const aDate = new Date(a[1][0]?.created_at || 0).getTime();
        const bDate = new Date(b[1][0]?.created_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
    
    const displayProjects: Record<string, any[]> = {};
    sortedProjectEntries.forEach(([name, orders]) => {
      displayProjects[name] = orders;
    });

    return { projects: displayProjects, allProjects, standaloneOrders };
  }, [orders, allOrders]);

  // Get project status based on its orders
  const getProjectStatus = (projectOrders: any[]): OrderStatus => {
    const statuses = projectOrders.map(o => o.status);
    if (statuses.every(s => s === 'delivered')) return 'delivered';
    if (statuses.every(s => s === 'finished' || s === 'delivered')) return 'finished';
    if (statuses.some(s => s === 'printing')) return 'printing';
    if (statuses.some(s => s === 'in_queue')) return 'in_queue';
    if (statuses.some(s => s === 'on_hold')) return 'on_hold';
    if (statuses.every(s => s === 'suspended')) return 'suspended';
    return 'submitted';
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
      // Use allProjects to get all orders in the project
      const projectOrders = groupedOrders.allProjects[selectedProject] || groupedOrders.projects[selectedProject];
      
      if (!projectOrders || projectOrders.length === 0) {
        toast.error(t('dashboard.toasts.projectNotFound'));
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
        toast.error(t('dashboard.toasts.renameFailed'));
      } else if (failCount > 0) {
        toast.warning(t('dashboard.toasts.renamePartial').replace('{{success}}', String(successCount)).replace('{{failed}}', String(failCount)));
      } else {
        toast.success(`${t('dashboard.toasts.renameSuccess')} "${newProjectName.trim()}"`);
      }
      
      setRenameDialogOpen(false);
      setSelectedProject(null);
      setNewProjectName('');
      fetchDashboardData();
    } catch (error) {
      console.error('Rename error:', error);
      toast.error(t('dashboard.toasts.renameFailed'));
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    toast.error(t('dashboard.toasts.deleteComingSoon'));
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleAddPartToProject = (projectName: string) => {
    navigate('/new-print', { state: { projectName, addToProject: true } });
  };

  const handleDuplicateProject = async (projectName: string) => {
    toast.info(t('dashboard.toasts.duplicateComingSoon'));
  };

  const handleDownloadAllFiles = async (projectName: string) => {
    const projectOrders = groupedOrders.allProjects[projectName] || groupedOrders.projects[projectName];
    if (!projectOrders) return;
    for (const order of projectOrders) {
      if (order.file_url) {
        window.open(order.file_url, '_blank');
      }
    }
    toast.success(t('dashboard.toasts.downloadingFiles').replace('{{count}}', String(projectOrders.length)));
  };

  const statsConfig = [
    {
      title: t('dashboard.activeOrders'),
      value: stats.activeOrders.toString(),
      icon: Clock,
      description: t('dashboard.inProgress'),
    },
    {
      title: t('dashboard.completedPrints'),
      value: stats.completedPrints.toString(),
      icon: Package,
      description: t('dashboard.successfullyDelivered'),
    },
    {
      title: t('dashboard.storeCredits'),
      value: `${creditBalance.toFixed(2)} ${t('common.pln')}`,
      icon: Wallet,
      description: t('dashboard.availableBalance'),
      isCredit: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header with Title and Notifications */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-slide-up">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">{t('dashboard.overview')}</h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">{t('dashboard.welcome')}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {statsConfig.map((stat, index) => (
              <Card 
                key={stat.title}
                className={`hover-lift border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-muted/50 shadow-lg animate-scale-in ${(stat as any).isCredit ? 'cursor-pointer' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={(stat as any).isCredit ? () => navigate('/credits') : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${(stat as any).isCredit ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${(stat as any).isCredit ? 'text-green-500' : 'text-primary'}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 ${(stat as any).isCredit ? 'text-green-600' : 'gradient-text'}`}>{stat.value}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {stat.description}
                    {(stat as any).isCredit && (
                      <span className="ml-2 text-primary hover:underline">{t('dashboard.projects.getMore')}</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Type Sections - Print Jobs & Design Assistance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Print Jobs Card */}
            <Card className="shadow-xl border-2 border-transparent hover:border-blue-500/20 transition-all bg-gradient-to-br from-card to-blue-500/5">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-blue-500" />
                    Print Jobs
                    <span className="text-sm font-normal text-muted-foreground">({stats.printJobsCount})</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/orders')}
                    className="hover:bg-blue-500/10 hover:border-blue-500"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {printJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Boxes className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No print jobs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {printJobs.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-500/5 transition-colors cursor-pointer border border-transparent hover:border-blue-500/20"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{order.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.material} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={order.status as OrderStatus} />
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Design Assistance Card */}
            <Card className="shadow-xl border-2 border-transparent hover:border-purple-500/20 transition-all bg-gradient-to-br from-card to-purple-500/5">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    Design Assistance
                    <span className="text-sm font-normal text-muted-foreground">({stats.designJobsCount})</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/services/design')}
                    className="hover:bg-purple-500/10 hover:border-purple-500"
                  >
                    New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {designJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No design requests yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/services/design')}
                      className="mt-2 text-xs"
                    >
                      Request Design Help
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {designJobs.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-500/5 transition-colors cursor-pointer border border-transparent hover:border-purple-500/20"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Palette className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{order.file_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {order.design_description ? order.design_description.substring(0, 40) + '...' : new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={order.status as OrderStatus} />
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders & Projects */}
          <Card className="shadow-xl border-2 border-transparent hover:border-primary/10 transition-all animate-slide-up bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="border-b p-4 md:p-6">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                {t('dashboard.recentOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6">
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">{t('dashboard.noOrders')}</p>
                    <p className="text-sm">{t('dashboard.noOrdersDescription')}</p>
                    <Button
                      onClick={() => navigate('/orders')}
                      className="mt-4"
                    >
                      {t('dashboard.projects.viewOrders')}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Projects */}
                    {Object.entries(groupedOrders.projects).map(([projectName, projectOrders], index) => (
                      <Collapsible 
                        key={projectName} 
                        open={expandedProjects.has(projectName)}
                        onOpenChange={() => toggleProject(projectName)}
                      >
                        <div className="border-2 border-primary/20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 mb-2">
                          <div className="flex items-center justify-between p-3 md:p-4 hover:bg-primary/5 transition-colors">
                              <CollapsibleTrigger className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <p className="font-bold text-primary text-sm md:text-base truncate">{projectName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {projectOrders.length} file{projectOrders.length > 1 ? 's' : ''} • 
                                      {new Date(projectOrders[0].created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                <StatusBadge status={getProjectStatus(projectOrders)} />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject(projectName);
                                      setNewProjectName(projectName);
                                      setRenameDialogOpen(true);
                                    }}>
                                      <Pencil className="w-4 h-4 mr-2" />
                                      {t('dashboard.projects.renameProject')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddPartToProject(projectName);
                                    }}>
                                      <Plus className="w-4 h-4 mr-2" />
                                      {t('dashboard.projects.addPart')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateProject(projectName);
                                    }}>
                                      <Files className="w-4 h-4 mr-2" />
                                      {t('dashboard.projects.duplicateProject')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadAllFiles(projectName);
                                    }}>
                                      <Download className="w-4 h-4 mr-2" />
                                      {t('dashboard.projects.downloadAllFiles')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProject(projectName);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      {t('dashboard.projects.deleteProject')}
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
                            <div className="border-t border-primary/10 p-2 space-y-1">
                              {projectOrders.map((order) => (
                                <div 
                                  key={order.id}
                                  className="flex items-center justify-between p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xs md:text-sm font-medium truncate">{order.file_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                    <StatusBadge status={order.status as OrderStatus} />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/orders/${order.id}`)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}

                    {/* Standalone Orders */}
                    {groupedOrders.standaloneOrders.length > 0 && (
                      <>
                        {Object.keys(groupedOrders.projects).length > 0 && (
                          <div className="text-xs font-semibold text-muted-foreground py-2 px-4">{t('dashboard.projects.individualOrders')}</div>
                        )}
                        {groupedOrders.standaloneOrders.map((order, index) => (
                          <div 
                            key={order.id} 
                            className="flex items-center justify-between py-3 md:py-4 px-3 md:px-4 rounded-lg hover:bg-primary/5 transition-all hover-lift border border-transparent hover:border-primary/20"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-primary truncate text-sm md:text-base">{order.file_name || 'Unnamed'}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {order.material || 'N/A'} • {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                              <StatusBadge status={order.status as OrderStatus} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover-lift shadow-sm hover:shadow-md hover:border-primary/50"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    {t('common.viewDetails')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    {t('common.editOrder')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(order.id);
                                    toast.success(t('dashboard.toasts.orderIdCopied'));
                                  }}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    {t('common.copyOrderId')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 mr-2" />
                                    {t('common.downloadFile')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => toast.error(t('dashboard.toasts.deleteOrderComingSoon'))}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t('common.deleteOrder')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rename Project Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('dashboard.projects.renameProject')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.projects.enterNewName')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">{t('dashboard.projects.projectName')}</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('dashboard.projects.enterProjectNamePlaceholder')}
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
              <AlertDialogTitle>{t('dashboard.projects.deleteConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.projects.deleteWarning').replace('"{selectedProject}"', `"${selectedProject}"`)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Dashboard;
