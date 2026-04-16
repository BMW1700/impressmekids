import { supabase } from "@/integrations/supabase/client";
import { STUDENT_INTERNAL_DOMAIN } from "@/lib/studentIdAuth";

export interface DistrictMatch {
  districtCode: string | null;
  districtName: string | null;
  suggestedRole: 'teacher' | 'student' | 'parent';
  requiresRoleSelection: boolean;
  availableRoles: ('teacher' | 'student' | 'parent')[]; // NEVER includes 'district_manager' - hidden role
}

export async function detectUserTypeFromEmail(email: string): Promise<DistrictMatch> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return {
      districtCode: null,
      districtName: null,
      suggestedRole: 'student',
      requiresRoleSelection: true,
      availableRoles: ['student', 'parent'],
    };
  }

  // Skip domain detection for synthetic student emails
  if (domain === STUDENT_INTERNAL_DOMAIN) {
    return {
      districtCode: null,
      districtName: null,
      suggestedRole: 'student',
      requiresRoleSelection: false,
      availableRoles: ['student'],
    };
  }
  
  // Query districts table for matching email domain
  const { data: districts } = await supabase
    .from('districts')
    .select('district_code, name, email_domains')
    .contains('email_domains', [domain]);
  
  if (districts && districts.length > 0) {
    // User email matches a registered district - they can be teacher OR student
    // Teacher accounts will require district code verification during signup
    return {
      districtCode: districts[0].district_code,
      districtName: districts[0].name,
      suggestedRole: 'student',
      requiresRoleSelection: true,
      availableRoles: ['teacher', 'student'],
    };
  }
  
  // Email doesn't match any district → offer only student/parent (no teacher option)
  return {
    districtCode: null,
    districtName: null,
    suggestedRole: 'student',
    requiresRoleSelection: true,
    availableRoles: ['student', 'parent'],
  };
}
