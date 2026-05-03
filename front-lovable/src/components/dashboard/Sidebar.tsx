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
      <aside className="w-72 min-h-screen bg-sidebar-bg flex flex-col border-r border-sidebar-border shrink-0">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-semibold text-sidebar-fg-bright tracking-tight">Retail Analytics</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-fg/50" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search stores..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-sidebar-muted text-sidebar-fg-bright placeholder:text-sidebar-fg/40 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-accent"
            />
          </div>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-3 py-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-fg/40">Stores</span>
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
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg mx-1 mb-0.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-sidebar-muted text-sidebar-fg-bright' : 'text-sidebar-fg hover:bg-sidebar-muted/50'
                  }`}
                  onClick={() => onSelectStore(store.id)}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-sidebar-accent' : 'bg-sidebar-fg/20'}`} />
                  <span className="text-sm truncate flex-1">{store.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded hover:bg-sidebar-fg/10" title="Upload data">
                      <Upload className="w-3 h-3" />
                    </button>
                    <button
                      className={`p-1 rounded hover:bg-sidebar-fg/10 ${viewMode === 'metrics' && isSelected ? 'text-sidebar-accent' : ''}`}
                      onClick={e => { e.stopPropagation(); onSelectStore(store.id); onViewChange('metrics'); }}
                      title="Metrics"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </button>
                    <button
                      className={`p-1 rounded hover:bg-sidebar-fg/10 ${viewMode === 'predictions' && isSelected ? 'text-sidebar-accent' : ''}`}
                      onClick={e => { e.stopPropagation(); onSelectStore(store.id); onViewChange('predictions'); }}
                      title="Predictions"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-destructive/20 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(store.id); }}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3 space-y-1.5 border-t border-sidebar-border">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-sidebar-fg-bright rounded-lg bg-sidebar-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Add Store
          </button>
          <button
            onClick={() => setShowInstructions(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-fg hover:bg-sidebar-muted rounded-lg transition-colors"
          >
            <Info className="w-3.5 h-3.5" /> Instructions
          </button>
        </div>
      </aside>

      {/* Add Store Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
            <DialogDescription>Enter a name for the new store location.</DialogDescription>
          </DialogHeader>
          <Input
            value={newStoreName}
            onChange={e => setNewStoreName(e.target.value)}
            placeholder="Store name"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Store</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Store</DialogTitle>
            <DialogDescription>This action cannot be undone. All data for this store will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) onDeleteStore(deleteTarget); setDeleteTarget(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Getting Started</DialogTitle>
            <DialogDescription>How to use the Retail Analytics Dashboard</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">1. Add a store</strong> — Click "+ Add Store" to create a new location.</p>
            <p><strong className="text-foreground">2. Upload data</strong> — Use the upload icon to import Excel files with sales data.</p>
            <p><strong className="text-foreground">3. View metrics</strong> — Click the chart icon to see performance dashboards.</p>
            <p><strong className="text-foreground">4. Predictions</strong> — Use the trend icon to view demand forecasts.</p>
            <p><strong className="text-foreground">5. Customize</strong> — Add, remove, or configure metric cards to fit your needs.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
