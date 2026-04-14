import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import * as chatService from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import type { Chat, Message } from "@/types";

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isDietitian = user?.role === "dietitian";

  // Load Chats - Initial and Polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadChats = async () => {
      try {
        const chats = await chatService.getChats();
        setConversations(chats);

        // Check for redirect state (only on first load)
        const stateChatId = location.state?.selectedChatId;
        if (stateChatId) {
          const targetChat = chats.find(c => c.id === stateChatId);
          if (targetChat) {
            setSelectedConversation(p => p?.id === targetChat.id ? p : targetChat);
          }
          window.history.replaceState({}, document.title);
        } else if (chats.length > 0 && !selectedConversation) {
          // Üye için: ilk ve tek sohbeti otomatik seç
          if (!isDietitian) {
            setSelectedConversation(chats[0]);
          }
          // Diyetisyen için: ilk yüklemede otomatik seçme (listeye göz atsın)
          if (isDietitian && isLoading) {
            // İlk sohbeti seçme, kullanıcı seçsin
          }
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadChats();
      intervalId = setInterval(loadChats, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [authLoading, isAuthenticated, navigate, user, location.state]);

  // Load Messages - Initial and Polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadMessages = async () => {
      if (selectedConversation && !selectedConversation.id.startsWith("new_")) {
        try {
          const msgs = await chatService.getMessages(selectedConversation.id);
          setMessages(msgs);
        } catch (error) {
          console.error("Error loading messages:", error);
        }
      } else {
        setMessages([]);
      }
    };

    if (selectedConversation) {
      loadMessages();
      intervalId = setInterval(loadMessages, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedConversation?.id]);

  const handleSelectConversation = async (conversation: Chat) => {
    if (conversation.id.startsWith("new_")) {
      if (isDietitian) {
        // Diyetisyen yeni sohbet başlatıyor
        const memberId = conversation.id.replace("new_", "");
        try {
          const newChat = await chatService.startChatWithMember(memberId);
          setConversations(prev =>
            prev.map(c => c.id === conversation.id ? newChat : c)
          );
          setSelectedConversation(newChat);
        } catch (error: any) {
          toast({ title: "Hata", description: error.response?.data?.detail || "Sohbet başlatılamadı", variant: "destructive" });
        }
      } else {
        // Üye yeni sohbet başlatıyor (diyetisyen ile)
        try {
          const newChat = await chatService.startChat();
          setConversations(prev =>
            prev.map(c => c.id === conversation.id ? newChat : c)
          );
          setSelectedConversation(newChat);
        } catch (error: any) {
          toast({ title: "Hata", description: error.response?.data?.detail || "Sohbet başlatılamadı", variant: "destructive" });
        }
      }
    } else {
      setSelectedConversation(conversation);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Eğer yeni sohbet ise (new_ prefix), önce sohbeti başlat
    if (selectedConversation.id.startsWith("new_")) {
      try {
        let newChat: Chat;
        if (isDietitian) {
          const memberId = selectedConversation.id.replace("new_", "");
          newChat = await chatService.startChatWithMember(memberId);
        } else {
          newChat = await chatService.startChat();
        }
        setConversations(prev =>
          prev.map(c => c.id === selectedConversation.id ? newChat : c)
        );
        setSelectedConversation(newChat);
        // Şimdi mesaj gönder
        const msg = await chatService.sendMessage(newChat.id, newMessage);
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
        return;
      } catch (error: any) {
        toast({ title: "Hata", description: error.response?.data?.detail || "Mesaj gönderilemedi", variant: "destructive" });
        return;
      }
    }

    setIsSending(true);
    try {
      const msg = await chatService.sendMessage(selectedConversation.id, newMessage);
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Mesaj gönderilemedi", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  // Filtreli sohbet listesi (arama)
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    return c.other_participant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] lg:h-screen flex">
        {/* Conversations List */}
        <div className={cn(
          "flex flex-col border-r border-border bg-card/50 w-full md:w-80",
          selectedConversation ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {isDietitian ? "Tüm Kullanıcılar" : "Mesajlar"}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={isDietitian ? "Kullanıcı ara..." : "Konuşma ara..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-surface transition-colors",
                    selectedConversation?.id === conversation.id && "bg-surface border-l-2 border-primary"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {conversation.other_participant?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className="font-medium text-foreground truncate block">
                      {conversation.other_participant?.name || `Sohbet #${conversation.id.slice(-4)}`}
                    </span>
                    {conversation.other_participant?.title && (
                      <span className="text-xs text-primary block mb-0.5">
                        {conversation.other_participant.title}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate w-32">
                        {conversation.last_message?.content || (conversation.id.startsWith("new_") ? "Yeni sohbet başlat" : "Henüz mesaj yok")}
                      </p>
                      {conversation.id.startsWith("new_") && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full shrink-0">Yeni</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "Sonuç bulunamadı" : "Henüz kullanıcı yok"}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedConversation ? "hidden md:flex" : "flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border glass">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                    {selectedConversation.other_participant?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedConversation.other_participant?.name || "Bilinmeyen Kullanıcı"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.id.startsWith("new_") ? "Yeni Sohbet" :
                        selectedConversation.status === 'active' ? "Aktif Sohbet" : "Sohbet"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="glass" size="icon"><Phone className="w-4 h-4" /></Button>
                  <Button variant="glass" size="icon"><Video className="w-4 h-4" /></Button>
                  <Button variant="glass" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender_id === user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-3",
                        message.sender_id === user?.id
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-surface text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border glass">
                <div className="flex items-center gap-3">
                  <Button variant="glass" size="icon"><Paperclip className="w-4 h-4" /></Button>
                  <input
                    type="text"
                    placeholder="Mesajınızı yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    variant="neon"
                    size="icon"
                    className="h-12 w-12"
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {isDietitian ? "Bir kullanıcı seçerek sohbete başlayın" : "Sohbet seçin veya yeni bir sohbet başlatın"}
              </p>
              <p className="text-sm mt-1">
                {isDietitian ? "Sol panelden bir kullanıcıya tıklayın" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
