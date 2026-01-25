
'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function UpdatePasswordPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !auth) {
    router.push('/login');
    return null;
  }

  const handleUpdatePassword = async (values: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);
    try {
      if (isPasswordUser) {
        if (!values.currentPassword) {
            toast({ title: 'Current password is required to update.', variant: 'destructive'});
            setIsSubmitting(false);
            return;
        }
        const credential = EmailAuthProvider.credential(user.email!, values.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      await updatePassword(user, values.newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated.',
      });
      router.push('/profile');
    } catch (error: any) {
      console.error('Password update error:', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/wrong-password') {
        description = 'The current password you entered is incorrect.';
      }
       if (error.code === 'auth/requires-recent-login') {
        description = 'This operation is sensitive and requires recent authentication. Please log in again before retrying.';
      }
      toast({
        title: 'Error Updating Password',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-headline mt-4">Set/Update Password</CardTitle>
            <CardDescription>
              {isPasswordUser ? 'Update your existing password.' : 'Set a password for your account to enable email & password login.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isPasswordUser && (
                <Alert className="mb-6">
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>You are signed in with Google</AlertTitle>
                    <AlertDescription>
                        You can set a password here to be able to sign in with your email and password as well.
                    </AlertDescription>
                </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-6">
                {isPasswordUser && (
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
