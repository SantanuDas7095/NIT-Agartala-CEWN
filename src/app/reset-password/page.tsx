
'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Header } from '@/components/common/header';
import { Footer } from '@/components/common/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useState(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) {
      toast({
        title: 'Email Required',
        description: 'Please enter the email address for your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${email}, you will receive an email with instructions to reset your password.`,
      });
      router.push('/');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error Sending Email',
        description: error.message || 'An unexpected error occurred. Please try again.',
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
            <CardTitle className="text-2xl font-headline mt-4">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your account's email address and we will send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@nita.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
