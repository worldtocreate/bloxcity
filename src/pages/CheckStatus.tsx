import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

type ReservationStatus = 'pending' | 'approved' | 'denied' | null;

const CheckStatus = () => {
  const [checkEmail, setCheckEmail] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    username?: string;
    status?: ReservationStatus;
    denialReason?: string;
  } | null>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail.trim()) return;

    setCheckLoading(true);
    setCheckError("");
    setStatusResult(null);

    try {
      const response = await supabase.functions.invoke('check-reservation-status', {
        body: { email: checkEmail.trim() },
      });

      if (response.error) {
        setCheckError("Failed to check status. Please try again.");
        setCheckLoading(false);
        return;
      }

      const data = response.data as any;
      setStatusResult(data);
    } catch (err) {
      setCheckError("Failed to check status. Please try again.");
    }

    setCheckLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back Link */}
        <a href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Check Reservation Status</h1>
            <p className="text-gray-500 mt-2">Enter your email to check if your username has been approved or denied.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckStatus} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={checkEmail}
                onChange={(e) => setCheckEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                disabled={checkLoading}
              />
            </div>
            <button
              type="submit"
              disabled={checkLoading}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {checkLoading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {/* Error */}
          {checkError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {checkError}
            </div>
          )}

          {/* Result */}
          {statusResult && (
            <div className={`mt-6 p-4 rounded-xl ${
              !statusResult.found ? 'bg-gray-50 border border-gray-200' :
              statusResult.status === 'pending' ? 'bg-yellow-50 border border-yellow-300' :
              statusResult.status === 'approved' ? 'bg-green-50 border border-green-300' :
              'bg-red-50 border border-red-300'
            }`}>
              {!statusResult.found ? (
                <div className="text-center">
                  <p className="text-gray-600">No reservation found for this email address.</p>
                  <a href="/" className="inline-block mt-3 text-blue-600 font-medium hover:underline">
                    Reserve a username →
                  </a>
                </div>
              ) : statusResult.status === 'pending' ? (
                <div>
                  <p className="text-yellow-700 font-semibold text-lg mb-1">⏳ Pending Review</p>
                  <p className="text-gray-600">
                    Your username "<strong>{statusResult.username}</strong>" is currently being reviewed by our team.
                  </p>
                </div>
              ) : statusResult.status === 'approved' ? (
                <div>
                  <p className="text-green-700 font-semibold text-lg mb-1">✅ Approved!</p>
                  <p className="text-gray-600">
                    Your username "<strong>{statusResult.username}</strong>" has been approved! Check your email for your reservation code.
                  </p>
                </div>
              ) : statusResult.status === 'denied' ? (
                <div>
                  <p className="text-red-700 font-semibold text-lg mb-1">❌ Denied</p>
                  <p className="text-gray-600">
                    Unfortunately, the username "<strong>{statusResult.username}</strong>" was not approved.
                  </p>
                  {statusResult.denialReason && (
                    <p className="text-red-600 text-sm mt-2 italic">Reason: {statusResult.denialReason}</p>
                  )}
                  <a href="/" className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Reserve a Different Username
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckStatus;
