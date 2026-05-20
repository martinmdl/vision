import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { uploadFile } from '@/api/services/mvp.ts';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UploadDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDataModal({ open, onOpenChange }: UploadDataModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isExcelFile = (file: File) => /\.(xls|xlsx)$/i.test(file.name);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!isExcelFile(file)) {
      toast({
        title: 'Formato no soportado',
        description: 'Sube un archivo Excel con extensión .xls o .xlsx.',
        variant: 'destructive',
      });
      resetState();
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: 'Falta el archivo',
        description: 'Selecciona un archivo Excel antes de subirlo.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('Iniciando carga');

    try {
      const response = await uploadFile(
        selectedFile,
        (progress) => setUploadProgress(progress),
        (stage) => setUploadStage(stage),
      );

      if (response?.status_code === 200) {
        toast({
          title: 'Archivo cargado',
          description: response.message ?? `${selectedFile.name} se subió correctamente.`,
        });
        onOpenChange(false);
        resetState();
        return;
      }

      toast({
        title: 'No se pudo cargar el archivo',
        description: response?.data?.detail ?? response?.detail ?? 'Intenta nuevamente con otro archivo.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Excel file</DialogTitle>
          <DialogDescription>Choose an .xls or .xlsx file to load sales data into the backend.</DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-background p-2 text-foreground shadow-sm">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">Excel import</p>
              <p className="text-sm text-muted-foreground">Only .xls and .xlsx files are accepted.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} type="button">
                  Choose file
                </Button>
                <Button onClick={handleSubmit} disabled={!selectedFile || isUploading} type="button">
                  {isUploading ? 'Uploading...' : 'Upload file'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected yet.'}
              </p>

              {isUploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{uploadStage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}