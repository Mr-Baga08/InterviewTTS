import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, Mic, MicOff } from 'lucide-react';
import { Button } from "./ui/button"

interface ProviderStatus {
  name: string;
  available: boolean;
  remaining: number;
  resetTime: number;
  lastError?: string;
}

interface VoicePipelineStatusProps {
  rateLimitState: {
    isRateLimited: boolean;
    retryAfter: number;
    failedAttempts: number;
    providerStatus: ProviderStatus[];
  };
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  isProcessing: boolean;
  error: string | null;
  onRetry?: () => void;
  onReset?: () => void;
}

export default function VoicePipelineStatus({
  rateLimitState,
  connectionStatus,
  isProcessing,
  error,
  onRetry,
  onReset
}: VoicePipelineStatusProps) {
  const [countdown, setCountdown] = useState(rateLimitState.retryAfter);

  useEffect(() => {
    setCountdown(rateLimitState.retryAfter);
  }, [rateLimitState.retryAfter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Mic className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <MicOff className="w-4 h-4" />;
      default: return <MicOff className="w-4 h-4" />;
    }
  };

  const getProviderStatusIcon = (provider: ProviderStatus) => {
    if (!provider.available) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (provider.remaining > 10) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const formatResetTime = (resetTime: number) => {
    const now = Date.now();
    const timeLeft = Math.max(0, resetTime - now);
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Voice Pipeline Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getConnectionStatusColor()}`}>
          {getConnectionStatusIcon()}
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Rate Limit Status */}
      {rateLimitState.isRateLimited && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900">Rate Limited</h4>
              <p className="text-sm text-orange-700 mt-1">
                Too many requests. Please wait {countdown} seconds before retrying.
              </p>
              <div className="mt-3 bg-orange-100 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.max(0, 100 - (countdown / rateLimitState.retryAfter) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-700">Processing audio...</span>
          </div>
        </div>
      )}

      {/* Provider Status */}
      {rateLimitState.providerStatus.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Provider Status</h4>
          <div className="grid gap-3">
            {rateLimitState.providerStatus.map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getProviderStatusIcon(provider)}
                  <div>
                    <span className="font-medium text-gray-900 capitalize">
                      {provider.name}
                    </span>
                    {provider.lastError && (
                      <p className="text-xs text-gray-500 mt-1">{provider.lastError}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {provider.remaining} remaining
                  </div>
                  <div className="text-xs text-gray-500">
                    Resets in {formatResetTime(provider.resetTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Attempts Warning */}
      {rateLimitState.failedAttempts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <span className="font-medium text-yellow-900">
                {rateLimitState.failedAttempts} failed attempts
              </span>
              <p className="text-sm text-yellow-700 mt-1">
                Consider checking your internet connection or API keys.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Troubleshooting Tips</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
            Check your microphone permissions and connection
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
            Ensure stable internet connection for API calls
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
            Wait for rate limits to reset before retrying
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
            Try speaking closer to the microphone
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {onRetry && !rateLimitState.isRateLimited && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Pipeline
          </button>
        )}
      </div>
    </div>
  );
}