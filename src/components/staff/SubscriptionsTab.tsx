import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Edit, Trash2, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  amount: number;
  payment_reference: string | null;
  payment_method: string;
  created_at: string;
  expires_at: string | null;
}

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  onRefresh: () => void;
}

const SubscriptionsTab = ({ subscriptions, onRefresh }: SubscriptionsTabProps) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newPaymentRef, setNewPaymentRef] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleSubscriptionStatus = async (subscription: Subscription) => {
    setIsUpdating(subscription.id);
    try {
      const newStatus = subscription.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          action: 'staff_update',
          subscription_id: subscription.id,
          new_status: newStatus
        }
      });

      if (error) throw error;
      
      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    
    setIsUpdating(subscriptionId);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          action: 'staff_delete',
          subscription_id: subscriptionId
        }
      });

      if (error) throw error;
      
      toast.success('Subscription deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    } finally {
      setIsUpdating(null);
    }
  };

  const addSubscription = async () => {
    if (!newUserId.trim()) {
      toast.error('User ID is required');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          action: 'staff_create',
          target_user_id: newUserId.trim(),
          payment_reference: newPaymentRef.trim() || 'STAFF_CREATED'
        }
      });

      if (error) throw error;
      
      toast.success('Subscription created successfully');
      setShowAddDialog(false);
      setNewUserId('');
      setNewPaymentRef('');
      onRefresh();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage premium subscribers</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No subscriptions yet</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="space-y-1">
                  <p className="font-mono text-sm text-muted-foreground">
                    User: {sub.user_id}
                  </p>
                  <p className="text-sm">
                    Payment Ref: {sub.payment_reference || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">${sub.amount}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sub.status === 'active'}
                      onCheckedChange={() => toggleSubscriptionStatus(sub)}
                      disabled={isUpdating === sub.id}
                    />
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubscription(sub.id)}
                    disabled={isUpdating === sub.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Manually create a subscription for a user. You'll need their User ID from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID (UUID)</Label>
              <Input
                id="userId"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentRef">Payment Reference (optional)</Label>
              <Input
                id="paymentRef"
                placeholder="e.g., PayPal transaction ID"
                value={newPaymentRef}
                onChange={(e) => setNewPaymentRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addSubscription} disabled={isAdding}>
              {isAdding ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionsTab;
