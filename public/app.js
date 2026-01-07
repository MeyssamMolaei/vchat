const socket = io({
    transports: ['websocket'],
    upgrade: false,
    rememberUpgrade: false
});
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const joinBtn = document.getElementById('joinBtn');
const status = document.getElementById('status');

let localStream;
let peerConnection;
let isJoined = false;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

joinBtn.addEventListener('click', startChat);

socket.on('connect', () => {
    console.log('Connected to server');
    if (isJoined) {
        socket.emit('join');
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('Connection lost. Reconnecting...');
});

async function startChat() {
    if (isJoined) return;
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        localVideo.srcObject = localStream;
        
        isJoined = true;
        socket.emit('join');
        updateStatus('Waiting for another user...');
        
        joinBtn.disabled = true;
        joinBtn.textContent = 'Connected';
        
    } catch (error) {
        updateStatus('Error accessing camera/microphone');
        console.error('Media access error:', error);
    }
}

socket.on('existing-users', (users) => {
    if (users.length > 0) {
        createPeerConnection(users[0], true);
    }
});

socket.on('user-connected', (userId) => {
    updateStatus('User connected, establishing connection...');
    createPeerConnection(userId, false);
});

socket.on('user-disconnected', (userId) => {
    updateStatus('User disconnected. Waiting for another user...');
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
    }
});

socket.on('offer', async (data) => {
    try {
        if (!peerConnection) {
            createPeerConnection(data.sender, false);
        }
        
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('answer', {
            answer: answer,
            target: data.sender
        });
    } catch (error) {
        console.error('Error handling offer:', error);
    }
});

socket.on('answer', async (data) => {
    try {
        if (peerConnection) {
            await peerConnection.setRemoteDescription(data.answer);
        }
    } catch (error) {
        console.error('Error handling answer:', error);
    }
});

socket.on('ice-candidate', async (data) => {
    try {
        if (peerConnection && peerConnection.remoteDescription) {
            await peerConnection.addIceCandidate(data.candidate);
        }
    } catch (error) {
        console.error('Error adding ICE candidate:', error);
    }
});

async function createPeerConnection(userId, isInitiator) {
    try {
        peerConnection = new RTCPeerConnection(config);
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
            updateStatus('Connected to peer');
        };
        
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    target: userId
                });
            }
        };
        
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                updateStatus('Connected to peer');
            } else if (peerConnection.connectionState === 'disconnected') {
                updateStatus('Peer disconnected');
            }
        };
        
        if (isInitiator) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            socket.emit('offer', {
                offer: offer,
                target: userId
            });
        }
    } catch (error) {
        console.error('Error creating peer connection:', error);
    }
}

function updateStatus(message) {
    status.textContent = message;
    console.log(message);
}