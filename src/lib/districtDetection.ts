import { supabase } from "@/integrations/supabase/client";

export interface DistrictMatch {
  districtId: string | null;
  districtName: string | null;
  suggestedRole: 'teacher' | 'student' | 'parent';
  requiresRoleSelection: boolean;
  availableRoles: ('teacher' | 'student' | 'parent')[];
}

export async function detectUserTypeFromEmail(email: string): Promise<DistrictMatch> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return {
      districtId: null,
      districtName: null,
      suggestedRole: 'parent',
      requiresRoleSelection: true,
      availableRoles: ['student', 'parent', 'teacher'],
    };
  }
  
  // Query districts table for matching email domain
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name, email_domains')
    .contains('email_domains', [domain]);
  
  if (districts && districts.length > 0) {
    // User email matches a registered district - offer teacher/student
    return {
      districtId: districts[0].id,
      districtName: districts[0].name,
      suggestedRole: 'teacher',
      requiresRoleSelection: true,
      availableRoles: ['teacher', 'student'],
    };
  }
  
  // Email doesn't match any district → offer student/parent/teacher
  return {
    districtId: null,
    districtName: null,
    suggestedRole: 'student',
    requiresRoleSelection: true,
    availableRoles: ['student', 'parent', 'teacher'],
  };
}
