import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Tabs,
  TabsContent,
} from '@/app/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  FileBarChart,
  Filter,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { cn } from '@/app/components/ui/utils';
import { useAuth } from '@/utils/auth-context';

// Import sub-components
import { StaffOverview } from "./staff/StaffOverview";
import { StaffList } from "./staff/StaffList";
import { StaffAttendance } from "./staff/StaffAttendance";
import { StaffShiftTimings } from "./staff/StaffShiftTimings";
import { StaffReports } from "./staff/StaffReports";

export function StaffManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, description: 'Staff overview' },
    { id: 'staff', label: 'Staff', icon: Users, description: 'Employee records' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, description: 'Daily tracking' },
    { id: 'shift-timings', label: 'Shift Timings', icon: Clock, description: 'Schedule management' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, description: 'Analytics & insights' },
  ];

  return (
    <div className="bg-staff-module min-h-screen flex flex-col">
      {/* Module Header Bar */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Search staff..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 rounded-xl h-10 text-sm text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-[#8B5A2B]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] bg-white/10 border-white/20 text-white rounded-xl h-10">
              <Filter className="h-4 w-4 mr-2 text-white/60 flex-shrink-0" />
              <SelectValue placeholder="Role" className="whitespace-normal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="chef">Chef</SelectItem>
              <SelectItem value="waiter">Waiter</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] bg-white/10 border-white/20 text-white rounded-xl h-10">
              <Clock className="h-4 w-4 mr-2 text-white/60 flex-shrink-0" />
              <SelectValue placeholder="Shift" className="whitespace-normal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
              <SelectItem value="night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{user?.name || 'Guest'}</p>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tight mt-1">{user?.role || 'User'}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[#8B5A2B] text-white font-bold">{user?.name ? getInitials(user.name) : 'GU'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 py-4">
        {/* Custom Tab Navigation - matching Inventory style */}
        <div className="w-full overflow-x-auto pb-6">
          <nav className="flex gap-3 min-w-max p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors text-left min-w-[180px]',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:bg-muted shadow-sm'
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
            <StaffOverview />
          </TabsContent>

          <TabsContent value="staff" className="mt-0 focus-visible:outline-none">
            <StaffList globalSearch={globalSearch} globalRoleFilter={roleFilter} globalShiftFilter={shiftFilter} />
          </TabsContent>

          <TabsContent value="attendance" className="mt-0 focus-visible:outline-none">
            <StaffAttendance globalSearch={globalSearch} />
          </TabsContent>

          <TabsContent value="shift-timings" className="mt-0 focus-visible:outline-none">
            <StaffShiftTimings globalSearch={globalSearch} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
            <StaffReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
