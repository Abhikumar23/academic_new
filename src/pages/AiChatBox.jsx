import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Trash2, MessageSquare, X, Minimize2, MessageCircle } from "lucide-react";


export default function AiChatBox() {
  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversation();
  }, []);

  const loadConversation = () => {
    try {
      const result = localStorage.getItem("ai-conversation");
      
      if (result) {
        const data = JSON.parse(result);
        setMessages(data.messages || []);
        setConversationId(data.id);
      } else {
        const newId = `conv_${Date.now()}`;
        setConversationId(newId);
      }
    } catch (err) {
      console.error("Failed to load conversation from localStorage:", err);
      const newId = `conv_${Date.now()}`;
      setConversationId(newId);
    }
  };

  const saveConversation = (msgs) => {
    try {
      localStorage.setItem(
        "ai-conversation",
        JSON.stringify({
          id: conversationId,
          messages: msgs,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error("Failed to save conversation to localStorage:", err);
    }
  };

  const callGeminiAPI = async (history) => {
    const MODEL_NAME = "gemini-2.5-flash-preview-09-2025"; 
    const MAX_RETRIES = 5;
    const INITIAL_DELAY_MS = 1000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const apiUrl =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          MODEL_NAME +
          ":generateContent?key=" +
          GEMINI_API_KEY;

        const geminiMessages = history.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const body = {
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.8,
          },
        };

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429 || response.status >= 500) {
            if (attempt < MAX_RETRIES - 1) {
              const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          console.error("Gemini API HTTP Error:", errorData.error);
          return errorData.error?.message || `API HTTP Error: ${response.status}`;
        }

        const data = await response.json();

        if (data.error) {
          console.error("Gemini API Error:", data.error);
          return data.error.message || "API Error.";
        }

        return (
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response or content blocked by safety filters."
        );

      } catch (err) {
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error("Fetch Error after all retries:", err);
        return "Failed to connect to Gemini API after multiple attempts.";
      }
    }
    return "Failed to connect to Gemini API.";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const aiText = await callGeminiAPI(newMessages);

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiText,
        timestamp: new Date().toISOString(),
      };

      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      await saveConversation(updated);
    } catch (err) {
      console.error("Error during message sending process:", err);

      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "An unexpected error occurred. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = async () => {
    setMessages([]);
    const newId = `conv_${Date.now()}`;
    setConversationId(newId);
    try {
      localStorage.removeItem("ai-conversation");
    } catch (err) {
      console.error("Failed to clear conversation:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button active={true}
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-300 via-blue-600 to-yellow-100 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 animate-pulse hover:animate-none"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-100 rounded-full border-2 border-white"></span>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-2 bg-richblack-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            Chat with AI Assistant
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[420px] h-[600px] bg-richblack-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-purple-500/30 backdrop-blur-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-white/90 text-xs">Online & Ready</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearConversation}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-richblack-800 to-richblack-900">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 rounded-2xl mb-4">
                  <Bot className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Welcome to AI Assistant! 👋
                </h3>
                <p className="text-richblack-300 text-sm">
                  Ask me anything about coding, courses, or learning tips!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] p-3 rounded-2xl shadow-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-none"
                      : "bg-richblack-700 text-richblack-5 border border-purple-500/20 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-60 mt-1 block text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-full h-9 w-9 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-richblack-700 border border-purple-500/20 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-richblack-300 text-sm">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-richblack-900 border-t border-richblack-700">
            <div className="flex gap-2 items-end bg-richblack-800 rounded-2xl p-2 border border-richblack-700 focus-within:border-purple-500 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-white px-3 py-2 outline-none text-sm placeholder-richblack-400 resize-none max-h-24"
                rows="1"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 p-2.5 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex-shrink-0 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-yellow-50" />
                )}
              </button>
            </div>
            <p className="text-xs text-richblack-400 mt-2 text-center flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Powered by Gemini AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}