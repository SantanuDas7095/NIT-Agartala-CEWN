
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
import { format, startOfDay, endOfDay } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User, Shield, Calendar as CalendarIcon, MessageSquareText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ViewFeedbackDialog({ appointment, children }: { appointment: Appointment, children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Post-Visit Feedback</DialogTitle>
                    <DialogDescription>
                        Feedback for {appointment.studentName}'s appointment on {format(appointment.appointmentDate.toDate(), "PPP")} at {appointment.appointmentTime}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-baseline">
                        <p className="font-semibold w-32">Waiting Time:</p>
                        <p>{appointment.waitingTime} minutes</p>
                    </div>
                     <div className="flex items-baseline">
                        <p className="font-semibold w-32">Doctor on Arrival:</p>
                        <p className="capitalize">{appointment.doctorAvailability}</p>
                    </div>
                     <div className="flex flex-col">
                        <p className="font-semibold">Feedback:</p>
                        <p className="mt-1 p-3 bg-muted rounded-md text-sm">{appointment.postVisitFeedback}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !selectedDate) return;
    
    setLoading(true);

    const appointmentsCol = collection(db, "appointments");
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const q = query(
        appointmentsCol, 
        where("appointmentDate", ">=", Timestamp.fromDate(start)),
        where("appointmentDate", "<=", Timestamp.fromDate(end)),
        orderBy("appointmentDate", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentsData.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(appointmentsData);
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
  }, [db, selectedDate]);

  const handleStatusChange = async (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    if (!db) return;
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    const updateData = { status };
    
    updateDoc(appointmentRef, updateData)
        .then(() => {
            toast({
                title: "Status Updated",
                description: `Appointment status changed to ${status}.`
            });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: appointmentRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Update Failed",
                description: "You do not have permission to update appointments.",
                variant: 'destructive'
            });
        });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive"
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Showing appointments for:</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Booked By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6}>
                            <Skeleton className="h-12 w-full" />
                        </TableCell>
                    </TableRow>
                ) : appointments.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No appointments scheduled for this day.
                    </TableCell>
                    </TableRow>
                ) : (
                appointments.map((appt) => (
                    <TableRow key={appt.id}>
                    <TableCell>
                        <div className="font-medium">{appt.appointmentTime}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                        <div>{appt.studentName}</div>
                        <div className="text-xs text-muted-foreground">{appt.enrollmentNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">{appt.reason}</TableCell>
                     <TableCell>
                        {appt.bookedBy === 'admin' ? (
                            <Badge variant="secondary"><Shield className="h-3 w-3 mr-1"/>Admin</Badge>
                        ) : (
                            <Badge variant="outline"><User className="h-3 w-3 mr-1"/>Student</Badge>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           {appt.status === 'completed' && appt.postVisitFeedback ? (
                               <ViewFeedbackDialog appointment={appt}>
                                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                                        View Feedback
                                    </Button>
                               </ViewFeedbackDialog>
                           ) : (
                            <Badge variant={getStatusBadge(appt.status)}>
                                {appt.status}
                            </Badge>
                           )}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'scheduled')}>
                                Mark as Scheduled
                            </DropdownMenuItem>
                            {!appt.postVisitFeedback &&
                              <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'completed')}>
                                  Mark as Completed
                              </DropdownMenuItem>
                            }
                            <DropdownMenuItem onClick={() => handleStatusChange(appt.id!, 'cancelled')}>
                                Mark as Cancelled
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
