// // hooks/useEnvironmentValidation.ts - React Hook for Environment Validation
// import { useState, useEffect } from 'react';
// import { checkAPIKeys, getSecurityRecommendations, type APICheckResults, type SecurityRecommendation } from '@/lib/env-validation';

// interface EnvironmentStatus {
//   isLoading: boolean;
//   isValid: boolean;
//   apiKeys: APICheckResults | null;
//   recommendations: SecurityRecommendation[];
//   error: string | null;
// }

// export function useEnvironmentValidation() {
//   const [status, setStatus] = useState<EnvironmentStatus>({
//     isLoading: true,
//     isValid: false,
//     apiKeys: null,
//     recommendations: [],
//     error: null
//   });

//   const checkEnvironment = async () => {
//     try {
//       setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
//       // Check API keys
//       const apiKeys = await checkAPIKeys();
      
//       // Get security recommendations
//       const recommendations = getSecurityRecommendations();
      
//       // Determine if environment is valid
//       const isValid = Object.values(apiKeys).every(result => result.valid) && 
//                      recommendations.filter(r => r.level === 'error').length === 0;
      
//       setStatus({
//         isLoading: false,
//         isValid,
//         apiKeys,
//         recommendations,
//         error: null
//       });
//     } catch (error) {
//       setStatus(prev => ({
//         ...prev,
//         isLoading: false,
//         error: error instanceof Error ? error.message : 'Unknown error occurred'
//       }));
//     }
//   };

//   useEffect(() => {
//     // Only run in development or when explicitly requested
//     if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV_CHECK === 'true') {
//       checkEnvironment();
//     } else {
//       setStatus(prev => ({ ...prev, isLoading: false, isValid: true }));
//     }
//   }, []);

//   return {
//     ...status,
//     refetch: checkEnvironment
//   };
// }

// // Component to display environment status
// export function EnvironmentStatus() {
//   const { isLoading, isValid, apiKeys, recommendations, error, refetch } = useEnvironmentValidation();

//   if (isLoading) {
//     return (
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <div className="flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
//           <span className="text-blue-700">Checking environment...</span>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="font-medium text-red-900">Environment Check Failed</h3>
//             <p className="text-sm text-red-700 mt-1">{error}</p>
//           </div>
//           <button
//             onClick={refetch}
//             className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const errorCount = recommendations.filter(r => r.level === 'error').length;
//   const warningCount = recommendations.filter(r => r.level === 'warning').length;

//   return (
//     <div className={`border rounded-lg p-4 ${
//       isValid 
//         ? 'bg-green-50 border-green-200' 
//         : errorCount > 0 
//         ? 'bg-red-50 border-red-200'
//         : 'bg-yellow-50 border-yellow-200'
//     }`}>
//       <div className="flex items-center justify-between mb-3">
//         <h3 className={`font-medium ${
//           isValid ? 'text-green-900' : errorCount > 0 ? 'text-red-900' : 'text-yellow-900'
//         }`}>
//           Environment Status
//         </h3>
//         <button
//           onClick={refetch}
//           className="text-sm text-gray-600 hover:text-gray-800"
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {/* API Keys Status */}
//       {apiKeys && (
//         <div className="mb-3">
//           <h4 className="text-sm font-medium text-gray-900 mb-2">API Keys</h4>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//             {Object.entries(apiKeys).map(([service, result]) => (
//               <div key={service} className="flex items-center gap-2">
//                 <span className={result.valid ? 'text-green-600' : 'text-red-600'}>
//                   {result.valid ? '✅' : '❌'}
//                 </span>
//                 <span className="text-sm capitalize">{service}</span>
//                 {!result.valid && result.error && (
//                   <span className="text-xs text-gray-500">({result.error})</span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Recommendations */}
//       {recommendations.length > 0 && (
//         <div>
//           <h4 className="text-sm font-medium text-gray-900 mb-2">
//             Issues Found ({errorCount} errors, {warningCount} warnings)
//           </h4>
//           <div className="space-y-2">
//             {recommendations.slice(0, 3).map((rec, index) => (
//               <div key={index} className="text-sm">
//                 <div className="flex items-start gap-2">
//                   <span className={
//                     rec.level === 'error' ? 'text-red-600' : 
//                     rec.level === 'warning' ? 'text-yellow-600' : 
//                     'text-blue-600'
//                   }>
//                     {rec.level === 'error' ? '🚨' : rec.level === 'warning' ? '⚠️' : 'ℹ️'}
//                   </span>
//                   <div>
//                     <p className="text-gray-900">{rec.message}</p>
//                     <p className="text-gray-600 text-xs mt-1">Fix: {rec.fix}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {recommendations.length > 3 && (
//               <p className="text-xs text-gray-500">
//                 +{recommendations.length - 3} more issues...
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {isValid && recommendations.length === 0 && (
//         <p className="text-green-700 text-sm">
//           ✅ All environment variables are properly configured!
//         </p>
//       )}
//     </div>
//   );
// }