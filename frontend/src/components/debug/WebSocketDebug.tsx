import React, { useState, useEffect } from 'react';
import { webSocketService } from '../../services/websocket';
import { globalWebRTCService } from '../../services/globalWebRTC';

export const WebSocketDebug: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [events, setEvents] = useState<string[]>([]);
  const [testUserId] = useState(`test-${Date.now()}`);

  useEffect(() => {
    // Monitor connection status
    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      addEvent(`WebSocket ${connected ? 'connected' : 'disconnected'}`);
    });

    // Initial status
    setConnectionStatus(webSocketService.isConnected ? 'connected' : 'disconnected');

    return unsubscribe;
  }, []);

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 19)]);
  };

  const testJoinGlobalCall = () => {
    const userData = {
      userId: testUserId,
      name: 'Test User',
      role: 'learner',
      isVideoEnabled: true,
      isAudioEnabled: true,
      isScreenSharing: false,
    };

    addEvent(`Attempting to join global call with user: ${testUserId}`);
    webSocketService.joinGlobalCall(userData);
  };

  const testLeaveGlobalCall = () => {
    addEvent(`Leaving global call`);
    webSocketService.leaveGlobalCall();
  };

  const testWebRTCOffer = () => {
    const offer = {
      type: 'offer' as RTCSdpType,
      sdp: 'test-sdp-data'
    };
    addEvent(`Sending WebRTC offer to test-target`);
    webSocketService.sendWebRTCOffer('test-target', offer);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">WebSocket Debug Panel</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Connection Status:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Socket ID: {webSocketService.socket?.id || 'N/A'}
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Test Actions:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testJoinGlobalCall}
            disabled={connectionStatus !== 'connected'}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:bg-gray-400"
          >
            Join Global Call
          </button>
          <button
            onClick={testLeaveGlobalCall}
            disabled={connectionStatus !== 'connected'}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:bg-gray-400"
          >
            Leave Global Call
          </button>
          <button
            onClick={testWebRTCOffer}
            disabled={connectionStatus !== 'connected'}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm disabled:bg-gray-400"
          >
            Send Test Offer
          </button>
          <button
            onClick={clearEvents}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
          >
            Clear Events
          </button>
        </div>
      </div>

      {/* Events Log */}
      <div>
        <h3 className="font-medium mb-2">Events Log:</h3>
        <div className="bg-gray-50 rounded p-3 h-64 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-gray-500 text-sm">No events yet...</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {event}
              </div>
            ))
          )}
        </div>
      </div>

      {/* WebRTC Service Status */}
      <div className="mt-4 pt-4 border-t">
        <h3 className="font-medium mb-2">WebRTC Service Status:</h3>
        <div className="text-sm space-y-1">
          <div>Is Connected: {globalWebRTCService.isConnected ? 'Yes' : 'No'}</div>
          <div>Local Stream: {globalWebRTCService.localVideoStream ? 'Available' : 'None'}</div>
        </div>
      </div>
    </div>
  );
};
