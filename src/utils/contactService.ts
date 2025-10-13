import { supabase } from '../store/authStore';
import type { KlvarmeContact, ContactSession, PaginatedResponse } from '../types/blog';

class ContactService {
  private tableName = 'klvarme_contacts';

  // Get all contacts with optional filtering and pagination
  async getAllContacts(
    page = 1,
    pageSize = 10,
    searchTerm = '',
    statusFilter = 'alle'
  ): Promise<PaginatedResponse<ContactSession>> {
    try {
      // Get all contacts first
      const { data: allContacts, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 ContactService: Raw data from database:', {
        totalContacts: allContacts?.length || 0,
        contacts: allContacts?.map(contact => ({
          id: contact.id,
          session_id: contact.session_id.substring(0, 20) + '...',
          customer_name: contact.customer_name,
          customer_email: contact.customer_email,
          message_count: this.getMessageCount(contact.conversation_history),
          last_message: this.getLastMessage(contact.conversation_history),
          session_duration: contact.session_duration,
          end_reason: contact.end_reason,
          created_at: contact.created_at
        }))
      });

      // Convert to ContactSession format
      const contactSessions: ContactSession[] = allContacts?.map(contact => {
        const conversationHistory = this.parseConversationHistory(contact.conversation_history);
        const messageCount = conversationHistory.length;
        const lastMessage = this.getLastMessage(contact.conversation_history);
        
        return {
          id: contact.id,
          session_id: contact.session_id,
          customer_name: contact.customer_name,
          customer_email: contact.customer_email,
          message_count: messageCount,
          last_message: lastMessage,
          session_duration: contact.session_duration || 0,
          end_reason: contact.end_reason || 'contact_collected',
          created_at: new Date(contact.created_at),
          status: this.determineStatus(contact.end_reason, contact.created_at),
          priority: this.determinePriority(contact.conversation_history, contact.session_duration)
        };
      }) || [];

      // Apply search filter
      let filteredContacts = contactSessions;
      if (searchTerm) {
        filteredContacts = contactSessions.filter(contact => 
          contact.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.last_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.session_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'alle') {
        filteredContacts = filteredContacts.filter(contact => 
          contact.status === statusFilter
        );
      }

      // Sort by created_at (newest first)
      filteredContacts.sort((a, b) => 
        b.created_at.getTime() - a.created_at.getTime()
      );

      // Apply pagination
      const totalCount = filteredContacts.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredContacts.slice(from, to);

      console.log('🔍 ContactService: Final result being returned:', {
        totalContacts: totalCount,
        paginatedCount: paginatedData.length,
        page,
        pageSize,
        contacts: paginatedData.map(contact => ({
          id: contact.id,
          session_id: contact.session_id.substring(0, 20) + '...',
          customer_name: contact.customer_name,
          customer_email: contact.customer_email,
          message_count: contact.message_count,
          status: contact.status
        }))
      });

      return {
        data: paginatedData,
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };

    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  // Get specific contact by ID
  async getContactById(id: number): Promise<KlvarmeContact | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as KlvarmeContact;
  }

  // Get contact by session_id
  async getContactBySessionId(sessionId: string): Promise<KlvarmeContact | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;
    return data as KlvarmeContact;
  }

  // Get contact statistics
  async getStats(): Promise<{
    total: number;
    aktiv: number;
    avsluttet: number;
    venter_svar: number;
  }> {
    const { data: contacts } = await this.getAllContacts(1, 1000); // Get all for stats
    
    return {
      total: contacts.length,
      aktiv: contacts.filter(c => c.status === 'aktiv').length,
      avsluttet: contacts.filter(c => c.status === 'avsluttet').length,
      venter_svar: contacts.filter(c => c.status === 'venter_svar').length,
    };
  }

  // Real-time subscription for new contacts
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: this.tableName },
        callback
      )
      .subscribe();
  }

  // Helper methods
  private parseConversationHistory(conversationHistory: any): any[] {
    try {
      if (Array.isArray(conversationHistory)) {
        return conversationHistory;
      }
      if (typeof conversationHistory === 'string') {
        return JSON.parse(conversationHistory);
      }
      return [];
    } catch (error) {
      console.error('Error parsing conversation history:', error);
      return [];
    }
  }

  private getMessageCount(conversationHistory: any): number {
    const messages = this.parseConversationHistory(conversationHistory);
    return messages.length;
  }

  private getLastMessage(conversationHistory: any): string {
    const messages = this.parseConversationHistory(conversationHistory);
    if (messages.length === 0) return 'Ingen meldinger';
    
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage === 'string') {
      return lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : '');
    }
    if (lastMessage.content) {
      return lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '');
    }
    return 'Ukjent melding';
  }

  private determineStatus(endReason?: string, createdAt?: string): 'aktiv' | 'avsluttet' | 'venter_svar' {
    if (!endReason || endReason === 'contact_collected') {
      return 'aktiv';
    }
    
    if (endReason === 'timeout' || endReason === 'user_left') {
      return 'avsluttet';
    }
    
    return 'venter_svar';
  }

  private determinePriority(conversationHistory: any, sessionDuration?: number): 'lav' | 'medium' | 'høy' | 'kritisk' {
    const messages = this.parseConversationHistory(conversationHistory);
    const content = messages.map((msg: any) => {
      if (typeof msg === 'string') return msg.toLowerCase();
      if (msg.content) return msg.content.toLowerCase();
      return '';
    }).join(' ');
    
    // Check for urgent keywords
    if (content.includes('urgent') || content.includes('kritisk') || content.includes('asap')) {
      return 'kritisk';
    }
    
    if (content.includes('viktig') || content.includes('prioritet') || content.includes('raskt')) {
      return 'høy';
    }
    
    // Long sessions might indicate complex issues
    if (sessionDuration && sessionDuration > 1800) { // 30 minutes
      return 'høy';
    }
    
    if (content.includes('når du får tid') || content.includes('ikke hastverk')) {
      return 'lav';
    }
    
    return 'medium';
  }

  // Debug function to verify data structure
  async debugContacts(): Promise<void> {
    try {
      const { data: contacts, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('🔍 Debug: Raw contacts from database:');
      contacts?.forEach((contact: KlvarmeContact, index) => {
        console.log(`  ${index + 1}. ID: ${contact.id}, Session: ${contact.session_id}, Customer: ${contact.customer_name}, Email: ${contact.customer_email}`);
        console.log(`     Conversation History Type: ${typeof contact.conversation_history}`);
        console.log(`     Message Count: ${this.getMessageCount(contact.conversation_history)}`);
        console.log(`     Last Message: "${this.getLastMessage(contact.conversation_history)}"`);
        console.log(`     Session Duration: ${contact.session_duration}s`);
        console.log(`     End Reason: ${contact.end_reason}`);
      });

    } catch (error) {
      console.error('❌ Debug contacts error:', error);
    }
  }
}

export const contactService = new ContactService();
export default contactService;
