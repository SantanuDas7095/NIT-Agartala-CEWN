
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
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import type { Appointment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const feedbackSchema = z.object({
  waitingTime: z.coerce.number().min(0, "Waiting time cannot be negative."),
  doctorAvailability: z.enum(["available", "unavailable"], { required_error: "Please select doctor availability." }),
  postVisitFeedback: z.string().min(10, "Feedback must be at least 10 characters.").max(500),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

function FeedbackDialog({ appointment, onFeedbackSubmit, children }: { appointment: Appointment, onFeedbackSubmit: (appointmentId: string, values: FeedbackFormValues) => void, children: React.ReactNode }) {
    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            waitingTime: 0,
            postVisitFeedback: "",
        },
    });
    
    const [open, setOpen] = useState(false);

    const handleSubmit = (values: FeedbackFormValues) => {
        onFeedbackSubmit(appointment.id!, values);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Post-Visit Feedback</DialogTitle>
                    <DialogDescription>
                        Your feedback for the appointment on {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="waitingTime"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Waiting Time (in minutes)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 30" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="doctorAvailability"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Doctor Availability on Arrival</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="available" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Available</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value="unavailable" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Unavailable</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="postVisitFeedback"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Overall Feedback</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your experience..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                               <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Submit Feedback</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function ViewFeedbackDialog({ appointment }: { appointment: Appointment }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    View Feedback
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Your Post-Visit Feedback</DialogTitle>
                    <DialogDescription>
                       Feedback you submitted for the appointment on {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}.
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


const formatDate = (timestamp: Timestamp | Date): string => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return format(date, "PPP");
}

export default function UserAppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !user) return;

    const appointmentsCol = collection(db, "appointments");
    const q = query(
      appointmentsCol, 
      where("studentId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentsData.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      appointmentsData.sort((a, b) => b.appointmentDate.toMillis() - a.appointmentDate.toMillis());
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
  }, [db, user]);

  const handleStatusUpdate = async (appointmentId: string, updateData: Partial<Appointment>) => {
    if (!db) return;
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    updateDoc(appointmentRef, updateData)
      .then(() => {
        toast({
          title: "Appointment Updated",
          description: "Your action was successful.",
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
          description: "Could not update the appointment. Please check permissions and try again.",
          variant: "destructive",
        });
      });
  };

  const onFeedbackSubmit = (appointmentId: string, values: FeedbackFormValues) => {
    handleStatusUpdate(appointmentId, values);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
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
            <TableHead>Date & Time</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                You have no scheduled appointments.
              </TableCell>
            </TableRow>
          )}
          {appointments.map((appt) => (
            <TableRow key={appt.id}>
              <TableCell>
                <div className="font-medium">{formatDate(appt.appointmentDate)}</div>
                <div className="text-xs text-muted-foreground">{appt.appointmentTime}</div>
              </TableCell>
              <TableCell>{appt.reason}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(appt.status)}>
                  {appt.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {appt.status === 'scheduled' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(appt.id!, { status: 'cancelled' })}>
                    Cancel
                  </Button>
                )}
                {appt.status === 'completed' && !appt.postVisitFeedback && (
                   <FeedbackDialog appointment={appt} onFeedbackSubmit={onFeedbackSubmit}>
                       <Button variant="outline" size="sm">
                            <MessageSquarePlus className="mr-2 h-4 w-4" />
                            Give Feedback
                        </Button>
                   </FeedbackDialog>
                )}
                {appt.status === 'completed' && appt.postVisitFeedback && (
                    <ViewFeedbackDialog appointment={appt} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
