import { supabase } from "@/integrations/supabase/client";

export interface DistrictMatch {
  districtId: string | null;
  districtName: string | null;
  suggestedRole: 'teacher' | 'student' | 'parent';
  requiresRoleSelection: boolean;
  availableRoles: ('teacher' | 'student' | 'parent')[]; // NEVER includes 'district_manager' - hidden role
}

export async function detectUserTypeFromEmail(email: string): Promise<DistrictMatch> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return {
      districtId: null,
      districtName: null,
      suggestedRole: 'student',
      requiresRoleSelection: true,
      availableRoles: ['student', 'parent'],
    };
  }
  
  // Query districts table for matching email domain
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name, email_domains')
    .contains('email_domains', [domain]);
  
  if (districts && districts.length > 0) {
    // User email matches a registered district - they can be teacher OR student
    // Teacher accounts will require district code verification during signup
    return {
      districtId: districts[0].id,
      districtName: districts[0].name,
      suggestedRole: 'student',
      requiresRoleSelection: true,
      availableRoles: ['teacher', 'student'],
    };
  }
  
  // Email doesn't match any district → offer only student/parent (no teacher option)
  return {
    districtId: null,
    districtName: null,
    suggestedRole: 'student',
    requiresRoleSelection: true,
    availableRoles: ['student', 'parent'],
  };
}
