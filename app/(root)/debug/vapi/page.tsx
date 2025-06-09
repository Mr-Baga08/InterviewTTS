// app/(root)/debug/vapi/page.tsx
import VapiTokenChecker from "@/components/VapiTokenChecker";
import VapiTest from "@/components/VapiTest";

const VapiDebugPage = () => {
  return (
    <div className="apple-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">VAPI Debug Center</h1>
        <p className="text-white/60">Debug and test your VAPI configuration</p>
      </div>

      <div className="space-y-8">
        {/* Token Checker */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Token Validation</h2>
          <VapiTokenChecker />
        </div>

        {/* Configuration Test */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Configuration Test</h2>
          <VapiTest />
        </div>
      </div>
    </div>
  );
};

export default VapiDebugPage;