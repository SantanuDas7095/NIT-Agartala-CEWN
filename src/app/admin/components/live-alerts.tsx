
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { EmergencyReport } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { MapPin } from "lucide-react";
import Link from "next/link";

export default function LiveAlerts() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;
    const reportsCol = collection(db, "emergencyReports");
    const q = query(reportsCol, orderBy("timestamp", "desc"), limit(5));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData: EmergencyReport[] = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() } as EmergencyReport);
      });
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: reportsCol.path,
            operation: 'list',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "medical":
        return "destructive";
      case "safety":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
           <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No recent emergency reports.
              </TableCell>
            </TableRow>
          )}
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Badge variant={getBadgeVariant(report.emergencyType)}>
                  {report.emergencyType}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div>{report.studentName}</div>
                <div className="text-xs text-muted-foreground">{report.enrollmentNumber} (Year {report.year})</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {report.latitude && report.longitude ? (
                    <Link 
                        href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                    >
                        <MapPin className="h-4 w-4"/>
                        View on Map
                    </Link>
                ) : (
                    report.location
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
