import { useState } from 'react';
import { METRIC_CATEGORIES } from '@/types/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DollarSign, Package, Cloud, CalendarHeart, Megaphone, Cog, Users } from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  finance: DollarSign, product: Package, weather: Cloud,
  holidays: CalendarHeart, promotions: Megaphone, operations: Cog, customer: Users,
};

interface AddMetricModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, category: string) => void;
}

export default function AddMetricModal({ open, onClose, onAdd }: AddMetricModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleAdd = (title: string, category: string) => {
    onAdd(title, category);
    setSelectedCategory(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setSelectedCategory(null); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Metric</DialogTitle>
          <DialogDescription>{selectedCategory ? 'Choose a metric' : 'Select a category'}</DialogDescription>
        </DialogHeader>
        {!selectedCategory ? (
          <div className="grid grid-cols-2 gap-2">
            {METRIC_CATEGORIES.map(cat => {
              const Icon = ICONS[cat.key] || Cog;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{cat.label}</div>
                    <div className="text-[10px] text-muted-foreground">{cat.items.length} metrics</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            <button onClick={() => setSelectedCategory(null)} className="text-xs text-muted-foreground hover:text-foreground mb-2">
              ← Back to categories
            </button>
            {METRIC_CATEGORIES.find(c => c.key === selectedCategory)?.items.map(item => (
              <button
                key={item}
                onClick={() => handleAdd(item, selectedCategory)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
