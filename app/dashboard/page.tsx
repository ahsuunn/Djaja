'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, AlertTriangle, CheckCircle, TrendingUp, Heart } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTests: 0,
    criticalTests: 0,
    warningTests: 0,
    normalTests: 0,
    totalPatients: 0,
  });

  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API call
      // In production, replace with actual API call
      setTimeout(() => {
        setStats({
          totalTests: 1247,
          criticalTests: 23,
          warningTests: 87,
          normalTests: 1137,
          totalPatients: 456,
        });

        setRecentTests([
          { date: '2025-11-16', tests: 45, critical: 2, warning: 8, normal: 35 },
          { date: '2025-11-15', tests: 52, critical: 3, warning: 10, normal: 39 },
          { date: '2025-11-14', tests: 38, critical: 1, warning: 6, normal: 31 },
          { date: '2025-11-13', tests: 48, critical: 4, warning: 9, normal: 35 },
          { date: '2025-11-12', tests: 41, critical: 2, warning: 7, normal: 32 },
          { date: '2025-11-11', tests: 55, critical: 3, warning: 11, normal: 41 },
          { date: '2025-11-10', tests: 43, critical: 2, warning: 8, normal: 33 },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Normal', value: stats.normalTests, color: '#10b981' },
    { name: 'Warning', value: stats.warningTests, color: '#f59e0b' },
    { name: 'Critical', value: stats.criticalTests, color: '#ef4444' },
  ];

  const testTypeData = [
    { name: 'Blood Pressure', count: 412 },
    { name: 'Heart Rate', count: 389 },
    { name: 'SpO2', count: 356 },
    { name: 'Glucose', count: 298 },
    { name: 'EKG', count: 245 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Healthcare Facility Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+12%</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Warning Cases</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.warningTests}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in system</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Line Chart - Tests Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Tests Over Time</CardTitle>
              <CardDescription>Last 7 days diagnostic activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentTests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tests" stroke="#269CAE" strokeWidth={2} />
                  <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="warning" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results Distribution</CardTitle>
              <CardDescription>Overall status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Test Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tests by Type</CardTitle>
            <CardDescription>Distribution of diagnostic tests performed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={testTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#269CAE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle>Device Status</CardTitle>
            <CardDescription>IoT device monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: 'BP Monitor', status: 'online', id: 'BP-001' },
                { name: 'Heart Rate', status: 'online', id: 'HR-001' },
                { name: 'Glucometer', status: 'online', id: 'GLU-001' },
                { name: 'Pulse Oximeter', status: 'maintenance', id: 'SPO2-001' },
                { name: 'EKG Machine', status: 'online', id: 'EKG-001' },
              ].map((device) => (
                <div
                  key={device.id}
                  className="p-4 border rounded-lg flex flex-col items-center justify-center"
                >
                  <Heart className={`w-8 h-8 mb-2 ${device.status === 'online' ? 'text-green-600' : 'text-orange-600'}`} />
                  <div className="font-medium text-sm">{device.name}</div>
                  <div className="text-xs text-muted-foreground">{device.id}</div>
                  <div className={`mt-2 text-xs font-medium ${device.status === 'online' ? 'text-green-600' : 'text-orange-600'}`}>
                    {device.status === 'online' ? '● Online' : '⚠ Maintenance'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button onClick={() => window.location.href = '/device-simulator'}>
            Open Device Simulator
          </Button>
          <Button variant="outline" onClick={fetchDashboardData}>
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
