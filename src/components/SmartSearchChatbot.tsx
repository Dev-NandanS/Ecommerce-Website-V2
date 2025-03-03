import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShoppingCart, User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';
// Custom styles for chat bubbles now applied inline

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
      // Call your API
      const response = await fetch('http://localhost:8000/api/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
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

      {/* Chatbot dialog - Based on wireframe with WhatsApp style */}
      {isOpen && (
        <div className={`absolute bottom-16 left-0 w-[90vw] max-w-4xl rounded-lg shadow-xl overflow-hidden
          ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          
          {/* Chat header with minimalistic design */}
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
          
          {/* Messages area with WhatsApp style bubbles and icons */}
          <div className="h-[50vh] overflow-y-auto p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div key={index} className="w-full">
                  {/* Message with icon - Fixed alignment to match wireframe */}
                  <div className={`flex items-center gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Bot icon - only show for bot messages */}
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-blue-600" />
                      </div>
                    )}
                    
                    {/* Message bubble - fixed position */}
                    <div 
                      style={{
                        maxWidth: '300px',
                        padding: '0.75em',
                        borderInline: '1.5em solid transparent',
                        borderRadius: 'calc(1em + 1.5em)/1em',
                        mask: `radial-gradient(100% 100% at ${message.isUser ? '100%' : '0'} 0, transparent 99%, black 102%) 
                               ${message.isUser ? '100%' : '0'} 100%/1.5em 1.5em no-repeat,
                               linear-gradient(black 0 0) padding-box`,
                        background: message.isUser 
                          ? '#2563eb' 
                          : darkMode 
                            ? '#374151' 
                            : '#f3f4f6',
                        color: message.isUser || darkMode ? 'white' : '#1f2937',
                        borderBottomRightRadius: message.isUser ? '0' : undefined,
                        borderBottomLeftRadius: !message.isUser ? '0' : undefined,
                      }}
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
                  
                  {/* Product grid - Limited to 4 by default */}
                  {!message.isUser && message.results && message.results.length > 0 && (
                    <div className="mt-4 w-full pl-10"> {/* Added padding-left to align with the message */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Show only 4 items or all items if showAllResults is true */}
                        {(message.showAllResults 
                          ? message.results 
                          : message.results.slice(0, 4)).map((result, idx) => (
                          <div 
                            key={idx} 
                            className={`rounded-md overflow-hidden border ${darkMode 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200'}`}
                          >
                            {/* Product image placeholder */}
                            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                              <img 
                                src="https://source.unsplash.com/random/300x200/?product" 
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Product details */}
                            <div className="p-3">
                              <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {result.title}
                              </h3>
                              <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {result.type}
                              </p>
                              <div className="mt-2 flex justify-between items-center">
                                <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  ${typeof result.price === 'string' ? result.price : result.price.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => handleAddToCart(result)}
                                  className="text-xs bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                                >
                                  add to cart
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Show more / Show less button */}
                      {message.results.length > 4 && (
                        <button
                          onClick={() => toggleShowAllResults(index)}
                          className={`mt-3 flex items-center gap-1 text-sm font-medium 
                            ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          {message.showAllResults ? (
                            <>
                              <ChevronUp size={16} />
                              <span>Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              <span>Show {message.results.length - 4} more results</span>
                            </>
                          )}
                        </button>
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
          
          {/* DataScout Logo Watermark with "Built using" text */}
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
          
          {/* Input area similar to wireframe */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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