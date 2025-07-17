const socket = io();
const pathParts = window.location.pathname.split('/');
// Fix: Extract room ID correctly from /room/roomId URL structure
const roomId = pathParts[1] === 'room' ? pathParts[2] : null;

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

// Add error handling for button clicks
newRoomBtn.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = '/new';
});

// Show join container only if we have a valid room ID
if (roomId && roomId.trim() !== '') {
  joinContainer.classList.remove('hidden');
  // Set room ID in both join screen and chat header
  if (roomIdDisplay) {
    roomIdDisplay.textContent = roomId;
  }
  console.log('Room ID found:', roomId); // Debug log
} else {
  // If no room ID, redirect to create new room
  console.log('No room ID found, redirecting to /new');
  window.location.href = '/new';
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
  
  // Ensure room ID is displayed in chat header after joining
  if (roomIdDisplay) {
    roomIdDisplay.textContent = roomId;
  }
  
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
