import React, { useState } from 'react';
import { ChatProvider, useChatStore } from './store/chatStore';
import { ThemeProvider } from './store/themeStore';
import { AuthProvider } from './store/authStore';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthCallback from './components/Auth/AuthCallback';
import Sidebar from './components/Sidebar';
import BlogManager from './components/Blog/BlogManager';
import ChatManager from './components/Chat/ChatManager';
import SupportManager from './components/Support/SupportManager';
import MainAssistant from './components/Assistant/MainAssistant';
import EmailManager from './components/Email/EmailManager';
import DatabaseSearchManager from './components/Database/DatabaseSearchManager';
import ThemeToggle from './components/ThemeToggle';
import { FileText, ClipboardList, Menu, X } from 'lucide-react';

type View = 'chat' | 'blog' | 'tasks';

// Feature flags - sett til false for å gjemme komponenter
const FEATURE_FLAGS = {
  supportManager: false, // Sett til true når du vil vise Support Manager igjen
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeAgentId } = useChatStore();

  // Auto-switch to chat view when main assistant is selected
  React.useEffect(() => {
    if (activeAgentId === 'main-assistant') {
      setCurrentView('chat');
    }
  }, [activeAgentId]);

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        // Vis MainAssistant for hovedassistent
        if (activeAgentId === 'main-assistant') {
          return <MainAssistant />;
        }
        // For SEO Agent - vis BlogManager automatisk
        if (activeAgentId === 'seo-agent') {
          return <BlogManager />;
        }
        // For Chat Agent - vis ChatManager automatisk
        if (activeAgentId === 'chat-agent') {
          return <ChatManager />;
        }
        // For Email Agent - vis EmailManager automatisk
        if (activeAgentId === 'email-agent') {
          return <EmailManager />;
        }
        // For Database Agent - vis DatabaseSearchManager automatisk
        if (activeAgentId === 'database-agent') {
          return <DatabaseSearchManager />;
        }
        return <MainAssistant />;
      case 'blog':
        // Vis ChatManager (chat-samtaler tabell) kun når Chat Agent er valgt
        if (activeAgentId === 'chat-agent') {
          return <ChatManager />;
        }
        // Vis EmailManager når Email Agent er valgt
        if (activeAgentId === 'email-agent') {
          return <EmailManager />;
        }
        // Vis DatabaseSearchManager når Database Agent er valgt
        if (activeAgentId === 'database-agent') {
          return <DatabaseSearchManager />;
        }
        return <BlogManager />;
      case 'tasks':
        return FEATURE_FLAGS.supportManager ? <SupportManager /> : <div className="flex items-center justify-center h-full text-center p-6">
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--foreground))' }}>Support Manager</h2>
            <p style={{ color: 'rgb(var(--muted-foreground))' }}>Denne funksjonen er midlertidig deaktivert</p>
          </div>
        </div>;
      default:
        if (activeAgentId === 'main-assistant') {
          return <MainAssistant />;
        }
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(var(--foreground))' }}>Velg en agent</h2>
            <p style={{ color: 'rgb(var(--foreground))' }}>Velg en agent fra sidebaren for å komme i gang.</p>
          </div>
        );
    }
  };

  return (
      <div className="h-screen flex relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border"
          style={{ 
            backgroundColor: 'rgb(var(--card))',
            borderColor: 'rgb(var(--border))',
            color: 'rgb(var(--foreground))'
          }}
          aria-label="Åpne meny"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop: Always visible, Mobile: Drawer */}
        <div className={`flex transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative fixed inset-y-0 left-0 z-50`}>
          <Sidebar />
          
                  {/* Secondary Navigation - Only show for SEO, Chat, Email and Database Agent */}
        {(activeAgentId === 'seo-agent' || activeAgentId === 'chat-agent' || activeAgentId === 'email-agent' || activeAgentId === 'database-agent') && (
            <div className="w-16 flex flex-col items-center py-4 space-y-4 shadow-lg" 
              style={{ 
                backgroundColor: 'rgb(var(--sidebar-background))', 
                borderRight: '1px solid rgb(var(--sidebar-border))' 
              }}>
              {/* Mobile Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden mb-4 p-2 transition-colors"
                style={{ color: 'rgb(var(--muted-foreground))' }}
                aria-label="Lukk meny"
              >
                <X size={16} />
              </button>


            
            <button
              onClick={() => {
                setCurrentView('blog');
                setSidebarOpen(false);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                currentView === 'blog'
                  ? 'text-white shadow-md'
                  : 'hover:shadow-md'
              }`}
              style={currentView === 'blog' 
                ? { backgroundColor: 'rgb(var(--orange-primary))' } 
                : { 
                    backgroundColor: 'rgb(var(--card))', 
                    color: 'rgb(var(--muted-foreground))' 
                  }
              }
              title="Blogg"
            >
              <FileText size={20} />
            </button>
            
            {FEATURE_FLAGS.supportManager && (
              <button
                onClick={() => {
                  setCurrentView('tasks');
                  setSidebarOpen(false);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  currentView === 'tasks'
                    ? 'text-white shadow-md'
                    : 'hover:shadow-md'
                }`}
                style={currentView === 'tasks' 
                  ? { backgroundColor: 'rgb(var(--orange-primary))' } 
                  : { 
                      backgroundColor: 'rgb(var(--card))', 
                      color: 'rgb(var(--muted-foreground))' 
                    }
                }
                title="Send Inn Sak"
              >
                <ClipboardList size={20} />
              </button>
            )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {renderContent()}
        </div>
      </div>
  );
};

function App() {
  // Check if we're on the auth callback route
  if (window.location.pathname === '/auth/callback') {
    return (
      <ThemeProvider>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </ThemeProvider>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <ProtectedRoute>
            <AppContent />
            <ThemeToggle />
          </ProtectedRoute>
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;