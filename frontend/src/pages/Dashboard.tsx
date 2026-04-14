import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "@/config";

import {
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  Wallet,
  TrendingUp,
  Banknote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/dashboard/StatCard";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalRevenue: 0,
    feesCollected: 0,
    totalExpenditure: 0,
    netRevenue: 0,
    feesDue: 0,
    feeDefaulters: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/dashboard/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  const pieData = [
    { name: "Collected", value: stats.feesCollected },
    { name: "Due", value: stats.feesDue },
  ];

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border-l-8 border-primary shadow-sm no-print">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time financial and academic performance monitoring.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
             <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Total Students</p>
             <p className="text-2xl font-black text-primary">{stats.totalStudents}</p>
           </div>
           <div className="w-px h-10 bg-slate-200"></div>
           <div className="text-right">
             <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Gross Revenue</p>
             <p className="text-2xl font-black text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Financial Health Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Revenue (Profit)"
          value={`₹${stats.netRevenue.toLocaleString()}`}
          icon={TrendingUp}
          className="bg-emerald-50/50 border-emerald-100"
        />
        <StatCard
          title="Total Expenditure"
          value={`₹${stats.totalExpenditure.toLocaleString()}`}
          icon={Wallet}
          className="bg-red-50/50 border-red-100"
        />
        <StatCard
          title="Outstanding Dues"
          value={`₹${stats.feesDue.toLocaleString()}`}
          icon={AlertTriangle}
          className="bg-amber-50/50 border-amber-100"
        />
         <StatCard
          title="Total Faculty"
          value={stats.totalFaculty.toLocaleString()}
          icon={UserCheck}
        />
      </div>

      {/* Charts and Widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fee Defaulters - Replaces Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fee Defaulters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.feeDefaulters && stats.feeDefaulters.length > 0 ? (
                stats.feeDefaulters.map((defaulter: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                        {defaulter.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {defaulter.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {defaulter.grade}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        ₹{defaulter.dueAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due Amount
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                  <p>No fee defaulters found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Pie Chart */}
        <div className="space-y-6">
          {/* Fees Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fees Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex flex-col justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `₹${value.toLocaleString()}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Total: ₹
                    {(stats.feesCollected + stats.feesDue).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
