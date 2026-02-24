import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  User, 
  ChevronRight, 
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/app/components/ui/dropdown-menu';
import { cn } from '@/app/components/ui/utils';
import { toast } from 'sonner';

type Role = 'Admin' | 'Manager' | 'Chef' | 'Cashier';

interface Message {
  id: string;
  senderRole: Role;
  recipientRole: Role;
  text: string;
  timestamp: Date;
  isRead: boolean;
  isMe: boolean;
}

const ROLES: Role[] = ['Admin', 'Manager', 'Chef', 'Cashier'];

const ROLE_COLORS = {
  Admin: 'bg-red-100 text-red-700 border-red-200',
  Manager: 'bg-blue-100 text-blue-700 border-blue-200',
  Chef: 'bg-orange-100 text-orange-700 border-orange-200',
  Cashier: 'bg-green-100 text-green-700 border-green-200',
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    senderRole: 'Chef',
    recipientRole: 'Manager',
    text: 'Chicken stock unavailable for next 2 hours',
    timestamp: new Date(Date.now() - 3600000),
    isRead: true,
    isMe: false,
  },
  {
    id: '2',
    senderRole: 'Manager',
    recipientRole: 'Chef',
    text: 'Understood. I will update the inventory status.',
    timestamp: new Date(Date.now() - 3500000),
    isRead: true,
    isMe: true,
  },
  {
    id: '3',
    senderRole: 'Cashier',
    recipientRole: 'Admin',
    text: 'Daily closing report ready for review.',
    timestamp: new Date(Date.now() - 1800000),
    isRead: false,
    isMe: false,
  }
];

export function AdminChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>('Admin');
  const [selectedRecipient, setSelectedRecipient] = useState<Role>('Manager');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => 
    (m.senderRole === currentRole && m.recipientRole === selectedRecipient) ||
    (m.senderRole === selectedRecipient && m.recipientRole === currentRole)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, filteredMessages]);

  useEffect(() => {
    // Listen for custom event to open chat with a specific role
    const handleOpenChat = (event: any) => {
      const { role } = event.detail || {};
      if (role) {
        setSelectedRecipient(role as Role);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderRole: currentRole,
      recipientRole: selectedRecipient,
      text: inputText,
      timestamp: new Date(),
      isRead: false,
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Simulate notification trigger
    const notificationEvent = new CustomEvent('new-admin-notification', {
      detail: {
        id: newMessage.id,
        type: 'chat',
        title: `Message from ${currentRole}`,
        message: inputText,
        senderRole: currentRole,
        timestamp: new Date().toLocaleString(),
      }
    });
    window.dispatchEvent(notificationEvent);
    
    toast.success(`Message sent to ${selectedRecipient}`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className={cn("text-xs font-bold", ROLE_COLORS[selectedRecipient].split(' ')[1])}>
                    {selectedRecipient.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{selectedRecipient}</h3>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4", ROLE_COLORS[selectedRecipient])}>
                    Online
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Internal Communication</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs">Mute Notifications</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">Clear Conversation</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs">Report Issue</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="bg-gray-50/50 p-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-medium text-muted-foreground uppercase px-2">To:</span>
            {ROLES.filter(r => r !== currentRole).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRecipient(role)}
                className={cn(
                  "whitespace-nowrap px-3 py-1 rounded-full text-xs transition-all",
                  selectedRecipient === role 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-white text-muted-foreground hover:bg-gray-100 border"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0 bg-white/80 backdrop-blur-sm border shadow-sm text-muted-foreground">
                Today
              </Badge>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-60">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Start a conversation with {selectedRecipient}</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col",
                    msg.isMe ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm relative",
                    msg.isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-white border text-foreground rounded-tl-none"
                  )}>
                    {msg.text}
                    <div className={cn(
                      "flex items-center gap-1 mt-1 justify-end",
                      msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span className="text-[9px]">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.isMe && (
                        msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Role Context Indicator */}
          <div className="px-4 py-1 bg-white border-t flex items-center justify-between">
             <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">My Role:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase", ROLE_COLORS[currentRole])}>
                      {currentRole}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {ROLES.map(r => (
                      <DropdownMenuItem key={r} onClick={() => setCurrentRole(r)} className="text-xs">
                        {r}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white flex items-center gap-2 border-t">
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputText.trim()}
              className="h-10 w-10 rounded-xl transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen ? "bg-red-500 rotate-90" : "bg-primary"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
          </div>
        )}
      </button>
    </div>
  );
}