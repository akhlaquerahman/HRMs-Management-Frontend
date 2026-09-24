import React from 'react';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserProfileCardProps {
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  profilePic: string;
  isUploadingPic: boolean;
  onProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UserProfileCard({
  firstName,
  lastName,
  email,
  roleName,
  profilePic,
  isUploadingPic,
  onProfilePicChange
}: UserProfileCardProps) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-xl bg-card p-5 flex flex-col items-center text-center shadow-sm relative overflow-hidden h-full">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10" />

      <div 
        className="relative group cursor-pointer mt-2" 
        onClick={() => document.getElementById('profilePicInput')?.click()}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-md bg-muted flex items-center justify-center transition-transform group-hover:scale-105">
          {isUploadingPic ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : profilePic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-full h-full text-muted-foreground/30 p-1.5" />
          )}
        </div>

        {!isUploadingPic && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <Camera className="text-white w-6 h-6" />
          </div>
        )}
      </div>

      <input 
        type="file" 
        id="profilePicInput" 
        className="hidden" 
        accept="image/*"
        onChange={onProfilePicChange}
      />
      
      <div className="mt-4 space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {firstName} {lastName}
        </h2>
        <p className="text-sm text-muted-foreground font-medium">{email}</p>
      </div>

      <div className="mt-4 inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm border border-primary/20">
        {roleName || t("EMPLOYEE")}
      </div>
    </div>
  );
}
