
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, linkWithCredential, PhoneAuthProvider, updatePhoneNumber } from 'firebase/auth';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Check, Briefcase, Phone, MessageSquare, Edit } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProfileCard from './components/profile-card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { uploadPhoto } from '../actions';
import { useAdmin } from '@/hooks/use-admin';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  enrollmentNumber: z.string().optional(),
  hostel: z.string().optional(),
  department: z.string().optional(),
  year: z.coerce.number().optional(),
  photo: z.instanceof(File).optional(),
  phoneNumber: z.string().optional(),
  otp: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isChangingPhoneNumber, setIsChangingPhoneNumber] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      enrollmentNumber: '',
      hostel: '',
      department: '',
      year: undefined,
      phoneNumber: '',
      otp: '',
    },
  });

  const loading = userLoading || profileLoading || adminLoading;

  useEffect(() => {
    if (loading) return;
    if (!user || !db) {
        router.push('/login');
        return;
    }
    
    const currentPhoneNumber = userProfile?.phoneNumber || user.phoneNumber || '';
    const numberWithoutCountryCode = currentPhoneNumber.startsWith('+91') 
      ? currentPhoneNumber.substring(3).trim()
      : currentPhoneNumber;

    form.reset({
        displayName: userProfile?.displayName || user.displayName || '',
        enrollmentNumber: userProfile?.enrollmentNumber || '',
        hostel: userProfile?.hostel || '',
        department: userProfile?.department || '',
        year: userProfile?.year,
        phoneNumber: numberWithoutCountryCode,
    });

  }, [user, userProfile, loading, db, router, form]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !auth) {
    return null;
  }
  
  const setupRecaptcha = () => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
    }
  }

  const handleSendOtp = async () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (!phoneNumber || phoneNumber.length < 10) {
        toast({ title: "Invalid Phone Number", description: "Phone number must be at least 10 digits.", variant: "destructive" });
        return;
    }
    
    const fullPhoneNumber = `+91${phoneNumber}`;

    if (fullPhoneNumber === (userProfile?.phoneNumber || user.phoneNumber)) {
        toast({ title: "Phone number is already verified", variant: "default" });
        return;
    }
    
    setIsSendingOtp(true);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;

    try {
        const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        setConfirmationResult(result);
        toast({ title: "OTP Sent", description: `An OTP has been sent to ${fullPhoneNumber}.` });
    } catch (error: any) {
        console.error("OTP Error:", error);
        toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    } finally {
        setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = form.getValues("otp");
    if (!otp || !confirmationResult || !db) {
      toast({ title: "OTP is required or system is not ready.", variant: "destructive" });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      
      // If user has no phone number, just link it.
      if (!user.phoneNumber) {
        await linkWithCredential(user, credential);
      } else {
        // If user already has a phone number, update it.
        await updatePhoneNumber(user, credential);
      }
      
      toast({ title: "Phone Number Verified!", description: "Your phone number has been successfully linked to your account." });
      
      // Save the new phone number to the Firestore profile
      const phoneNumber = form.getValues("phoneNumber");
      if (phoneNumber) {
        const fullPhoneNumber = `+91${phoneNumber}`;
        const userDocRef = doc(db, 'userProfile', user.uid);
        await setDoc(userDocRef, { phoneNumber: fullPhoneNumber, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: "Profile Updated", description: "Your new phone number has been saved to your profile." });
      }

      setConfirmationResult(null);
      form.resetField("otp");
      setIsChangingPhoneNumber(false);

    } catch (error: any) {
      if (error.code === 'auth/provider-already-linked') {
          toast({
              title: "Already Verified",
              description: "This phone number is already linked to your account.",
              variant: "default"
          });
          setConfirmationResult(null);
          form.resetField("otp");
      } else if (error.code === 'auth/account-exists-with-different-credential' || error.code === 'auth/credential-already-in-use') {
        toast({
            title: "Verification Failed",
            description: "This phone number is already linked to another account. Please use a different number.",
            variant: "destructive"
        });
      } else {
        console.error("OTP Verification Error:", error);
        toast({ title: "OTP Verification Failed", description: error.message || 'An unknown error occurred.', variant: "destructive" });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  }


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('photo', file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !db) return;

    setIsSubmitting(true);
    let photoURL = userProfile?.photoURL || user.photoURL;

    try {
      if (data.photo) {
        const formData = new FormData();
        formData.append('photo', data.photo);
        const result = await uploadPhoto(formData);
        if (result.success && result.url) {
          photoURL = result.url;
        } else {
          throw new Error(result.error || 'Photo upload failed.');
        }
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: photoURL || '',
      });

      const userDocRef = doc(db, 'userProfile', user.uid);
      
      const userProfileData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email!,
        displayName: data.displayName,
        photoURL: photoURL || '',
        enrollmentNumber: data.enrollmentNumber || '',
        department: data.department || '',
        updatedAt: serverTimestamp(),
      };
      
      if (!isAdmin) {
        userProfileData.hostel = data.hostel || '';
        if (data.year && !isNaN(data.year)) {
          userProfileData.year = data.year;
        }
      }
      
      if (!userProfile) {
        userProfileData.createdAt = serverTimestamp();
      }

      await setDoc(userDocRef, userProfileData, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);

    } catch (error: any) {
      console.error('Error during profile update process:', error);
      
      if (error.code && error.code.includes('permission-denied')) {
         const permissionError = new FirestorePermissionError({
            path: `userProfile/${user.uid}`,
            operation: userProfile ? 'update' : 'create',
            requestResourceData: data,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to save this profile.',
          variant: 'destructive',
        });
      } else {
        toast({
            title: 'Update Failed',
            description: error.message || 'An error occurred while updating your profile.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
      setPhotoPreview(null);
      form.resetField('photo');
    }
  };

  const userHasPhoneNumber = !!(user.phoneNumber || userProfile?.phoneNumber);

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Header />
      <main className="flex-1">
        <div id="recaptcha-container" className={isEditing ? '' : 'hidden'} />
        <div className="container mx-auto max-w-2xl py-12 px-4 md:px-6">
          {!isEditing ? (
             <ProfileCard user={user} userProfile={userProfile} onEdit={() => setIsEditing(true)} isAdmin={isAdmin} />
          ) : (
            <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <UserIcon className="h-6 w-6 text-primary" />
                Edit Your Profile
              </CardTitle>
              <CardDescription>
                Manage your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview || userProfile?.photoURL || user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Profile Picture</Label>
                      <Input id="picture" type="file" accept="image/*" onChange={handlePhotoChange} />
                      <p className="text-sm text-muted-foreground">Upload a new photo (max 2MB).</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enrollmentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isAdmin ? "Employee ID" : "Enrollment Number"}</FormLabel>
                        <FormControl>
                          <Input placeholder={isAdmin ? "e.g., EMP12345" : "e.g., 20-UCD-034"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!isAdmin && (
                    <>
                      <FormField
                        control={form.control}
                        name="hostel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hostel</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your hostel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Gargi hostel">Gargi hostel</SelectItem>
                                <SelectItem value="RNT hostel">RNT hostel</SelectItem>
                                <SelectItem value="Aryabhatta hostel">Aryabhatta hostel</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year of Study</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 3" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  <div className="space-y-4 rounded-lg border p-4">
                     <FormLabel className="flex items-center gap-2"><Phone/> Phone Number</FormLabel>
                     {userHasPhoneNumber && !isChangingPhoneNumber ? (
                         <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">{user.phoneNumber || userProfile?.phoneNumber}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingPhoneNumber(true)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Change
                            </Button>
                         </div>
                     ) : (
                        <>
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
                                            <span className="text-sm text-muted-foreground">+91</span>
                                            </div>
                                            <Input type="tel" placeholder="98765 43210" {...field} />
                                            <Button type="button" onClick={handleSendOtp} disabled={isSendingOtp}>
                                                {isSendingOtp ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {confirmationResult && (
                                <FormField
                                    control={form.control}
                                    name="otp"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MessageSquare/> Verification Code</FormLabel>
                                        <FormControl>
                                        <div className="flex gap-2">
                                            <Input placeholder="Enter 6-digit OTP" {...field} />
                                            <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp}>
                                                {isVerifyingOtp ? <Loader2 className="animate-spin" /> : 'Verify'}
                                            </Button>
                                        </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}
                        </>
                     )}
                  </div>


                  <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => { setIsEditing(false); setIsChangingPhoneNumber(false); }}>Cancel</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
