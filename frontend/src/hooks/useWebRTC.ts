import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { useWebSocket } from './useWebSocket';

interface UseWebRTCProps {
  streamId: string;
  isStreamer: boolean;
  wsUrl: string;
  onStreamReceived?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
}

export const useWebRTC = ({
  streamId,
  isStreamer,
  wsUrl,
  onStreamReceived,
  onError,
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewers, setViewers] = useState<number>(0);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      handleWebSocketMessage(message);
    },
  });

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'user_joined':
        if (isStreamer && message.userId !== streamId) {
          createPeerConnection(message.userId, true);
        }
        setViewers(message.viewerCount || 0);
        break;
        
      case 'user_left':
        if (peersRef.current.has(message.userId)) {
          peersRef.current.get(message.userId)?.destroy();
          peersRef.current.delete(message.userId);
        }
        setViewers(message.viewerCount || 0);
        break;
        
      case 'webrtc_offer':
        if (!isStreamer) {
          handleOffer(message);
        }
        break;
        
      case 'webrtc_answer':
        if (isStreamer) {
          handleAnswer(message);
        }
        break;
        
      case 'webrtc_ice_candidate':
        handleIceCandidate(message);
        break;
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsStreaming(true);
      
      sendMessage({
        type: 'join_stream',
        streamId
      });

    } catch (error) {
      console.error('Error starting stream:', error);
      onError?.('Failed to access camera/microphone');
    }
  };

  const stopStreaming = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();
    
    setIsStreaming(false);
    
    sendMessage({
      type: 'leave_stream',
      streamId
    });
  };

  const createPeerConnection = (userId: string, initiator: boolean) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        sendMessage({
          type: 'webrtc_offer',
          targetUserId: userId,
          offer: data
        });
      } else if (data.type === 'answer') {
        sendMessage({
          type: 'webrtc_answer',
          targetUserId: userId,
          answer: data
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      onStreamReceived?.(remoteStream);
    });

    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
      onError?.(`Connection error: ${error.message}`);
    });

    peer.on('close', () => {
      peersRef.current.delete(userId);
    });

    peersRef.current.set(userId, peer);
  };

  const handleOffer = (message: any) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    peer.on('signal', (data) => {
      if (data.type === 'answer') {
        sendMessage({
          type: 'webrtc_answer',
          targetUserId: message.fromUserId,
          answer: data
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      onStreamReceived?.(remoteStream);
    });

    peer.on('error', (error) => {
      console.error('Peer connection error:', error);
      onError?.(`Connection error: ${error.message}`);
    });

    peer.signal(message.offer);
    peersRef.current.set(message.fromUserId, peer);
  };

  const handleAnswer = (message: any) => {
    const peer = peersRef.current.get(message.fromUserId);
    if (peer) {
      peer.signal(message.answer);
    }
  };

  const handleIceCandidate = (message: any) => {
    const peer = peersRef.current.get(message.fromUserId);
    if (peer && message.candidate) {
      peer.signal(message.candidate);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const switchCamera = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const currentDeviceId = videoTrack.getSettings().deviceId;
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        const nextDevice = videoDevices[nextIndex];
        
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: nextDevice.deviceId },
          audio: true
        });
        
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        
        oldVideoTrack.stop();
        
        peersRef.current.forEach(peer => {
          const sender = (peer as any)._pc.getSenders().find((s: any) => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
      } catch (error) {
        console.error('Error switching camera:', error);
        onError?.('Failed to switch camera');
      }
    }
  };

  useEffect(() => {
    if (isStreamer && isConnected) {
      startStreaming();
    } else if (!isStreamer && isConnected) {
      sendMessage({
        type: 'join_stream',
        streamId
      });
    }

    return () => {
      stopStreaming();
    };
  }, [isStreamer, isConnected, streamId]);

  return {
    localStream,
    isStreaming,
    viewers,
    localVideoRef,
    startStreaming,
    stopStreaming,
    toggleVideo,
    toggleAudio,
    switchCamera,
  };
};