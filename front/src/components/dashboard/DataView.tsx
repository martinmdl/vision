import { useEffect, useMemo, useState } from 'react';
import { Database, FileSpreadsheet, Loader2, Table2 } from 'lucide-react';
import {
  getProcessedDataSummary,
  type ProcessedDataCategoryItem,
  type ProcessedDataOverview,
  type ProcessedDataPipelineItem,
  type ProcessedDataSaleItem,
} from '@/api/services/mvp.ts';

interface DataViewProps {
  selectedStoreId: number;
}

const EMPTY_OVERVIEW: ProcessedDataOverview = {
  sales_rows: 0,
  products_rows: 0,
  sale_detail_rows: 0,
  sales_days: 0,
  total_income: 0,
  first_sale_date: null,
  last_sale_date: null,
};

function formatCurrency(value: number) {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-AR');
}

export default function DataView({ selectedStoreId }: DataViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<ProcessedDataOverview>(EMPTY_OVERVIEW);
  const [pipeline, setPipeline] = useState<ProcessedDataPipelineItem[]>([]);
  const [topCategories, setTopCategories] = useState<ProcessedDataCategoryItem[]>([]);
  const [salesSample, setSalesSample] = useState<ProcessedDataSaleItem[]>([]);

  const loadProcessedData = async () => {
    setIsLoading(true);
    setError('');

    const response = await getProcessedDataSummary(selectedStoreId);

    if (response.status_code === 200 && response.data) {
      setOverview(response.data.overview ?? EMPTY_OVERVIEW);
      setPipeline(Array.isArray(response.data.pipeline) ? response.data.pipeline : []);
      setTopCategories(Array.isArray(response.data.top_categories) ? response.data.top_categories : []);
      setSalesSample(Array.isArray(response.data.sales_sample) ? response.data.sales_sample : []);
    } else {
      setOverview(EMPTY_OVERVIEW);
      setPipeline([]);
      setTopCategories([]);
      setSalesSample([]);
      setError(response.message || 'No se pudo obtener el resumen de datos.');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    loadProcessedData();

    const onDataUploaded = (event: Event) => {
      if (!mounted) {
        return;
      }

      const detail = (event as CustomEvent<{ storeId?: number | null }>).detail;
      if (!detail || detail.storeId == null || detail.storeId === selectedStoreId) {
        loadProcessedData();
      }
    };

    window.addEventListener('vision:data-uploaded', onDataUploaded as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('vision:data-uploaded', onDataUploaded as EventListener);
    };
  }, [selectedStoreId]);

  const hasRows = useMemo(
    () => overview.sales_rows > 0 || overview.products_rows > 0 || overview.sale_detail_rows > 0,
    [overview]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando resumen de datos procesados...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!hasRows) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <h3 className="text-lg font-semibold mb-2">No hay datos procesados para esta sucursal</h3>
        <p className="text-sm text-muted-foreground">
          Sube un archivo Excel para ver como se transformo en tablas de Postgres.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 p-4">
        <p className="text-xs text-slate-600">Pipeline de carga de datos</p>
        <p className="mt-1 text-sm text-slate-700">
          Resumen en tiempo real de como el archivo Excel alimenta las tablas operativas en Postgres.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ventas cargadas</p>
          <p className="mt-1 text-2xl font-semibold">{overview.sales_rows.toLocaleString('es-AR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Filas en tabla ventas</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Productos cargados</p>
          <p className="mt-1 text-2xl font-semibold">{overview.products_rows.toLocaleString('es-AR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Filas en tabla productos</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Detalle de ventas</p>
          <p className="mt-1 text-2xl font-semibold">{overview.sale_detail_rows.toLocaleString('es-AR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Filas en tabla detalle_ventas</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ingreso total registrado</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(overview.total_income)}</p>
          <p className="text-xs text-muted-foreground mt-1">{overview.sales_days} dias con ventas</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Como se proceso el Excel</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {pipeline.map((item) => (
            <div key={`${item.source_sheet}-${item.target_table}`} className="rounded-lg border border-border/80 bg-background p-3">
              <p className="text-xs text-muted-foreground">Hoja Excel</p>
              <p className="text-sm font-medium">{item.source_sheet}</p>
              <p className="text-xs text-muted-foreground mt-2">Tabla Postgres</p>
              <p className="text-sm font-medium">{item.target_table}</p>
              <p className="text-xs text-muted-foreground mt-2">Filas importadas</p>
              <p className="text-sm font-semibold">{item.rows.toLocaleString('es-AR')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Rango de datos cargados</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Primera venta: <span className="text-foreground font-medium">{formatDate(overview.first_sale_date)}</span>
            </p>
            <p className="text-muted-foreground">
              Ultima venta: <span className="text-foreground font-medium">{formatDate(overview.last_sale_date)}</span>
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Categorias con mas productos</p>
            <div className="space-y-2">
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin categorias disponibles.</p>
              ) : (
                topCategories.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm">
                    <span>{item.name}</span>
                    <span className="font-semibold">{item.products_count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Table2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Muestra reciente en ventas</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">ID venta</th>
                  <th className="py-2 pr-2">Fecha</th>
                  <th className="py-2 pr-2">Tipo</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {salesSample.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-muted-foreground">Sin ventas para mostrar.</td>
                  </tr>
                ) : (
                  salesSample.map((sale) => (
                    <tr key={sale.id_venta} className="border-b border-border/60">
                      <td className="py-2 pr-2 font-medium">{sale.id_venta}</td>
                      <td className="py-2 pr-2">{formatDate(sale.sale_date)}</td>
                      <td className="py-2 pr-2">{sale.sale_type}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
