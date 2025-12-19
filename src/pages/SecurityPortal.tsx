import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  Users, 
  FileText, 
  CheckCircle2, 
  Server, 
  Database,
  Key,
  AlertTriangle,
  Bell,
  Smartphone
} from "lucide-react";

export default function SecurityPortal() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Student Safety Verification & Reunification System",
      description: "Real-time drill monitoring with student check-in, escalation protocols, and parent notifications for complete accountability during emergencies.",
      color: "icon-circle-purple"
    },
    {
      icon: Lock,
      title: "Immutable Audit Logs",
      description: "All safety-critical events are cryptographically hashed and stored in tamper-proof logs that cannot be modified or deleted.",
      color: "icon-circle-blue"
    },
    {
      icon: Database,
      title: "Row-Level Security (RLS)",
      description: "Every database table enforces access controls at the row level, ensuring users can only access data they're authorized to see.",
      color: "icon-circle-green"
    },
    {
      icon: Key,
      title: "Role-Based Access Control",
      description: "Strict RBAC implementation with server-side validation prevents privilege escalation and unauthorized access.",
      color: "icon-circle-orange"
    },
    {
      icon: Eye,
      title: "Parental Consent Verification",
      description: "Voice recordings and sensitive data require verified parental consent before teachers can access them.",
      color: "icon-circle-gold"
    },
    {
      icon: Bell,
      title: "Real-Time Notifications",
      description: "Push notifications and email alerts keep parents and staff informed during drills and emergencies.",
      color: "icon-circle-red"
    }
  ];

  const complianceItems = [
    {
      name: "FERPA",
      fullName: "Family Educational Rights and Privacy Act",
      status: "Compliant",
      description: "Student education records are protected with strict access controls and audit logging."
    },
    {
      name: "COPPA",
      fullName: "Children's Online Privacy Protection Act",
      status: "Compliant",
      description: "Parental consent is required and verified before collecting data from children under 13."
    }
  ];

  const architectureItems = [
    {
      icon: Server,
      title: "Encrypted Data at Rest",
      description: "All data is encrypted using AES-256 encryption at the database level."
    },
    {
      icon: Lock,
      title: "Encrypted Data in Transit",
      description: "TLS 1.3 encryption for all data transmitted between clients and servers."
    },
    {
      icon: Shield,
      title: "CDN Protection",
      description: "Cloudflare provides SSL/TLS, DDoS protection, and edge caching."
    },
    {
      icon: Database,
      title: "Automated Backups",
      description: "Continuous database backups with point-in-time recovery capability."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Security & Compliance
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Impress Me Kids is built with security-first architecture to protect student data, 
            ensure regulatory compliance, and maintain a safe learning environment.
          </p>
        </div>

        {/* Security Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Security Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature) => (
              <Card key={feature.title} className="glass-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`icon-circle ${feature.color} mb-4`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Compliance Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Regulatory Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {complianceItems.map((item) => (
              <Card key={item.name} className="border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <Badge className="bg-green-500 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.fullName}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Security Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {architectureItems.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-6 rounded-xl border bg-card"
              >
                <div className="icon-circle icon-circle-sm icon-circle-purple flex-shrink-0">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SSVRS Highlight */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Student Safety Verification & Reunification System
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Our proprietary SSVRS provides complete accountability during emergency drills and real incidents. 
                    Features include QR-based student check-in, real-time attendance tracking, automated escalation 
                    protocols, and parent notification systems.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary" className="gap-1">
                      <Smartphone className="h-3 w-3" />
                      QR Check-In
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Escalation Protocols
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Bell className="h-3 w-3" />
                      Parent Notifications
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Immutable Logs
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Access Control Matrix */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Access Control Matrix
          </h2>
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Data Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Student</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Teacher</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Parent</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Own Profile", student: true, teacher: true, parent: true, admin: true },
                    { type: "Own Assignments", student: true, teacher: true, parent: "View", admin: true },
                    { type: "Classroom Students", student: false, teacher: true, parent: false, admin: true },
                    { type: "Voice Recordings", student: "Own", teacher: "w/ Consent", parent: "Child's", admin: false },
                    { type: "Grade Data", student: "Own", teacher: true, parent: "Child's", admin: true },
                    { type: "Drill Attendance", student: "Own", teacher: true, parent: "Child's", admin: true },
                    { type: "Audit Logs", student: false, teacher: false, parent: false, admin: true },
                  ].map((row) => (
                    <tr key={row.type} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium text-foreground">{row.type}</td>
                      <td className="text-center py-3 px-4">
                        {row.student === true ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.student === false ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{row.student}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.teacher === true ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.teacher === false ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{row.teacher}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.parent === true ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.parent === false ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{row.parent}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {row.admin === true ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.admin === false ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{row.admin}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-xl font-bold text-foreground mb-2">Security Questions?</h3>
              <p className="text-muted-foreground mb-4">
                For security inquiries, compliance documentation, or to report a security concern, 
                please contact our security team.
              </p>
              <p className="text-primary font-medium">security@impressmekids.com</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
