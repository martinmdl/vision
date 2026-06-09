import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Database, Loader2, Table2 } from 'lucide-react';
import {
  getProcessedDataSummary,
  getProcessedProductsCatalog,
  getProcessedSales,
  getSaleDetail,
  type ProcessedDataOverview,
  type ProcessedProductCatalogItem,
  type ProcessedDataSaleItem,
  type SaleDetailItem,
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
  const [productsCatalog, setProductsCatalog] = useState<ProcessedProductCatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [salesRows, setSalesRows] = useState<ProcessedDataSaleItem[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [saleDetailRows, setSaleDetailRows] = useState<SaleDetailItem[]>([]);
  const [isLoadingSaleDetail, setIsLoadingSaleDetail] = useState(false);

  const loadProcessedData = async () => {
    setIsLoading(true);
    setError('');

    const [summaryResponse, catalogResponse, salesResponse] = await Promise.all([
      getProcessedDataSummary(selectedStoreId),
      getProcessedProductsCatalog(selectedStoreId),
      getProcessedSales(selectedStoreId),
    ]);

    if (summaryResponse.status_code === 200 && summaryResponse.data) {
      setOverview(summaryResponse.data.overview ?? EMPTY_OVERVIEW);
    } else {
      setOverview(EMPTY_OVERVIEW);
      setError(summaryResponse.message || 'No se pudo obtener el resumen de datos.');
    }

    if (catalogResponse.status_code === 200 && Array.isArray(catalogResponse.data)) {
      setProductsCatalog(catalogResponse.data);
    } else {
      setProductsCatalog([]);
      if (!error) {
        setError(catalogResponse.message || 'No se pudo obtener el catalogo de productos.');
      }
    }

    if (salesResponse.status_code === 200 && Array.isArray(salesResponse.data)) {
      setSalesRows(salesResponse.data);
    } else {
      setSalesRows([]);
      if (!error) {
        setError(salesResponse.message || 'No se pudo obtener las ventas procesadas.');
      }
    }

    setSelectedSaleId(null);
    setSaleDetailRows([]);
    setSelectedCategory(null);

    setIsLoading(false);
  };

  const loadSalesByDate = async () => {
    setIsLoadingSales(true);
    setSelectedSaleId(null);
    setSaleDetailRows([]);

    const response = await getProcessedSales(selectedStoreId, startDate || undefined, endDate || undefined);
    if (response.status_code === 200 && Array.isArray(response.data)) {
      setSalesRows(response.data);
    } else {
      setSalesRows([]);
      setError(response.message || 'No se pudo filtrar ventas por fecha.');
    }

    setIsLoadingSales(false);
  };

  const handleSelectSale = async (saleId: number) => {
    setSelectedSaleId(saleId);
    setIsLoadingSaleDetail(true);

    const response = await getSaleDetail(selectedStoreId, saleId);
    if (response.status_code === 200 && Array.isArray(response.data)) {
      setSaleDetailRows(response.data);
    } else {
      setSaleDetailRows([]);
      setError(response.message || 'No se pudo obtener el detalle de la venta.');
    }

    setIsLoadingSaleDetail(false);
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

  const categoriesMap = useMemo(
    () => {
      const map = new Map<string, string[]>();
      for (const item of productsCatalog) {
        const current = map.get(item.category) || [];
        current.push(item.product_name);
        map.set(item.category, current);
      }

      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, products]) => ({
          category,
          products: products.sort((a, b) => a.localeCompare(b)),
        }));
    },
    [productsCatalog]
  );

  const selectedCategoryProducts = useMemo(
    () => categoriesMap.find(item => item.category === selectedCategory)?.products || [],
    [categoriesMap, selectedCategory]
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
          <p className="text-xs text-muted-foreground">Dias con ventas</p>
          <p className="mt-1 text-2xl font-semibold">{overview.sales_days.toLocaleString('es-AR')}</p>
          <p className="text-xs text-muted-foreground mt-1">Dias con actividad comercial</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Rango de datos cargados</h3>
            </div>

            {selectedCategory !== null && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Volver a categorías
              </button>
            )}
          </div>

          {selectedCategory === null ? (
            <>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Primera venta: <span className="text-foreground font-medium">{formatDate(overview.first_sale_date)}</span>
                </p>
                <p className="text-muted-foreground">
                  Ultima venta: <span className="text-foreground font-medium">{formatDate(overview.last_sale_date)}</span>
                </p>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Categorías</p>
                <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                  {categoriesMap.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin categorias disponibles.</p>
                  ) : (
                    categoriesMap.map((item) => (
                      <button
                        key={item.category}
                        type="button"
                        onClick={() => setSelectedCategory(item.category)}
                        className="w-full flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span>{item.category}</span>
                        <span className="font-semibold">{item.products.length}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">Productos en {selectedCategory}</p>
              <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                {selectedCategoryProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin productos para esta categoría.</p>
                ) : (
                  selectedCategoryProducts.map((product) => (
                    <p key={`${selectedCategory}-${product}`} className="text-sm text-foreground rounded-md border border-border/60 px-2 py-1.5 bg-background">
                      {product}
                    </p>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Muestra reciente en ventas</h3>
            </div>

            {selectedSaleId !== null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSaleId(null);
                  setSaleDetailRows([]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Volver a ventas
              </button>
            )}
          </div>

          {selectedSaleId === null ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md border border-border bg-background"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md border border-border bg-background"
                />
                <button
                  type="button"
                  onClick={loadSalesByDate}
                  className="h-9 px-3 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  disabled={isLoadingSales}
                >
                  {isLoadingSales ? 'Filtrando...' : 'Aplicar filtro'}
                </button>
              </div>

              <div className="max-h-72 overflow-auto">
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
                    {salesRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 text-muted-foreground">Sin ventas para mostrar.</td>
                      </tr>
                    ) : (
                      salesRows.map((sale) => (
                        <tr
                          key={sale.id_venta}
                          className="border-b border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => handleSelectSale(sale.id_venta)}
                        >
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
            </>
          ) : isLoadingSaleDetail ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando detalle de venta...</div>
          ) : (
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-2">Producto</th>
                    <th className="py-2 pr-2">Categoria</th>
                    <th className="py-2 pr-2">Cant.</th>
                    <th className="py-2 pr-2">Precio</th>
                    <th className="py-2 pr-2">Costo</th>
                    <th className="py-2 pr-2">Subtotal</th>
                    <th className="py-2 pr-2">Ganancia</th>
                    <th className="py-2 pr-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {saleDetailRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-3 text-muted-foreground">No hay detalle para esta venta.</td>
                    </tr>
                  ) : (
                    saleDetailRows.map((detail) => (
                      <tr key={detail.id_detalle} className="border-b border-border/60">
                        <td className="py-2 pr-2 font-medium">{detail.product_name}</td>
                        <td className="py-2 pr-2">{detail.category}</td>
                        <td className="py-2 pr-2">{detail.quantity}</td>
                        <td className="py-2 pr-2">{formatCurrency(detail.unit_price)}</td>
                        <td className="py-2 pr-2">{formatCurrency(detail.unit_cost)}</td>
                        <td className="py-2 pr-2">{formatCurrency(detail.subtotal)}</td>
                        <td className="py-2 pr-2">{formatCurrency(detail.profit)}</td>
                        <td className="py-2 pr-2">{detail.cancelled ? 'Cancelada' : 'Activa'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
