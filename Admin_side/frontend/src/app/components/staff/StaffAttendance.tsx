import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { 
  Search, 
  FileDown, 
  Plus, 
  Pencil, 
  Calendar as CalendarIcon,
  Clock,
  UserX,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from "framer-motion";
import { attendanceApi, staffApi } from '@/utils/api';
import { toast } from 'sonner';

interface AttendanceRecord {
  _id: string;
  staffId: string;
  staffName: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  notes?: string;
}

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  shift: string;
  phone?: string;
  department?: string;
}

interface AttendanceForm {
  staffId: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  notes: string;
}

interface StaffAttendanceProps {
  globalSearch?: string;
}

export function StaffAttendance({ globalSearch = '' }: StaffAttendanceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '',
    checkOut: '',
    hoursWorked: '',
    notes: ''
  });

  // Calculate stats from attendance data
  const activeOnSite = attendance.filter((a: AttendanceRecord) => a.status === 'present' || a.status === 'late').length;
  const totalStaff = staff.length || 46;
  const lateToday = attendance.filter((a: AttendanceRecord) => a.status === 'late').length;
  const absences = attendance.filter((a: AttendanceRecord) => a.status === 'absent').length;

  useEffect(() => {
    fetchData();
  }, [departmentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Fetch attendance records
      const attendanceData = await attendanceApi.list({
        date_from: today,
        date_to: today
      });
      setAttendance(attendanceData || []);

      // Fetch all staff for reference
      const staffData = await staffApi.getAll();
      setStaff(staffData || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const result = await staffApi.exportAttendanceCsv();
      
      // Create and download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || 'attendance_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting attendance:', err);
      setError('Failed to export attendance data');
    } finally {
      setExporting(false);
    }
  };

  const handleManualEntry = async () => {
    if (!attendanceForm.staffId || !attendanceForm.date) {
      toast.error('Please select a staff member and date');
      return;
    }

    try {
      setSaving(true);
      await attendanceApi.record({
        staffId: attendanceForm.staffId,
        date: attendanceForm.date,
        status: attendanceForm.status,
        checkIn: attendanceForm.checkIn || undefined,
        checkOut: attendanceForm.checkOut || undefined,
        hoursWorked: attendanceForm.hoursWorked ? parseFloat(attendanceForm.hoursWorked) : undefined,
        notes: attendanceForm.notes || undefined
      });
      
      toast.success('Attendance recorded successfully!');
      setManualEntryOpen(false);
      setAttendanceForm({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: '',
        checkOut: '',
        hoursWorked: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      console.error('Error recording attendance:', err);
      toast.error('Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStaffInfo = (staffId: string) => {
    const member = staff.find((s: StaffMember) => s._id === staffId);
    return member || { name: 'Unknown', role: 'N/A', shift: 'N/A' };
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setAttendanceForm({
      staffId: record.staffId,
      date: record.date,
      status: record.status || 'present',
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      hoursWorked: record.hoursWorked?.toString() || '',
      notes: record.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditAttendance = async () => {
    if (!selectedRecord) return;

    try {
      setSaving(true);
      // Delete the old record and create a new one
      await attendanceApi.record({
        staffId: selectedRecord.staffId,
        date: selectedRecord.date,
        status: attendanceForm.status,
        checkIn: attendanceForm.checkIn || undefined,
        checkOut: attendanceForm.checkOut || undefined,
        hoursWorked: attendanceForm.hoursWorked ? parseFloat(attendanceForm.hoursWorked) : undefined,
        notes: attendanceForm.notes || undefined
      });
      
      toast.success('Attendance updated successfully!');
      setEditDialogOpen(false);
      setSelectedRecord(null);
      fetchData();
    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  // Combine local and global search
  const effectiveSearch = globalSearch || searchTerm;
  
  const filteredAttendance = attendance.filter((record: AttendanceRecord) => 
    effectiveSearch === '' || record.staffName?.toLowerCase().includes(effectiveSearch.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Attendance Tracking</h2>
          <p className="text-gray-300">Real-time staff monitoring and shift verification.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2 bg-white border-gray-200 shadow-sm"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4 text-[#8B5A2B]" />}
            Export
          </Button>
          <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#1A1A1A] hover:bg-black text-white px-6">
                <Plus className="h-4 w-4" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Manual Attendance Entry</DialogTitle>
                <DialogDescription>
                  Record attendance for a staff member manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff">Staff Member *</Label>
                  <Select 
                    value={attendanceForm.staffId} 
                    onValueChange={(value) => setAttendanceForm({ ...attendanceForm, staffId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} ({s.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={attendanceForm.status} 
                    onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="checkIn">Clock In Time</Label>
                    <Input
                      id="checkIn"
                      type="time"
                      value={attendanceForm.checkIn}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="checkOut">Clock Out Time</Label>
                    <Input
                      id="checkOut"
                      type="time"
                      value={attendanceForm.checkOut}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    placeholder="e.g. 8"
                    value={attendanceForm.hoursWorked}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, hoursWorked: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Optional notes"
                    value={attendanceForm.notes}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setManualEntryOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleManualEntry} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Record Attendance'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-white-600 uppercase tracking-widest mb-1">Active On-Site</p>
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                ) : (
                  <div className="text-4xl font-bold text-[#2D2D2D]">{activeOnSite}/{totalStaff}</div>
                )}
              </div>
              <Badge className="bg-green-50 text-green-600 border-none font-bold text-[10px]">+5.2%</Badge>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-green-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: totalStaff > 0 ? `${(activeOnSite / totalStaff) * 100}%` : '0%' }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Late Today</p>
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                ) : (
                  <div className="text-4xl font-bold text-[#2D2D2D]">{lateToday}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Pending review: <span className="font-semibold text-gray-700">1</span></p>
              </div>
              <div className="bg-orange-50 text-orange-600 rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs">-2</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Absences</p>
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                ) : (
                  <div className="text-4xl font-bold text-[#2D2D2D]">{absences}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Unexcused this week: <span className="font-semibold text-gray-700">2</span></p>
              </div>
              <div className="text-red-600 font-bold text-xl">{absences}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-[#FDFCFB] border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">24-10-2024</span>
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-[#FDFCFB] border-none rounded-xl text-sm font-medium">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name..." 
                className="pl-10 bg-[#FDFCFB] border-none rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FDFCFB]">
                <tr className="text-left text-gray-600 uppercase tracking-wider text-[11px] font-bold border-b border-gray-100">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Shift</th>
                  <th className="px-6 py-4">Clock In</th>
                  <th className="px-6 py-4">Clock Out</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Pay</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading attendance data...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((record: AttendanceRecord) => {
                    const staffInfo = getStaffInfo(record.staffId);
                    const status = record.status?.toUpperCase() || 'ABSENT';
                    const clockInStatus = record.checkIn ? (new Date(`2000-01-01T${record.checkIn}`) < new Date('2000-01-01T08:00:00') ? 'EARLY' : 'ON TIME') : '';
                    
                    return (
                      <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-semibold text-xs border border-white shadow-sm">
                              {staffInfo.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{staffInfo.name}</div>
                              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{staffInfo.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{staffInfo.shift}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-800">{record.checkIn || '--:--'}</div>
                            {clockInStatus && (
                              <div className={`text-[9px] font-bold uppercase tracking-tighter ${clockInStatus === 'EARLY' ? 'text-green-500' : 'text-orange-500'}`}>
                                {clockInStatus}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{record.checkOut || '--:--'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-white border border-gray-200 px-3 py-1 rounded-md font-bold text-gray-800 w-14 text-center">
                              {record.hoursWorked || '0'}
                            </div>
                            <span className="text-gray-400 text-xs font-medium">hrs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-green-600">₹{(record.hoursWorked || 0) * 1500}.00</div>
                            <div className="text-[10px] font-bold text-gray-400">₹1,500/hr</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`border-none font-bold text-[10px] px-3 py-1 ${
                            status === 'PRESENT' ? 'bg-green-50 text-green-600' : 
                            status === 'LATE' ? 'bg-orange-50 text-orange-600' : 
                            'bg-red-50 text-red-600'
                          }`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-[#8B5A2B] hover:bg-[#8B5A2B]/10"
                            onClick={() => openEditDialog(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Attendance Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              Update attendance record for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Staff Member</Label>
              <Input value={selectedRecord?.staffName || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select 
                value={attendanceForm.status} 
                onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Clock In Time</Label>
                <Input
                  type="time"
                  value={attendanceForm.checkIn}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Clock Out Time</Label>
                <Input
                  type="time"
                  value={attendanceForm.checkOut}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hours Worked</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g. 8"
                value={attendanceForm.hoursWorked}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, hoursWorked: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAttendance} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Attendance'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
