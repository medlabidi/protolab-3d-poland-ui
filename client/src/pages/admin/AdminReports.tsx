import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Eye,
  Share2,
  Plus,
  Search,
  Trash2,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const AdminReports = () => {
  const [reports, setReports] = useState([
    {
      id: 1,
      name: "Monthly Business Report",
      type: "Business",
      generatedDate: "2026-01-06",
      period: "January 2026",
      size: "2.4 MB",
      status: "completed",
    },
    {
      id: 2,
      name: "Printer Performance Analysis",
      type: "Printers",
      generatedDate: "2026-01-05",
      period: "December 2025",
      size: "1.8 MB",
      status: "completed",
    },
    {
      id: 3,
      name: "Material Inventory Report",
      type: "Materials",
      generatedDate: "2026-01-05",
      period: "December 2025",
      size: "1.3 MB",
      status: "completed",
    },
    {
      id: 4,
      name: "Maintenance Schedule Report",
      type: "Maintenance",
      generatedDate: "2026-01-04",
      period: "Q4 2025",
      size: "890 KB",
      status: "completed",
    },
    {
      id: 5,
      name: "Suppliers Performance Review",
      type: "Suppliers",
      generatedDate: "2026-01-04",
      period: "December 2025",
      size: "1.1 MB",
      status: "completed",
    },
    {
      id: 6,
      name: "Print Jobs Analysis",
      type: "Print Jobs",
      generatedDate: "2026-01-03",
      period: "December 2025",
      size: "2.2 MB",
      status: "processing",
    },
    {
      id: 7,
      name: "Design Assistance Requests",
      type: "Design Assistance",
      generatedDate: "2026-01-03",
      period: "December 2025",
      size: "950 KB",
      status: "completed",
    },
    {
      id: 8,
      name: "Customer Satisfaction Report",
      type: "Customer",
      generatedDate: "2026-01-02",
      period: "December 2025",
      size: "1.2 MB",
      status: "completed",
    },
    {
      id: 9,
      name: "Financial Summary",
      type: "Finance",
      generatedDate: "2026-01-01",
      period: "December 2025",
      size: "1.5 MB",
      status: "completed",
    },
    {
      id: 10,
      name: "Weekly Maintenance Check",
      type: "Maintenance",
      generatedDate: "2026-01-01",
      period: "Week 52 2025",
      size: "650 KB",
      status: "failed",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [deletingReport, setDeletingReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [newReport, setNewReport] = useState({
    name: "",
    type: "Business",
    period: "monthly",
    startDate: "",
    endDate: "",
    includeCharts: true,
    format: "pdf",
  });

  const [scheduledReports, setScheduledReports] = useState([
    {
      id: 1,
      name: "Weekly Sales Report",
      type: "Finance",
      frequency: "weekly",
      nextRun: "2026-01-17",
      enabled: true,
    },
    {
      id: 2,
      name: "Monthly Performance Summary",
      type: "Operations",
      frequency: "monthly",
      nextRun: "2026-02-01",
      enabled: true,
    },
  ]);

  // Filter reports based on type, status and search query
  const filteredReports = reports.filter((report) => {
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Business":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Printers":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Materials":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Maintenance":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Suppliers":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Print Jobs":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "Design Assistance":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "Customer":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "Finance":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Business":
        return <TrendingUp className="w-4 h-4" />;
      case "Printers":
        return <Package className="w-4 h-4" />;
      case "Materials":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "Maintenance":
        return <RefreshCw className="w-4 h-4" />;
      case "Suppliers":
        return <Share2 className="w-4 h-4" />;
      case "Print Jobs":
        return <FileText className="w-4 h-4" />;
      case "Design Assistance":
        return <Eye className="w-4 h-4" />;
      case "Customer":
        return <Users className="w-4 h-4" />;
      case "Finance":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleGenerateReport = async () => {
    if (!newReport.name) {
      toast.error("Please enter a report name");
      return;
    }

    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      const newReportData = {
        id: reports.length + 1,
        name: newReport.name,
        type: newReport.type,
        generatedDate: new Date().toISOString().split("T")[0],
        period: newReport.period,
        size: "1.2 MB",
        status: "completed",
      };

      setReports([newReportData, ...reports]);
      setShowGenerateDialog(false);
      setIsGenerating(false);
      setNewReport({
        name: "",
        type: "Business",
        period: "monthly",
        startDate: "",
        endDate: "",
        includeCharts: true,
        format: "pdf",
      });

      toast.success("Report generated successfully!");
    }, 2000);
  };

  const handleDownloadReport = (report: any) => {
    toast.success(`Downloading ${report.name}...`);
    // Implement actual download logic here
  };

  const handlePreviewReport = (report: any) => {
    setSelectedReport(report);
    setShowPreviewDialog(true);
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;

    setLoading(true);
    // Simulate deletion
    setTimeout(() => {
      setReports(reports.filter((r) => r.id !== deletingReport.id));
      setShowDeleteDialog(false);
      setDeletingReport(null);
      setLoading(false);
      toast.success("Report deleted successfully!");
    }, 1000);
  };

  const handleExportAll = () => {
    toast.success("Exporting all reports...");
    // Implement bulk export logic here
  };

  const handleRefresh = () => {
    setLoading(true);
    toast.info("Refreshing reports...");
    setTimeout(() => {
      setLoading(false);
      toast.success("Reports refreshed!");
    }, 1000);
  };

  const reportTypeStats = {
    all: reports.length,
    Business: reports.filter((r) => r.type === "Business").length,
    Printers: reports.filter((r) => r.type === "Printers").length,
    Materials: reports.filter((r) => r.type === "Materials").length,
    Maintenance: reports.filter((r) => r.type === "Maintenance").length,
    Suppliers: reports.filter((r) => r.type === "Suppliers").length,
    "Print Jobs": reports.filter((r) => r.type === "Print Jobs").length,
    "Design Assistance": reports.filter((r) => r.type === "Design Assistance").length,
    Customer: reports.filter((r) => r.type === "Customer").length,
    Finance: reports.filter((r) => r.type === "Finance").length,
  };

  const reportStatusStats = {
    all: reports.length,
    completed: reports.filter((r) => r.status === "completed").length,
    processing: reports.filter((r) => r.status === "processing").length,
    pending: reports.filter((r) => r.status === "pending").length,
    failed: reports.filter((r) => r.status === "failed").length,
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Reports & Analytics
              </h1>
              <p className="text-gray-400">
                Generate and manage business reports
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={() => setShowGenerateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Total Reports</p>
                    <p className="text-3xl font-bold text-white">
                      {reports.length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-300 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900 to-green-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm mb-1">This Month</p>
                    <p className="text-3xl font-bold text-white">
                      {
                        reports.filter((r) =>
                          r.generatedDate.startsWith("2026-01")
                        ).length
                      }
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-300 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm mb-1">Scheduled</p>
                    <p className="text-3xl font-bold text-white">
                      {scheduledReports.filter((r) => r.enabled).length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-300 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-900 to-pink-800 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-200 text-sm mb-1">Total Size</p>
                    <p className="text-3xl font-bold text-white">8.8 MB</p>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-pink-300 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Printers", period: "weekly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-green-500"
            >
              <div className="flex items-start gap-3 w-full">
                <Package className="w-5 h-5 mt-0.5 text-green-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Printers</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Performance & status
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Materials", period: "monthly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-yellow-500"
            >
              <div className="flex items-start gap-3 w-full">
                <FileSpreadsheet className="w-5 h-5 mt-0.5 text-yellow-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Materials</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Inventory & usage
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Maintenance", period: "weekly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-orange-500"
            >
              <div className="flex items-start gap-3 w-full">
                <RefreshCw className="w-5 h-5 mt-0.5 text-orange-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Maintenance</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Schedule & costs
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Suppliers", period: "monthly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-purple-500"
            >
              <div className="flex items-start gap-3 w-full">
                <Share2 className="w-5 h-5 mt-0.5 text-purple-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Suppliers</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Performance review
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Print Jobs", period: "weekly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-cyan-500"
            >
              <div className="flex items-start gap-3 w-full">
                <FileText className="w-5 h-5 mt-0.5 text-cyan-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Print Jobs</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Jobs analysis
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Design Assistance", period: "monthly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-pink-500"
            >
              <div className="flex items-start gap-3 w-full">
                <Eye className="w-5 h-5 mt-0.5 text-pink-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Design Assist</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Requests & time
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Finance", period: "monthly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-rose-500"
            >
              <div className="flex items-start gap-3 w-full">
                <DollarSign className="w-5 h-5 mt-0.5 text-rose-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Finance</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Revenue & costs
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setNewReport({ ...newReport, type: "Business", period: "monthly" });
                setShowGenerateDialog(true);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-blue-500"
            >
              <div className="flex items-start gap-3 w-full">
                <Calendar className="w-5 h-5 mt-0.5 text-blue-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Business</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Overall summary
                  </p>
                </div>
              </div>
            </Button>

            <Button
              onClick={handleExportAll}
              variant="outline"
              className="border-gray-700 text-gray-300 h-auto py-4 hover:bg-gray-800 hover:border-indigo-500"
            >
              <div className="flex items-start gap-3 w-full">
                <Download className="w-5 h-5 mt-0.5 text-indigo-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-white">Export All</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Download all
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Filters and Search */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[220px] bg-gray-800 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Types ({reportTypeStats.all})
                    </SelectItem>
                    <SelectItem value="Business">
                      Business ({reportTypeStats.Business})
                    </SelectItem>
                    <SelectItem value="Printers">
                      Printers ({reportTypeStats.Printers})
                    </SelectItem>
                    <SelectItem value="Materials">
                      Materials ({reportTypeStats.Materials})
                    </SelectItem>
                    <SelectItem value="Maintenance">
                      Maintenance ({reportTypeStats.Maintenance})
                    </SelectItem>
                    <SelectItem value="Suppliers">
                      Suppliers ({reportTypeStats.Suppliers})
                    </SelectItem>
                    <SelectItem value="Print Jobs">
                      Print Jobs ({reportTypeStats["Print Jobs"]})
                    </SelectItem>
                    <SelectItem value="Design Assistance">
                      Design Assistance ({reportTypeStats["Design Assistance"]})
                    </SelectItem>
                    <SelectItem value="Customer">
                      Customer ({reportTypeStats.Customer})
                    </SelectItem>
                    <SelectItem value="Finance">
                      Finance ({reportTypeStats.Finance})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Status ({reportStatusStats.all})
                    </SelectItem>
                    <SelectItem value="completed">
                      Completed ({reportStatusStats.completed})
                    </SelectItem>
                    <SelectItem value="processing">
                      Processing ({reportStatusStats.processing})
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending ({reportStatusStats.pending})
                    </SelectItem>
                    <SelectItem value="failed">
                      Failed ({reportStatusStats.failed})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Generated Reports</CardTitle>
                <span className="text-sm text-gray-400">
                  {filteredReports.length} report{filteredReports.length !== 1 && "s"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No reports found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || filterType !== "all"
                      ? "Try adjusting your filters"
                      : "Generate your first report to get started"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gray-800 rounded-lg">
                          {getTypeIcon(report.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">
                            {report.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                                report.type
                              )}`}
                            >
                              {report.type}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                report.status
                              )}`}
                            >
                              {report.status === "completed" && "Completed"}
                              {report.status === "processing" && "Processing"}
                              {report.status === "pending" && "Pending"}
                              {report.status === "failed" && "Failed"}
                            </span>
                            <p className="text-sm text-gray-500">
                              {report.period}
                            </p>
                            <p className="text-sm text-gray-500">{report.size}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500 mr-2">
                          {new Date(report.generatedDate).toLocaleDateString()}
                        </p>
                        <Button
                          onClick={() => handlePreviewReport(report)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDownloadReport(report)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setDeletingReport(report);
                            setShowDeleteDialog(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Reports */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Scheduled Reports
                </CardTitle>
                <Button
                  onClick={() => setShowScheduleDialog(true)}
                  size="sm"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800">
                {scheduledReports.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {schedule.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                              schedule.type
                            )}`}
                          >
                            {schedule.type}
                          </span>
                          <p className="text-sm text-gray-500 capitalize">
                            {schedule.frequency}
                          </p>
                          <p className="text-sm text-gray-500">
                            Next: {new Date(schedule.nextRun).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.enabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {schedule.enabled ? "Active" : "Paused"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">
              Report Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Printers Performance",
                  description: "Machine utilization and uptime",
                  icon: <Package className="w-5 h-5" />,
                  type: "Printers",
                  color: "green",
                },
                {
                  title: "Materials Inventory",
                  description: "Stock levels and usage patterns",
                  icon: <FileSpreadsheet className="w-5 h-5" />,
                  type: "Materials",
                  color: "yellow",
                },
                {
                  title: "Maintenance Schedule",
                  description: "Upcoming and completed maintenance",
                  icon: <RefreshCw className="w-5 h-5" />,
                  type: "Maintenance",
                  color: "orange",
                },
                {
                  title: "Suppliers Review",
                  description: "Supplier performance and ratings",
                  icon: <Share2 className="w-5 h-5" />,
                  type: "Suppliers",
                  color: "purple",
                },
                {
                  title: "Print Jobs Analysis",
                  description: "Job completion rates and times",
                  icon: <FileText className="w-5 h-5" />,
                  type: "Print Jobs",
                  color: "cyan",
                },
                {
                  title: "Design Requests",
                  description: "Design assistance requests tracking",
                  icon: <Eye className="w-5 h-5" />,
                  type: "Design Assistance",
                  color: "pink",
                },
                {
                  title: "Financial Analysis",
                  description: "Revenue and expense breakdown",
                  icon: <DollarSign className="w-5 h-5" />,
                  type: "Finance",
                  color: "rose",
                },
                {
                  title: "Business Summary",
                  description: "Overview of business metrics",
                  icon: <TrendingUp className="w-5 h-5" />,
                  type: "Business",
                  color: "blue",
                },
              ].map((template, idx) => (
                <Card
                  key={idx}
                  className="bg-gray-900 border-gray-800 cursor-pointer hover:border-blue-500 transition-colors group"
                >
                  <CardContent className="p-4">
                    <div
                      className={`p-3 bg-${template.color}-500/20 rounded-lg w-fit mb-3 group-hover:bg-${template.color}-500/30 transition-colors`}
                    >
                      {template.icon}
                    </div>
                    <p className="font-medium text-white">{template.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {template.description}
                    </p>
                    <Button
                      onClick={() => {
                        setNewReport({ ...newReport, name: template.title, type: template.type });
                        setShowGenerateDialog(true);
                      }}
                      variant="outline"
                      className="mt-3 border-gray-700 text-gray-300 w-full hover:bg-gray-800 hover:border-blue-500"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure and generate a custom report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="report-name" className="text-gray-300">
                Report Name *
              </Label>
              <Input
                id="report-name"
                value={newReport.name}
                onChange={(e) =>
                  setNewReport({ ...newReport, name: e.target.value })
                }
                placeholder="e.g., Q1 Financial Summary"
                className="mt-2 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="report-type" className="text-gray-300">
                Report Type *
              </Label>
              <Select
                value={newReport.type}
                onValueChange={(value) =>
                  setNewReport({ ...newReport, type: value })
                }
              >
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Printers">Printers</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Suppliers">Suppliers</SelectItem>
                  <SelectItem value="Print Jobs">Print Jobs</SelectItem>
                  <SelectItem value="Design Assistance">Design Assistance</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report-period" className="text-gray-300">
                Period *
              </Label>
              <Select
                value={newReport.period}
                onValueChange={(value) =>
                  setNewReport({ ...newReport, period: value })
                }
              >
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newReport.period === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-gray-300">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newReport.startDate}
                    onChange={(e) =>
                      setNewReport({ ...newReport, startDate: e.target.value })
                    }
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-gray-300">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newReport.endDate}
                    onChange={(e) =>
                      setNewReport({ ...newReport, endDate: e.target.value })
                    }
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="report-format" className="text-gray-300">
                Export Format
              </Label>
              <Select
                value={newReport.format}
                onValueChange={(value) =>
                  setNewReport({ ...newReport, format: value })
                }
              >
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include-charts"
                checked={newReport.includeCharts}
                onChange={(e) =>
                  setNewReport({
                    ...newReport,
                    includeCharts: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-700 bg-gray-800"
              />
              <Label htmlFor="include-charts" className="text-gray-300">
                Include charts and visualizations
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowGenerateDialog(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Report Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Report preview - {selectedReport?.period}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
              {/* Report Header */}
              <div className="border-b border-gray-700 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedReport?.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Period: {selectedReport?.period}</span>
                  <span>•</span>
                  <span>Generated: {selectedReport?.generatedDate && new Date(selectedReport.generatedDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedReport?.status || "")}`}>
                    {selectedReport?.status}
                  </span>
                </div>
              </div>

              {/* Report Content Based on Type */}
              {selectedReport?.type === "Printers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Printers</p>
                      <p className="text-2xl font-bold text-white mt-1">12</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">10</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Avg Uptime</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">94.2%</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Top Performers</h3>
                    <div className="space-y-2">
                      {["Prusa i3 MK3S+", "Creality Ender 3 Pro", "Anycubic i3 Mega"].map((printer, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{printer}</span>
                          <span className="text-green-400 font-medium">{98 - i * 2}% uptime</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Materials" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Materials</p>
                      <p className="text-2xl font-bold text-white mt-1">24</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Low Stock</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">5</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Value</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">€8,542</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Most Used Materials</h3>
                    <div className="space-y-2">
                      {[
                        { name: "PLA White", used: "12.5 kg", stock: "35 kg" },
                        { name: "PETG Black", used: "8.2 kg", stock: "28 kg" },
                        { name: "ABS Red", used: "6.8 kg", stock: "15 kg" },
                      ].map((mat, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{mat.name}</span>
                          <span className="text-blue-400 text-sm">Used: {mat.used} | Stock: {mat.stock}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Maintenance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Completed</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">18</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Upcoming</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">6</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Cost</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">€1,240</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Recent Maintenance</h3>
                    <div className="space-y-2">
                      {[
                        { printer: "Prusa i3 MK3S+", date: "Jan 8", type: "Routine" },
                        { printer: "Ender 3 Pro", date: "Jan 6", type: "Repair" },
                        { printer: "Anycubic i3", date: "Jan 4", type: "Calibration" },
                      ].map((maint, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <div>
                            <span className="text-gray-300">{maint.printer}</span>
                            <span className="text-gray-500 text-sm ml-2">• {maint.type}</span>
                          </div>
                          <span className="text-gray-400 text-sm">{maint.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Suppliers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Active Suppliers</p>
                      <p className="text-2xl font-bold text-white mt-1">8</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Avg Rating</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">4.6★</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">142</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Top Suppliers</h3>
                    <div className="space-y-2">
                      {[
                        { name: "3D FilaTech", rating: 4.8, orders: 45 },
                        { name: "Prusa Research", rating: 4.9, orders: 38 },
                        { name: "Ultimaker", rating: 4.5, orders: 32 },
                      ].map((sup, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{sup.name}</span>
                          <div className="flex gap-3">
                            <span className="text-yellow-400">{sup.rating}★</span>
                            <span className="text-gray-400">{sup.orders} orders</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Print Jobs" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Jobs</p>
                      <p className="text-2xl font-bold text-white mt-1">156</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Completed</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">142</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">91%</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Job Statistics</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Avg Print Time", value: "4.2 hours" },
                        { label: "Avg Material Used", value: "125g" },
                        { label: "Failed Jobs", value: "14 (9%)" },
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-400">{stat.label}</span>
                          <span className="text-white font-medium">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Design Assistance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Requests</p>
                      <p className="text-2xl font-bold text-white mt-1">48</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Completed</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">42</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Avg Time</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">2.5 days</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Request Types</h3>
                    <div className="space-y-2">
                      {[
                        { type: "3D Model Creation", count: 18 },
                        { type: "Model Optimization", count: 15 },
                        { type: "Design Consultation", count: 15 },
                      ].map((req, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{req.type}</span>
                          <span className="text-blue-400 font-medium">{req.count} requests</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Finance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">€24,580</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-400 mt-1">€8,240</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Net Profit</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">€16,340</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Revenue Breakdown</h3>
                    <div className="space-y-2">
                      {[
                        { category: "3D Printing Services", amount: "€18,420" },
                        { category: "Design Assistance", amount: "€4,680" },
                        { category: "Material Sales", amount: "€1,480" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{item.category}</span>
                          <span className="text-green-400 font-medium">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Business" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-white mt-1">156</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Revenue</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">€24,580</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">New Customers</p>
                      <p className="text-2xl font-bold text-blue-400 mt-1">28</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Key Metrics</h3>
                    <div className="space-y-2">
                      {[
                        { metric: "Customer Satisfaction", value: "4.7/5.0" },
                        { metric: "Order Completion Rate", value: "94%" },
                        { metric: "Avg Response Time", value: "2.4 hours" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{item.metric}</span>
                          <span className="text-blue-400 font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport?.type === "Customer" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Customers</p>
                      <p className="text-2xl font-bold text-white mt-1">284</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-green-400 mt-1">156</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Satisfaction</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">4.7★</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Customer Insights</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Repeat Customer Rate", value: "68%" },
                        { label: "Avg Order Value", value: "€157" },
                        { label: "Churn Rate", value: "12%" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                          <span className="text-gray-300">{item.label}</span>
                          <span className="text-blue-400 font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Trends - Dynamic Content */}
              <div className="mt-6 bg-gray-900 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Performance Trends & Evolution
                </h3>
                
                {selectedReport?.type === "Printers" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Uptime Evolution</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +3.2% <span className="text-xs">vs last month</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Print Quality</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +1.8% <span className="text-xs">improvement</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Failure Rate</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -2.1% <span className="text-xs">reduction</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Materials" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Material Consumption</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        +15.4% <span className="text-xs">vs last period</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Cost per kg</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -8.3% <span className="text-xs">optimization</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Waste Reduction</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -12.7% <span className="text-xs">improvement</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Maintenance" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Maintenance Frequency</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        +5.2% <span className="text-xs">more proactive</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Cost per Maintenance</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -6.8% <span className="text-xs">reduction</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Downtime</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -18.5% <span className="text-xs">improved</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Suppliers" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Avg Delivery Time</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -2.3 days <span className="text-xs">faster</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Quality Rating</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +0.4★ <span className="text-xs">improvement</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Order Fulfillment</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +4.2% <span className="text-xs">better</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Print Jobs" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Job Completion Rate</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +7.2% <span className="text-xs">vs last month</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Avg Print Time</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -15 min <span className="text-xs">optimization</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Failed Jobs</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -3.8% <span className="text-xs">reduction</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Design Assistance" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Request Volume</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        +22.4% <span className="text-xs">growth</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Response Time</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -8 hours <span className="text-xs">faster</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Customer Satisfaction</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +0.6★ <span className="text-xs">improvement</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Finance" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Revenue Growth</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +18.3% <span className="text-xs">vs last period</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Profit Margin</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +5.2% <span className="text-xs">improvement</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Cost Optimization</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -12.4% <span className="text-xs">reduction</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Business" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Overall Growth</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +24.8% <span className="text-xs">year over year</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Customer Acquisition</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        +32 <span className="text-xs">new customers</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Market Share</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +2.1% <span className="text-xs">expansion</span>
                      </span>
                    </div>
                  </div>
                )}

                {selectedReport?.type === "Customer" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Customer Retention</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +8.4% <span className="text-xs">improvement</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Satisfaction Score</span>
                      <span className="text-green-400 flex items-center gap-1">
                        +0.3★ <span className="text-xs">increase</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="text-gray-300">Churn Rate</span>
                      <span className="text-green-400 flex items-center gap-1">
                        -4.2% <span className="text-xs">reduction</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Type</p>
                <p className="text-white font-medium mt-1">
                  {selectedReport?.type}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Generated</p>
                <p className="text-white font-medium mt-1">
                  {selectedReport?.generatedDate &&
                    new Date(selectedReport.generatedDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Size</p>
                <p className="text-white font-medium mt-1">
                  {selectedReport?.size}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="text-white font-medium mt-1">
                  {selectedReport?.status}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowPreviewDialog(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
            <Button
              onClick={() => handleDownloadReport(selectedReport)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this report? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="font-medium text-white">{deletingReport?.name}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <span>{deletingReport?.type}</span>
              <span>•</span>
              <span>{deletingReport?.size}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingReport(null);
              }}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteReport}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Schedule Automatic Report</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up automatic report generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Report Name</Label>
              <Input
                placeholder="e.g., Weekly Sales Report"
                className="mt-2 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Frequency</Label>
              <Select defaultValue="weekly">
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Report Type</Label>
              <Select defaultValue="Business">
                <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowScheduleDialog(false)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Scheduled report created!");
                setShowScheduleDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
