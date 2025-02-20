import io from 'socket.io-client';

const socket = io('http://localhost:5000'); 
socket.on('connect', () => {
    console.log('Socket connected, id:', socket.id);
});
  
socket.on('disconnect', () => {
    console.log('Socket disconnected');
});
  
socket.on('photoData', (data) => {
    console.log('Photo data received on client:', data);
});
  
export default socket;
