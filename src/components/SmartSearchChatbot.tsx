import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShoppingCart, User, Bot, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { Product, SearchRequest } from '../types';

interface SearchResult {
  title: string;
  type: string;
  price: string | number;
  rating: number;
  relevance_score?: number;
}

interface Message {
  text: string;
  isUser: boolean;
  results?: SearchResult[];
  resultPage?: number; // Page number for pagination
}

interface SmartSearchChatbotProps {
  darkMode: boolean;
  addToCart: (product: Product) => void;
}

// Product card component with improved "Add to Cart" button and removed unnecessary "3303" code
const ProductCard = ({ result, darkMode, handleAddToCart }) => {
  // Format price to avoid double dollar signs
  const formatPrice = (price) => {
    if (typeof price === 'string') {
      return price.replace(/[^0-9.]/g, '');
    }
    return price.toFixed(2);
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Product image with better aspect ratio and hover effect */}
      <div className="relative w-full h-40 overflow-hidden group">
        <img 
          src="https://source.unsplash.com/random/300x200/?product" 
          alt={result.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      {/* Product details - improved layout and typography */}
      <div className="p-3">
        <h3 className={`font-semibold truncate text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {result.title}
        </h3>
        <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {result.type}
        </p>
        
        {/* Star Rating Display - improved with transition effects */}
        <div className="flex items-center mt-2">
          {[...Array(5)].map((_, i) => (
            <svg 
              key={i}
              className={`w-3 h-3 ${i < result.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className={`text-xs ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({result.rating.toFixed(1)})
          </span>
        </div>
        
        {/* Better price and "Add to Cart" button layout */}
        <div className="mt-3 flex justify-between items-center">
          <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            ${formatPrice(result.price)}
          </span>
          <button
            onClick={() => handleAddToCart(result)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// Show more results component with intuitive design
const ShowMoreResults = ({ darkMode, onShowMore }) => (
  <button
    onClick={onShowMore}
    className={`mt-4 mx-auto block px-5 py-2.5 rounded-full transition-all hover:shadow-md ${
      darkMode 
        ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' 
        : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
    }`}
  >
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-medium">Show more results</span>
      <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
      </svg>
    </div>
  </button>
);

// Main component with proper export
export function SmartSearchChatbot({ darkMode, addToCart }: SmartSearchChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Hi there! How can I help you find products today?', isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState<number>(100);
  const [priceMax, setPriceMax] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number>(4);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Function to handle adding a product to cart from search results
  const handleAddToCart = (product: SearchResult) => {
    // Transform the search result to match the Product interface
    const cartProduct: Product = {
      id: Date.now(), // Use timestamp as a temporary ID
      name: product.title,
      price: typeof product.price === 'string' 
        ? parseFloat(product.price.replace(/[^0-9.]/g, '')) 
        : product.price,
      description: product.type,
      image: 'https://source.unsplash.com/random/300x200/?product', // Placeholder image
    };
    
    // Add product to cart
    addToCart(cartProduct);
    
    // Provide feedback in chat
    setMessages(prevMessages => [
      ...prevMessages,
      { text: `Added "${product.title}" to your cart!`, isUser: false }
    ]);
  };

  // Function to handle showing more results
  const handleShowMoreResults = (messageIndex: number) => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      if (updatedMessages[messageIndex]) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          resultPage: (updatedMessages[messageIndex].resultPage || 1) + 1
        };
      }
      return updatedMessages;
    });
  };

  const sendMessage = async () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = { text: inputValue, isUser: true };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create search request with filters
      const searchRequest: SearchRequest = {
        query: userMessage.text,
        filters: {}
      };

      // Only add filters that have been set
      if (showFilters) {
        searchRequest.filters = {
          price_min: priceMin,
          price_max: priceMax,
          min_rating: minRating,
          sort_by: "price_asc" // Default sort
        };
      }

      // Call your API
      const response = await fetch('http://localhost:8000/api/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      });

      const data = await response.json();
      
      // Add bot response
      if (data.status === 'success') {
        const resultsText = data.results.length > 0 
          ? 'Here\'s what I found:' 
          : 'I couldn\'t find any products matching your query.';
          
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            text: resultsText, 
            isUser: false, 
            results: data.results,
            resultPage: 1 // Initialize with page 1
          }
        ]);
      } else {
        setMessages(prevMessages => [
          ...prevMessages, 
          { text: 'Sorry, I encountered an error processing your request.', isUser: false }
        ]);
      }
    } catch (error) {
      // Handle errors
      setMessages(prevMessages => [
        ...prevMessages, 
        { text: 'Sorry, there was an error connecting to the search service.', isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Format price to avoid double dollar signs
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      // Remove any existing currency symbols
      const numericPrice = price.replace(/[^0-9.]/g, '');
      return numericPrice;
    }
    return price.toFixed(2);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Chatbot toggle button */}
      <button 
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center 
        ${darkMode 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        aria-label="Chat with Smart Search"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chatbot dialog */}
      {isOpen && (
        <div className={`absolute bottom-16 left-0 w-[90vw] max-w-4xl rounded-lg shadow-xl overflow-hidden
          ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          
          {/* Chat header */}
          <div className={`p-4 flex justify-between items-center ${darkMode ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white'}`}>
            <span className="font-bold text-lg">Smart Product Search</span>
            <button 
              onClick={toggleChat} 
              className="text-white hover:text-gray-200"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Messages area */}
          <div className="h-[50vh] overflow-y-auto p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div key={index} className="w-full">
                  {/* Message with icon */}
                  <div className={`flex items-center gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Bot icon - only show for bot messages */}
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-blue-600" />
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div 
                      className={`rounded-2xl px-4 py-3 max-w-[300px] ${
                        message.isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : darkMode 
                            ? 'bg-gray-700 text-white rounded-tl-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p>{message.text}</p>
                    </div>
                    
                    {/* User icon - only show for user messages */}
                    {message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product grid - Using the new component */}
                  {!message.isUser && message.results && message.results.length > 0 && (
                    <div className="mt-6 w-full pl-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {message.results.slice(
                          message.resultPage ? (message.resultPage - 1) * 4 : 0, 
                          message.resultPage ? message.resultPage * 4 : 4
                        ).map((result, idx) => (
                          <ProductCard
                            key={idx}
                            result={result}
                            darkMode={darkMode}
                            handleAddToCart={handleAddToCart}
                          />
                        ))}
                      </div>
                      
                      {/* Show more results button - only if there are more results to show */}
                      {message.results.length > (message.resultPage || 1) * 4 && (
                        <ShowMoreResults 
                          darkMode={darkMode}
                          onShowMore={() => handleShowMoreResults(index)}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={18} className="text-blue-600" />
                  </div>
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef}></div>
            </div>
          </div>
          
          {/* DataScout Logo Watermark */}
          <div className="py-3 flex flex-col justify-center items-center">
            <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Built using
            </p>
            <img 
              src="/images/datascout-logo.png" 
              alt="DataScout" 
              className="h-8 opacity-60"
              style={{ maxWidth: '200px' }}
            />
          </div>
          
          {/* Input area with integrated compact filters */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Filter Controls - Compact inline version */}
            <div className={`mb-3 px-2 flex flex-wrap items-center gap-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-2 py-1 rounded ${showFilters 
                  ? darkMode ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800' 
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Sliders size={14} />
                <span>Filters</span>
              </button>
              
              {showFilters && (
                <>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input 
                      type="number" 
                      value={priceMin} 
                      min={0} 
                      max={priceMax}
                      onChange={(e) => setPriceMin(Number(e.target.value))}
                      className={`w-16 rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Min"
                    />
                    <span>-</span>
                    <span>$</span>
                    <input 
                      type="number" 
                      value={priceMax} 
                      min={priceMin}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className={`w-16 rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="Max"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span>Rating:</span>
                    <select 
                      value={minRating} 
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className={`rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      <option value={0}>Any</option>
                      <option value={1}>1★+</option>
                      <option value={2}>2★+</option>
                      <option value={3}>3★+</option>
                      <option value={4}>4★+</option>
                      <option value={5}>5★</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 relative rounded-full border overflow-hidden pl-4 pr-1 py-1
              ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about products..."
                className={`flex-1 bg-transparent border-none outline-none ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                }`}
              />
              <button 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2 rounded-full transition-colors ${
                  darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}