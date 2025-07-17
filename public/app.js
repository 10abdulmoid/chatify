const socket = io();
const pathParts = window.location.pathname.split('/');
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

newRoomBtn.addEventListener('click', () => location.href = '/new');

if (roomId) {
  joinContainer.classList.remove('hidden');
  roomIdDisplay.textContent = roomId;
}

joinBtn.addEventListener('click', () => {
  const userName = nameInput.value.trim();
  if (!userName) return;
  currentUserName = userName;
  joinContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  socket.emit('join-room', roomId, userName);
});

chatInput.addEventListener('input', () => {
  sendBtn.disabled = !chatInput.value.trim();
});

sendBtn.addEventListener('click', () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit('message', msg);
  chatInput.value = '';
  sendBtn.disabled = true;
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
