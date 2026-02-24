import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import { Input } from '@/app/components/ui/input';
import { Database, Download, Upload, RefreshCcw, Check, AlertCircle, Calendar, Clock, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { backupApi } from '@/utils/api';

// Local storage keys
const BACKUPS_STORAGE_KEY = 'rms_backups';
const BACKUP_CONFIG_KEY = 'rms_backup_config';

interface Backup {
  _id: string;
  name: string;
  size: string;
  date: string;
  time: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'manual' | 'automatic';
  documentCounts?: Record<string, number>;
  totalDocuments?: number;
  collections?: string[];
  data?: Record<string, any[]>;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  frequency: string;
  backupTime: string;
  retentionDays: number;
  backupLocation: string;
  googleDriveEnabled: boolean;
}

// Local storage helper functions
const getStoredBackups = (): Backup[] => {
  try {
    const stored = localStorage.getItem(BACKUPS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveBackups = (backups: Backup[]): void => {
  localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(backups));
};

const getStoredConfig = (): BackupConfig => {
  try {
    const stored = localStorage.getItem(BACKUP_CONFIG_KEY);
    return stored ? JSON.parse(stored) : {
      autoBackupEnabled: true,
      frequency: 'daily',
      backupTime: '02:00',
      retentionDays: 30,
      backupLocation: 'local',
      googleDriveEnabled: false,
    };
  } catch {
    return {
      autoBackupEnabled: true,
      frequency: 'daily',
      backupTime: '02:00',
      retentionDays: 30,
      backupLocation: 'local',
      googleDriveEnabled: false,
    };
  }
};

const saveConfig = (config: BackupConfig): void => {
  localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(config));
};

// Generate a unique ID
const generateId = (): string => {
  return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get mock data for backup (simulating actual data)
const getMockBackupData = (): Record<string, any[]> => {
  // Get data from localStorage or use empty arrays
  const menuItems = localStorage.getItem('rms_menu_items');
  const orders = localStorage.getItem('rms_orders');
  const tables = localStorage.getItem('rms_tables');
  const staff = localStorage.getItem('rms_staff');
  const customers = localStorage.getItem('rms_customers');
  const inventory = localStorage.getItem('rms_inventory');
  
  return {
    settings: [],
    system_config: [],
    roles: [],
    audit_logs: [],
    staff: staff ? JSON.parse(staff) : [],
    menu: menuItems ? JSON.parse(menuItems) : [],
    orders: orders ? JSON.parse(orders) : [],
    tables: tables ? JSON.parse(tables) : [],
    customers: customers ? JSON.parse(customers) : [],
    inventory: inventory ? JSON.parse(inventory) : [],
  };
};

export function BackupRecovery() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    autoBackupEnabled: true,
    frequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    backupLocation: 'local',
    googleDriveEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Load backups and config - try backend first, fallback to localStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to load from backend first
        try {
          const configData = await backupApi.getConfig();
          if (configData) {
            setConfig({
              autoBackupEnabled: configData.autoBackupEnabled ?? true,
              frequency: configData.frequency ?? 'daily',
              backupTime: configData.backupTime ?? '02:00',
              retentionDays: configData.retentionDays ?? 30,
              backupLocation: configData.backupLocation ?? 'local',
              googleDriveEnabled: configData.googleDriveEnabled ?? false,
            });
            // Save to localStorage for offline access
            saveConfig({
              autoBackupEnabled: configData.autoBackupEnabled ?? true,
              frequency: configData.frequency ?? 'daily',
              backupTime: configData.backupTime ?? '02:00',
              retentionDays: configData.retentionDays ?? 30,
              backupLocation: configData.backupLocation ?? 'local',
              googleDriveEnabled: configData.googleDriveEnabled ?? false,
            });
          }
        } catch (apiError) {
          // Backend not available, use localStorage
          console.log('Backend not available, loading from localStorage');
          const storedConfig = getStoredConfig();
          setConfig(storedConfig);
        }
        
        // Load backups from localStorage
        const storedBackups = getStoredBackups();
        setBackups(storedBackups);
      } catch (error) {
        console.error('Failed to load backup data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      // Simulate backup creation with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      
      // Get mock data for backup
      const backupData = getMockBackupData();
      
      // Calculate approximate size
      const dataJson = JSON.stringify(backupData);
      const backupSizeBytes = dataJson.length;
      let sizeStr: string;
      if (backupSizeBytes > 1024 * 1024) {
        sizeStr = `${(backupSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        sizeStr = `${(backupSizeBytes / 1024).toFixed(2)} KB`;
      }
      
      // Count documents in each collection
      const documentCounts: Record<string, number> = {};
      let totalDocs = 0;
      Object.keys(backupData).forEach(key => {
        documentCounts[key] = backupData[key].length;
        totalDocs += backupData[key].length;
      });
      
      const newBackup: Backup = {
        _id: generateId(),
        name: `Manual Backup - ${dateStr}`,
        size: sizeStr,
        date: dateStr,
        time: timeStr,
        status: 'completed',
        type: 'manual',
        documentCounts,
        totalDocuments: totalDocs,
        collections: Object.keys(backupData),
        data: backupData,
      };
      
      // Save to localStorage
      const updatedBackups = [newBackup, ...backups];
      setBackups(updatedBackups);
      saveBackups(updatedBackups);
      
      toast.success('Backup created successfully!');
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b._id === backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      // Simulate restore with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If backup has data, restore it to localStorage
      if (backup.data) {
        Object.keys(backup.data).forEach(key => {
          localStorage.setItem(`rms_${key}`, JSON.stringify(backup.data![key]));
        });
      }
      
      toast.success(`Backup '${backup.name}' restored successfully!`);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Failed to restore backup');
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b._id === backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      // Create backup data object for download
      const downloadData = {
        backupInfo: {
          name: backup.name,
          date: backup.date,
          time: backup.time,
          type: backup.type,
          documentCounts: backup.documentCounts,
          totalDocuments: backup.totalDocuments,
          exportedAt: new Date().toISOString(),
        },
        collections: backup.collections || [],
        data: backup.data || {},
      };
      
      const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const updatedBackups = backups.filter(b => b._id !== backupId);
      setBackups(updatedBackups);
      saveBackups(updatedBackups);
      toast.success('Backup deleted');
    } catch (error) {
      console.error('Failed to delete backup:', error);
      toast.error('Failed to delete backup');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      saveConfig(config);
      
      // Also try to save to backend API (if available)
      try {
        await backupApi.updateConfig({
          autoBackupEnabled: config.autoBackupEnabled,
          frequency: config.frequency,
          backupTime: config.backupTime,
          retentionDays: config.retentionDays,
          backupLocation: config.backupLocation,
          googleDriveEnabled: config.googleDriveEnabled,
        });
      } catch (apiError) {
        console.log('Backend not available, using localStorage only');
      }
      
      toast.success('Backup configuration saved!');
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500">
            <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-settings-module min-h-screen space-y-6 p-6">
      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-black">Backup Actions</CardTitle>
                <CardDescription className="text-black">Create and manage backups</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCreateBackup} 
              className="w-full" 
              size="lg"
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Database className="h-5 w-5 mr-2" />
              )}
              {isCreatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
            </Button>

            <Separator />

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-xs text-muted-foreground">
                  Enable scheduled backups
                </p>
              </div>
              <Switch 
                checked={config.autoBackupEnabled} 
                onCheckedChange={(checked) => setConfig({ ...config, autoBackupEnabled: checked })} 
              />
            </div>

            {config.autoBackupEnabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select 
                    value={config.frequency} 
                    onValueChange={(value) => setConfig({ ...config, frequency: value })}
                  >
                    <SelectTrigger id="backup-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.frequency !== 'hourly' && (
                  <div className="space-y-2">
                    <Label htmlFor="backup-time">Backup Time</Label>
                    <Input
                      id="backup-time"
                      type="time"
                      value={config.backupTime}
                      onChange={(e) => setConfig({ ...config, backupTime: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Set the time for automatic backups</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="retention">Retention Period (Days)</Label>
                  <Select 
                    value={config.retentionDays.toString()} 
                    onValueChange={(value) => setConfig({ ...config, retentionDays: parseInt(value) })}
                  >
                    <SelectTrigger id="retention">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="15">15 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            <Button onClick={handleSaveConfig} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Backup Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle className="text-black">Backup Status</CardTitle>
                <CardDescription className="text-black">Latest backup information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="p-2 bg-green-500 rounded-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">Last Backup Successful</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {backups.length > 0 ? `${backups[0].date} at ${backups[0].time}` : 'No backups yet'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Next Scheduled</span>
                </div>
                <span className="font-medium">
                  {config.autoBackupEnabled ? `Next ${config.frequency === 'hourly' ? 'hour' : `at ${config.backupTime}`}` : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Retention Period</span>
                </div>
                <span className="font-medium">{config.retentionDays} Days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-black">Backup History</CardTitle>
              <CardDescription className="text-black">Previous backups available for restore</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No backups found
                  </TableCell>
                </TableRow>
              ) : (
                backups.map(backup => (
                  <TableRow key={backup._id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {backup.type === 'manual' ? 'Manual' : 'Automatic'}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.size || 'N/A'}</TableCell>
                    <TableCell>{backup.date}</TableCell>
                    <TableCell>{backup.time}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreBackup(backup._id)}
                          disabled={backup.status !== 'completed'}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadBackup(backup._id)}
                          disabled={backup.status !== 'completed'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBackup(backup._id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
