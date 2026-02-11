import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, MapPin, Hotel, Globe } from 'lucide-react';
import { toast } from 'sonner';

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

const DestinationsHotelsTab = () => {
  const queryClient = useQueryClient();
  const [destDialog, setDestDialog] = useState(false);
  const [hotelDialog, setHotelDialog] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [destForm, setDestForm] = useState({ id: '', name: '', description: '', latitude: '', longitude: '' });
  const [hotelForm, setHotelForm] = useState({ id: '', name: '', destination_id: '', latitude: '', longitude: '', website: '' });

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destinations').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hotels').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const destMutation = useMutation({
    mutationFn: () => callStaffApi({
      entity: 'destination',
      action: editingDestId ? 'update' : 'create',
      ...destForm,
      latitude: destForm.latitude ? parseFloat(destForm.latitude) : null,
      longitude: destForm.longitude ? parseFloat(destForm.longitude) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast.success(editingDestId ? 'Destination updated' : 'Destination added');
      setDestDialog(false);
      resetDestForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDestMutation = useMutation({
    mutationFn: (id: string) => callStaffApi({ entity: 'destination', action: 'delete', id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast.success('Destination deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hotelMutation = useMutation({
    mutationFn: () => callStaffApi({
      entity: 'hotel',
      action: editingHotelId ? 'update' : 'create',
      ...hotelForm,
      latitude: hotelForm.latitude ? parseFloat(hotelForm.latitude) : null,
      longitude: hotelForm.longitude ? parseFloat(hotelForm.longitude) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels-admin'] });
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success(editingHotelId ? 'Hotel updated' : 'Hotel added');
      setHotelDialog(false);
      resetHotelForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteHotelMutation = useMutation({
    mutationFn: (id: string) => callStaffApi({ entity: 'hotel', action: 'delete', id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels-admin'] });
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success('Hotel deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetDestForm = () => {
    setEditingDestId(null);
    setDestForm({ id: '', name: '', description: '', latitude: '', longitude: '' });
  };

  const resetHotelForm = () => {
    setEditingHotelId(null);
    setHotelForm({ id: '', name: '', destination_id: '', latitude: '', longitude: '', website: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Destinations & Hotels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="destinations">
          <TabsList>
            <TabsTrigger value="destinations">
              <MapPin className="w-4 h-4 mr-1" /> Destinations ({destinations.length})
            </TabsTrigger>
            <TabsTrigger value="hotels">
              <Hotel className="w-4 h-4 mr-1" /> Hotels ({hotels.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="destinations" className="space-y-4">
            <Button size="sm" onClick={() => { resetDestForm(); setDestDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Destination
            </Button>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Coords</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-xs">
                        {d.latitude && d.longitude ? `${d.latitude.toFixed(2)}, ${d.longitude.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingDestId(d.id);
                            setDestForm({ id: d.id, name: d.name, description: d.description, latitude: d.latitude?.toString() || '', longitude: d.longitude?.toString() || '' });
                            setDestDialog(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDestMutation.mutate(d.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-4">
            <Button size="sm" onClick={() => { resetHotelForm(); setHotelDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Hotel
            </Button>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((h: any) => {
                    const dest = destinations.find((d: any) => d.id === h.destination_id);
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.name}</TableCell>
                        <TableCell>{dest?.name || h.destination_id}</TableCell>
                        <TableCell>
                          {h.website ? (
                            <a href={h.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Link
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingHotelId(h.id);
                              setHotelForm({ id: h.id, name: h.name, destination_id: h.destination_id, latitude: h.latitude?.toString() || '', longitude: h.longitude?.toString() || '', website: h.website || '' });
                              setHotelDialog(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteHotelMutation.mutate(h.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Destination Dialog */}
        <Dialog open={destDialog} onOpenChange={setDestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDestId ? 'Edit' : 'Add'} Destination</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingDestId && (
                <div>
                  <Label>ID (slug, e.g. "lake-kivu") *</Label>
                  <Input value={destForm.id} onChange={e => setDestForm(f => ({ ...f, id: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Name *</Label>
                <Input value={destForm.name} onChange={e => setDestForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={destForm.description} onChange={e => setDestForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={destForm.latitude} onChange={e => setDestForm(f => ({ ...f, latitude: e.target.value }))} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={destForm.longitude} onChange={e => setDestForm(f => ({ ...f, longitude: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={() => destMutation.mutate()} disabled={!destForm.name || !destForm.description || destMutation.isPending}>
                {destMutation.isPending ? 'Saving...' : editingDestId ? 'Update' : 'Add'} Destination
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hotel Dialog */}
        <Dialog open={hotelDialog} onOpenChange={setHotelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHotelId ? 'Edit' : 'Add'} Hotel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingHotelId && (
                <div>
                  <Label>ID (slug, e.g. "hotel-serena") *</Label>
                  <Input value={hotelForm.id} onChange={e => setHotelForm(f => ({ ...f, id: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Name *</Label>
                <Input value={hotelForm.name} onChange={e => setHotelForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Destination *</Label>
                <Select value={hotelForm.destination_id} onValueChange={v => setHotelForm(f => ({ ...f, destination_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent>
                    {destinations.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website URL</Label>
                <Input value={hotelForm.website} onChange={e => setHotelForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={hotelForm.latitude} onChange={e => setHotelForm(f => ({ ...f, latitude: e.target.value }))} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={hotelForm.longitude} onChange={e => setHotelForm(f => ({ ...f, longitude: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={() => hotelMutation.mutate()} disabled={!hotelForm.name || !hotelForm.destination_id || hotelMutation.isPending}>
                {hotelMutation.isPending ? 'Saving...' : editingHotelId ? 'Update' : 'Add'} Hotel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DestinationsHotelsTab;
