
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAdmin } from "@/hooks/use-admin";

type ChartData = {
  date: string;
  displayDate: string;
  'Student Booked'?: number;
  'Admin Booked'?: number;
}

export default function ResponseTimeChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    // Only run the effect if the user is a confirmed admin and db is available.
    if (!isAdmin || !db) {
      if (!adminLoading) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const appointmentsCol = collection(db, "appointments");
    const q = query(
        appointmentsCol, 
        where("status", "==", "completed"),
        where("waitingTime", ">=", 0)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dailyAverage: { [key: string]: { student: { total: number, count: number }, admin: { total: number, count: number } } } = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.appointmentDate && data.waitingTime !== undefined) {
          const date = format(data.appointmentDate.toDate(), 'yyyy-MM-dd');
          if (!dailyAverage[date]) {
            dailyAverage[date] = { 
              student: { total: 0, count: 0 },
              admin: { total: 0, count: 0 }
            };
          }
          
          if (data.bookedBy === 'admin') {
              dailyAverage[date].admin.total += data.waitingTime;
              dailyAverage[date].admin.count += 1;
          } else { // 'student' or undefined defaults to student
              dailyAverage[date].student.total += data.waitingTime;
              dailyAverage[date].student.count += 1;
          }
        }
      });

      const formattedData = Object.keys(dailyAverage).map(date => {
        const entry: ChartData = {
          date,
          displayDate: format(new Date(date), 'MMM d'),
        }

        if (dailyAverage[date].student.count > 0) {
            entry['Student Booked'] = Math.round(dailyAverage[date].student.total / dailyAverage[date].student.count);
        }
        if (dailyAverage[date].admin.count > 0) {
            entry['Admin Booked'] = Math.round(dailyAverage[date].admin.total / dailyAverage[date].admin.count);
        }

        return entry;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setChartData(formattedData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: appointmentsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, isAdmin, adminLoading]);

  // Guard clauses at the top of the render function
  if (adminLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (!isAdmin) {
    return (
        <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            You do not have permission to view this chart.
        </div>
    );
  }
  
  if (loading) {
      return <Skeleton className="h-[300px] w-full" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No completed appointments with feedback available.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="displayDate" stroke="hsl(var(--foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
             labelFormatter={(label, payload) => {
                 const data = payload[0]?.payload;
                 if (data?.date) {
                     return format(new Date(data.date), "PPP");
                 }
                 return label;
             }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Bar dataKey="Student Booked" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Admin Booked" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
