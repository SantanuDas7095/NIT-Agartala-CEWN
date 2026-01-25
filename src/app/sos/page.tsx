

"use client";

import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeartPulse, Shield, Flame, Home, Megaphone, LocateFixed, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAdmin } from "@/hooks/use-admin";

const emergencyTypes = [
  {
    name: "Medical",
    icon: <HeartPulse className="h-16 w-16 text-red-500" />,
    color: "hover:bg-red-500/10",
  },
  {
    name: "Safety",
    icon: <Shield className="h-16 w-16 text-blue-500" />,
    color: "hover:bg-blue-500/10",
  },
  {
    name: "Fire",
    icon: <Flame className="h-16 w-16 text-orange-500" />,
    color: "hover:bg-orange-500/10",
  },
  {
    name: "Hostel Issue",
    icon: <Home className="h-16 w-16 text-green-500" />,
    color: "hover:bg-green-500/10",
  },
];

export default function SosPage() {
  const [selectedEmergency, setSelectedEmergency] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const db = useFirestore();
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);

  const loading = userLoading || profileLoading || adminLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && userProfile) {
      setStudentName(userProfile?.displayName || user.displayName || "");
      setEnrollmentNumber(userProfile?.enrollmentNumber || "");
      setYear(userProfile?.year);
      if (userProfile?.hostel) {
        setLocation(userProfile.hostel);
      }
    }
  }, [user, userProfile]);
  
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
        toast({
            title: "Geolocation Not Supported",
            description: "Your browser does not support geolocation.",
            variant: "destructive"
        });
        return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            setCoordinates({ lat: latitude, lon: longitude });
            setIsFetchingLocation(false);
            toast({
                title: "Location Fetched",
                description: "Your current location has been set."
            });
        },
        (error) => {
            setIsFetchingLocation(false);
            toast({
                title: "Location Error",
                description: `Could not fetch location: ${error.message}`,
                variant: "destructive"
            });
        }
    );
  }

  const isFormValid = 
    studentName.trim() !== "" && 
    location.trim() !== "" && 
    selectedEmergency !== null && 
    enrollmentNumber.trim() !== "" && 
    (isAdmin || (year !== undefined && year > 0));

  const handleAlertConfirm = async () => {
    if (!selectedEmergency || !user || !db) {
        toast({ title: "Error", description: "User not logged in or form is incomplete.", variant: "destructive" });
        return;
    }

    const reportData: any = {
        studentId: user.uid,
        studentName: studentName,
        enrollmentNumber: enrollmentNumber,
        location: location,
        emergencyType: selectedEmergency,
        timestamp: serverTimestamp(),
        ...(coordinates && { latitude: coordinates.lat, longitude: coordinates.lon }),
    };

    if (year && !isAdmin) {
      reportData.year = year;
    }

    addDoc(collection(db, "emergencyReports"), reportData)
        .then(() => {
            toast({
                title: "SOS Alert Sent",
                description: `Your ${selectedEmergency.toLowerCase()} emergency alert has been sent. Authorities are on their way.`,
                variant: "destructive",
            });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: 'emergencyReports',
                operation: 'create',
                requestResourceData: reportData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Error",
                description: "Could not send SOS alert. Please try again.",
                variant: "destructive",
            });
        });

    setSelectedEmergency(null);
  };
  
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
        <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6 md:py-20">
          <div className="text-center space-y-4">
            <Megaphone className="mx-auto h-16 w-16 text-accent" />
            <h1 className="text-4xl font-bold font-headline">Emergency SOS</h1>
            <p className="text-muted-foreground text-lg">
              In an emergency, fill in your details and tap the relevant button below.
            </p>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>This information will be sent to the authorities. Use the button to get your precise location.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter your full name" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="enrollmentNumber">{isAdmin ? "Employee ID" : "Enrollment Number"}</Label>
                  <Input 
                    id="enrollmentNumber" 
                    placeholder={isAdmin ? "e.g., EMP12345" : "e.g., 20-UCD-034"}
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                  />
                </div>
                {!isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="year">Year of Study</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="e.g., 3"
                      value={year || ''}
                      onChange={(e) => setYear(parseInt(e.target.value) || undefined)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="location">Your Current Location</Label>
                  <div className="flex gap-2">
                    <Input 
                        id="location" 
                        placeholder="e.g., Hostel 5, Block B, Room 201" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={handleFetchLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AlertDialog>
            <div className="mt-8">
              <h3 className="text-center text-lg font-semibold mb-4">Select Emergency Type</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {emergencyTypes.map((emergency) => (
                  <AlertDialogTrigger asChild key={emergency.name}>
                    <Card
                      className={`cursor-pointer transition-all ${emergency.color} hover:shadow-xl`}
                      onClick={() => setSelectedEmergency(emergency.name)}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                        {emergency.icon}
                        <span className="text-2xl font-bold">{emergency.name}</span>
                      </CardContent>
                    </Card>
                  </AlertDialogTrigger>
                ))}
              </div>
            </div>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm {selectedEmergency} Emergency?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately alert campus security with your name and location. Only proceed if this is a genuine emergency.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedEmergency(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAlertConfirm}
                  disabled={!isFormValid}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm Emergency
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
