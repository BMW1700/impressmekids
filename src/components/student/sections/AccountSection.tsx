import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCdnUrl, rewriteToCdn } from "@/lib/cdn";
import { mirrorToR2Async } from "@/lib/r2Mirror";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  CreditCard,
  Lock,
  Edit,
  Phone,
  MoreVertical,
  Plus,
  Camera,
  Check,
  X,
  Pill,
  Clock,
  AlertTriangle,
} from "lucide-react";
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
import { MedicationModal } from "../MedicationModal";
import { AllergyModal } from "../AllergyModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface AccountSectionProps {
  userProfile: any;
  studentProfile: any;
}

export const AccountSection = ({ userProfile, studentProfile }: AccountSectionProps) => {
  const { t } = useLanguage();
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

  // Medications state
  const [medications, setMedications] = useState<any[]>([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [showMedicationDeleteConfirm, setShowMedicationDeleteConfirm] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState<string | null>(null);

  // Allergies state
  const [allergies, setAllergies] = useState<any[]>([]);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<any>(null);
  const [showAllergyDeleteConfirm, setShowAllergyDeleteConfirm] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState<string | null>(null);

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
    fetchMedications();
    fetchAllergies();
    initializeUserData();
  }, [studentProfile, userProfile]);

  const initializeUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.user_metadata?.preferred_name) {
      setPreferredName(user.user_metadata.preferred_name);
    } else if (userProfile?.full_name) {
      setPreferredName(userProfile.full_name.split(" ")[0]);
    }

    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    } else if (studentProfile?.avatar_url) {
      setAvatarUrl(studentProfile.avatar_url);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const fetchMedications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("student_medications")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMedications(data || []);
    } catch (error: any) {
      console.error("Error fetching medications:", error);
    }
  };

  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return;

    try {
      const { error } = await supabase
        .from("student_medications")
        .delete()
        .eq("id", medicationToDelete);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Medication deleted successfully",
      });

      fetchMedications();
      setShowMedicationDeleteConfirm(false);
      setMedicationToDelete(null);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAllergies = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("student_allergies")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAllergies(data || []);
    } catch (error: any) {
      console.error("Error fetching allergies:", error);
    }
  };

  const handleDeleteAllergy = async () => {
    if (!allergyToDelete) return;

    try {
      const { error } = await supabase
        .from("student_allergies")
        .delete()
        .eq("id", allergyToDelete);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Allergy deleted successfully",
      });

      fetchAllergies();
      setShowAllergyDeleteConfirm(false);
      setAllergyToDelete(null);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTimeOfDayLabel = (value: string) => {
    const labels: Record<string, string> = {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Night (Before Bed)",
      with_meals: "With Meals",
      as_needed: "As Needed",
    };
    return labels[value] || value;
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", contactToDelete);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("student.account.noneContacts").includes("Aún")
          ? "Contacto de emergencia eliminado"
          : "Emergency contact deleted successfully",
      });

      fetchEmergencyContacts();
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t("common.error"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "Las nuevas contraseñas no coinciden"
            : "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("common.error"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "La contraseña debe tener al menos 6 caracteres"
            : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: t("common.success"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "Contraseña cambiada con éxito"
            : "Password changed successfully",
      });

      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: t("common.error"),
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

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("common.error"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "Por favor selecciona una imagen"
            : "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error"),
        description:
          t("student.account.maxPhotoNote") === "Máx 5MB, JPG o PNG"
            ? "La imagen debe ser menor de 5MB"
            : "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      mirrorToR2Async("avatars", fileName, file.type, file.size);

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const finalUrl = getCdnUrl("avatars", fileName) ?? publicUrl;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: finalUrl },
      });
      if (updateError) throw updateError;

      setAvatarUrl(finalUrl);
      toast({
        title: t("common.success"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "Foto de perfil actualizada"
            : "Profile photo updated successfully",
      });
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast({
        title: t("common.error"),
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSavePreferredName = async () => {
    if (!preferredName.trim()) {
      toast({
        title: t("common.error"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "El nombre preferido no puede estar vacío"
            : "Preferred name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { preferred_name: preferredName.trim() },
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description:
          t("student.account.cancel") === "Cancelar"
            ? "Nombre preferido actualizado"
            : "Preferred name updated successfully",
      });
      setIsEditingPreferredName(false);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPreferredName = () => {
    if (studentProfile?.preferred_name) {
      setPreferredName(studentProfile.preferred_name);
    } else if (userProfile?.full_name) {
      setPreferredName(userProfile.full_name.split(" ")[0]);
    }
    setIsEditingPreferredName(false);
  };

  const displayAvatarUrl = rewriteToCdn(avatarUrl || studentProfile?.avatar_url) || undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground">{t("student.account.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("student.account.profileInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={displayAvatarUrl} />
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
                {isUploadingPhoto ? t("student.account.uploading") : t("student.account.changePhoto")}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">{t("student.account.maxPhotoNote")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("student.account.fullName")}
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.full_name || t("student.common.na")}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("student.account.contactAdminName")}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("student.account.preferredName")}
            </Label>
            {isEditingPreferredName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder={t("student.account.preferredNamePlaceholder")}
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
                    {preferredName || userProfile?.full_name?.split(" ")[0] || t("student.common.na")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingPreferredName(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("student.account.email")}
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">{userProfile?.email || t("student.common.na")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("student.account.studentId")}
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50 font-mono">
              <p className="text-foreground">{userProfile?.student_id || t("student.account.notSet")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("student.account.grade")}
            </Label>
            <div className="p-3 border border-border rounded-lg bg-muted/50">
              <p className="text-foreground">
                {studentProfile?.grade === 0
                  ? t("student.account.kindergarten")
                  : studentProfile?.grade
                    ? t("student.account.gradeNumber").replace("{n}", String(studentProfile.grade))
                    : t("student.account.notSet")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{t("student.account.contactTeacherGrade")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("student.account.emergencyContacts")}</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedContact(null);
              setShowContactModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("student.account.addContact")}
          </Button>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("student.account.noneContacts")}</p>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 relative"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
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
                        {t("student.account.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setContactToDelete(contact.id);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        {t("student.account.delete")}
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
                        {contact.relationship === "Other" ? contact.custom_relationship : contact.relationship}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${contact.phone_number}`} className="text-sm text-primary hover:underline">
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

      {/* Medications Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedMedication(null);
              setShowMedicationModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No medications added yet
            </p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 relative"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMedication(med);
                          setShowMedicationModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t("student.account.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setMedicationToDelete(med.id);
                          setShowMedicationDeleteConfirm(true);
                        }}
                      >
                        {t("student.account.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="space-y-2 pr-8">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{med.medication_name}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">{med.dose}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeOfDayLabel(med.time_of_day)}
                      </span>
                    </div>
                    {med.description && (
                      <p className="text-sm text-muted-foreground">{med.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergies Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Allergies
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setSelectedAllergy(null);
              setShowAllergyModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        </CardHeader>
        <CardContent>
          {allergies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No allergies added yet
            </p>
          ) : (
            <div className="space-y-3">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 relative"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAllergy(allergy);
                          setShowAllergyModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t("student.account.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setAllergyToDelete(allergy.id);
                          setShowAllergyDeleteConfirm(true);
                        }}
                      >
                        {t("student.account.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="space-y-2 pr-8">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{allergy.allergy_name}</p>
                    </div>
                    {allergy.description && (
                      <p className="text-sm text-muted-foreground">{allergy.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("student.account.security")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => setShowPasswordModal(true)}>
            <Lock className="h-4 w-4 mr-2" />
            {t("student.account.changePassword")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("student.account.changePasswordTitle")}</DialogTitle>
            <DialogDescription>{t("student.account.changePasswordDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("student.account.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("student.account.newPasswordPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("student.account.confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("student.account.confirmNewPasswordPlaceholder")}
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
                {t("student.account.cancel")}
              </Button>
              <Button onClick={handlePasswordChange} disabled={isLoading || !newPassword || !confirmPassword}>
                {isLoading ? t("student.account.changing") : t("student.account.changePassword")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmergencyContactModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
        contact={selectedContact}
        onSave={fetchEmergencyContacts}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteContact}
        title={t("student.account.deleteEmergencyContactTitle")}
        description={t("student.account.deleteEmergencyContactDesc")}
      />

      <MedicationModal
        open={showMedicationModal}
        onOpenChange={setShowMedicationModal}
        medication={selectedMedication}
        onSave={fetchMedications}
      />

      <ConfirmModal
        open={showMedicationDeleteConfirm}
        onOpenChange={setShowMedicationDeleteConfirm}
        onConfirm={handleDeleteMedication}
        title="Delete Medication"
        description="Are you sure you want to delete this medication? This action cannot be undone."
      />

      <AllergyModal
        isOpen={showAllergyModal}
        onClose={() => setShowAllergyModal(false)}
        allergy={selectedAllergy}
        onSuccess={fetchAllergies}
      />

      <ConfirmModal
        open={showAllergyDeleteConfirm}
        onOpenChange={setShowAllergyDeleteConfirm}
        onConfirm={handleDeleteAllergy}
        title="Delete Allergy"
        description="Are you sure you want to delete this allergy? This action cannot be undone."
      />
    </div>
  );
};
