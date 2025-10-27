import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ViewBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupData: any;
  isLoading: boolean;
  backupName: string;
  recordCount: number;
}

export const ViewBackupDialog = ({
  open,
  onOpenChange,
  backupData,
  isLoading,
  backupName,
  recordCount,
}: ViewBackupDialogProps) => {
  const { toast } = useToast();
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "Backup data has been copied",
    });
  };

  const copyTableData = (tableName: string, data: any[]) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Table data copied",
      description: `${tableName} data copied to clipboard`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Backup Data: {backupName}
          </DialogTitle>
          <DialogDescription>
            Viewing decrypted backup data • {recordCount.toLocaleString()} total records
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              Downloading and decrypting backup from AWS S3...
            </p>
          </div>
        ) : backupData ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">Tables in this backup</div>
                  <div className="text-2xl font-bold">
                    {backupData.tables?.length || Object.keys(backupData.backup_data || {}).length}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupData)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Data
                </Button>
              </div>

              {/* Tables List */}
              <div className="space-y-2">
                {backupData.tables?.map((tableName: string) => {
                  const tableData = backupData.backup_data?.[tableName] || [];
                  const isExpanded = expandedTables.has(tableName);

                  return (
                    <Collapsible
                      key={tableName}
                      open={isExpanded}
                      onOpenChange={() => toggleTable(tableName)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <div className="text-left">
                              <div className="font-medium">{tableName}</div>
                              <div className="text-sm text-muted-foreground">
                                {tableData.length} records
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">{tableData.length}</Badge>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t p-4 bg-muted/20">
                            <div className="flex justify-between items-center mb-3">
                              <div className="text-sm text-muted-foreground">
                                Preview of records in {tableName}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTableData(tableName, tableData)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            
                            <ScrollArea className="h-[200px]">
                              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                                {JSON.stringify(tableData, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>

              {/* Warning Notice */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  <strong>⚠️ View Only:</strong> This shows the backup data for review purposes. 
                  To restore this data to your database, you would need to implement a separate restore operation.
                </p>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
