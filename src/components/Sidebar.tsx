import React from 'react';
import { Plus, MessageSquare, LogOut, User } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuth } from '../store/authStore';

const Sidebar: React.FC = () => {
  const { agents, activeAgentId, setActiveAgent, clearMessages, getMessagesForAgent } = useChatStore();
  const { user, signOut } = useAuth();

  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId);
  };

  const handleNewChat = () => {
    clearMessages();
  };

  const handleLogout = async () => {
    if (confirm('Er du sikker på at du vil logge ut?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <div className="w-64 flex flex-col h-full shadow-lg" style={{ backgroundColor: 'rgb(var(--sidebar-background))', borderRight: '1px solid rgb(var(--sidebar-border))' }}>
      {/* Header with AI LABBEN Logo */}
      <div className="p-4" style={{ borderBottom: '1px solid rgb(var(--sidebar-border))' }}>
        <div className="flex items-center justify-center py-2">
          <h1 className="logo-text text-3xl font-black" style={{ fontWeight: '950', textShadow: '0 0 1px currentColor', color: 'rgb(var(--foreground))' }}>AI LABBEN</h1>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgb(var(--muted-foreground))' }}>
            AI Agenter
          </h3>
          <div className="space-y-2">
            {agents.map((agent) => {
              const messageCount = getMessagesForAgent(agent.id).length;
              const isActive = activeAgentId === agent.id;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className="w-full relative flex items-center justify-start px-4 py-3 rounded-lg transition-all duration-200 shadow-sm"
                  style={isActive 
                    ? { backgroundColor: 'rgb(var(--orange-primary))', color: 'white' } 
                    : { backgroundColor: 'rgb(var(--card))', color: 'rgb(var(--card-foreground))' }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgb(var(--card))';
                    }
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium text-base heading">
                      {agent.name}
                    </div>
                  </div>
                  {messageCount > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <MessageSquare size={12} />
                      <span className="text-xs">{messageCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgb(var(--sidebar-border))' }}>
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--card))' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--orange-primary))' }}>
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--foreground))' }}>
              {user?.email || 'Bruker'}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgb(var(--muted-foreground))' }}>
              {user?.email === 'system@ailabben.no' ? 'System' : user?.email === 'simen@smabathavner.no' ? 'Administrator' : 'Kunde'}
            </p>
          </div>
        </div>

        {/* Settings Button - Temporarily hidden */}
        {/* TODO: Implement settings functionality and uncomment this button
        <button 
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            color: 'rgb(var(--muted-foreground))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(var(--muted))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(var(--card))';
          }}
        >
          <Settings size={16} />
          <span className="text-sm">Innstillinger</span>
        </button>
        */}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm"
          style={{ 
            backgroundColor: 'rgb(var(--card))', 
            color: 'rgb(var(--muted-foreground))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(var(--orange-100))';
            e.currentTarget.style.color = 'rgb(var(--orange-primary))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(var(--card))';
            e.currentTarget.style.color = 'rgb(var(--muted-foreground))';
          }}
        >
          <LogOut size={16} />
          <span className="text-sm">Logg ut</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;