import { useState } from 'react';
import { Search, Plus, Upload, BarChart3, TrendingUp, Trash2, Info, Store as StoreIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Store, ViewMode } from '@/types/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SidebarProps {
  stores: Store[];
  selectedStoreId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectStore: (id: string) => void;
  onAddStore: (name: string) => void;
  onDeleteStore: (id: string) => void;
  onViewChange: (mode: ViewMode) => void;
  viewMode: ViewMode;
}

export default function Sidebar({
  stores, selectedStoreId, searchQuery, onSearchChange,
  onSelectStore, onAddStore, onDeleteStore, onViewChange, viewMode,
}: SidebarProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');

  const handleAdd = () => {
    if (newStoreName.trim()) {
      onAddStore(newStoreName.trim());
      setNewStoreName('');
      setShowAddModal(false);
    }
  };

  return (
    <>
      <aside className="w-96 h-screen bg-sidebar-bg flex flex-col border-r border-sidebar-border shrink-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-base font-semibold text-sidebar-fg-bright tracking-tight">Vision</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-fg/50" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Buscar tiendas..."
              className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-sidebar-muted text-sidebar-fg-bright placeholder:text-sidebar-fg/40 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-accent"
            />
          </div>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-widest text-sidebar-fg/40">Tiendas</span>
          </div>
          <AnimatePresence>
            {stores.map(store => {
              const isSelected = store.id === selectedStoreId;
              return (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg mx-1 mb-1 cursor-pointer transition-colors ${
                    isSelected ? 'bg-sidebar-muted text-sidebar-fg-bright' : 'text-sidebar-fg hover:bg-sidebar-muted/50'
                  }`}
                  onClick={() => onSelectStore(store.id)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-sidebar-accent' : 'bg-sidebar-fg/20'}`} />
                  <span className="text-base truncate flex-1">{store.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded hover:bg-sidebar-fg/10" title="Subir datos">
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded hover:bg-sidebar-fg/10 ${viewMode === 'metrics' && isSelected ? 'text-sidebar-accent' : ''}`}
                      onClick={e => { e.stopPropagation(); onSelectStore(store.id); onViewChange('metrics'); }}
                      title="Metricas"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded hover:bg-sidebar-fg/10 ${viewMode === 'predictions' && isSelected ? 'text-sidebar-accent' : ''}`}
                      onClick={e => { e.stopPropagation(); onSelectStore(store.id); onViewChange('predictions'); }}
                      title="Predicciones"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-destructive/20 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(store.id); }}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 space-y-2 border-t border-sidebar-border">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sidebar-fg-bright rounded-lg bg-sidebar-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Agregar tienda
          </button>
          <button
            onClick={() => setShowInstructions(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sidebar-fg hover:bg-sidebar-muted rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" /> Instrucciones
          </button>
        </div>
      </aside>

      {/* Add Store Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar nueva tienda</DialogTitle>
            <DialogDescription>Ingresa un nombre para la nueva sucursal.</DialogDescription>
          </DialogHeader>
          <Input
            value={newStoreName}
            onChange={e => setNewStoreName(e.target.value)}
            placeholder="Nombre de la tienda"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Agregar tienda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tienda</DialogTitle>
            <DialogDescription>Esta accion no se puede deshacer. Todos los datos de esta tienda se eliminaran de forma permanente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) onDeleteStore(deleteTarget); setDeleteTarget(null); }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Primeros pasos</DialogTitle>
            <DialogDescription>Como usar el panel de analitica de retail</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">1. Agregar una tienda</strong> - Haz clic en "Agregar tienda" para crear una nueva sucursal.</p>
            <p><strong className="text-foreground">2. Subir datos</strong> - Usa el icono de carga para importar archivos Excel con ventas.</p>
            <p><strong className="text-foreground">3. Ver metricas</strong> - Haz clic en el icono de grafico para ver los tableros.</p>
            <p><strong className="text-foreground">4. Predicciones</strong> - Usa el icono de tendencia para ver pronosticos de demanda.</p>
            <p><strong className="text-foreground">5. Personalizar</strong> - Agrega, elimina o configura tarjetas de metricas segun tu necesidad.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
