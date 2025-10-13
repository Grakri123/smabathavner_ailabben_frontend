import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../store/chatStore';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${message.role}`}>
      <div className={`message-bubble ${message.role}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border`} 
            style={{ 
              backgroundColor: 'rgb(var(--message-background))', 
              borderColor: 'rgb(var(--message-border))',
              color: 'rgb(var(--foreground))'
            }}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none">
              {isUser ? (
                <p className="m-0" style={{ color: 'rgb(var(--foreground))' }}>{message.content}</p>
              ) : (
                <ReactMarkdown 
                  className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  style={{ color: 'rgb(var(--foreground))' }}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-bold mb-1 mt-2 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-bold mb-1 mt-2 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-2 first:mt-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</h6>,
                    p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: 'rgb(var(--foreground))' }}>{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4 list-disc" style={{ color: 'rgb(var(--foreground))' }}>{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4 list-decimal" style={{ color: 'rgb(var(--foreground))' }}>{children}</ol>,
                    li: ({ children }) => <li className="mb-1" style={{ color: 'rgb(var(--foreground))' }}>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold" style={{ color: 'rgb(var(--foreground))' }}>{children}</strong>,
                    em: ({ children }) => <em className="italic" style={{ color: 'rgb(var(--foreground))' }}>{children}</em>,
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 rounded text-sm font-mono" 
                        style={{ 
                          backgroundColor: 'rgb(var(--muted))', 
                          color: 'rgb(var(--muted-foreground))' 
                        }}>
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="p-3 rounded-md overflow-x-auto mb-2" 
                        style={{ backgroundColor: 'rgb(var(--muted))' }}>
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 pl-4 italic mb-2" 
                        style={{ 
                          borderColor: 'rgb(var(--border))', 
                          color: 'rgb(var(--muted-foreground))' 
                        }}>
                        {children}
                      </blockquote>
                    )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
            <div className="mt-2 text-xs opacity-70" style={{ color: 'rgb(var(--muted-foreground))' }}>
              {message.timestamp.toLocaleTimeString('no-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;