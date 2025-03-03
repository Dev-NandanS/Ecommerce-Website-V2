import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

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
          { text: resultsText, isUser: false, results: data.results }
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

      {/* Chatbot dialog */}
      {isOpen && (
        <div className={`absolute bottom-16 left-0 w-80 sm:w-96 rounded-lg shadow-xl overflow-hidden
          ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className={`p-4 font-medium ${darkMode ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white'}`}>
            Smart Product Search
          </div>
          
          <div className="h-96 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${message.isUser 
                  ? 'ml-auto bg-blue-600 text-white' 
                  : darkMode 
                    ? 'mr-auto bg-gray-700 text-white' 
                    : 'mr-auto bg-gray-100 text-gray-800'} 
                  p-3 rounded-lg max-w-[85%]`}
              >
                <p>{message.text}</p>
                
                {!message.isUser && message.results && message.results.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.results.slice(0, 3).map((result, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded ${darkMode 
                          ? 'bg-gray-800 hover:bg-gray-900 border border-gray-700' 
                          : 'bg-white hover:bg-gray-50 border border-gray-200'}`}
                      >
                        <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {result.title}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          ${typeof result.price === 'string' ? result.price : result.price.toFixed(2)}
                        </p>
                        {result.rating && (
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Rating: {result.rating}
                          </p>
                        )}
                        <button
                          onClick={() => handleAddToCart(result)}
                          className={`mt-2 flex items-center gap-1 px-3 py-1 rounded text-sm 
                            ${darkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          <ShoppingCart size={14} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    ))}
                    {message.results.length > 3 && (
                      <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        + {message.results.length - 3} more results
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className={`mr-auto p-3 rounded-lg ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef}></div>
          </div>
          
          <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about products..."
                className={`flex-1 p-2 rounded ${
                  darkMode 
                    ? 'bg-gray-700 text-white border border-gray-600 focus:ring-blue-500' 
                    : 'bg-white text-gray-800 border border-gray-300 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
              />
              <button 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`p-2 rounded-full ${
                  darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}