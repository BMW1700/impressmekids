import { supabase } from "@/integrations/supabase/client";

export interface DistrictMatch {
  districtId: string | null;
  districtName: string | null;
  suggestedRole: 'teacher' | 'student' | 'parent';
  requiresRoleSelection: boolean;
}

export async function detectUserTypeFromEmail(email: string): Promise<DistrictMatch> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return {
      districtId: null,
      districtName: null,
      suggestedRole: 'parent',
      requiresRoleSelection: false,
    };
  }
  
  // Query districts table for matching email domain
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name, email_domains')
    .contains('email_domains', [domain]);
  
  if (districts && districts.length > 0) {
    // User email matches a registered district - needs to choose role
    return {
      districtId: districts[0].id,
      districtName: districts[0].name,
      suggestedRole: 'teacher',
      requiresRoleSelection: true,
    };
  }
  
  // Email doesn't match any district → must be a parent
  return {
    districtId: null,
    districtName: null,
    suggestedRole: 'parent',
    requiresRoleSelection: false,
  };
}
