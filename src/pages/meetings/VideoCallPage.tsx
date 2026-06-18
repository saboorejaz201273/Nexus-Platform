import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!roomId) return;

    const init = async () => {
      try {
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Connect to socket
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.emit('join-room', roomId, user?.id || socket.id);

        // Create peer connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote stream
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnected(true);
            setStatus('Connected');
          }
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { roomId, candidate: event.candidate });
          }
        };

        // When another user joins -> create offer
        socket.on('user-connected', async () => {
          setStatus('User joined, connecting...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        });

        // Receive offer -> create answer
        socket.on('offer', async (data: any) => {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer });
        });

        // Receive answer
        socket.on('answer', async (data: any) => {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        // Receive ICE candidate
        socket.on('ice-candidate', async (data: any) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error('Error adding ICE candidate', err);
          }
        });

        // User disconnected
        socket.on('user-disconnected', () => {
          setStatus('Other user left');
          setConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        // Call ended by other user
        socket.on('call-ended', () => {
          setStatus('Call ended by other user');
          cleanup();
          navigate('/meetings');
        });

        setStatus('Waiting for other person to join...');
      } catch (err) {
        console.error(err);
        setStatus('Failed to access camera/microphone');
      }
    };

    init();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOn(videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (roomId) {
      socketRef.current?.emit('end-call', roomId);
    }
    cleanup();
    navigate('/meetings');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="p-4 text-white text-center">
        <h1 className="text-lg font-semibold">Video Call - Room: {roomId}</h1>
        <p className="text-sm text-gray-400">{status}</p>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Remote Video (main) */}
        <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!connected && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p>Waiting for other participant...</p>
            </div>
          )}

          {/* Local Video (small overlay) */}
          <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-black rounded-lg overflow-hidden border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 flex justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full ${micOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80`}
        >
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${videoOn ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80`}
        >
          {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};