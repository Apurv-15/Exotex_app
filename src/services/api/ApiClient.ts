import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../../core/logging/Logger';

/**
 * Resilient API Client with automatic Retry (Exponential Backoff) and Logging
 */
class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private MAX_RETRIES = 3;

  private constructor() {
    this.client = axios.create({
      timeout: 15000, // 15 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    // Request Logger
    this.client.interceptors.request.use((config) => {
      logger.debug('API', `Request: [${config.method?.toUpperCase()}] ${config.url}`, {
        params: config.params,
        data: config.data,
      });
      return config;
    });

    // Response Logger & Retry Logic
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('API', `Response: [${response.status}] ${response.config.url}`, {
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as any;
        
        // Handle Timeout/Network Error
        if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
            logger.warn('API', `Network failure detected for ${config?.url}`, { message: error.message });
        } else {
            logger.error('API', `Request failed [${error.response?.status}] for ${config?.url}`, {
                error: error.message,
                data: error.response?.data
            });
        }

        // 1. Check if we should retry
        if (!config || config.retryCount >= this.MAX_RETRIES || (error.response?.status && error.response.status < 500)) {
          return Promise.reject(error);
        }

        // 2. Exponential Backoff
        config.retryCount = config.retryCount || 0;
        config.retryCount += 1;

        const backoff = Math.pow(2, config.retryCount) * 1000;
        logger.info('API', `Retrying request (${config.retryCount}/${this.MAX_RETRIES}) for ${config.url} in ${backoff}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.client(config);
      }
    );
  }

  // Wrapper methods for better typing and error classification
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = ApiClient.getInstance();
