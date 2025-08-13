import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Monitor,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

const normalizeHardware = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.hardware)) return raw.hardware;
  return [];
};

const sanitizeItem = (it) => ({
  id: it.id,
  assetTag: it.assetTag ?? '',
  type: it.type ?? 'OUTRO',
  brand: it.brand ?? '',
  model: it.model ?? '',
  serialNumber: it.serialNumber ?? '',
  purchaseDate: it.purchaseDate ?? '',
  purchaseCost: it.purchaseCost ?? '',
  status: it.status ?? 'EM_ESTOQUE',
  condition: it.condition ?? 'BOM',
  location: it.location ?? '',
  notes: it.notes ?? '',
});

const Hardware = () => {
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    assetTag: '',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: '',
    status: 'EM_ESTOQUE',
    condition: 'BOM',
    location: '',
    notes: '',
  });

  const { user } = useAuth();

  useEffect(() => {
    loadHardware();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHardware = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getHardware();
      const list = normalizeHardware(data).map(sanitizeItem);
      setHardware(list);
    } catch (err) {
      console.error(err);
      setHardware([]);
      setError('Erro ao carregar hardware');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const dataToSend = {
        ...formData,
        purchaseCost:
          formData.purchaseCost !== '' && formData.purchaseCost !== null
            ? Number(formData.purchaseCost)
            : null,
        purchaseDate: formData.purchaseDate || null,
      };

      if (editingItem?.id) {
        await apiService.updateHardware(editingItem.id, dataToSend);
      } else {
        await apiService.createHardware(dataToSend);
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      await loadHardware();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Falha ao salvar hardware');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      assetTag: item.assetTag || '',
      type: item.type || '',
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      purchaseDate: item.purchaseDate ? String(item.purchaseDate).split('T')[0] : '',
      purchaseCost: item.purchaseCost ?? '',
      status: item.status || 'EM_ESTOQUE',
      condition: item.condition || 'BOM',
      location: item.location || '',
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        setError('');
        await apiService.deleteHardware(id);
        await loadHardware();
      } catch (err) {
        console.error(err);
        setError(err?.message || 'Falha ao excluir hardware');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      assetTag: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchaseCost: '',
      status: 'EM_ESTOQUE',
      condition: 'BOM',
      location: '',
      notes: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target ?? {};
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const list = useMemo(() => (Array.isArray(hardware) ? hardware : []), [hardware]);

  const filteredHardware = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) =>
      (item.assetTag ?? '').toLowerCase().includes(q) ||
      (item.brand ?? '').toLowerCase().includes(q) ||
      (item.model ?? '').toLowerCase().includes(q) ||
      (item.type ?? '').toLowerCase().includes(q)
    );
  }, [list, searchTerm]);

  const getStatusColor = (status) => {
    const colors = {
      EM_USO: 'bg-green-100 text-green-800',
      EM_ESTOQUE: 'bg-blue-100 text-blue-800',
      EM_MANUTENCAO: 'bg-yellow-100 text-yellow-800',
      DESATIVADO: 'bg-red-100 text-red-800',
      EMPRESTADO: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      EM_USO: 'Em Uso',
      EM_ESTOQUE: 'Em Estoque',
      EM_MANUTENCAO: 'Em Manutenção',
      DESATIVADO: 'Desativado',
      EMPRESTADO: 'Emprestado',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    const labels = {
      LAPTOP: 'Laptop',
      IMPRESSORA: 'Impressora',
      MONITOR: 'Monitor',
      PERIFERICO: 'Periférico',
      REDE: 'Rede',
      OUTRO: 'Outro',
    };
    return labels[type] || type;
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'GESTOR';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hardware</h1>
          <p className="text-gray-600">Gerencie os ativos de hardware</p>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingItem(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Hardware
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Hardware' : 'Adicionar Hardware'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do hardware
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetTag">Tag do Ativo *</Label>
                    <Input
                      id="assetTag"
                      name="assetTag"
                      value={formData.assetTag}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData((p) => ({ ...p, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LAPTOP">Laptop</SelectItem>
                        <SelectItem value="IMPRESSORA">Impressora</SelectItem>
                        <SelectItem value="MONITOR">Monitor</SelectItem>
                        <SelectItem value="PERIFERICO">Periférico</SelectItem>
                        <SelectItem value="REDE">Rede</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" name="model" value={formData.model} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Número de Série</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Data de Compra</Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseCost">Custo de Compra</Label>
                    <Input
                      id="purchaseCost"
                      name="purchaseCost"
                      type="number"
                      step="0.01"
                      value={formData.purchaseCost}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((p) => ({ ...p, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EM_USO">Em Uso</SelectItem>
                        <SelectItem value="EM_ESTOQUE">Em Estoque</SelectItem>
                        <SelectItem value="EM_MANUTENCAO">Em Manutenção</SelectItem>
                        <SelectItem value="DESATIVADO">Desativado</SelectItem>
                        <SelectItem value="EMPRESTADO">Emprestado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condição</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData((p) => ({ ...p, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOVO">Novo</SelectItem>
                          <SelectItem value="BOM">Bom</SelectItem>
                          <SelectItem value="REGULAR">Regular</SelectItem>
                          <SelectItem value="RUIM">Ruim</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar hardware..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHardware.map((item) => (
          <Card key={item.id ?? item.assetTag}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.assetTag}</CardTitle>
                  <CardDescription>
                    {getTypeLabel(item.type)}{(item.brand || item.model) ? ' - ' : ''}{item.brand} {item.model}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!!item.serialNumber && (
                  <p className="text-sm text-gray-600">
                    <strong>S/N:</strong> {item.serialNumber}
                  </p>
                )}
                {!!item.location && (
                  <p className="text-sm text-gray-600">
                    <strong>Local:</strong> {item.location}
                  </p>
                )}
                {!!item.purchaseDate && (
                  <p className="text-sm text-gray-600">
                    <strong>Compra:</strong>{' '}
                    {new Date(item.purchaseDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {!!item.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Obs:</strong> {item.notes}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHardware.length === 0 && !loading && (
        <div className="text-center py-12">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum hardware encontrado
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando um novo item de hardware'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Hardware;
