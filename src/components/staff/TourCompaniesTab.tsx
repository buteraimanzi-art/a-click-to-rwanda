import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface TourCompany {
  id: string;
  name: string;
  description: string;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  website: string | null;
  created_at: string;
}

const emptyForm = { name: '', description: '', phone: '', email: '', image_url: '', website: '' };

const TourCompaniesTab = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['tour-companies-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tour_companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TourCompany[];
    },
  });

  const callEdgeFunction = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-tour-companies`,
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const action = editingId ? 'update' : 'create';
      const payload = editingId ? { action, id: editingId, ...formData } : { action, ...formData };
      return callEdgeFunction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-companies-admin'] });
      toast.success(editingId ? 'Company updated' : 'Company added');
      setDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => callEdgeFunction({ action: 'delete', id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-companies-admin'] });
      toast.success('Company deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (company: TourCompany) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      description: company.description,
      phone: company.phone || '',
      email: company.email || '',
      image_url: company.image_url || '',
      website: company.website || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Tour Companies ({companies.length})
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Tour Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={formData.image_url} onChange={e => setFormData(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={formData.website} onChange={e => setFormData(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!formData.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add'} Company
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : companies.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No tour companies added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TourCompaniesTab;
