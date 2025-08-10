import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { webSocketService } from '../../services/websocket';
import { sessionWebRTCService } from '../../services/sessionWebRTC';
import { initiateSessionCall } from '../notifications/SessionCallNotification';
import { useAuth } from '../../contexts/AuthContext';

export const SessionCallTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: WebSocket Connection
      addResult("🔌 Testing WebSocket connection...");
      if (webSocketService.isConnected) {
        addResult("✅ WebSocket is connected");
        addResult(`📋 User ID: ${webSocketService.userId}`);
      } else {
        addResult("❌ WebSocket is not connected");
        return;
      }

      // Test 2: User Authentication
      addResult("👤 Testing user authentication...");
      if (user) {
        addResult(`✅ User authenticated: ${user.name} (${user.role})`);
      } else {
        addResult("❌ User not authenticated");
        return;
      }

      // Test 3: Session WebRTC Service
      addResult("📹 Testing session WebRTC service...");
      const testSessionId = "test-session-123";
      const testUserData = {
        userId: user.id,
        name: user.name || 'Test User',
        role: user.role || 'user',
        isVideoEnabled: false,
        isAudioEnabled: true,
        isScreenSharing: false,
      };

      try {
        await sessionWebRTCService.joinCall(testSessionId, testUserData);
        addResult("✅ Successfully joined test session call");
        
        // Test media access
        const localStream = sessionWebRTCService.localVideoStream;
        if (localStream) {
          addResult(`✅ Local stream obtained: ${localStream.getTracks().length} tracks`);
          addResult(`📹 Video tracks: ${localStream.getVideoTracks().length}`);
          addResult(`🎤 Audio tracks: ${localStream.getAudioTracks().length}`);
        } else {
          addResult("⚠️ No local stream obtained");
        }

        // Test leaving call
        await sessionWebRTCService.leaveCall();
        addResult("✅ Successfully left test session call");
      } catch (error) {
        addResult(`❌ Session WebRTC test failed: ${error}`);
      }

      // Test 4: Call Initiation
      addResult("📞 Testing call initiation...");
      try {
        initiateSessionCall(
          "test-session-456",
          "test-target-user",
          user.name || 'Test Caller',
          user.role || 'user'
        );
        addResult("✅ Call initiation test completed");
      } catch (error) {
        addResult(`❌ Call initiation failed: ${error}`);
      }

      addResult("🎉 All tests completed!");
      
    } catch (error) {
      addResult(`❌ Test suite failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Session Video Call System Test</h2>
      
      <div className="flex space-x-4 mb-6">
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
        
        <Button
          onClick={clearResults}
          variant="outline"
          disabled={isRunning}
        >
          Clear Results
        </Button>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
        <h3 className="font-semibold mb-3">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click "Run Tests" to start.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-sm font-mono ${
                  result.includes('✅') ? 'text-green-600' :
                  result.includes('❌') ? 'text-red-600' :
                  result.includes('⚠️') ? 'text-yellow-600' :
                  result.includes('🎉') ? 'text-purple-600' :
                  'text-gray-700'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">System Status:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">WebSocket:</span>
            <span className={`ml-2 ${webSocketService.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {webSocketService.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div>
            <span className="font-medium">User:</span>
            <span className="ml-2 text-gray-700">
              {user ? `${user.name} (${user.role})` : 'Not authenticated'}
            </span>
          </div>
          <div>
            <span className="font-medium">Session Service:</span>
            <span className={`ml-2 ${sessionWebRTCService.isConnected ? 'text-green-600' : 'text-gray-600'}`}>
              {sessionWebRTCService.isConnected ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="font-medium">Current Session:</span>
            <span className="ml-2 text-gray-700">
              {sessionWebRTCService.currentSessionId || 'None'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h4>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Ensure you're logged in and WebSocket is connected</li>
          <li>2. Click "Run Tests" to verify all components</li>
          <li>3. Check browser console for detailed logs</li>
          <li>4. Test with another user for full call functionality</li>
        </ol>
      </div>
    </div>
  );
};
