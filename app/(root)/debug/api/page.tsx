// File: app/(root)/debug/api/page.tsx
// This creates a route at: https://your-domain.com/debug/api

import React from 'react';
import ApiTester from '@/components/ApiTester';

const ApiDebugPage = () => {
  return (
    <div className="apple-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Debug Center</h1>
        <p className="text-white/60">Test and debug your API endpoints</p>
      </div>

      <div className="space-y-8">
        {/* API Tester Component */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Interview Generation API</h2>
          <ApiTester />
        </div>

        {/* Additional Debug Info */}
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">Environment</h4>
              <ul className="text-white/70 space-y-1">
                <li>• NODE_ENV: {process.env.NODE_ENV}</li>
                <li>• Current URL: {typeof window !== 'undefined' ? window.location.origin : 'Server'}</li>
                <li>• API Base: /vapi/generate</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Expected Response</h4>
              <ul className="text-white/70 space-y-1">
                <li>• Health: 200 OK with service info</li>
                <li>• Generation: 200 with interview data</li>
                <li>• Errors: 4xx/5xx with error details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugPage;