'use client'

import { useState, useRef, useEffect } from 'react';
import { useWebLLM, Message, AVAILABLE_MODELS } from '@/hooks/useWebLLM';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Sparkles, Menu, Plus, MessageSquare } from 'lucide-react';

export default function ChatInterface() {
  const { isLoading, isModelLoaded, progress, error, generateResponse, selectedModel, setSelectedModel } = useWebLLM();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am a local AI running entirely in your browser. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !isModelLoaded) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await generateResponse(newMessages, (currentText) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: currentText };
          return updated;
        });
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I am a local AI running entirely in your browser. How can I help you today?',
      },
    ]);
    setInput('');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black/95 text-gray-100 p-3 space-y-4">
      <Button
        variant="outline"
        className="w-full justify-start gap-2 border-gray-700 hover:bg-gray-800 hover:text-white text-gray-200"
        onClick={handleNewChat}
      >
        <Plus className="w-4 h-4" />
        New chat
      </Button>



      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="text-xs font-medium text-gray-500 px-2 py-2">Today</div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm font-normal text-gray-300 hover:bg-gray-800 hover:text-white truncate"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="truncate">WebLLM Chat Session</span>
        </Button>
      </div>

      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2 py-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-700 text-gray-200">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">User</div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Error Loading Model</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !isModelLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold">Initializing AI Model</h2>
          <p className="text-gray-400">Downloading {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}...</p>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress.progress * 100}% ` }}
              />
            </div>
            <p className="text-xs font-mono text-gray-500">{progress.text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[260px] flex-col border-r border-gray-800 bg-black">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[260px] border-r-gray-800 bg-black text-white border-none"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="mx-auto font-semibold">WebLLM Chat</div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Model Status Indicator (Desktop) */}
        <div className="hidden md:flex absolute top-4 right-4 z-10">
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
            <SelectTrigger className="w-auto gap-2 text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 hover:bg-green-500/20 transition-colors focus:ring-0 focus:ring-offset-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
            </SelectTrigger>
            <SelectContent align="end" className="bg-gray-900 border-gray-700 text-gray-200 w-[320px]">
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="focus:bg-gray-800 focus:text-white cursor-pointer py-3 pr-12">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-gray-400 font-normal">
                        {/* @ts-ignore */}
                        {model.description}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-normal ml-3 shrink-0">
                      {/* @ts-ignore */}
                      {model.size}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center py-10 px-8 md:px-12">
            <div className="w-full max-w-4xl space-y-10">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 mt-1">
                      <Bot className="w-7 h-7 text-green-500" />
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={`relative max-w-[85%] md:max-w-[80%] ${msg.role === 'user'
                      ? 'bg-[#2f2f2f] text-white rounded-3xl px-8 py-5'
                      : 'text-gray-100 py-2'
                      }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-xl">
                      {msg.content || (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Sparkles className="w-6 h-6 animate-spin" />
                          <span className="animate-pulse text-lg">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-8 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center gap-4 bg-[#2f2f2f] rounded-full border border-gray-700 focus-within:border-gray-500 transition-colors p-2 pl-6 shadow-xl">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message WebLLM..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder-gray-400 h-14 text-xl font-light px-0"
                  disabled={isGenerating}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isGenerating}
                  className={`h-12 w-12 rounded-full shrink-0 transition-all mr-1 ${input.trim() && !isGenerating
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-transparent text-gray-500 hover:bg-gray-800'
                    }`}
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </form>
            <p className="text-center text-base text-gray-500 mt-5">
              WebLLM can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
