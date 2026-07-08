import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function App() {
  const [username, setUsername] = useState(null);
  const [tempUsername, setTempUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [connStatus, setConnStatus] = useState('connecting'); // 'connecting', 'online', 'disconnected'
  const [connLabel, setConnLabel] = useState('Connecting...');
  const [activeUsers, setActiveUsers] = useState(0);
  const [messageInput, setMessageInput] = useState('');

  const stompClientRef = useRef(null);
  const messageAreaRef = useRef(null);

  // Initialize socket connection immediately on load
  useEffect(() => {
    setConnStatus('connecting');
    setConnLabel('Connecting...');

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-endpoints'),// backend endpoint se connect hona
      reconnectDelay: 5000, // when connection get lost ,reconnect with in 5 sec
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
           // when connect successfully
    client.onConnect = (frame) => {
      console.log('Connected to websocket server');
      setConnStatus('online');
      setConnLabel('Connected');

      // Subscribe to messages
      client.subscribe('/topic/messages', (message) => {
        try {
          const msg = JSON.parse(message.body);
          setMessages((prev) => [...prev, msg]);
        } catch (e) {
          console.error('Error parsing received message: ', e);
        }
      });

      // Subscribe to active user count
      client.subscribe('/topic/userCount', (countMessage) => {
        const count = parseInt(countMessage.body, 10);
        setActiveUsers(count);
      });
    };

    client.onWebSocketClose = () => {
      console.log('STOMP socket connection closed');
      setConnStatus('disconnected');
      setConnLabel('Disconnected');
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      setConnStatus('disconnected');
      setConnLabel('Disconnected');
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  // Scroll automatically to the bottom on new message additions
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Format timestamps into readable localized hours:minutes format
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };

  // Triggered when entering username on the login screen
  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const trimmed = tempUsername.trim();

    if (!trimmed) {
      alert('Please enter a valid username!');
      return;
    }

    setUsername(trimmed);

    // Broadcast JOIN notification to the chat room
    const client = stompClientRef.current;
    if (client && client.connected) {
      client.publish({
        destination: '/app/chat',
        body: JSON.stringify({
          sender: trimmed,
          content: `${trimmed} joined the chat`,
          type: 'JOIN',
          timeStamp: new Date().toISOString(),
        }),
      });
    }
  };

  // Send standard chat message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const trimmed = messageInput.trim();// it remove the unwanted space enter by user in string
    if (!trimmed) return; // prevent from sending empty message

    const client = stompClientRef.current;
    if (client && client.connected) {
      client.publish({
        destination: '/app/chat',
        body: JSON.stringify({// convert the js object into normal string
          sender: username,
          content: trimmed,
          type: 'CHAT',
          timeStamp: new Date().toISOString(),
        }),
      });
      setMessageInput('');
    } else {
      alert('Lost connection to chat server. Please reload the page.');
    }
  };

  return (
    <>
      {/* Login Card overlay */}
      {!username ? (
        <div className="login-overlay">
          <form className="login-card" onSubmit={handleJoin}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
            </div>
            <h1>Live Chat</h1>
            <p>Connect with others in real-time</p>
            <div className="input-group">
              <label htmlFor="uname">Select a Username</label>
              <input
                type="text"
                id="uname"
                placeholder="Enter your nickname..."
                autoComplete="off"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary">
              Join Conversation
            </button>
          </form>
        </div>
      ) : (
        /* Chat dashboard layout */
        <div className="chat-container">
          {/* Sidebar Panel (Desktop viewports) */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
              <h2>Live Chat</h2>
            </div>
            <div className="sidebar-content">
              {/* User Profile Info Card */}
              <div className="profile-card">
                <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
                <div className="profile-info">
                  <div className="username-label">{username}</div>
                  <div className="status-sub">
                    <span
                      className={`status-dot ${
                        connStatus === 'online'
                          ? 'online'
                          : connStatus === 'connecting'
                          ? 'connecting'
                          : ''
                      }`}
                      style={
                        connStatus === 'disconnected'
                          ? { backgroundColor: '#ef4444' }
                          : undefined
                      }
                    ></span>
                    <span>{connLabel}</span>
                  </div>
                </div>
              </div>

              {/* Channels List */}
              <div className="sidebar-section">
                <h3>Rooms</h3>
                <ul className="sidebar-list">
                  <li className="sidebar-item active">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                    <span># Global Room</span>
                  </li>
                </ul>
              </div>

              {/* System instructions / tips */}
              <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                <h3>Info</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Messages are broadcasted in real-time. Type message and hit Enter or click send.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Window area */}
          <main className="chat-window">
            <header className="chat-header">
              <div className="chat-header-info">
                <h2># Global Room</h2>
                <p>Sharing messages with everyone in the room</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.82rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{ width: '14px', height: '14px', fill: 'var(--text-muted)' }}
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span style={{ color: 'var(--text-muted)' }}>Active:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{activeUsers}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className={`status-dot ${
                      connStatus === 'online'
                        ? 'online'
                        : connStatus === 'connecting'
                        ? 'connecting'
                        : ''
                    }`}
                    style={
                      connStatus === 'disconnected'
                        ? { backgroundColor: '#ef4444' }
                        : undefined
                    }
                  ></span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Real-time
                  </span>
                </div>
              </div>
            </header>

            {/* Scrollable list of chat messages */}
            <div ref={messageAreaRef} className="message-area">
              {messages.map((msg, index) => {
                const isSystemMessage = msg.type === 'JOIN' || msg.type === 'LEAVE';
                if (isSystemMessage) {
                  return (
                    <div key={index} className="system-msg-container">
                      <div className="system-pill">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                } else {
                  const isSentByMe = msg.sender === username;
                  return (
                    <div
                      key={index}
                      className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}
                    >
                      <div className="message-meta">
                        <span className="sender">{msg.sender}</span>
                        <span className="time">{formatTime(msg.timeStamp)}</span>
                      </div>
                      <div className="message-bubble">{msg.content}</div>
                    </div>
                  );
                }
              })}
            </div>

            {/* Footer Message Input form */}
            <footer className="input-area">
              <form className="input-container" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message here..."
                  autoComplete="off"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit" className="btn-send">
                  <svg viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </footer>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
