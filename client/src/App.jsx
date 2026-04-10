import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

const defaultServerUrl = "http://localhost:5000";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const currentTargetUserIdRef = useRef("");
  const pendingIceCandidatesRef = useRef([]);

  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [token, setToken] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [callStatus, setCallStatus] = useState("Disconnected");
  const [incomingCall, setIncomingCall] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      cleanupCall();

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const attachLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const ensurePeerConnection = async (peerUserId) => {
    currentTargetUserIdRef.current = peerUserId;

    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const stream = await attachLocalStream();
    const peerConnection = new RTCPeerConnection(rtcConfig);
    const remoteStream = new MediaStream();

    remoteStreamRef.current = remoteStream;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !currentTargetUserIdRef.current) {
        return;
      }

      socketRef.current.emit("call:ice-candidate", {
        targetUserId: currentTargetUserIdRef.current,
        candidate: event.candidate
      });
    };

    peerConnection.onconnectionstatechange = () => {
      const { connectionState } = peerConnection;

      if (connectionState === "connected") {
        setCallStatus("Connected");
        setIsInCall(true);
      }

      if (["failed", "disconnected", "closed"].includes(connectionState)) {
        setCallStatus("Call ended");
        setIsInCall(false);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const flushPendingIceCandidates = async () => {
    if (!peerConnectionRef.current || !pendingIceCandidatesRef.current.length) {
      return;
    }

    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    currentTargetUserIdRef.current = "";
    pendingIceCandidatesRef.current = [];
    setIncomingCall(null);
    setIsInCall(false);
  };

  const handleSocketEvents = (socket) => {
    socket.on("chat:ready", ({ userId }) => {
      setMyUserId(userId);
      setIsConnected(true);
      setCallStatus("Ready");
      setErrorMessage("");
    });

    socket.on("connect_error", (error) => {
      setErrorMessage(error.message || "Socket connection failed");
      setCallStatus("Connection failed");
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setCallStatus("Disconnected");
    });

    socket.on("call:incoming", async ({ fromUserId }) => {
      setIncomingCall({ fromUserId });
      setTargetUserId(fromUserId);
      currentTargetUserIdRef.current = fromUserId;
      setCallStatus(`Incoming call from ${fromUserId}`);
    });

    socket.on("call:accepted", async ({ fromUserId }) => {
      setCallStatus("Call accepted. Starting video...");
      currentTargetUserIdRef.current = fromUserId;
      const peerConnection = await ensurePeerConnection(fromUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("call:offer", {
        targetUserId: fromUserId,
        offer
      });
    });

    socket.on("call:rejected", () => {
      setCallStatus("Call rejected");
      cleanupCall();
    });

    socket.on("call:offer", async ({ fromUserId, offer }) => {
      setCallStatus("Received call offer");
      currentTargetUserIdRef.current = fromUserId;
      const peerConnection = await ensurePeerConnection(fromUserId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIceCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("call:answer", {
        targetUserId: fromUserId,
        answer
      });
    });

    socket.on("call:answer", async ({ answer }) => {
      if (!peerConnectionRef.current) {
        return;
      }

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      await flushPendingIceCandidates();
      setCallStatus("Connecting...");
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (!peerConnectionRef.current?.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });

    socket.on("call:ended", () => {
      setCallStatus("Call ended by peer");
      cleanupCall();
    });

    socket.on("call:error", ({ message }) => {
      setErrorMessage(message);
    });
  };

  const connectSocket = () => {
    if (!token.trim()) {
      setErrorMessage("JWT token is required to connect");
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(serverUrl, {
      auth: { token: token.trim() }
    });

    socketRef.current = socket;
    handleSocketEvents(socket);
    setCallStatus("Connecting...");
  };

  const startCall = async () => {
    if (!socketRef.current || !targetUserId.trim()) {
      setErrorMessage("Connect first and provide a target user ID");
      return;
    }

    setErrorMessage("");
    await attachLocalStream();
    currentTargetUserIdRef.current = targetUserId.trim();
    socketRef.current.emit("call:initiate", {
      targetUserId: targetUserId.trim()
    });
    setCallStatus("Calling...");
  };

  const acceptCall = async () => {
    if (!incomingCall || !socketRef.current) {
      return;
    }

    await attachLocalStream();
    currentTargetUserIdRef.current = incomingCall.fromUserId;
    socketRef.current.emit("call:accept", {
      targetUserId: incomingCall.fromUserId
    });
    setIncomingCall(null);
    setCallStatus("Call accepted");
  };

  const rejectCall = () => {
    if (!incomingCall || !socketRef.current) {
      return;
    }

    socketRef.current.emit("call:reject", {
      targetUserId: incomingCall.fromUserId
    });
    setIncomingCall(null);
    setCallStatus("Call rejected");
  };

  const endCall = () => {
    if (socketRef.current && currentTargetUserIdRef.current) {
      socketRef.current.emit("call:end", {
        targetUserId: currentTargetUserIdRef.current
      });
    }

    cleanupCall();
    setCallStatus("Call ended");
  };

  return (
    <main className="app-shell">
      <section className="call-layout">
        <div className="control-panel">
          <p className="eyebrow">WebRTC Video Call</p>
          <h1>Two-user developer calling in React.</h1>
          <p className="hero-copy">
            Connect with your JWT token, enter another user&apos;s id, and start a
            direct video call over WebRTC with Socket.IO signaling.
          </p>

          <label className="field">
            <span>Socket server URL</span>
            <input
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
              placeholder="http://localhost:5000"
            />
          </label>

          <label className="field">
            <span>JWT token</span>
            <textarea
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste a valid JWT from /api/auth/login"
              rows={4}
            />
          </label>

          <div className="meta-grid">
            <article className="status-card">
              <span>Status</span>
              <strong>{callStatus}</strong>
            </article>
            <article className="status-card">
              <span>My user ID</span>
              <strong>{myUserId || "Not connected yet"}</strong>
            </article>
          </div>

          <button className="primary-button" onClick={connectSocket}>
            {isConnected ? "Reconnect Socket" : "Connect Socket"}
          </button>

          <label className="field">
            <span>Target user ID</span>
            <input
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="Mongo user id of the other developer"
            />
          </label>

          <div className="button-row">
            <button className="primary-button" onClick={startCall}>
              Start Call
            </button>
            <button className="secondary-button" onClick={endCall} disabled={!isInCall}>
              End Call
            </button>
          </div>

          {incomingCall ? (
            <div className="incoming-card">
              <p>Incoming call from {incomingCall.fromUserId}</p>
              <div className="button-row">
                <button className="primary-button" onClick={acceptCall}>
                  Accept
                </button>
                <button className="secondary-button" onClick={rejectCall}>
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </div>

        <div className="video-panel">
          <article className="video-card">
            <div className="video-meta">
              <span>Local</span>
              <strong>You</strong>
            </div>
            <video ref={localVideoRef} autoPlay muted playsInline />
          </article>
          <article className="video-card">
            <div className="video-meta">
              <span>Remote</span>
              <strong>Peer</strong>
            </div>
            <video ref={remoteVideoRef} autoPlay playsInline />
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
