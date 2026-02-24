import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { DollarSign, Save, Plus, Edit, Trash2, Percent, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { taxConfigApi, discountRulesApi } from '@/utils/api';

interface TaxConfig {
  gstEnabled: boolean;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  packagingChargeEnabled: boolean;
  packagingChargeRate: number;
}

interface DiscountRule {
  _id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  enabled: boolean;
}

export function TaxServiceSettings() {
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    gstEnabled: true,
    gstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceChargeEnabled: true,
    serviceChargeRate: 10,
    packagingChargeEnabled: true,
    packagingChargeRate: 20,
  });

  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [isAddDiscountOpen, setIsAddDiscountOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
  });

  // Load tax configuration and discounts from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taxData, discountsData] = await Promise.all([
          taxConfigApi.get().catch(() => null),
          discountRulesApi.list().catch(() => []),
        ]);
        
        if (taxData) {
          setTaxConfig({
            gstEnabled: taxData.gstEnabled ?? true,
            gstRate: taxData.gstRate ?? 5,
            cgstRate: taxData.cgstRate ?? 2.5,
            sgstRate: taxData.sgstRate ?? 2.5,
            serviceChargeEnabled: taxData.serviceChargeEnabled ?? true,
            serviceChargeRate: taxData.serviceChargeRate ?? 10,
            packagingChargeEnabled: taxData.packagingChargeEnabled ?? true,
            packagingChargeRate: taxData.packagingChargeRate ?? 20,
          });
        }
        
        setDiscountRules(discountsData || []);
      } catch (error) {
        console.error('Failed to load tax & discount data:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveTaxConfig = async () => {
    setSaving(true);
    try {
      await taxConfigApi.update(taxConfig);
      toast.success('Tax & service charge settings saved successfully!');
    } catch (error) {
      console.error('Failed to save tax config:', error);
      toast.error('Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDiscount = async () => {
    if (!newDiscount.name || newDiscount.value <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const created = await discountRulesApi.create({
        name: newDiscount.name,
        type: newDiscount.type,
        value: newDiscount.value,
        minOrderAmount: newDiscount.minOrderAmount,
        maxDiscount: newDiscount.maxDiscount,
        enabled: true,
      });
      
      setDiscountRules(prev => [...prev, created]);
      toast.success(`Discount rule "${newDiscount.name}" added successfully!`);
      setNewDiscount({
        name: '',
        type: 'percentage',
        value: 0,
        minOrderAmount: 0,
        maxDiscount: 0,
      });
      setIsAddDiscountOpen(false);
    } catch (error) {
      console.error('Failed to create discount rule:', error);
      toast.error('Failed to create discount rule');
    } finally {
      setSaving(false);
    }
  };

  const toggleDiscountRule = async (id: string) => {
    try {
      const updated = await discountRulesApi.toggle(id);
      setDiscountRules(prev => prev.map(rule => 
        rule._id === id ? updated : rule
      ));
      toast.success(`Discount rule ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle discount rule:', error);
      toast.error('Failed to update discount rule');
    }
  };

  const deleteDiscountRule = async (id: string) => {
    try {
      await discountRulesApi.delete(id);
      setDiscountRules(prev => prev.filter(rule => rule._id !== id));
      toast.success('Discount rule deleted successfully');
    } catch (error) {
      console.error('Failed to delete discount rule:', error);
      toast.error('Failed to delete discount rule');
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
      {/* GST Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-black">GST / VAT Configuration</CardTitle>
              <CardDescription className="text-black">Configure tax rates for billing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Enable GST</Label>
              <p className="text-xs text-muted-foreground">Apply GST on all transactions</p>
            </div>
            <Switch
              checked={taxConfig.gstEnabled}
              onCheckedChange={(checked) => setTaxConfig({ ...taxConfig, gstEnabled: checked })}
            />
          </div>

          {taxConfig.gstEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="gst-rate">Total GST Rate (%)</Label>
                <Input
                  id="gst-rate"
                  type="number"
                  value={taxConfig.gstRate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, gstRate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cgst-rate">CGST Rate (%)</Label>
                <Input
                  id="cgst-rate"
                  type="number"
                  value={taxConfig.cgstRate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, cgstRate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sgst-rate">SGST Rate (%)</Label>
                <Input
                  id="sgst-rate"
                  type="number"
                  value={taxConfig.sgstRate}
                  onChange={(e) => setTaxConfig({ ...taxConfig, sgstRate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Charge Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-black">Service & Additional Charges</CardTitle>
              <CardDescription className="text-black">Configure service and packaging charges</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Service Charge</Label>
              <p className="text-xs text-muted-foreground">Add service charge to bills</p>
            </div>
            <Switch
              checked={taxConfig.serviceChargeEnabled}
              onCheckedChange={(checked) => setTaxConfig({ ...taxConfig, serviceChargeEnabled: checked })}
            />
          </div>

          {taxConfig.serviceChargeEnabled && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="service-charge">Service Charge Rate (%)</Label>
              <Input
                id="service-charge"
                type="number"
                value={taxConfig.serviceChargeRate}
                onChange={(e) => setTaxConfig({ ...taxConfig, serviceChargeRate: parseFloat(e.target.value) })}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Packaging Charge</Label>
              <p className="text-xs text-muted-foreground">Add packaging charge for takeaway orders</p>
            </div>
            <Switch
              checked={taxConfig.packagingChargeEnabled}
              onCheckedChange={(checked) => setTaxConfig({ ...taxConfig, packagingChargeEnabled: checked })}
            />
          </div>

          {taxConfig.packagingChargeEnabled && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="packaging-charge">Packaging Charge (₹)</Label>
              <Input
                id="packaging-charge"
                type="number"
                value={taxConfig.packagingChargeRate}
                onChange={(e) => setTaxConfig({ ...taxConfig, packagingChargeRate: parseFloat(e.target.value) })}
                min="0"
                step="1"
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveTaxConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Tax Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discount Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-black">Default Discount Rules</CardTitle>
                <CardDescription className="text-black">Manage automatic discount policies</CardDescription>
              </div>
            </div>
            <Dialog open={isAddDiscountOpen} onOpenChange={setIsAddDiscountOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Discount Rule</DialogTitle>
                  <DialogDescription>Create a new discount rule for automatic application</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount-name">Discount Name</Label>
                    <Input
                      id="discount-name"
                      value={newDiscount.name}
                      onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                      placeholder="e.g., Weekend Special"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <Select value={newDiscount.type} onValueChange={(value: 'percentage' | 'fixed') => setNewDiscount({ ...newDiscount, type: value })}>
                      <SelectTrigger id="discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-value">
                      {newDiscount.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={newDiscount.value}
                      onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-order">Minimum Order Amount (₹)</Label>
                    <Input
                      id="min-order"
                      type="number"
                      value={newDiscount.minOrderAmount}
                      onChange={(e) => setNewDiscount({ ...newDiscount, minOrderAmount: parseFloat(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-discount">Maximum Discount Cap (₹)</Label>
                    <Input
                      id="max-discount"
                      type="number"
                      value={newDiscount.maxDiscount}
                      onChange={(e) => setNewDiscount({ ...newDiscount, maxDiscount: parseFloat(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDiscountOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDiscount} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Discount
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {discountRules.map(rule => (
              <div key={rule._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>
                      {rule.type === 'percentage' ? `${rule.value}% off` : `₹${rule.value} off`}
                    </span>
                    <span>•</span>
                    <span>Min. order: ₹{rule.minOrderAmount}</span>
                    <span>•</span>
                    <span>Max. discount: ₹{rule.maxDiscount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleDiscountRule(rule._id)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDiscountRule(rule._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
