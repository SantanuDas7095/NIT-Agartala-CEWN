
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, LogIn, User as UserIcon, BookCopy, CalendarClock, KeyRound, University } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/use-user-profile";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/sos", label: "SOS" },
  { href: "/hospital", label: "Hospital" },
  { href: "/mess", label: "Mess" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export function Header() {
  const { user, loading } = useUser();
  const { userProfile } = useUserProfile();
  const { isAdmin } = useAdmin();
  const auth = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const allNavLinks = [...navLinks];
  if (isAdmin) {
    allNavLinks.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold" prefetch={false}>
          <University className="h-8 w-8 text-primary" />
          <span className="text-lg font-headline">NIT Agartala CEWN</span>
        </Link>
        <nav className="hidden items-center gap-6 text-base font-medium md:flex lg:gap-8">
          {allNavLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "transition-colors hover:text-primary text-lg",
                pathname === href ? "text-primary font-bold" : "text-muted-foreground"
              )}
              prefetch={false}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.photoURL || user.photoURL || undefined} alt={user.displayName || "User"} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        {userProfile?.enrollmentNumber && (
                           <p className="text-xs leading-none text-muted-foreground pt-1">{userProfile.enrollmentNumber}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/nutrition-diary">
                        <BookCopy className="mr-2 h-4 w-4" />
                        <span>Nutrition Diary</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/my-appointments">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        <span>My Appointments</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/update-password">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Set/Update Password</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/reset-password">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Forgot Password</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               <SheetHeader>
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    A list of navigation links for the site.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-6 p-6 pt-0">
                <Link href="/" className="flex items-center gap-2 font-bold" prefetch={false}>
                  <University className="h-8 w-8 text-primary" />
                  <span className="text-lg font-headline">NIT Agartala CEWN</span>
                </Link>
                <nav className="grid gap-4">
                  {allNavLinks.map(({ href, label }) => (
                     <Link
                      key={label}
                      href={href}
                      className={cn(
                        "text-xl font-medium transition-colors hover:text-primary",
                        pathname === href ? "text-primary" : "text-muted-foreground"
                      )}
                      prefetch={false}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
