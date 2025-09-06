"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserContext } from "@/contexts/UserContext";
import { Loader2, Upload, Save, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";

interface UserProfileData {
  displayName: string;
  email: string;
  photoURL?: string;
}

export function UserProfileForm() {
  const { user: firebaseUser } = useAuth();
  const { user: userInfo } = useUserContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    displayName: "",
    email: "",
    photoURL: "",
  });

  useEffect(() => {
    if (firebaseUser && userInfo) {
      setProfileData({
        displayName: userInfo.name || firebaseUser.displayName || "",
        email: userInfo.email || firebaseUser.email || "",
        photoURL: userInfo.image || firebaseUser.photoURL || "",
      });
    }
  }, [firebaseUser, userInfo]);

  const handleSaveProfile = async () => {
    if (!firebaseUser) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: profileData.displayName,
          email: profileData.email,
          photoURL: profileData.photoURL,
        }),
      });

      if (response.ok) {
        // Also update Firebase Auth profile
        await updateProfile(firebaseUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
        });

        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll use a simple file-to-base64 conversion
    // In production, you'd want to upload to Firebase Storage or another service
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileData(prev => ({
        ...prev,
        photoURL: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const getUserInitials = () => {
    const name = profileData.displayName || profileData.email || "User";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <p className="text-gray-600 text-sm">
          Update your display name and profile picture. Your email address cannot be changed here.
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profileData.photoURL || undefined} />
            <AvatarFallback className="text-lg bg-gradient-to-br from-pink-100 to-purple-100 text-pink-700">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <Label htmlFor="photo-upload" className="text-sm font-medium text-gray-700">
              Profile Picture
            </Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="bg-white/50 hover:bg-white/70 border-pink-200 hover:border-pink-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">
              JPG, GIF or PNG. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={profileData.displayName}
              onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Enter your display name"
              className="bg-white/50 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
            <p className="text-xs text-gray-500">
              This is how your name will appear to other users.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Your email address cannot be changed here. Contact support if needed.
            </p>
          </div>
        </div>

        {/* User Info Display */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white rounded-lg">
              <User className="h-5 w-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Account Information</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>User ID: <span className="font-mono text-xs">{firebaseUser?.uid}</span></p>
                <p>Account Created: {firebaseUser?.metadata.creationTime}</p>
                <p>Last Sign In: {firebaseUser?.metadata.lastSignInTime}</p>
                <p>Email Verified: {firebaseUser?.emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleSaveProfile}
            disabled={saving || !profileData.displayName.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}