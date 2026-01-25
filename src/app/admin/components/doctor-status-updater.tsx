
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import type { DoctorStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emergencyStatuses = [
    "Normal Operations",
    "Priority Open",
    "High Alert",
    "Information Only"
];

const doctorStatusSchema = z.object({
  name: z.string().min(2, "Doctor's name is required."),
  specialty: z.string().min(2, "Specialty is required."),
  isAvailable: z.boolean(),
  emergencyStatus: z.string().optional(),
});

type DoctorStatusForm = z.infer<typeof doctorStatusSchema>;

export default function DoctorStatusUpdater() {
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DoctorStatusForm>({
    resolver: zodResolver(doctorStatusSchema),
    defaultValues: {
      name: "",
      specialty: "",
      isAvailable: true,
      emergencyStatus: "Normal Operations",
    },
  });

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const docRef = doc(db, "campusInfo", "hospital");

    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as DoctorStatus;
          form.reset({
            ...data,
            emergencyStatus: data.emergencyStatus || "Normal Operations",
          });
        } else {
          form.reset({
            name: "Dr. A. K. Singh",
            specialty: "General Physician",
            isAvailable: true,
            emergencyStatus: "Normal Operations",
          });
        }
        setLoading(false);
      }, 
      (error) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'get' }, error);
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, form]);

  const onSubmit = async (data: DoctorStatusForm) => {
    if (!db) return;
    setIsSubmitting(true);
    const docRef = doc(db, "campusInfo", "hospital");
    
    setDoc(docRef, data, { merge: true })
        .then(() => {
            toast({
                title: "Status Updated",
                description: "Hospital status has been updated successfully.",
            });
        })
        .catch(error => {
             const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: data,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Update Failed",
                description: "You do not have permission to change the hospital status.",
                variant: "destructive",
            });
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  if (loading) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Status</CardTitle>
        <CardDescription>Update doctor availability and campus emergency status.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dr. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., General Physician" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Is Doctor Available?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="emergencyStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an emergency status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {emergencyStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
