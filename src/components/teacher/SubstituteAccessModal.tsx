import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSubstituteAccess, SubstituteAccessLink } from "@/hooks/useSubstituteAccess";
import { 
  UserPlus, 
  Copy, 
  Clock, 
  Shield, 
  XCircle, 
  CheckCircle2,
  Users,
  ClipboardList,
  BookOpen,
  Megaphone,
  Link2
} from "lucide-react";
import { format, addHours, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface SubstituteAccessModalProps {
  classroomId: string;
  classroomName: string;
}

export function SubstituteAccessModal({ classroomId, classroomName }: SubstituteAccessModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'list' | 'create'>('list');
  const [copied, setCopied] = useState(false);
  const [newLinkCode, setNewLinkCode] = useState<string | null>(null);

  // Form state
  const [substituteName, setSubstituteName] = useState('');
  const [substituteEmail, setSubstituteEmail] = useState('');
  const [accessDuration, setAccessDuration] = useState<'half_day' | 'full_day' | 'custom'>('full_day');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [permissions, setPermissions] = useState({
    view_students: true,
    take_attendance: true,
    view_assignments: true,
    post_announcements: false,
  });

  const { activeLinks, expiredLinks, createLink, isCreating, revokeLink, isRevoking } = useSubstituteAccess(classroomId);

  const handleCreate = () => {
    const now = new Date();
    let endDate: Date;

    switch (accessDuration) {
      case 'half_day':
        endDate = addHours(now, 4);
        break;
      case 'full_day':
        endDate = addHours(now, 8);
        break;
      case 'custom':
        endDate = new Date(`${customEndDate}T${customEndTime || '17:00'}`);
        break;
      default:
        endDate = addHours(now, 8);
    }

    createLink({
      substituteName: substituteName || undefined,
      substituteEmail: substituteEmail || undefined,
      accessStart: now,
      accessEnd: endDate,
      permissions,
    }, {
      onSuccess: (data) => {
        setNewLinkCode((data as SubstituteAccessLink).access_code);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setSubstituteName('');
    setSubstituteEmail('');
    setAccessDuration('full_day');
    setCustomEndDate('');
    setCustomEndTime('');
    setPermissions({
      view_students: true,
      take_attendance: true,
      view_assignments: true,
      post_announcements: false,
    });
    setStep('list');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setStep('list');
        setNewLinkCode(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Share with Sub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Substitute Teacher Access
          </DialogTitle>
          <DialogDescription>
            Give temporary classroom access to substitute teachers for {classroomName}
          </DialogDescription>
        </DialogHeader>

        {/* Show new code after creation */}
        {newLinkCode && (
          <Card className="border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Access Code Created!</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-3xl font-bold tracking-wider">{newLinkCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(newLinkCode)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this code with your substitute teacher. They'll use it to access the classroom.
              </p>
              <Button onClick={() => setNewLinkCode(null)} className="w-full">
                Done
              </Button>
            </CardContent>
          </Card>
        )}

        {!newLinkCode && step === 'list' && (
          <div className="space-y-4">
            {/* Active Links */}
            {activeLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Active Access ({activeLinks.length})
                </h4>
                {activeLinks.map((link) => (
                  <Card key={link.id} className="border-primary/20">
                    <CardContent className="py-3 px-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{link.access_code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link.access_code)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          {link.substitute_name && (
                            <p className="text-sm text-muted-foreground">{link.substitute_name}</p>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {getTimeRemaining(link.access_end)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeLink(link.id)}
                          disabled={isRevoking}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button onClick={() => setStep('create')} className="w-full bg-gradient-primary">
              <Link2 className="mr-2 h-4 w-4" />
              Create New Access Link
            </Button>

            {/* Expired Links */}
            {expiredLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Past Access ({expiredLinks.length})
                </h4>
                {expiredLinks.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex justify-between items-center text-sm text-muted-foreground py-2 px-3 bg-muted/50 rounded-lg">
                    <span className="font-mono">{link.access_code}</span>
                    <span>{link.substitute_name || 'Unknown'}</span>
                    <span>{format(new Date(link.access_end), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!newLinkCode && step === 'create' && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sub-name">Substitute Name (optional)</Label>
                <Input
                  id="sub-name"
                  placeholder="e.g., Mrs. Johnson"
                  value={substituteName}
                  onChange={(e) => setSubstituteName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sub-email">Substitute Email (optional)</Label>
                <Input
                  id="sub-email"
                  type="email"
                  placeholder="substitute@school.edu"
                  value={substituteEmail}
                  onChange={(e) => setSubstituteEmail(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Access Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'half_day' as const, label: '4 Hours' },
                    { value: 'full_day' as const, label: '8 Hours' },
                    { value: 'custom' as const, label: 'Custom' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={accessDuration === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAccessDuration(option.value)}
                      className={accessDuration === option.value ? 'bg-gradient-primary' : ''}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                {accessDuration === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label htmlFor="end-date" className="text-xs">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Permissions</Label>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">View Students</span>
                  </div>
                  <Switch
                    checked={permissions.view_students}
                    onCheckedChange={(c) => setPermissions(p => ({ ...p, view_students: c }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Take Attendance</span>
                  </div>
                  <Switch
                    checked={permissions.take_attendance}
                    onCheckedChange={(c) => setPermissions(p => ({ ...p, take_attendance: c }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">View Assignments</span>
                  </div>
                  <Switch
                    checked={permissions.view_assignments}
                    onCheckedChange={(c) => setPermissions(p => ({ ...p, view_assignments: c }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Post Announcements</span>
                  </div>
                  <Switch
                    checked={permissions.post_announcements}
                    onCheckedChange={(c) => setPermissions(p => ({ ...p, post_announcements: c }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={isCreating || (accessDuration === 'custom' && !customEndDate)}
                className="flex-1 bg-gradient-primary"
              >
                {isCreating ? 'Creating...' : 'Create Link'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}