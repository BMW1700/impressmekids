import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GradeWeights {
  test: number;
  quiz: number;
  homework: number;
  attendance: number;
  behavior: number;
}

export interface ClassroomSyllabus {
  id: string;
  classroom_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_posted: boolean;
  grade_weights: GradeWeights;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const useClassroomSyllabus = (classroomId: string | undefined) => {
  return useQuery({
    queryKey: ["classroom-syllabus", classroomId],
    queryFn: async () => {
      if (!classroomId) throw new Error("Classroom ID required");

      const { data, error } = await supabase
        .from("classroom_syllabus")
        .select("*")
        .eq("classroom_id", classroomId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        grade_weights: data.grade_weights as unknown as GradeWeights,
      };
    },
    enabled: !!classroomId,
  });
};

export const useSignedSyllabusUrl = (filePath: string | null) => {
  return useQuery({
    queryKey: ["signed-syllabus-url", filePath],
    queryFn: async () => {
      if (!filePath) return null;
      
      const { data, error } = await supabase.storage
        .from("classroom-syllabus")
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 3000 * 1000, // Consider stale after 50 minutes
    refetchInterval: 3000 * 1000, // Refresh every 50 minutes
  });
};

export const useUploadSyllabus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      file,
    }: {
      classroomId: string;
      file: File;
    }) => {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only PDF and Word documents are allowed");
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if syllabus already exists
      const { data: existingSyllabus } = await supabase
        .from("classroom_syllabus")
        .select("file_url")
        .eq("classroom_id", classroomId)
        .maybeSingle();

      // Delete old file if exists
      if (existingSyllabus?.file_url) {
        const oldPath = existingSyllabus.file_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("classroom-syllabus")
            .remove([`${classroomId}/${oldPath}`]);
        }
      }

      // Upload new file
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${classroomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("classroom-syllabus")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("classroom-syllabus")
        .getPublicUrl(filePath);

      // Insert or update database record
      const { data, error } = await supabase
        .from("classroom_syllabus")
        .upsert({
          classroom_id: classroomId,
          file_url: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        grade_weights: data.grade_weights as unknown as GradeWeights,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-syllabus", variables.classroomId],
      });
      toast.success("Syllabus uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload syllabus");
    },
  });
};

export const useUpdateGradeWeights = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      weights,
    }: {
      classroomId: string;
      weights: GradeWeights;
    }) => {
      // Validate weights sum to 100
      const total = weights.test + weights.quiz + weights.homework + weights.attendance + weights.behavior;
      if (total !== 100) {
        throw new Error(`Grade weights must sum to 100% (currently: ${total}%)`);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use upsert to create or update the record
      const { data, error } = await supabase
        .from("classroom_syllabus")
        .upsert({
          classroom_id: classroomId,
          grade_weights: weights as any,
          updated_at: new Date().toISOString(),
          uploaded_by: user.id,
          // Default values for required fields if creating new record
          file_url: '',
          file_name: '',
          file_size: 0,
          mime_type: '',
          is_posted: false,
        }, {
          onConflict: 'classroom_id',
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        grade_weights: data.grade_weights as unknown as GradeWeights,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-syllabus", variables.classroomId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-gradebook"],
      });
      toast.success("Grade weights updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update grade weights");
    },
  });
};

export const useToggleSyllabusPublish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classroomId,
      isPosted,
    }: {
      classroomId: string;
      isPosted: boolean;
    }) => {
      const { data, error } = await supabase
        .from("classroom_syllabus")
        .update({
          is_posted: isPosted,
          updated_at: new Date().toISOString(),
        })
        .eq("classroom_id", classroomId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        grade_weights: data.grade_weights as unknown as GradeWeights,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-syllabus", variables.classroomId],
      });
      toast.success(
        variables.isPosted
          ? "Syllabus published successfully"
          : "Syllabus unpublished"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update syllabus status");
    },
  });
};

export const useDeleteSyllabus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classroomId: string) => {
      // Get current syllabus to find file path
      const { data: syllabus } = await supabase
        .from("classroom_syllabus")
        .select("file_url")
        .eq("classroom_id", classroomId)
        .single();

      if (syllabus?.file_url) {
        // Delete file from storage
        await supabase.storage
          .from("classroom-syllabus")
          .remove([syllabus.file_url]);
      }

      // Delete database record
      const { error } = await supabase
        .from("classroom_syllabus")
        .delete()
        .eq("classroom_id", classroomId);

      if (error) throw error;
    },
    onSuccess: (_, classroomId) => {
      queryClient.invalidateQueries({
        queryKey: ["classroom-syllabus", classroomId],
      });
      toast.success("Syllabus deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete syllabus");
    },
  });
};

export const useDownloadSyllabus = () => {
  return useMutation({
    mutationFn: async ({
      filePath,
      fileName,
    }: {
      filePath: string;
      fileName: string;
    }) => {
      const { data, error } = await supabase.storage
        .from("classroom-syllabus")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Syllabus downloaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download syllabus");
    },
  });
};
