import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MaintenanceInsight {
  id: string;
  name: string;
  model: string;
  status: string;
  maintenanceCostMonthly: number;
  totalMaintenanceCost: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceIntervalDays: number;
  daysUntilMaintenance: number;
  totalMaintenanceCount: number;
  emergencyCount: number;
  avgMaintenanceCost: number;
}

const AdminMaintenanceInsights = () => {
  const [insights, setInsights] = useState<MaintenanceInsight[]>([
    {
      id: "1",
      name: "Prusa i3 MK3S+",
      model: "MK3S+",
      status: "operational",
      maintenanceCostMonthly: 75.00,
      totalMaintenanceCost: 850.00,
      lastMaintenanceDate: "2026-01-03",
      nextMaintenanceDate: "2026-03-03",
      maintenanceIntervalDays: 90,
      daysUntilMaintenance: 54,
      totalMaintenanceCount: 12,
      emergencyCount: 2,
      avgMaintenanceCost: 70.83,
    },
    {
      id: "2",
      name: "Creality Ender 3 Pro",
      model: "Ender 3 Pro",
      status: "operational",
      maintenanceCostMonthly: 50.00,
      totalMaintenanceCost: 1200.00,
      lastMaintenanceDate: "2025-12-28",
      nextMaintenanceDate: "2026-02-28",
      maintenanceIntervalDays: 90,
      daysUntilMaintenance: 51,
      totalMaintenanceCount: 18,
      emergencyCount: 4,
      avgMaintenanceCost: 66.67,
    },
    {
      id: "3",
      name: "Anycubic i3 Mega",
      model: "i3 Mega",
      status: "offline",
      maintenanceCostMonthly: 45.00,
      totalMaintenanceCost: 540.00,
      lastMaintenanceDate: "2025-12-15",
      nextMaintenanceDate: "2026-01-15",
      maintenanceIntervalDays: 90,
      daysUntilMaintenance: -7, // Overdue
      totalMaintenanceCount: 8,
      emergencyCount: 1,
      avgMaintenanceCost: 67.50,
    },
    {
      id: "4",
      name: "Artillery Sidewinder X1",
      model: "Sidewinder X1",
      status: "maintenance",
      maintenanceCostMonthly: 60.00,
      totalMaintenanceCost: 720.00,
      lastMaintenanceDate: "2026-01-06",
      nextMaintenanceDate: "2026-04-06",
      maintenanceIntervalDays: 90,
      daysUntilMaintenance: 88,
      totalMaintenanceCount: 10,
      emergencyCount: 3,
      avgMaintenanceCost: 72.00,
    },
  ]);

  // Calculs des totaux
  const totalMonthlyMaintenance = insights.reduce((sum, i) => sum + i.maintenanceCostMonthly, 0);
  const totalAnnualMaintenance = totalMonthlyMaintenance * 12;
  const totalCumulativeCost = insights.reduce((sum, i) => sum + i.totalMaintenanceCost, 0);
  const averageMonthlyCost = totalMonthlyMaintenance / insights.length;
  const overdueCount = insights.filter(i => i.daysUntilMaintenance < 0).length;
  const upcomingCount = insights.filter(i => i.daysUntilMaintenance >= 0 && i.daysUntilMaintenance <= 14).length;

  const getMaintenanceStatus = (days: number) => {
    if (days < 0) return { label: "En retard", color: "bg-red-500/20 text-red-400", icon: AlertTriangle };
    if (days <= 14) return { label: "Imminent", color: "bg-yellow-500/20 text-yellow-400", icon: Clock };
    return { label: "À jour", color: "bg-green-500/20 text-green-400", icon: CheckCircle2 };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Maintenance Insights</h1>
              <p className="text-gray-400">Suivi des coûts et planning de maintenance des imprimantes</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Planifier Maintenance
            </Button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm mb-1">Coût Mensuel Total</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalMonthlyMaintenance)}</p>
                    <p className="text-blue-400 text-xs mt-1">≈ {formatCurrency(totalAnnualMaintenance)}/an</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm mb-1">Coût Total Cumulé</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalCumulativeCost)}</p>
                    <p className="text-purple-400 text-xs mt-1">Depuis l'installation</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-sm mb-1">Maintenances En Retard</p>
                    <p className="text-2xl font-bold text-white">{overdueCount}</p>
                    <p className="text-red-400 text-xs mt-1">Action requise</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm mb-1">Maintenances Imminentes</p>
                    <p className="text-2xl font-bold text-white">{upcomingCount}</p>
                    <p className="text-yellow-400 text-xs mt-1">Dans les 14 prochains jours</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown Chart Placeholder */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5" />
                Répartition des Coûts de Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="flex items-center gap-4">
                    <div className="w-48 text-sm text-gray-300 truncate">
                      {insight.name}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-gray-800 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end px-3"
                          style={{
                            width: `${(insight.maintenanceCostMonthly / totalMonthlyMaintenance) * 100}%`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {formatCurrency(insight.maintenanceCostMonthly)}/mois
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-gray-400">
                      {((insight.maintenanceCostMonthly / totalMonthlyMaintenance) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wrench className="w-5 h-5" />
                Détails de Maintenance par Imprimante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-800/50 hover:bg-gray-800/50 border-gray-800">
                      <TableHead className="text-gray-300">Imprimante</TableHead>
                      <TableHead className="text-gray-300">Statut</TableHead>
                      <TableHead className="text-gray-300 text-right">Coût/Mois</TableHead>
                      <TableHead className="text-gray-300 text-right">Coût Total</TableHead>
                      <TableHead className="text-gray-300 text-center">Maintenances</TableHead>
                      <TableHead className="text-gray-300">Dernière</TableHead>
                      <TableHead className="text-gray-300">Prochaine</TableHead>
                      <TableHead className="text-gray-300">État</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.map((insight) => {
                      const statusInfo = getMaintenanceStatus(insight.daysUntilMaintenance);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <TableRow key={insight.id} className="border-gray-800 hover:bg-gray-800/30">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{insight.name}</p>
                              <p className="text-xs text-gray-500">{insight.model}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              insight.status === 'operational' 
                                ? 'bg-green-500/20 text-green-400' 
                                : insight.status === 'maintenance'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }>
                              {insight.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-white font-medium">
                            {formatCurrency(insight.maintenanceCostMonthly)}
                          </TableCell>
                          <TableCell className="text-right text-white font-semibold">
                            {formatCurrency(insight.totalMaintenanceCost)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-white font-medium">{insight.totalMaintenanceCount}</span>
                              {insight.emergencyCount > 0 && (
                                <span className="text-xs text-red-400">
                                  {insight.emergencyCount} urgence{insight.emergencyCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {new Date(insight.lastMaintenanceDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {new Date(insight.nextMaintenanceDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                              {insight.daysUntilMaintenance >= 0 && (
                                <span className="ml-1">({insight.daysUntilMaintenance}j)</span>
                              )}
                              {insight.daysUntilMaintenance < 0 && (
                                <span className="ml-1">({Math.abs(insight.daysUntilMaintenance)}j)</span>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <p className="text-gray-400 text-sm mb-2">Coût Moyen/Imprimante/Mois</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(averageMonthlyCost)}</p>
                <p className="text-xs text-gray-500 mt-1">Basé sur {insights.length} imprimantes actives</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <p className="text-gray-400 text-sm mb-2">Intervalle Moyen de Maintenance</p>
                <p className="text-2xl font-bold text-white">90 jours</p>
                <p className="text-xs text-gray-500 mt-1">≈ 4 maintenances/an/imprimante</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <p className="text-gray-400 text-sm mb-2">Taux d'Urgence</p>
                <p className="text-2xl font-bold text-white">
                  {((insights.reduce((sum, i) => sum + i.emergencyCount, 0) / 
                     insights.reduce((sum, i) => sum + i.totalMaintenanceCount, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Maintenances non planifiées</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMaintenanceInsights;
