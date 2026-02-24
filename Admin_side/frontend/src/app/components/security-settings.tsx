import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Shield, 
  Users, 
  FileText, 
  Database, 
  Wrench,
  DollarSign,
  Lock,
  Settings,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

// Import sub-components
import { AccountAuthentication } from '@/app/components/settings/account-authentication';
import { RoleBasedAccessControl } from '@/app/components/settings/role-based-access-control';
import { AuditLogs } from '@/app/components/settings/audit-logs';
import { SystemConfiguration } from '@/app/components/settings/system-configuration';
import { TaxServiceSettings } from '@/app/components/settings/tax-service-settings';
import { BackupRecovery } from '@/app/components/settings/backup-recovery';

type SettingsSection = 
  | 'account' 
  | 'rbac' 
  | 'audit' 
  | 'system' 
  | 'tax' 
  | 'backup';

interface NavigationItem {
  id: SettingsSection;
  label: string;
  icon: any;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'account',
    label: 'Account & Authentication',
    icon: Lock,
    description: 'Manage passwords and user accounts',
  },
  {
    id: 'rbac',
    label: 'Role-Based Access Control',
    icon: Shield,
    description: 'Configure roles and permissions',
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: FileText,
    description: 'View system activity logs',
  },
  {
    id: 'system',
    label: 'System Configuration',
    icon: Wrench,
    description: 'Restaurant and system settings',
  },
  {
    id: 'tax',
    label: 'Tax & Service Charge',
    icon: DollarSign,
    description: 'Configure tax and pricing',
  },
  {
    id: 'backup',
    label: 'Backup & Recovery',
    icon: Database,
    description: 'Manage data backups',
  },
];

export function SecuritySettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountAuthentication />;
      case 'rbac':
        return <RoleBasedAccessControl />;
      case 'audit':
        return <AuditLogs />;
      case 'system':
        return <SystemConfiguration />;
      case 'tax':
        return <TaxServiceSettings />;
      case 'backup':
        return <BackupRecovery />;
      default:
        return <AccountAuthentication />;
    }
  };

  return (
    <div className="bg-settings-module min-h-screen space-y-6">
      {/* Header */}
      <div className="module-container flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Settings</h2>
          <p className="text-sm text-white mt-1">
            Manage system configuration, security, and preferences
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </div>

      {/* Settings Navigation */}
      <div className="w-full overflow-x-auto pb-4">
        <nav className="flex gap-3 min-w-max p-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors text-left min-w-[240px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                )}
              >
                <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isActive ? '' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isActive ? '' : '')}>
                    {item.label}
                  </p>
                  <p className={cn('text-xs mt-0.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
}
