/**
 * HTTP client for the Rentalot REST API.
 * All MCP tools delegate to this client for actual API calls.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: { code: string; message: string; details?: Array<{ field: string; message: string }> };
  status: number;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  async get<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return this.request<T>(url.toString(), { method: "GET" });
  }

  async post<T = unknown>(path: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}${path}`, { method: "DELETE" });
  }

  private async request<T>(url: string, init: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...init.headers as Record<string, string>,
      },
    });

    const status = res.status;
    if (status === 204) return { status };

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status,
        error: json?.error ?? { code: "unknown", message: `HTTP ${status}` },
      };
    }

    return { status, data: json as T };
  }
}
