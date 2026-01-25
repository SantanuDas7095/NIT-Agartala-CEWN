
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, BrainCircuit, Loader2, CalendarClock } from 'lucide-react';
import LiveAlerts from './components/live-alerts';
import ResponseTimeChart from './components/response-time-chart';
import MessHygieneChart from './components/mess-hygiene-chart';
import PredictiveHealth from './components/predictive-health';
import AppointmentsList from './components/appointments-list';
import DoctorStatusUpdater from './components/doctor-status-updater';

export default function AdminPage() {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50">
        <div className="container mx-auto py-12 px-4 md:px-6">
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Monitor campus health, safety, and wellness in real-time.
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Live Dashboard
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <CalendarClock className="mr-2 h-4 w-4" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="ai-insights">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Predictive Health
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
               <Card>
                  <CardHeader>
                    <CardTitle>Live Emergency Alerts</CardTitle>
                    <CardDescription>Real-time stream of campus emergencies.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LiveAlerts />
                  </CardContent>
                </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                <CardHeader>
                    <CardTitle>Hospital Response Time</CardTitle>
                    <CardDescription>Average waiting time for student vs admin-booked appointments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponseTimeChart />
                </CardContent>
                </Card>
                <DoctorStatusUpdater />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Mess Hygiene Trends</CardTitle>
                  <CardDescription>Average food quality ratings. Use the dropdown to filter by meal.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MessHygieneChart />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments">
              <Card>
                  <CardHeader>
                    <CardTitle>Manage Appointments</CardTitle>
                    <CardDescription>Select a date to view and manage that day's appointments.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AppointmentsList />
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="ai-insights">
              <PredictiveHealth />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
