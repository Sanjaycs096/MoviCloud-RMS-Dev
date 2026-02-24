import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { UserCog, ShieldCheck, UserCheck } from 'lucide-react';
import { restaurantState, type UserRole } from '@/app/services/restaurant-state';
import { toast } from 'sonner';

interface WaiterOption {
  id: string;
  name: string;
}

interface RoleSwitcherProps {
  availableWaiters: WaiterOption[];
  onRoleChange?: () => void;
}

export function RoleSwitcher({ availableWaiters, onRoleChange }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(restaurantState.getRole());
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>(
    restaurantState.getCurrentWaiterId() || ''
  );

  useEffect(() => {
    // Update current role from state
    setCurrentRole(restaurantState.getRole());
    setSelectedWaiterId(restaurantState.getCurrentWaiterId() || '');
  }, [open]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'waiter') {
      // Don't change yet, wait for waiter selection
      setCurrentRole(newRole);
    } else {
      // Admin - apply immediately
      restaurantState.setRole('admin');
      setCurrentRole('admin');
      setSelectedWaiterId('');
      toast.success('Switched to Admin mode');
      setOpen(false);
      onRoleChange?.();
    }
  };

  const handleWaiterSelect = (waiterId: string) => {
    setSelectedWaiterId(waiterId);
  };

  const handleApply = () => {
    if (currentRole === 'waiter' && !selectedWaiterId) {
      toast.error('Please select a waiter');
      return;
    }

    if (currentRole === 'waiter') {
      const waiter = availableWaiters.find(w => w.id === selectedWaiterId);
      restaurantState.setRole('waiter', selectedWaiterId);
      toast.success(`Switched to Waiter mode: ${waiter?.name}`);
    } else {
      restaurantState.setRole('admin');
      toast.success('Switched to Admin mode');
    }

    setOpen(false);
    onRoleChange?.();
  };

  const getCurrentWaiterName = () => {
    const id = restaurantState.getCurrentWaiterId();
    if (!id) return null;
    return availableWaiters.find(w => w.id === id)?.name;
  };

  const displayRole = restaurantState.getRole();
  const waiterName = getCurrentWaiterName();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-2"
          size="sm"
        >
          {displayRole === 'admin' ? (
            <>
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Admin</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="font-semibold">Waiter</span>
              {waiterName && (
                <Badge variant="secondary" className="ml-1">
                  {waiterName}
                </Badge>
              )}
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#8B5A2B]" />
            Switch Role
          </DialogTitle>
          <DialogDescription>
            Choose your role to access specific features and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Select Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={currentRole === 'admin' ? 'default' : 'outline'}
                className="w-full h-auto flex-col gap-2 py-4"
                onClick={() => handleRoleChange('admin')}
              >
                <ShieldCheck className={`h-6 w-6 ${currentRole === 'admin' ? 'text-white' : 'text-blue-600'}`} />
                <div>
                  <div className="font-semibold">Admin</div>
                  <div className="text-xs opacity-80">Full Access</div>
                </div>
              </Button>

              <Button
                variant={currentRole === 'waiter' ? 'default' : 'outline'}
                className="w-full h-auto flex-col gap-2 py-4"
                onClick={() => handleRoleChange('waiter')}
              >
                <UserCheck className={`h-6 w-6 ${currentRole === 'waiter' ? 'text-white' : 'text-green-600'}`} />
                <div>
                  <div className="font-semibold">Waiter</div>
                  <div className="text-xs opacity-80">Limited Access</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Waiter Selection (only shown when waiter role is selected) */}
          {currentRole === 'waiter' && (
            <div className="space-y-2">
              <Label>Select Waiter</Label>
              <Select value={selectedWaiterId} onValueChange={handleWaiterSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a waiter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableWaiters.map(waiter => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Permissions Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="text-xs font-semibold text-gray-700">
              {currentRole === 'admin' ? 'Admin Permissions:' : 'Waiter Permissions:'}
            </div>
            <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
              {currentRole === 'admin' ? (
                <>
                  <li>• Full access to all modules</li>
                  <li>• Can clean and reset tables</li>
                  <li>• Can manage all orders</li>
                  <li>• Can assign waiters</li>
                </>
              ) : (
                <>
                  <li>• Can manage assigned tables only</li>
                  <li>• Can create and serve orders</li>
                  <li>• Can process checkout</li>
                  <li>• Cannot clean tables</li>
                </>
              )}
            </ul>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleApply}
            className="w-full bg-[#8B5A2B] hover:bg-[#6d4522]"
            disabled={currentRole === 'waiter' && !selectedWaiterId}
          >
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
