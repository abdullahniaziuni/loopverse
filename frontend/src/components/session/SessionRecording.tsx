import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Download, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../hooks/useToast';

interface SessionRecordingProps {
  sessionId: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  recordingDuration: number;
  canRecord?: boolean;
}

export const SessionRecording: React.FC<SessionRecordingProps> = ({
  sessionId,
  isRecording,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  recordingDuration,
  canRecord = true,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    if (!canRecord) {
      showError('Recording permission required');
      return;
    }
    onStartRecording();
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      onResumeRecording();
      setIsPaused(false);
    } else {
      onPauseRecording();
      setIsPaused(true);
    }
  };

  const handleStopRecording = () => {
    onStopRecording();
    setIsPaused(false);
    // In a real implementation, you would get the recording blob from the recording service
    // setRecordingBlob(blob);
  };

  const downloadRecording = async () => {
    if (!recordingBlob) {
      showError('No recording available to download');
      return;
    }

    try {
      setIsProcessing(true);
      
      const url = URL.createObjectURL(recordingBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-recording-${sessionId}-${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Recording downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const shareRecording = async () => {
    if (!recordingBlob) {
      showError('No recording available to share');
      return;
    }

    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([recordingBlob], `session-recording-${sessionId}.webm`, {
          type: recordingBlob.type,
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Session Recording',
            text: 'Check out this learning session recording',
            files: [file],
          });
          return;
        }
      }

      // Fallback: copy link to clipboard
      const url = URL.createObjectURL(recordingBlob);
      await navigator.clipboard.writeText(url);
      showSuccess('Recording link copied to clipboard');
    } catch (error) {
      console.error('Share error:', error);
      showError('Failed to share recording');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Recording Status */}
          <div className="flex items-center space-x-2">
            {isRecording && (
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
            )}
            <span className="text-sm font-medium text-gray-700">
              {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready to Record'}
            </span>
          </div>

          {/* Duration */}
          {(isRecording || recordingDuration > 0) && (
            <div className="text-sm text-gray-600">
              {formatDuration(recordingDuration)}
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center space-x-2">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={!canRecord}
              size="sm"
              className="flex items-center"
            >
              <Play className="h-4 w-4 mr-1" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleStopRecording}
                variant="danger"
                size="sm"
                className="flex items-center"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recording Actions */}
      {recordingBlob && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Recording completed • {(recordingBlob.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={downloadRecording}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button
                onClick={shareRecording}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Note:</strong> Recordings include audio and video from the session. 
          All participants will be notified when recording starts.
        </p>
        {!canRecord && (
          <p className="text-red-500 mt-1">
            Recording requires microphone and camera permissions.
          </p>
        )}
      </div>
    </div>
  );
};

// Recording Player Component for playback
interface RecordingPlayerProps {
  recordingUrl: string;
  title?: string;
  duration?: number;
  onClose?: () => void;
}

export const RecordingPlayer: React.FC<RecordingPlayerProps> = ({
  recordingUrl,
  title = 'Session Recording',
  duration,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={recordingUrl}
        className="w-full h-auto"
        controls={false}
      />

      {/* Controls */}
      <div className="bg-gray-900 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{title}</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
              ×
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={videoRef.current?.duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(videoRef.current?.duration || 0)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={togglePlayPause}
              variant="ghost"
              size="sm"
              className="text-white"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="text-white"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
