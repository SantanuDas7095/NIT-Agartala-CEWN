
'use client';

import { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User as UserIcon, BookUser, School, Building, Calendar, Pen, Briefcase, Phone } from 'lucide-react';

interface ProfileCardProps {
  user: User | null;
  userProfile: UserProfile | null;
  onEdit: () => void;
  isAdmin: boolean;
}

const ProfileInfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => (
  <div className="flex items-center gap-4">
    <div className="flex-shrink-0 text-primary">{icon}</div>
    <div className="flex-grow">
      <p className="font-bold text-lg">{value || 'Not set'}</p>
      <p className="text-sm text-muted-foreground -mt-1">{label}</p>
    </div>
  </div>
);


export default function ProfileCard({ user, userProfile, onEdit, isAdmin }: ProfileCardProps) {
  if (!user) return null;

  const displayName = userProfile?.displayName || user.displayName;
  const photoURL = userProfile?.photoURL || user.photoURL;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center">
        <Avatar className="h-32 w-32 border-4 border-primary">
          <AvatarImage src={photoURL || undefined} alt={displayName || 'User'} />
          <AvatarFallback className="text-4xl">
            {displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
            <ProfileInfoRow icon={<UserIcon />} label="Name" value={displayName} />
            <ProfileInfoRow icon={<Phone />} label="Phone Number" value={userProfile?.phoneNumber || user.phoneNumber} />
            {isAdmin ? (
                <>
                    <ProfileInfoRow icon={<Briefcase />} label="Employee ID" value={userProfile?.enrollmentNumber} />
                    <ProfileInfoRow icon={<Building />} label="Department" value={userProfile?.department} />
                </>
            ) : (
                <>
                    <ProfileInfoRow icon={<BookUser />} label="Enrollment No." value={userProfile?.enrollmentNumber} />
                    <ProfileInfoRow icon={<School />} label="Hostel" value={userProfile?.hostel} />
                    <ProfileInfoRow icon={<Building />} label="Department" value={userProfile?.department} />
                    <ProfileInfoRow icon={<Calendar />} label="Year" value={userProfile?.year ? `${userProfile.year}${getOrdinal(userProfile.year)} Year` : 'Not set'} />
                </>
            )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button size="lg" onClick={onEdit}>
          <Pen className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
}

function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
