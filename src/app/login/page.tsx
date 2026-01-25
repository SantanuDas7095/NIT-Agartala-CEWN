
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { University, LogIn, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing.
        return;
      }
      toast({
        title: 'Authentication Error',
        description:
          error.message || 'An error occurred during Google Sign-In.',
        variant: 'destructive',
      });
    }
  };

  const handleEmailSignUp = async (values: z.infer<typeof emailSchema>) => {
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Sign-Up Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already in use.'
            : error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEmailSignIn = async (values: z.infer<typeof emailSchema>) => {
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
       let description = 'An unexpected error occurred.';
       switch (error.code) {
         case 'auth/user-not-found':
         case 'auth/wrong-password':
         case 'auth/invalid-credential':
           description = 'Invalid credentials. Please check your email and password, or sign up.';
           break;
         default:
           description = error.message;
       }
      toast({
        title: 'Sign-In Failed',
        description,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <University className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">
            Welcome to NIT Agartala CEWN
          </CardTitle>
          <CardDescription>
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailSignIn)}
                  className="space-y-6 pt-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@nita.ac.in"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="flex justify-end">
                    <Button asChild variant="link" className="p-0 h-auto">
                        <Link href="/reset-password">Forgot Password?</Link>
                    </Button>
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailSignUp)}
                  className="space-y-6 pt-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@nita.ac.in"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.05 1.67-4.7 0-8.53-3.84-8.53-8.53s3.84-8.53 8.53-8.53c2.42 0 4.5 1.05 5.94 2.36l2.64-2.64C19.43 1.99 16.25 1 12.48 1 5.88 1 1 5.88 1 12.48s4.88 11.48 11.48 11.48c3.47 0 6.3-1.2 8.3-3.33 2.1-2.1 2.85-5.05 2.85-7.73 0-.74-.07-1.44-.2-2.14H12.48z"
              />
            </svg>
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
