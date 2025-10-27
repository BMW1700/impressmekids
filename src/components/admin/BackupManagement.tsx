import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, AlertCircle, CheckCircle2, Database, Calendar, Trash2, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ViewBackupDialog } from "./RestoreBackupDialog";
import { RestoreConfirmationDialog } from "./RestoreConfirmationDialog";

interface Backup {
  id: string;
  backup_name: string;
  backup_size_bytes: number;
  tables_included: string[];
  record_count: number;
  backup_timestamp: string;
  storage_provider: string;
  status: string;
  metadata: any;
}

interface HealthStatus {
  health_status: string;
  latest_backup: Backup | null;
  total_backups: number;
  hours_since_last_backup: number | null;
  recent_failed_operations: number;
  recommendations: string[];
}

export const BackupManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [viewedData, setViewedData] = useState<any>(null);
  const [selectedBackup, setSelectedBackup] = useState<{ id: string; name: string; count: number; tables: string[] } | null>(null);

  // Fetch health status
  const { data: healthData, isLoading: healthLoading } = useQuery<HealthStatus>({
    queryKey: ['backup-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-backup-health');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch backups list
  const { data: backupsData, isLoading: backupsLoading } = useQuery<{ backups: Backup[] }>({
    queryKey: ['cold-storage-backups'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('list-cold-storage-backups');
      if (error) throw error;
      return data;
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      const { data, error } = await supabase.functions.invoke('create-cold-storage-backup');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Cold storage backup completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['cold-storage-backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-health'] });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  // Cleanup old backups mutation
  const cleanupBackupsMutation = useMutation({
    mutationFn: async () => {
      setIsCleaning(true);
      const { data, error } = await supabase.functions.invoke('cleanup-old-backups');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Cleanup Complete",
        description: data.message || `Deleted ${data.deleted_count} old backups`,
      });
      queryClient.invalidateQueries({ queryKey: ['cold-storage-backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-health'] });
      setIsCleaning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsCleaning(false);
    },
  });

  // View backup handler
  const handleViewBackup = async (backup: Backup) => {
    setIsViewing(true);
    setSelectedBackup({ 
      id: backup.id, 
      name: backup.backup_name, 
      count: backup.record_count, 
      tables: backup.tables_included 
    });
    setViewDialogOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('restore-cold-storage-backup', {
        body: { backup_id: backup.id, execute_restore: false }
      });

      if (error) throw error;

      setViewedData(data);
      toast({
        title: "Backup Loaded",
        description: "Backup data retrieved for viewing",
      });
    } catch (error: any) {
      console.error('Error viewing backup:', error);
      toast({
        title: "View Failed",
        description: error.message,
        variant: "destructive",
      });
      setViewDialogOpen(false);
      setViewedData(null);
      setSelectedBackup(null);
    } finally {
      setIsViewing(false);
    }
  };

  // Restore backup handler
  const handleRestoreBackup = (backup: Backup) => {
    setSelectedBackup({ 
      id: backup.id, 
      name: backup.backup_name, 
      count: backup.record_count, 
      tables: backup.tables_included 
    });
    setRestoreDialogOpen(true);
  };

  // Confirm restore
  const handleConfirmRestore = async (selectedTables: string[]) => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('restore-cold-storage-backup', {
        body: { 
          backup_id: selectedBackup.id, 
          execute_restore: true,
          tables: selectedTables
        }
      });

      if (error) throw error;

      toast({
        title: "Restore Complete",
        description: `Restored ${data.total_records?.toLocaleString()} records across ${data.restored_tables?.length} tables`,
      });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      
      // Refresh backup list
      queryClient.invalidateQueries({ queryKey: ['cold-storage-backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-health'] });
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isHealthy = healthData?.health_status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Health Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {healthLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Backup System Health
          </CardTitle>
          <CardDescription>
            Monitor backup status and system health
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Backups</div>
                  <div className="text-2xl font-bold">{healthData?.total_backups || 0}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Last Backup</div>
                  <div className="text-2xl font-bold">
                    {healthData?.hours_since_last_backup !== null
                      ? `${Math.round(healthData.hours_since_last_backup)}h ago`
                      : 'Never'}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Failed Operations</div>
                  <div className="text-2xl font-bold text-red-500">
                    {healthData?.recent_failed_operations || 0}
                  </div>
                </div>
              </div>

              {healthData?.recommendations && healthData.recommendations.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {healthData.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Management</CardTitle>
          <CardDescription>
            Manually trigger backups or cleanup old data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => createBackupMutation.mutate()}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Database className="mr-2 h-4 w-4" />
              Create Backup Now
            </Button>
            
            <Button
              onClick={() => cleanupBackupsMutation.mutate()}
              disabled={isCleaning}
              variant="outline"
              className="flex-1"
            >
              {isCleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup Old Backups (90d)
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-3">
            Backups older than 90 days are automatically deleted daily at 3 AM UTC
          </p>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage all cold storage backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : backupsData?.backups && backupsData.backups.length > 0 ? (
            <div className="space-y-4">
              {backupsData.backups.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium">{backup.backup_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(backup.backup_timestamp), 'PPpp')}
                      </div>
                      <div className="text-sm">
                        {formatBytes(backup.backup_size_bytes)} • {backup.record_count.toLocaleString()} records
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {backup.tables_included.length} tables: {backup.tables_included.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBackup(backup)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRestoreBackup(backup)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No backups found. Create your first backup to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <ViewBackupDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        backupData={viewedData}
        isLoading={isViewing}
        backupName={selectedBackup?.name || ''}
        recordCount={selectedBackup?.count || 0}
      />

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmationDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        onConfirm={handleConfirmRestore}
        isRestoring={isRestoring}
        backupName={selectedBackup?.name || ''}
        recordCount={selectedBackup?.count || 0}
        tables={selectedBackup?.tables || []}
      />
    </div>
  );
};
