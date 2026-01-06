import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Eye,
  Share2,
} from "lucide-react";

const AdminReports = () => {
  const [reports] = useState([
    {
      id: 1,
      name: "Monthly Business Report",
      type: "Business",
      generatedDate: "2026-01-06",
      period: "January 2026",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Printer Performance Analysis",
      type: "Operations",
      generatedDate: "2026-01-05",
      period: "December 2025",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Customer Satisfaction Report",
      type: "Customer",
      generatedDate: "2026-01-04",
      period: "December 2025",
      size: "1.2 MB",
    },
    {
      id: 4,
      name: "Material Usage Report",
      type: "Inventory",
      generatedDate: "2026-01-03",
      period: "December 2025",
      size: "980 KB",
    },
    {
      id: 5,
      name: "Financial Summary",
      type: "Finance",
      generatedDate: "2026-01-01",
      period: "December 2025",
      size: "1.5 MB",
    },
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Business': return 'bg-blue-500/20 text-blue-400';
      case 'Operations': return 'bg-green-500/20 text-green-400';
      case 'Customer': return 'bg-purple-500/20 text-purple-400';
      case 'Inventory': return 'bg-yellow-500/20 text-yellow-400';
      case 'Finance': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
              <p className="text-gray-400">Generate and manage business reports</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="border-gray-700 text-gray-300 h-auto py-4">
              <Calendar className="w-4 h-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Monthly</p>
                <p className="text-xs">Generate monthly report</p>
              </div>
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 h-auto py-4">
              <Filter className="w-4 h-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Custom</p>
                <p className="text-xs">Create custom report</p>
              </div>
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 h-auto py-4">
              <FileText className="w-4 h-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Financial</p>
                <p className="text-xs">Financial summary</p>
              </div>
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 h-auto py-4">
              <Share2 className="w-4 h-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Export</p>
                <p className="text-xs">Export all reports</p>
              </div>
            </Button>
          </div>

          {/* Reports List */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Generated Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800">
                {reports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{report.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                          <p className="text-sm text-gray-500">{report.period}</p>
                          <p className="text-sm text-gray-500">{report.size}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{new Date(report.generatedDate).toLocaleDateString()}</p>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Report Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Monthly Summary', description: 'Overview of business metrics' },
                { title: 'Financial Analysis', description: 'Revenue and expense breakdown' },
                { title: 'Printer Performance', description: 'Machine utilization and uptime' },
                { title: 'Customer Analytics', description: 'User activity and satisfaction' },
              ].map((template, idx) => (
                <Card key={idx} className="bg-gray-900 border-gray-800 cursor-pointer hover:border-blue-500 transition-colors">
                  <CardContent className="p-4">
                    <p className="font-medium text-white">{template.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                    <Button variant="outline" className="mt-3 border-gray-700 text-gray-300 w-full">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
