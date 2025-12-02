import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentStatusBadge, OrderStatus, PaymentStatus } from "@/components/StatusBadge";
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
import { Eye, Package, Loader2, MoreHorizontal, Pencil, Trash2, Download, Copy, FolderOpen, ChevronDown, ChevronRight, FileText, Plus, Files } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

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
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
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

  const fetchOrders = async (retry = true) => {
    try {
      setLoading(true);
      let token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      let response = await fetch(`${API_URL}/orders/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchOrders(false); // Retry with new token
        }
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Group orders by project
  const groupedOrders = useMemo(() => {
    const projects: Record<string, Order[]> = {};
    const standaloneOrders: Order[] = [];

    orders.forEach(order => {
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
  }, [orders]);

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
    if (statuses.some(s => s === 'pending')) return 'pending';
    if (statuses.some(s => s === 'refunded')) return 'refunded';
    return 'pending';
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
        toast.error('Project not found');
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
        toast.error('Failed to rename project. Please make sure you have the latest database schema.');
      } else if (failCount > 0) {
        toast.warning(`Partially renamed: ${successCount} succeeded, ${failCount} failed`);
      } else {
        toast.success(`Project renamed to "${newProjectName.trim()}"`);
      }
      
      setRenameDialogOpen(false);
      setSelectedProject(null);
      setNewProjectName('');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to rename project');
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    toast.error('Delete project functionality coming soon');
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleAddPartToProject = (projectName: string) => {
    navigate('/new-print', { state: { projectName, addToProject: true } });
  };

  const handleDuplicateProject = async (projectName: string) => {
    toast.info('Duplicate project functionality coming soon');
  };

  const handleDownloadAllFiles = async (projectName: string) => {
    const projectOrders = groupedOrders.projects[projectName];
    for (const order of projectOrders) {
      if (order.file_url) {
        window.open(order.file_url, '_blank');
      }
    }
    toast.success(`Downloading ${projectOrders.length} files...`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} PLN`;
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-2 gradient-text">My Orders</h1>
            <p className="text-muted-foreground text-lg">Track and manage your 3D printing orders</p>
          </div>

          <Card className="shadow-xl border-2 border-transparent hover:border-primary/10 transition-all animate-slide-up bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                All Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading orders...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p>{error}</p>
                  <Button onClick={fetchOrders} variant="outline" className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No orders yet</p>
                  <p className="mt-2">Start by creating your first 3D print order!</p>
                  <Button onClick={() => navigate('/new-print')} className="mt-4">
                    Create New Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Projects Section */}
                  {Object.keys(groupedOrders.projects).length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-muted-foreground px-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        PROJECTS ({Object.keys(groupedOrders.projects).length})
                      </div>
                      
                      {Object.entries(groupedOrders.projects).map(([projectName, projectOrders], index) => (
                        <Collapsible 
                          key={projectName} 
                          open={expandedProjects.has(projectName)}
                          onOpenChange={() => toggleProject(projectName)}
                        >
                          <div className="border-2 border-primary/20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50/50 to-primary/5">
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
                                Mixed
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
                                      setSelectedProject(projectName);
                                      setNewProjectName(projectName);
                                      setRenameDialogOpen(true);
                                    }}>
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Rename Project
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddPartToProject(projectName);
                                    }}>
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Part
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateProject(projectName);
                                    }}>
                                      <Files className="w-4 h-4 mr-2" />
                                      Duplicate Project
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadAllFiles(projectName);
                                    }}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download All Files
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
                                      Delete Project
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
                              <div className="border-t border-primary/10 bg-white/50">
                                <div className="grid grid-cols-7 gap-4 text-xs font-bold text-muted-foreground py-2 px-4 bg-muted/30">
                                  <div className="pl-14">File Name</div>
                                  <div>Status</div>
                                  <div>Payment</div>
                                  <div>Date</div>
                                  <div>Material</div>
                                  <div>Price</div>
                                  <div className="text-right">Actions</div>
                                </div>
                                {projectOrders.map((order) => (
                                  <div
                                    key={order.id}
                                    className="grid grid-cols-7 gap-4 items-center py-3 px-4 hover:bg-primary/5 transition-colors border-t border-primary/5"
                                  >
                                    <div className="flex items-center gap-3 pl-4">
                                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="font-medium text-sm truncate">{order.file_name}</span>
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
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit Order
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            navigator.clipboard.writeText(order.id);
                                            toast.success('Order ID copied to clipboard');
                                          }}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Order ID
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download File
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}

                  {/* Individual Orders Section */}
                  {groupedOrders.standaloneOrders.length > 0 && (
                    <div className="space-y-2">
                      {Object.keys(groupedOrders.projects).length > 0 && (
                        <div className="text-sm font-bold text-muted-foreground px-4 pt-4 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          INDIVIDUAL ORDERS ({groupedOrders.standaloneOrders.length})
                        </div>
                      )}
                      
                      <div className="grid grid-cols-7 gap-4 text-sm font-bold text-muted-foreground pb-2 px-4">
                        <div>File Name</div>
                        <div>Status</div>
                        <div>Payment</div>
                        <div>Date</div>
                        <div>Material</div>
                        <div>Price</div>
                        <div className="text-right">Actions</div>
                      </div>
                      
                      {groupedOrders.standaloneOrders.map((order, index) => (
                        <div
                          key={order.id}
                          className="grid grid-cols-7 gap-4 items-center py-4 px-4 rounded-xl hover:bg-primary/5 transition-all hover-lift border border-transparent hover:border-primary/20 animate-scale-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="font-bold text-primary truncate" title={order.file_name}>
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
                          <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
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
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Order
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  toast.success('Order ID copied to clipboard');
                                }}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Order ID
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download File
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => toast.error('Delete functionality coming soon')}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rename Project Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rename Project</DialogTitle>
              <DialogDescription>
                Enter a new name for your project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameProject} disabled={!newProjectName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Project Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all orders in the project "{selectedProject}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Orders;
