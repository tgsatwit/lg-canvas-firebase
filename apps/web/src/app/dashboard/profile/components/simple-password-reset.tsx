"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

export function SimplePasswordReset() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email address found for your account",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), user.email);
      toast({
        title: "Success",
        description: "Password reset email sent! Check your inbox.",
      });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-4">
        <Mail className="h-5 w-5 text-pink-600" />
        <h2 className="text-xl font-semibold text-gray-900">Password Reset</h2>
      </div>
      
      <p className="text-gray-600 text-sm mb-6">
        We'll send you a secure link to reset your password via email.
      </p>
      
      <Button
        onClick={handlePasswordReset}
        disabled={loading}
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Password Reset Email
          </>
        )}
      </Button>
    </div>
  );
}