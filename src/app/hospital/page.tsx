
"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Stethoscope, Users, Calendar as CalendarIcon, BookMarked, BadgeCheck, BadgeAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { addDoc, collection, serverTimestamp, onSnapshot, query, Timestamp, doc, getDocs, where, limit, orderBy } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAdmin } from "@/hooks/use-admin";
import type { DoctorStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/use-user-profile";


const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

export default function HospitalPage() {
  const { toast } = useToast();
  const [avgWaitTime, setAvgWaitTime] = useState<number | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<DoctorStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const loading = userLoading || profileLoading;

  const appointmentSchema = useMemo(() => z.object({
    studentName: z.string().min(2, "Name is required."),
    enrollmentNumber: z.string().min(5, isAdmin ? "Employee ID is required." : "Enrollment Number is required."),
    appointmentDate: z.date({ required_error: "Please select a date." }),
    appointmentTime: z.string({ required_error: "Please select a time slot." }),
    reason: z.string().min(10, "Please provide a brief reason for your visit.").max(200),
  }), [isAdmin]);

  const appointmentForm = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      studentName: "",
      enrollmentNumber: "",
      reason: "",
    }
  });
  
  useEffect(() => {
    if (loading || !user) return;

    appointmentForm.reset({
        studentName: userProfile?.displayName || user?.displayName || "",
        enrollmentNumber: userProfile?.enrollmentNumber || "",
        appointmentDate: appointmentForm.getValues("appointmentDate") || undefined,
        appointmentTime: appointmentForm.getValues("appointmentTime") || "",
        reason: appointmentForm.getValues("reason") || "",
    });
  }, [user, userProfile, loading, appointmentForm]);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!db) return;
    
    // Fetch average wait time from recent completed appointments
    const getAvgWaitTime = async () => {
        if (!user) return; // Ensure user is available before querying
        const appointmentsCol = collection(db, "appointments");
        
        // This query is now compliant with security rules for non-admins
        const q = query(
            appointmentsCol,
            where("studentId", "==", user.uid)
        );

        try {
            const querySnapshot = await getDocs(q);
            
            const userAppointments = querySnapshot.docs.map(doc => doc.data());
            userAppointments.sort((a,b) => b.appointmentDate.toMillis() - a.appointmentDate.toMillis());

            const completedWithFeedback = userAppointments
                .slice(0, 20)
                .filter(data => 
                    data.status === "completed" && 
                    data.waitingTime !== undefined && 
                    data.waitingTime >= 0
                );

            if (completedWithFeedback.length === 0) {
                setAvgWaitTime(0); 
                return;
            }
            
            const totalWaitTime = completedWithFeedback.reduce((acc, data) => acc + data.waitingTime, 0);
            setAvgWaitTime(Math.floor(totalWaitTime / completedWithFeedback.length));

        } catch (error) {
            console.error("Could not fetch average wait time:", error);
            // Do not emit permission error here, as it might be expected for users with no appointments
            if (!(error as any).message.includes('permission-denied')) {
               errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'appointments', operation: 'list' }, error));
            }
            setAvgWaitTime(null);
        }
    }

    if (user) {
      getAvgWaitTime();
    }

    // Fetch doctor status
    const hospitalDocRef = doc(db, "campusInfo", "hospital");
    const unsubDoctor = onSnapshot(hospitalDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setDoctorStatus(docSnap.data() as DoctorStatus);
        }
        setStatusLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: hospitalDocRef.path,
            operation: 'get',
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setStatusLoading(false);
    });

    return () => {
        unsubDoctor();
    };
  }, [db, user, isAdmin]);

  async function onAppointmentSubmit(values: z.infer<typeof appointmentSchema>) {
    if (!user || !db) {
        toast({ title: "Authentication Error", description: "You must be logged in to book an appointment.", variant: "destructive" });
        return;
    }

    const appointmentData = {
      studentId: user.uid,
      studentName: values.studentName,
      enrollmentNumber: values.enrollmentNumber,
      appointmentDate: Timestamp.fromDate(values.appointmentDate),
      appointmentTime: values.appointmentTime,
      reason: values.reason,
      status: 'scheduled' as const,
      bookedBy: isAdmin ? 'admin' as const : 'student' as const,
    };

    addDoc(collection(db, "appointments"), appointmentData)
      .then(() => {
        toast({
          title: "Appointment Booked",
          description: `Your appointment is scheduled for ${format(values.appointmentDate, "PPP")} at ${values.appointmentTime}.`,
        });
        appointmentForm.reset({
            studentName: userProfile?.displayName || user?.displayName || "",
            enrollmentNumber: userProfile?.enrollmentNumber || "",
            reason: "",
            appointmentTime: "",
            appointmentDate: undefined,
        });
      })
      .catch((error) => {
         const permissionError = new FirestorePermissionError({
            path: `appointments`,
            operation: 'create',
            requestResourceData: appointmentData,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: "Booking Failed",
          description: "Could not book your appointment. Please try again.",
          variant: "destructive",
        });
      });
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Stethoscope className="mx-auto h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Campus Hospital Transparency</h1>
            <p className="text-muted-foreground text-lg">
              Real-time hospital status and a platform for your valuable feedback.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
             {avgWaitTime !== null ? (
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Waiting Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgWaitTime} min</div>
                  <p className="text-xs text-muted-foreground">Based on recent patient feedback</p>
                </CardContent>
              </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Waiting Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-32 mt-1" />
                    </CardContent>
                </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doctor Availability</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                    <>
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-48 mt-1" />
                    </>
                ) : doctorStatus ? (
                    <>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {doctorStatus.isAvailable ? <BadgeCheck className="text-green-500" /> : <BadgeAlert className="text-yellow-500" />}
                            {doctorStatus.isAvailable ? "Available" : "Unavailable"}
                        </div>
                        <p className="text-xs text-muted-foreground">{doctorStatus.name} ({doctorStatus.specialty})</p>
                    </>
                ) : (
                    <p>Status not available</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-foreground/80">Emergency Status</CardTitle>
                <Stethoscope className="h-4 w-4 text-primary-foreground/80" />
              </CardHeader>
              <CardContent>
                 {statusLoading ? (
                     <Skeleton className="h-8 w-32 bg-primary/50" />
                 ) : (
                    <>
                        <div className="text-2xl font-bold">{doctorStatus?.emergencyStatus || "Normal Operations"}</div>
                        <p className="text-xs text-primary-foreground/80">Current campus-wide status.</p>
                    </>
                 )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <BookMarked />
                  Book an Appointment
                </CardTitle>
                <CardDescription>Schedule a non-emergency visit to the campus hospital.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appointmentForm}>
                  <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                          control={appointmentForm.control}
                          name="studentName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={appointmentForm.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{isAdmin ? "Employee ID" : "Enrollment Number"}</FormLabel>
                              <FormControl>
                                <Input placeholder={isAdmin ? "e.g. EMP12345" : "e.g. 20-UCD-034"} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                     <FormField
                        control={appointmentForm.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Appointment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0,0,0,0)) 
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={appointmentForm.control}
                        name="appointmentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Slot</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map(slot => (
                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     <FormField
                        control={appointmentForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Visit</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Briefly describe the reason for your appointment..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <Button type="submit" className="w-full">Book Appointment</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
