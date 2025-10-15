import axios from 'axios';

// Configuration for n8n API
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://smabathavner.n8n.ailabben.no';

const api = axios.create({
  baseURL: N8N_BASE_URL,
  timeout: 60000, // Increased timeout for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Add request interceptor for authentication if needed
api.interceptors.request.use((config) => {
  // Add authentication headers here if your n8n setup requires it
  // const token = localStorage.getItem('n8n-token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export interface N8nWebhookResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Helper function for retry logic
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const n8nApi = {
  // Send message to specific agent webhook with retry logic
  sendMessage: async (webhookId: string, message: string): Promise<N8nWebhookResponse> => {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sending message to n8n (attempt ${attempt}/${maxRetries}):`, { webhookId, message: message.substring(0, 50) + '...' });
        
        // Build webhook URL using base URL and webhook ID
        const baseUrl = N8N_BASE_URL.endsWith('/') ? N8N_BASE_URL.slice(0, -1) : N8N_BASE_URL;
        const fullWebhookUrl = `${baseUrl}/webhook/${webhookId}`;
        
        console.log('🔗 Making request to:', fullWebhookUrl);
        console.log('📤 Request payload:', { message, timestamp: new Date().toISOString() });
        
        const response = await axios.post(fullWebhookUrl, {
          message,
          timestamp: new Date().toISOString(),
        }, {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false
        });

        console.log('n8n response received:', { status: response.status, data: response.data });
        
        // Handle different response formats from n8n
        let responseMessage = '';
        if (typeof response.data === 'string') {
          responseMessage = response.data;
        } else if (response.data.output) {
          // Extract content from {"output": "actual message"} format
          responseMessage = response.data.output;
        } else if (response.data.message) {
          responseMessage = response.data.message;
        } else if (response.data.response) {
          responseMessage = response.data.response;
        } else {
          responseMessage = JSON.stringify(response.data);
        }
        
        return {
          success: true,
          message: responseMessage,
          data: response.data
        };
        
      } catch (error) {
        console.error(`🚨 n8n API attempt ${attempt} failed:`, error);
        
        if (axios.isAxiosError(error)) {
          console.error('📊 Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            code: error.code,
            message: error.message
          });
        }
        
        lastError = error;
        
        // Check if we should retry
        const shouldRetry = axios.isAxiosError(error) && (
          error.code === 'NETWORK_ERROR' ||
          error.code === 'ECONNABORTED' ||
          error.response?.status === 429 || // Rate limit
          error.response?.status === 502 || // Bad Gateway
          error.response?.status === 503 || // Service Unavailable
          error.response?.status === 504    // Gateway Timeout
        );
        
        if (!shouldRetry || attempt === maxRetries) {
          // Don't retry for these errors or if we've exhausted retries
          break;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      }
    }
    
    // Handle the final error after all retries failed
    console.error('All n8n API attempts failed:', lastError);
    
    if (axios.isAxiosError(lastError)) {
      if (lastError.response?.status === 404) {
        throw new Error('Webhook not found. Check your n8n workflow is active.');
      } else if (lastError.response?.status >= 500) {
        throw new Error('n8n server error. Please try again later.');
      } else if (lastError.code === 'NETWORK_ERROR' || lastError.message.includes('CORS')) {
        throw new Error('Cannot connect to n8n server. Check your connection and CORS settings.');
      } else if (lastError.response?.status === 400) {
        throw new Error('Invalid request format. Please check the message.');
      } else if (lastError.response?.status === 0 || !lastError.response) {
        throw new Error('CORS error: n8n server must allow requests from your domain. Check n8n CORS configuration.');
      }
    }
    
    throw new Error('Failed to communicate with AI agent after multiple attempts');
  },

  // Health check for n8n connection
  healthCheck: async (): Promise<boolean> => {
    try {
      // Try to reach the base URL
      await api.get('/');
      return true;
    } catch {
      return false;
    }
  }
};

export default n8nApi;