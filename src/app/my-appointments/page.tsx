
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CalendarClock } from 'lucide-react';
import UserAppointmentsList from './components/user-appointments-list';

export default function MyAppointmentsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50">
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
           <div className="space-y-4 mb-8">
            <h1 className="text-4xl font-bold font-headline flex items-center gap-4"><CalendarClock /> My Appointments</h1>
            <p className="text-muted-foreground text-lg">
              A list of your upcoming and past appointments.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Your Scheduled Appointments</CardTitle>
              <CardDescription>A list of all your scheduled appointments at the campus hospital.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserAppointmentsList />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
