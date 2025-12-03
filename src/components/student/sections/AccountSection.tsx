import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Mail, CreditCard, Lock, Edit, Phone, MoreVertical, Plus, Camera, Check, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmergencyContactModal } from "../EmergencyContactModal";
import { ConfirmModal } from "@/components/ConfirmModal";

interface AccountSectionProps {
  userProfile: any;
  studentProfile: any;
}

export const AccountSection = ({ userProfile, studentProfile }: AccountSectionProps) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  
  // Edit states
  const [isEditingPreferredName, setIsEditingPreferredName] = useState(false);
  const [preferredName, setPreferredName] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  useEffect(() => {
    fetchEmergencyContacts();
    initializeUserData();
  }, [studentProfile, userProfile]);

  const initializeUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Initialize preferred name from auth metadata or profile
    if (user?.user_metadata?.preferred_name) {
      setPreferredName(user.user_metadata.preferred_name);
    } else if (userProfile?.full_name) {
      setPreferredName(userProfile.full_name.split(" ")[0]);
    }
    
    // Initialize avatar from auth metadata or profile
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    } else if (studentProfile?.avatar_url) {
      setAvatarUrl(studentProfile.avatar_url);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setEmergencyContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching emergency contacts:", error);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", contactToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      });

      fetchEmergencyContacts();
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSavePreferredName = async () => {
    if (!preferredName.trim()) {
      toast({
        title: "Error",
        description: "Preferred name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { preferred_name: preferredName.trim() }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferred name updated successfully",
      });
      setIsEditingPreferredName(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPreferredName = () => {
    // Reset to original value
    if (studentProfile?.preferred_name) {
      setPreferredName(studentProfile.preferred_name);
    } else if (userProfile?.full_name) {
      setPreferredName(userProfile.full_name.split(" ")[0]);
    }
    setIsEditingPreferredName(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || studentProfile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {getInitials(userProfile?.full_name || "")}
                </AvatarFallback>
              </Avatar>
              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isUploadingPhoto ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB, JPG or PNG
              </p>
            </div>
          </div>

          {/* Full Name - Read Only */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.full_name || "N/A"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact your school administrator to change your legal name
            </p>
          </div>

          {/* Preferred Name - Editable */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Preferred Name
            </Label>
            {isEditingPreferredName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Enter preferred name"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSavePreferredName}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancelPreferredName}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-3 border border-border rounded-lg bg-muted/50 flex-1">
                  <p className="text-foreground">
                    {preferredName || userProfile?.full_name?.split(" ")[0] || "N/A"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingPreferredName(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.email || "N/A"}</p>
            </div>
          </div>

          {/* Student ID - Read Only */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Student ID
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50 font-mono">
              <p className="text-foreground">{userProfile?.id || "N/A"}</p>
            </div>
          </div>

          {/* Grade - Read Only */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Grade
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">
                {studentProfile?.grade === 0 
                  ? "Kindergarten" 
                  : studentProfile?.grade 
                    ? `Grade ${studentProfile.grade}`
                    : "Not Set"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact your teacher to update your grade level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Emergency Contacts</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedContact(null);
              setShowContactModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No emergency contacts added yet
            </p>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 relative"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowContactModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setContactToDelete(contact.id);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="space-y-2 pr-8">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{contact.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {contact.relationship === "Other"
                          ? contact.custom_relationship
                          : contact.relationship}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contact.phone_number}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {contact.phone_number}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowPasswordModal(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Make sure it's at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Modal */}
      <EmergencyContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        contact={selectedContact}
        onSave={fetchEmergencyContacts}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteContact}
        title="Delete Emergency Contact"
        description="Are you sure you want to delete this emergency contact? This action cannot be undone."
      />
    </div>
  );
};
