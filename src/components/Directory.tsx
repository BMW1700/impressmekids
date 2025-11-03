import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mail, User, Shield } from "lucide-react";
import { useDirectoryTeachers, useDirectoryAdmins } from "@/hooks/useDirectory";

export const Directory = () => {
  const { data: teachers, isLoading: teachersLoading } = useDirectoryTeachers();
  const { data: admins, isLoading: adminsLoading } = useDirectoryAdmins();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Directory</CardTitle>
        <CardDescription>Contact information for teachers and administrators</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="teachers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <ScrollArea className="h-[400px] pr-4">
              {teachersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : teachers && teachers.length > 0 ? (
                <div className="space-y-4">
                  {teachers.map((teacher) => (
                    <Card key={teacher.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-primary/10 p-3">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{teacher.full_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a 
                                href={`mailto:${teacher.email}`}
                                className="hover:text-primary transition-colors"
                              >
                                {teacher.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No teachers found
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="admins">
            <ScrollArea className="h-[400px] pr-4">
              {adminsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : admins && admins.length > 0 ? (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <Card key={admin.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-primary/10 p-3">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-lg">{admin.full_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a 
                                href={`mailto:${admin.email}`}
                                className="hover:text-primary transition-colors"
                              >
                                {admin.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No administrators found
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
