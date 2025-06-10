// File: components/ApiTester.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TestResult {
  type: 'health' | 'generation';
  data: any;
  status: number;
  timestamp: string;
}

const ApiTester = () => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/vapi/generate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult({
        type: 'health',
        data,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async () => {
    setLoading(true);
    setError(null);
    
    const testData = {
      type: "Mixed",
      role: "Frontend Developer",
      level: "Senior", 
      techstack: "React, TypeScript, Next.js, Node.js",
      amount: 5,
      userid: "test-user-debug-123",
      difficulty: "Medium",
      industry: "Technology"
    };

    try {
      const response = await fetch('/vapi/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      setResult({
        type: 'generation',
        data,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="apple-glass rounded-2xl p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          onClick={testHealthCheck}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading && result?.type !== 'generation' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Test Health Check (GET)
        </Button>
        
        <Button
          onClick={testGeneration}
          disabled={loading}
          variant="default"
          className="flex items-center gap-2"
        >
          {loading && result?.type !== 'health' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          Test Interview Generation (POST)
        </Button>

        {result && (
          <Button
            onClick={clearResults}
            variant="ghost"
            className="text-white/70 hover:text-white"
          >
            Clear Results
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {result.type === 'health' ? (
                <>
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Health Check Result
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Interview Generation Result
                </>
              )}
            </h3>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>Status: {result.status}</span>
              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="bg-black/50 rounded-lg p-4 overflow-auto">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>

          {result.type === 'generation' && result.data.success && (
            <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <strong>Success!</strong>
              </div>
              <p>Interview created with ID: <code className="bg-black/30 px-2 py-1 rounded">{result.data.data.interviewId}</code></p>
              <p>Generated {result.data.data.questionsGenerated} questions for {result.data.data.role}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h4 className="font-medium text-white mb-2">Quick Debug Info</h4>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-white/60">
          <div>
            <p><strong>API Endpoint:</strong> /vapi/generate</p>
            <p><strong>File Location:</strong> app/vapi/generate/route.ts</p>
            <p><strong>Methods:</strong> GET, POST, HEAD, OPTIONS</p>
          </div>
          <div>
            <p><strong>Current Domain:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server Side'}</p>
            <p><strong>Full URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/vapi/generate` : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;