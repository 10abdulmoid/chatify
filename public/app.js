const socket = io();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Extract room ID from URL
  const pathParts = window.location.pathname.split('/');
  const roomId = pathParts[1] === 'room' ? pathParts[2] : null;
  
  console.log('URL:', window.location.href);
  console.log('Room ID extracted:', roomId);
  
  const joinContainer = document.getElementById('join-container');
  const chatContainer = document.getElementById('chat-container');
  const nameInput = document.getElementById('name-input');
  const joinBtn = document.getElementById('join');
  const newRoomBtn = document.getElementById('new-room');
  const roomIdDisplay = document.getElementById('room-id');
  const messagesDiv = document.getElementById('messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send');

  let currentUserName = '';

  // Function to update room ID display
  function updateRoomIdDisplay(id) {
    if (roomIdDisplay && id) {
      roomIdDisplay.textContent = id;
      console.log('Room ID updated in display:', id);
    }
  }

  // Add error handling for button clicks
  newRoomBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/new';
  });

  // Show join container only if we have a valid room ID
  if (roomId && roomId.trim() !== '') {
    joinContainer.classList.remove('hidden');
    updateRoomIdDisplay(roomId);
    console.log('Valid room ID found:', roomId);
  } else {
    console.log('No room ID found, redirecting to /new');
    window.location.href = '/new';
    return;
  }

  joinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const userName = nameInput.value.trim();
    if (!userName) {
      alert('Please enter your name');
      return;
    }
    if (!roomId) {
      alert('Invalid room ID');
      return;
    }
    
    currentUserName = userName;
    joinContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Update room ID display again after showing chat container
    updateRoomIdDisplay(roomId);
    
    socket.emit('join-room', roomId, userName);
  });

  // Add Enter key support for name input
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      joinBtn.click();
    }
  });

  chatInput.addEventListener('input', () => {
    sendBtn.disabled = !chatInput.value.trim();
  });

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    socket.emit('message', msg);
    chatInput.value = '';
    sendBtn.disabled = true;
  });

  // Add Enter key support for chat input
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });

  socket.on('createMessage', (msg, userName) => {
    const el = document.createElement('div');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    el.innerHTML = `<strong>${userName}:</strong> ${msg} <span style="color:#aaa;font-size:0.9em;margin-left:8px;">${time}</span>`;
    if (userName === currentUserName) {
      el.classList.add('self');
    }
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('user-connected', (userName) => {
    const el = document.createElement('div');
    el.innerHTML = `<em>${userName} joined</em>`;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('user-disconnected', (userName) => {
    const el = document.createElement('div');
    el.innerHTML = `<em>${userName} left</em>`;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  // Add connection error handling for production
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    const el = document.createElement('div');
    el.innerHTML = '<em style="color: red;">Connection lost. Trying to reconnect...</em>';
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    const el = document.createElement('div');
    el.innerHTML = '<em style="color: red;">Connection error. Please refresh the page.</em>';
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  socket.on('reconnect', () => {
    console.log('Reconnected to server');
    const el = document.createElement('div');
    el.innerHTML = '<em style="color: green;">Reconnected!</em>';
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Rejoin room after reconnection
    if (currentUserName && roomId) {
      socket.emit('join-room', roomId, currentUserName);
    }
  });
}

// Fallback: if DOMContentLoaded already fired, run immediately
if (document.readyState === 'loading') {
  // Do nothing, DOMContentLoaded will fire
} else {
  initializeApp();
}
