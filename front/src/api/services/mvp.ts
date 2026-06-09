export interface PredictionItem {
  nombre: string;
  fecha_prediccion: string;
  pred_cantidad: number;
}

export interface PredictResponse {
  status_code: number;
  message: string;
  data?: PredictionItem[];
}

export interface TopSoldProductItem {
  name: string;
  demand: number;
}

export interface TopProfitableProductItem {
  name: string;
  profit: number;
}

export interface WeatherImpactIncomeItem {
  month: string;
  rainy_income: number;
  clear_income: number;
}

export interface CalendarImpactIncomeItem {
  month: string;
  festive_income: number;
  normal_income: number;
  weekend_income: number;
}

export interface CalendarUpliftItem {
  holiday_uplift: number;
  weekend_uplift: number;
}

export interface CategoryProfitabilityItem {
  name: string;
  profit: number;
}

export interface TopSoldProductsResponse {
  status_code: number;
  message: string;
  data?: TopSoldProductItem[];
}

export interface TopProfitableProductsResponse {
  status_code: number;
  message: string;
  data?: TopProfitableProductItem[];
}

export interface WeatherImpactIncomeResponse {
  status_code: number;
  message: string;
  data?: WeatherImpactIncomeItem[];
}

export interface CalendarImpactIncomeResponse {
  status_code: number;
  message: string;
  data?: CalendarImpactIncomeItem[];
}

export interface CalendarUpliftResponse {
  status_code: number;
  message: string;
  data?: CalendarUpliftItem;
}

export interface CategoryProfitabilityResponse {
  status_code: number;
  message: string;
  data?: CategoryProfitabilityItem[];
}

export interface UploadResponse {
  status_code: number;
  message: string;
  data?: {
    detail?: string;
  };
  detail?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

type UploadProgressHandler = (progress: number) => void;
type UploadStageHandler = (stage: string) => void;

export async function uploadFile(
  file: File,
  onProgress?: UploadProgressHandler,
  onStageChange?: UploadStageHandler,
  idSucursal?: number | null
): Promise<UploadResponse> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    if (idSucursal !== null && idSucursal !== undefined) {
      formData.append('id_sucursal', String(idSucursal));
    }

    onStageChange?.('Preparando archivo');
    onProgress?.(5);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const uploadRatio = event.loaded / event.total;
      const progress = Math.min(85, Math.round(10 + uploadRatio * 75));
      onStageChange?.('Subiendo archivo');
      onProgress?.(progress);
    };

    xhr.onload = () => {
      let payload: UploadResponse | null = null;

      try {
        payload = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        payload = null;
      }

      onStageChange?.('Procesando datos');
      onProgress?.(95);

      if (payload && typeof payload.status_code === 'number') {
        onStageChange?.('Completado');
        onProgress?.(100);
        resolve(payload);
        return;
      }

      onStageChange?.('Completado');
      onProgress?.(100);
      resolve({
        status_code: xhr.status >= 200 && xhr.status < 300 ? 200 : xhr.status,
        message: xhr.status >= 200 && xhr.status < 300
          ? 'Archivo subido correctamente.'
          : 'No se pudo cargar el archivo.',
      });
    };

    xhr.onerror = () => {
      resolve({
        status_code: 500,
        message: 'No se pudo conectar con el backend.',
      });
    };

    xhr.open('POST', `${API_BASE_URL}/load`);
    xhr.send(formData);
  });
}

export async function predict(idSucursal: number): Promise<PredictResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_sucursal: idSucursal }),
    });

    const payload = await response.json();

    if (typeof payload?.status_code === 'number') {
      return payload as PredictResponse;
    }

    return {
      status_code: response.ok ? 200 : response.status,
      message: response.ok ? 'Prediccion completa' : 'Error en la prediccion',
      data: Array.isArray(payload?.data) ? payload.data : undefined,
    };
  } catch {
    return {
      status_code: 500,
      message: 'No se pudo conectar con el backend.',
    };
  }
}

export interface BatchMetricItem {
  status_code: number;
  message?: string;
  data?: any;
}

export interface FetchMetricsResponse {
  status_code: number;
  message: string;
  data?: Record<string, BatchMetricItem>;
}

const _pendingFetches: Record<string, Promise<FetchMetricsResponse> | undefined> = {};

export async function getAllMetrics(idSucursal: number, limit?: number, startDate?: string, endDate?: string): Promise<FetchMetricsResponse> {
  const key = `${idSucursal}:${limit ?? ''}:${startDate ?? ''}:${endDate ?? ''}`;
  if (_pendingFetches[key]) return _pendingFetches[key]!;

  const p = fetchMetrics(idSucursal, undefined, limit, startDate, endDate);
  _pendingFetches[key] = p;

  try {
    const res = await p;
    return res;
  } finally {
    delete _pendingFetches[key];
  }
}

export async function fetchMetrics(idSucursal: number, metrics?: string[], limit?: number, startDate?: string, endDate?: string): Promise<FetchMetricsResponse> {
  try {
    const params = new URLSearchParams();
    params.append('id_sucursal', String(idSucursal));
    if (metrics && metrics.length) metrics.forEach(m => params.append('metrics', m));
    if (typeof limit === 'number') params.append('limit', String(limit));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`${API_BASE_URL}/metrics?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const payload = await response.json();

    if (typeof payload?.status_code === 'number') {
      return payload as FetchMetricsResponse;
    }

    return {
      status_code: response.ok ? 200 : response.status,
      message: response.ok ? 'Metrics fetched' : 'Error fetching metrics',
      data: payload?.data,
    };
  } catch {
    return {
      status_code: 500,
      message: 'No se pudo conectar con el backend.',
    };
  }
}
