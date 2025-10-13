import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { n8nApi } from '../utils/n8nApi';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await n8nApi.healthCheck();
      setIsConnected(connected);
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <AlertCircle size={16} className="animate-pulse" />
        <span className="text-xs">Sjekker tilkobling...</span>
      </div>
    );
  }

  return (
    <button
      onClick={checkConnection}
      disabled={isChecking}
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
        isConnected
          ? 'text-green-600 hover:bg-green-50'
          : 'text-red-600 hover:bg-red-50'
      }`}
      title="Klikk for å sjekke tilkobling til n8n"
    >
      {isChecking ? (
        <AlertCircle size={16} className="animate-spin" />
      ) : isConnected ? (
        <Wifi size={16} />
      ) : (
        <WifiOff size={16} />
      )}
      <span>
        {isChecking
          ? 'Sjekker...'
          : isConnected
          ? 'n8n tilkoblet'
          : 'n8n frakoblet'
        }
      </span>
    </button>
  );
};

export default ConnectionStatus;