import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShoppingBag, User, Bot, ChevronDown, ChevronUp, Sliders, Star, PlusCircle } from 'lucide-react';
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
  showAllResults?: boolean;
}

interface SmartSearchChatbotProps {
  darkMode: boolean;
  addToCart: (product: Product) => void;
}

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
  
  // Remove the filter header section since we're moving filters to the prompt area
  const [showFilterHeader, setShowFilterHeader] = useState(false); // Set to false to hide the original filter section

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

  // Function to toggle showing all results for a specific message
  const toggleShowAllResults = (messageIndex: number) => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      if (updatedMessages[messageIndex]) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          showAllResults: !updatedMessages[messageIndex].showAllResults
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
            showAllResults: false
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
      {/* Chatbot toggle button - redesigned with a softer shadow and animation */}
      <button 
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105
        ${darkMode 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'}`}
        aria-label="Chat with Smart Search"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chatbot dialog - Enhanced with softer corners and better spacing */}
      {isOpen && (
        <div className={`absolute bottom-16 left-0 w-[90vw] max-w-4xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300
          ${darkMode 
            ? 'bg-gray-800 border border-gray-700 shadow-gray-900/30' 
            : 'bg-white border border-gray-200 shadow-gray-500/20'}`}>
          
          {/* Chat header with minimalistic design - improved with a gradient */}
          <div className={`p-4 flex justify-between items-center ${
            darkMode 
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <span className="font-bold text-lg">Smart Product Search</span>
            <button 
              onClick={toggleChat} 
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Messages area with improved bubble styling */}
          <div className="h-[50vh] overflow-y-auto p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div key={index} className="w-full">
                  {/* Message with icon - Improved alignment and spacing */}
                  <div className={`flex items-start gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Bot icon - only show for bot messages - enhanced with gradient */}
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    
                    {/* Message bubble - improved styling with better transitions */}
                    <div 
                      className={`rounded-2xl px-4 py-3 max-w-[300px] shadow-sm ${
                        message.isUser 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none' 
                          : darkMode 
                            ? 'bg-gray-700 text-white rounded-tl-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p>{message.text}</p>
                    </div>
                    
                    {/* User icon - only show for user messages - enhanced with gradient */}
                    {message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product grid - Enhanced with better card design and spacing */}
                  {!message.isUser && message.results && message.results.length > 0 && (
                    <div className="mt-4 w-full pl-10"> {/* Added padding-left to align with the message */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Show only 4 items or all items if showAllResults is true */}
                        {(message.showAllResults 
                          ? message.results 
                          : message.results.slice(0, 4)).map((result, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded-xl overflow-hidden border transition-transform duration-200 hover:shadow-md hover:-translate-y-1 ${
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
                              {/* "Add to cart" floating action button */}
                              <button
                                onClick={() => handleAddToCart(result)}
                                className="absolute bottom-2 right-2 bg-white text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                                title="Add to cart"
                              >
                                <PlusCircle size={20} />
                              </button>
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
                                  <Star 
                                    key={i}
                                    size={12}
                                    className={`${i < result.rating 
                                      ? 'text-yellow-400 fill-yellow-400' 
                                      : 'text-gray-300'} transition-colors`}
                                  />
                                ))}
                                <span className={`text-xs ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ({result.rating.toFixed(1)})
                                </span>
                              </div>
                              
                              {/* Price - clean display with currency symbol */}
                              <div className="mt-2">
                                <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  ${formatPrice(result.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Show more / Show less button - improved styling */}
                      {message.results.length > 4 && (
                        <button
                          onClick={() => toggleShowAllResults(index)}
                          className={`mt-4 flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full 
                            ${darkMode 
                              ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-blue-600 hover:bg-gray-200'} transition-colors`}
                        >
                          {message.showAllResults ? (
                            <>
                              <ChevronUp size={14} />
                              <span>Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              <span>Show {message.results.length - 4} more results</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator - improved with a more subtle animation */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-none shadow-sm ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef}></div>
            </div>
          </div>
          
          {/* DataScout Logo Watermark with "Built using" text - improved styling */}
          <div className="py-3 flex flex-col justify-center items-center border-t border-opacity-10 
            ${darkMode ? 'border-gray-500' : 'border-gray-300'}">
            <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Built using
            </p>
            <img 
              src="/images/datascout-logo.png" 
              alt="DataScout" 
              className="h-6 opacity-70 hover:opacity-100 transition-opacity"
              style={{ maxWidth: '180px' }}
            />
          </div>
          
          {/* Input area with integrated compact filters - improved visuals */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Filter Controls - Compact and visually appealing */}
            <div className={`mb-3 px-1 flex flex-wrap items-center gap-2.5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors 
                  ${showFilters 
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700' 
                    : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Sliders size={14} />
                <span className="font-medium">Filters</span>
              </button>
              
              {showFilters && (
                <>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                    ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <span className="text-xs font-medium">Price:</span>
                    <span>$</span>
                    <input 
                      type="number" 
                      value={priceMin} 
                      min={0} 
                      max={priceMax}
                      onChange={(e) => setPriceMin(Number(e.target.value))}
                      className={`w-16 rounded-md px-2 py-1 text-xs ${
                        darkMode 
                          ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-400'
                      } focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors`}
                      placeholder="Min"
                    />
                    <span>-</span>
                    <span>$</span>
                    <input 
                      type="number" 
                      value={priceMax} 
                      min={priceMin}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className={`w-16 rounded-md px-2 py-1 text-xs ${
                        darkMode 
                          ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-400'
                      } focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors`}
                      placeholder="Max"
                    />
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                    ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <span className="text-xs font-medium">Rating:</span>
                    <select 
                      value={minRating} 
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className={`rounded-md px-2 py-1 text-xs ${
                        darkMode 
                          ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-400'
                      } focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors`}
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
            
            {/* Search input - improved with rounded styling and better focus state */}
            <div className={`flex items-center gap-2 relative rounded-full border overflow-hidden pl-4 pr-1 py-1.5
              ${darkMode 
                ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500' 
                : 'bg-white border-gray-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400'} 
              transition-colors shadow-sm`}>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about products..."
                className={`flex-1 bg-transparent border-none outline-none text-sm ${
                  darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                }`}
              />
              <button 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-105 ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-50'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-50'
                } disabled:cursor-not-allowed`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}