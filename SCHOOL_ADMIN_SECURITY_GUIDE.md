# NabuLearn - School Administrator Security Guide

**For**: School Administrators, IT Directors, District Technology Coordinators  
**Purpose**: Non-technical security overview for school decision-makers  
**Last Updated**: 2025-10-20

---

## Executive Summary

NabuLearn is an **enterprise-grade educational platform** designed with student privacy and data security as the foundation. This platform meets or exceeds all federal regulations (FERPA, COPPA) and implements security controls comparable to major enterprise education platforms like Google Classroom and Canvas LMS.

**Key Security Highlights**:
- ✅ FERPA compliant student data protection
- ✅ COPPA compliant parental consent system
- ✅ Full audit logging for compliance reviews
- ✅ Role-based access control (teachers can't see other teachers' students)
- ✅ Explicit parental consent required for voice recordings

---

## For School Board Members & Superintendents

### "Is this platform safe for our students?"

**Yes.** NabuLearn implements the same security standards used by Fortune 500 companies and major education platforms. Here's what that means:

1. **Student data is locked down**: Only teachers assigned to a student's classroom can access their data
2. **Parents have control**: Parents must explicitly approve voice recording features
3. **We track everything**: Complete audit trail of who accessed what data and when
4. **No data leaks**: Students cannot see each other's grades, recordings, or work
5. **No email harvesting**: User email addresses are protected from unauthorized access

### Comparison to Platforms You Know

| Feature | Google Classroom | Canvas LMS | **NabuLearn** |
|---------|------------------|------------|---------------------|
| FERPA Compliance | ✅ Yes | ✅ Yes | ✅ Yes |
| COPPA Compliance | ✅ Yes | ✅ Yes | ✅ Yes |
| Audit Logging | ⚠️ Limited | ✅ Full | ✅ **Full + Detailed** |
| Parental Consent | ⚠️ Basic | ⚠️ Basic | ✅ **Explicit + Granular** |
| Voice Recording Analysis | ❌ No | ❌ No | ✅ **Yes (with consent)** |

---

## For IT Directors & Technology Coordinators

### Security Architecture Overview

**Authentication**: Industry-standard authentication with email verification  
**Authorization**: Role-based access control enforced server-side  
**Data Protection**: Row-Level Security (RLS) on all database tables  
**Audit Trail**: Full logging of sensitive data access  
**Encryption**: Data encrypted in transit (TLS) and at rest  

### Data Access Rules

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Student** | Own assignments, grades, recordings | Other students' data, teacher notes (private) |
| **Teacher** | Their classroom students only | Students in other classrooms |
| **Parent** | Their linked child's data (with approval) | Other students' data, teacher notes (private) |
| **District Admin** | Aggregate analytics (no PII) | Individual student PII without proper role |

### Security Measures Implemented

1. **Prevent Privilege Escalation**
   - Roles stored in separate `user_roles` table (not in user profile)
   - Server-side role verification prevents client-side manipulation
   - Security definer functions prevent RLS recursion attacks

2. **Prevent Data Breaches**
   - Anonymous users explicitly denied access to all PII tables
   - Each data access checks classroom relationships
   - Audit logging tracks all sensitive data access

3. **Prevent Unauthorized Access**
   - Teachers cannot access students outside their classrooms
   - Parents must be approved by teachers before linking
   - Voice recordings require explicit parental consent

4. **Compliance & Audit Trail**
   - All sensitive data access is logged with timestamps
   - Audit logs include: user ID, email, role, action, table, record ID
   - Logs are indexed for fast compliance queries
   - Only district admins can view audit logs

### Technical Security Features

```
✅ Row-Level Security (RLS) on all tables
✅ Security Definer functions (prevent recursion)
✅ Explicit anonymous denial policies
✅ Server-side role verification
✅ Audit logging with triggers
✅ Indexed audit queries
✅ Encrypted data at rest and in transit
✅ Password strength requirements
✅ Email verification required
✅ Session management with automatic expiration
```

---

## For Curriculum Directors & Principals

### "What data does this platform collect?"

**Student Academic Data**:
- Assignment submissions and grades
- Reading comprehension responses
- Voice recordings (with parental consent only)
- Highlighted text and annotations
- Performance analytics (accuracy, speed, improvement)

**What We DON'T Collect**:
- Social Security Numbers
- Home addresses (unless voluntarily provided)
- Financial information
- Medical information
- Biometric data (voice is for assessment, not identification)

### Parent Consent System

**How It Works**:
1. Parent creates account and requests link to student
2. Teacher approves parent-student link
3. Parent sees consent form for voice recording features
4. Teacher can ONLY access voice recordings if consent granted
5. Parent can revoke consent at any time

**What Parents Control**:
- ✅ Voice recording consent (opt-in required)
- ✅ Assignment data sharing (automatic for grading)
- ✅ Third-party data sharing (opt-in required)

**What Parents See**:
- ✅ Their child's grades (after teacher releases them)
- ✅ Their child's assignments
- ✅ Their child's AURA voice feedback (if consented)
- ❌ Other students' data (never)
- ❌ Private teacher notes (unless teacher shares)

---

## Regulatory Compliance

### FERPA (Family Educational Rights and Privacy Act)

**How We Comply**:
- ✅ Student data only accessible to authorized school officials
- ✅ Parents can request access to their child's records
- ✅ Audit trail of who accessed student records
- ✅ Directory information protected by default
- ✅ Data not shared with third parties without consent

**What This Means**:
- Teachers cannot access students they don't teach
- Parents must be approved before seeing student data
- Complete record of data access for audits
- Students cannot see each other's grades or work

### COPPA (Children's Online Privacy Protection Act)

**How We Comply**:
- ✅ Explicit parental consent for voice recordings
- ✅ No collection of unnecessary personal information
- ✅ Parents can review and delete data
- ✅ Clear privacy policy in plain language
- ✅ Data minimization (only collect what's needed)

**What This Means**:
- Parents control whether voice features are used
- No marketing data collected from minors
- Parents can request data deletion at any time
- Privacy policy is written for parents (not lawyers)

---

## Security Questions Schools Ask

### "Can teachers see students from other classrooms?"
**No.** Teachers can only access students in their assigned classrooms. RLS policies enforce this at the database level.

### "What if a teacher's account is hacked?"
The hacker would only access that teacher's assigned classrooms (not the whole school). Audit logs would reveal the breach. We recommend enabling 2FA for teacher accounts.

### "Can students see each other's grades?"
**No.** Students can only see their own submissions and grades. RLS policies prevent access to other students' data.

### "How do we audit who accessed student data?"
The `security_audit_log` table tracks every access to sensitive data: user, timestamp, action, table, and record ID. Only admins can query these logs.

### "What happens to voice recordings if parents don't consent?"
Teachers cannot access them. The system enforces consent verification before allowing teacher access to AURA recordings.

### "Can parents revoke consent after granting it?"
Yes. Parents can update consent settings at any time. Teacher access is immediately revoked.

### "Does this platform sell student data?"
**No.** Student data is never sold or shared with third parties for marketing purposes. This is a FERPA violation we would never commit.

### "How does this compare to Google Classroom?"
We have stronger audit logging and explicit parental consent management. Google Classroom has limited audit capabilities and basic consent.

### "What if we want to export student data?"
District admins can export aggregate analytics (no PII). Individual student data exports require proper authorization following FERPA guidelines.

---

## Incident Response Plan

### If You Suspect a Security Breach

1. **Immediately contact support**: [support@nabulearn.com]
2. **Document the incident**: Date, time, what data may be affected
3. **Review audit logs**: Check `security_audit_log` for suspicious access
4. **Notify affected parties**: We'll help determine FERPA notification requirements
5. **Reset credentials**: Change passwords for affected accounts

### What We Do If We Detect a Breach

1. **Immediate containment**: Block affected accounts
2. **Forensic investigation**: Review audit logs to determine scope
3. **Notification within 24 hours**: Alert school administrators
4. **Remediation**: Fix vulnerability, restore secure access
5. **Post-incident review**: Document lessons learned

---

## Getting Started Securely

### Before Launching

1. ✅ **Enable leaked password protection** (backend configuration)
2. ✅ **Test parent consent flow** (create test parent, request access)
3. ✅ **Review audit logs** (verify logging works)
4. ✅ **Train teachers** (explain parent consent requirements)
5. ✅ **Communicate with parents** (send consent form information)

### Initial Setup Best Practices

1. **Start small**: Pilot with 1-2 classrooms before full rollout
2. **Train staff**: Teachers must understand consent requirements
3. **Communicate with parents**: Send clear information about features
4. **Review audit logs weekly**: Monitor for unusual activity
5. **Establish support process**: Who do teachers contact with questions?

### Recommended Policies

**Teacher Accounts**:
- ✅ Use school email addresses only
- ✅ Enable 2FA for all teacher accounts
- ✅ Review classroom rosters monthly
- ✅ Remove teachers who change roles immediately

**Student Accounts**:
- ✅ Use school email addresses or parent email
- ✅ Require email verification
- ✅ Review enrollments each semester
- ✅ Archive graduated students annually

**Parent Accounts**:
- ✅ Verify parent identity before approval
- ✅ Review consent status quarterly
- ✅ Send annual reminder about consent options

---

## Annual Security Review Checklist

### For School Administrators (Annually)

- [ ] Review audit logs for unusual access patterns
- [ ] Verify all teachers have only their assigned classrooms
- [ ] Confirm parent consent records are up to date
- [ ] Review and update data retention policies
- [ ] Check for inactive accounts that should be removed
- [ ] Verify backup and disaster recovery procedures
- [ ] Update privacy policy if features changed
- [ ] Train new staff on security procedures

### For IT Directors (Annually)

- [ ] Review RLS policies for any changes
- [ ] Audit user roles and permissions
- [ ] Check audit log storage capacity
- [ ] Verify leaked password protection is enabled
- [ ] Test incident response procedures
- [ ] Review authentication security settings
- [ ] Check for any Supabase security updates
- [ ] Validate encryption is working correctly

---

## Support & Resources

### Documentation
- **Full Security Overview**: `SECURITY_OVERVIEW.md`
- **Phase 1 Technical Fixes**: `PHASE_1_COMPLETE.md`
- **Phase 2 Technical Fixes**: `PHASE_2_SECURITY_COMPLETE.md`

### Contact
- **Email**: support@nabulearn.com
- **Phone**: [Your phone number]
- **Website**: [Your website]

### Training Resources
- Teacher Training Guide: [Coming soon]
- Parent Information Sheet: [Coming soon]
- Student Privacy Policy: [Plain language version coming soon]

---

## Certification & Compliance Documents

**Available Upon Request**:
- FERPA Compliance Statement
- COPPA Compliance Statement
- Data Processing Agreement (DPA)
- Security Whitepaper (technical details)
- Third-Party Security Audit Reports (when available)

**For RFP Submissions**:
We can provide detailed security documentation, audit logs, and compliance certifications for school district RFP submissions.

---

## Final Word

**NabuLearn takes student privacy seriously.** We built this platform with security-first principles, implementing the same controls used by Fortune 500 companies and major education platforms.

Your students' data is protected by:
- Enterprise-grade authentication and authorization
- FERPA and COPPA compliant data handling
- Full audit logging for transparency
- Explicit parental consent management
- Row-level security on all database tables

**Questions?** Contact our team. We're here to help your school make an informed decision.

---

**Built with ❤️ for student privacy and educational excellence**
