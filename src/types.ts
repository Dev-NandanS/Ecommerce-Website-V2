// src/types.ts

// Product types for the main e-commerce functionality
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Smart Search API types
export interface SearchResult {
  title: string;
  type: string;
  price: string | number;
  rating: number;
  relevance_score?: number;
  bullet_points?: string[];
}

export interface SearchResponse {
  status: string;
  results: SearchResult[];
  total: number;
  debug_info?: {
    processed_keywords: string[];
  };
}

export interface SearchRequest {
  query: string;
  filters?: {
    sort_by?: string;
    price_min?: number | null;
    price_max?: number | null;
    min_rating?: number | null;
  };
}

// Chat message types for the SmartSearchChatbot
export interface ChatMessage {
  text: string;
  isUser: boolean;
  results?: SearchResult[];
}