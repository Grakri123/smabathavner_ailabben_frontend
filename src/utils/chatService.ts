import { supabase } from '../store/authStore';
import type { N8nChatHistory, ChatConversation } from '../types/blog';

class ChatService {
  private tableName = 'n8n_chat_histories';

  // Get all chat histories with optional filtering
  async getAllHistories(
    page = 1,
    pageSize = 50,
    sessionIdFilter?: string,
    agentIdFilter?: string
  ): Promise<{ data: N8nChatHistory[]; count: number; totalPages: number }> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Apply filters
    if (sessionIdFilter) {
      query = query.eq('session_id', sessionIdFilter);
    }

    if (agentIdFilter) {
      query = query.contains('message', { agent_id: agentIdFilter });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('id', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data as N8nChatHistory[],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  // Get conversations grouped by session_id (for email agent)
  async getConversations(
    page = 1,
    pageSize = 10,
    searchTerm = '',
    statusFilter = 'alle'
  ): Promise<{ data: ChatConversation[]; count: number; totalPages: number }> {
    try {
      // Get all chat histories first
      const { data: allHistories, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // Group by session_id
      const groupedBySession = new Map<string, N8nChatHistory[]>();
      
      allHistories?.forEach((history: N8nChatHistory) => {
        if (!groupedBySession.has(history.session_id)) {
          groupedBySession.set(history.session_id, []);
        }
        groupedBySession.get(history.session_id)!.push(history);
      });

      console.log('📊 ChatService: Raw data stats:', {
        totalHistories: allHistories?.length || 0,
        uniqueSessions: groupedBySession.size,
        sessions: Array.from(groupedBySession.keys()),
        messagesPerSession: Array.from(groupedBySession.entries()).map(([sessionId, messages]) => ({
          sessionId: sessionId.substring(0, 20) + '...',
          messageCount: messages.length
        }))
      });

      // Convert to ChatConversation format
      const conversations: ChatConversation[] = [];
      
      for (const [sessionId, messages] of groupedBySession.entries()) {
        if (messages.length === 0) continue;

        const sortedMessages = messages.sort((a, b) => a.id - b.id);
        const firstMessage = sortedMessages[0];
        const lastMessage = sortedMessages[sortedMessages.length - 1];

        // Derive email-specific fields from message content
        const emailInfo = this.extractEmailInfo(sortedMessages);
        const status = this.determineStatus(sortedMessages);
        const priority = this.determinePriority(sortedMessages);
        const category = this.determineCategory(sortedMessages);

        const conversation: ChatConversation = {
          session_id: sessionId,
          messages: sortedMessages,
          first_message: firstMessage,
          last_message: lastMessage,
          message_count: messages.length,
          started_at: new Date(firstMessage.message.timestamp),
          last_activity: new Date(lastMessage.message.timestamp),
          from: emailInfo.from,
          to: emailInfo.to,
          subject: emailInfo.subject,
          status,
          priority,
          category
        };

        conversations.push(conversation);
      }

      // Apply search filter
      let filteredConversations = conversations;
      if (searchTerm) {
        filteredConversations = conversations.filter(conv => 
          conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.session_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'alle') {
        filteredConversations = filteredConversations.filter(conv => 
          conv.status === statusFilter
        );
      }

      // Sort by last activity (newest first)
      filteredConversations.sort((a, b) => 
        b.last_activity.getTime() - a.last_activity.getTime()
      );

      // Apply pagination
      const totalCount = filteredConversations.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredConversations.slice(from, to);

      console.log('🔍 ChatService: Final result being returned:', {
        totalConversations: totalCount,
        paginatedCount: paginatedData.length,
        page,
        pageSize,
        conversations: paginatedData.map(conv => ({
          session_id: conv.session_id.substring(0, 20) + '...',
          message_count: conv.message_count,
          subject: conv.subject,
          from: conv.from
        }))
      });

      return {
        data: paginatedData,
        count: totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      };

    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get specific conversation by session_id
  async getConversationBySessionId(sessionId: string): Promise<ChatConversation | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const messages = data as N8nChatHistory[];
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const emailInfo = this.extractEmailInfo(messages);

    return {
      session_id: sessionId,
      messages,
      first_message: firstMessage,
      last_message: lastMessage,
      message_count: messages.length,
      started_at: new Date(firstMessage.message.timestamp),
      last_activity: new Date(lastMessage.message.timestamp),
      from: emailInfo.from,
      to: emailInfo.to,
      subject: emailInfo.subject,
      status: this.determineStatus(messages),
      priority: this.determinePriority(messages),
      category: this.determineCategory(messages)
    };
  }

  // Add new message to conversation
  async addMessage(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    agent_id?: string;
    from?: string;
    to?: string;
    subject?: string;
    direction?: 'innkommende' | 'utgående';
    ai_generated?: boolean;
    metadata?: Record<string, any>;
  }): Promise<N8nChatHistory> {
    const messageData = {
      session_id: sessionId,
      message: {
        ...message,
        timestamp: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data as N8nChatHistory;
  }

  // Get conversation statistics
  async getStats(): Promise<{
    total: number;
    aktiv: number;
    venter_svar: number;
    avsluttet: number;
  }> {
    const { data: conversations } = await this.getConversations(1, 1000); // Get all for stats
    
    return {
      total: conversations.length,
      aktiv: conversations.filter(c => c.status === 'aktiv').length,
      venter_svar: conversations.filter(c => c.status === 'venter_svar').length,
      avsluttet: conversations.filter(c => c.status === 'avsluttet').length,
    };
  }

  // Real-time subscription for new messages
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tableName },
        callback
      )
      .subscribe();
  }

  // Debug function to verify grouping works correctly
  async debugGrouping(): Promise<void> {
    try {
      const { data: allHistories, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      console.log('🔍 Debug: Raw data from database:');
      allHistories?.forEach((history: N8nChatHistory, index) => {
        console.log(`  ${index + 1}. ID: ${history.id}, Session: ${history.session_id}, Content: "${history.message.content.substring(0, 50)}..."`);
      });

      // Group by session_id
      const groupedBySession = new Map<string, N8nChatHistory[]>();
      
      allHistories?.forEach((history: N8nChatHistory) => {
        if (!groupedBySession.has(history.session_id)) {
          groupedBySession.set(history.session_id, []);
        }
        groupedBySession.get(history.session_id)!.push(history);
      });

      console.log('🔍 Debug: Grouped by session_id:');
      for (const [sessionId, messages] of groupedBySession.entries()) {
        console.log(`  Session: ${sessionId.substring(0, 20)}... (${messages.length} messages)`);
        messages.forEach((msg, index) => {
          const normalized = this.normalizeMessage(msg.message);
          console.log(`    ${index + 1}. Role: ${normalized.role}, Content: "${normalized.content.substring(0, 30)}..."`);
          console.log(`       Raw message object:`, msg.message);
          console.log(`       Normalized message:`, normalized);
        });
      }

    } catch (error) {
      console.error('❌ Debug grouping error:', error);
    }
  }

  // Helper method to normalize message format (handle both n8n and standard formats)
  private normalizeMessage(message: any): {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    from?: string;
    to?: string;
    subject?: string;
    ai_generated?: boolean;
  } {
    // Handle n8n format: {type: 'human'/'ai', content: '...'}
    if (message.type) {
      return {
        role: message.type === 'human' ? 'user' : 'assistant',
        content: message.content || '',
        timestamp: message.timestamp || new Date().toISOString(),
        from: message.from,
        to: message.to,
        subject: message.subject,
        ai_generated: message.type === 'ai'
      };
    }
    
    // Handle standard format: {role: 'user'/'assistant', content: '...'}
    return {
      role: message.role || 'user',
      content: message.content || '',
      timestamp: message.timestamp || new Date().toISOString(),
      from: message.from,
      to: message.to,
      subject: message.subject,
      ai_generated: message.ai_generated || message.role === 'assistant'
    };
  }

  // Helper methods for extracting email information
  private extractEmailInfo(messages: N8nChatHistory[]): {
    from?: string;
    to?: string;
    subject?: string;
  } {
    // Look for email-specific fields in messages
    for (const msg of messages) {
      const normalizedMsg = this.normalizeMessage(msg.message);
      if (normalizedMsg.from || normalizedMsg.to || normalizedMsg.subject) {
        return {
          from: normalizedMsg.from,
          to: normalizedMsg.to,
          subject: normalizedMsg.subject
        };
      }
    }

    // Fallback: try to extract email from content
    const firstMessage = messages[0];
    if (firstMessage?.message.content) {
      const emailMatch = firstMessage.message.content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        return {
          from: firstMessage.message.role === 'user' ? emailMatch[1] : undefined,
          to: firstMessage.message.role === 'assistant' ? emailMatch[1] : undefined,
          subject: this.extractSubjectFromContent(firstMessage.message.content)
        };
      }
    }

    return {};
  }

  private extractSubjectFromContent(content: string): string {
    // Try to extract a meaningful subject from the first message
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line is short and descriptive, use it as subject
    if (firstLine.length < 100 && firstLine.length > 10) {
      return firstLine;
    }
    
    // Otherwise create a subject from content
    return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
  }

  private determineStatus(messages: N8nChatHistory[]): 'aktiv' | 'avsluttet' | 'venter_svar' {
    const lastMessage = messages[messages.length - 1];
    const normalizedLastMsg = this.normalizeMessage(lastMessage.message);
    const lastActivity = new Date(normalizedLastMsg.timestamp);
    const hoursSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);

    // If last message was from user and it's recent, status is "venter_svar"
    if (normalizedLastMsg.role === 'user' && hoursSinceLastActivity < 24) {
      return 'venter_svar';
    }

    // If no activity for more than 48 hours, consider it closed
    if (hoursSinceLastActivity > 48) {
      return 'avsluttet';
    }

    // Otherwise it's active
    return 'aktiv';
  }

  private determinePriority(messages: N8nChatHistory[]): 'lav' | 'medium' | 'høy' | 'kritisk' {
    const content = messages.map(m => this.normalizeMessage(m.message).content.toLowerCase()).join(' ');
    
    // Check for urgent keywords
    if (content.includes('urgent') || content.includes('kritisk') || content.includes('asap')) {
      return 'kritisk';
    }
    
    if (content.includes('viktig') || content.includes('prioritet') || content.includes('raskt')) {
      return 'høy';
    }
    
    if (content.includes('når du får tid') || content.includes('ikke hastverk')) {
      return 'lav';
    }
    
    return 'medium';
  }

  private determineCategory(messages: N8nChatHistory[]): 'support' | 'salg' | 'generell' | 'klage' {
    const content = messages.map(m => this.normalizeMessage(m.message).content.toLowerCase()).join(' ');
    
    // Check for sales keywords
    if (content.includes('pris') || content.includes('tilbud') || content.includes('kjøp') || content.includes('salg')) {
      return 'salg';
    }
    
    // Check for support keywords
    if (content.includes('problem') || content.includes('feil') || content.includes('hjelp') || content.includes('support')) {
      return 'support';
    }
    
    // Check for complaint keywords
    if (content.includes('klage') || content.includes('misfornøyd') || content.includes('dårlig')) {
      return 'klage';
    }
    
    return 'generell';
  }
}

export const chatService = new ChatService();
export default chatService;
