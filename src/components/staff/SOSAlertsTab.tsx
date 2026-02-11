import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const callStaffApi = async (body: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/staff-management`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed');
  }
  return res.json();
};

const SOSAlertsTab = () => {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: () => callStaffApi({ entity: 'sos_alert', action: 'list' }),
    refetchInterval: 15000, // Poll every 15s for new alerts
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => callStaffApi({ entity: 'sos_alert', action: 'resolve', id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      toast.success('Alert marked as resolved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingAlerts = alerts.filter((a: any) => a.status === 'pending');
  const resolvedAlerts = alerts.filter((a: any) => a.status === 'resolved');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          SOS Alerts
          {pendingAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">{pendingAlerts.length} Pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : alerts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No SOS alerts received yet</p>
        ) : (
          <div className="space-y-6">
            {pendingAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold text-destructive mb-3">🚨 Pending Alerts</h3>
                <div className="space-y-3">
                  {pendingAlerts.map((alert: any) => (
                    <div key={alert.id} className="border-2 border-destructive rounded-lg p-4 bg-destructive/5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium">{alert.user_email || 'Unknown user'}</p>
                          {alert.phone_number && (
                            <p className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${alert.phone_number}`} className="text-primary hover:underline">{alert.phone_number}</a>
                            </p>
                          )}
                          {alert.description && <p className="text-sm text-muted-foreground">{alert.description}</p>}
                          {alert.latitude && alert.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <MapPin className="w-3 h-3" /> View on Map
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground">{format(new Date(alert.created_at), 'PPpp')}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(alert.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolvedAlerts.length > 0 && (
              <div>
                <h3 className="font-semibold text-muted-foreground mb-3">Resolved ({resolvedAlerts.length})</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Resolved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resolvedAlerts.slice(0, 20).map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.user_email || '-'}</TableCell>
                          <TableCell>{a.phone_number || '-'}</TableCell>
                          <TableCell className="text-xs">{format(new Date(a.created_at), 'PP')}</TableCell>
                          <TableCell className="text-xs">{a.resolved_at ? format(new Date(a.resolved_at), 'PP') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SOSAlertsTab;
