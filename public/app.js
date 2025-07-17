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
  const linkInput = document.getElementById('link-input');
  const joinLinkBtn = document.getElementById('join-link-btn');

  let currentUserName = '';

  // Utility to create a fallback name
  function generateDefaultName() {
    return 'Guest-' + Math.floor(1000 + Math.random() * 9000);
  }

  // Function to update room ID display
  function updateRoomIdDisplay(id) {
    if (roomIdDisplay && id) {
      roomIdDisplay.textContent = id;
      console.log('Room ID updated in display:', id);
    }
  }

  // Function to reset app state for new room
  function resetAppState() {
    currentUserName = '';
    nameInput.value = '';
    chatInput.value = '';
    messagesDiv.innerHTML = '';
    joinContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    sendBtn.disabled = true;
  }

  // Add error handling for button clicks
  newRoomBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const pendingName = nameInput.value.trim();
    localStorage.setItem('autoJoinName', pendingName); // may be empty
    window.location.replace('/new');
  });

  // Show join container only if we have a valid room ID
  if (roomId && roomId.trim() !== '') {
    // Entering an existing room via direct link
    resetAppState();
    joinContainer.classList.remove('hidden');
    joinBtn.disabled = false;
    updateRoomIdDisplay(roomId);
    console.log('Valid room ID found:', roomId);
  } else {
    // No room yet – landing page mode
    resetAppState();
    joinContainer.classList.remove('hidden');
    joinBtn.disabled = true; // cannot join until a room is loaded
    console.log('Landing page – waiting for user to create or paste room');
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
    
    // Clear any existing messages when joining a new room
    messagesDiv.innerHTML = '';
    
    socket.emit('join-room', roomId, userName);
  });

  if (joinLinkBtn) {
    joinLinkBtn.addEventListener('click', () => {
      const link = linkInput.value.trim();
      if (!link) return;
      const pendingName = nameInput.value.trim();
      localStorage.setItem('autoJoinName', pendingName);
      try {
        const url = new URL(link, window.location.origin);
        // if link contains /room/<id> navigate directly
        if (url.pathname.startsWith('/room/')) {
          window.location.href = url.pathname;
        } else {
          alert('Invalid room link');
        }
      } catch (err) {
        alert('Invalid URL');
      }
    });
  }

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

  // Auto-join logic when landing directly on /room/:id
  if (roomId) {
    const storedName = localStorage.getItem('autoJoinName');
    if (storedName !== null) {
      localStorage.removeItem('autoJoinName'); // consume it
      const finalName = storedName && storedName.trim() !== '' ? storedName : generateDefaultName();
      currentUserName = finalName;
      joinContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
      updateRoomIdDisplay(roomId);
      socket.emit('join-room', roomId, finalName);
    }
  }

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
