// Accessing elements
const video = document.getElementById('video');
const emotionElement = document.getElementById('emotion');
const songOptionsDiv = document.getElementById('song-options');
const songButtonsDiv = document.getElementById('song-buttons');
const songPlayer = document.getElementById('song-player');
const songSource = document.getElementById('song-source');

// Start the webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert('Could not access the webcam: ' + err);
  });

// Emotion detection logic
let isEmotionDetected = false;
let captureInterval = setInterval(() => {
  if (isEmotionDetected) return;  // Stop capturing if emotion detected

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageData = canvas.toDataURL('image/jpeg'); // Convert to base64
  
  emotionElement.innerHTML = 'Detecting emotion...';

  // Send image to backend
  $.ajax({
    url: '/detect_emotion',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ image: imageData }),
    success: (response) => {
      if (response.error) {
        emotionElement.innerHTML = 'Error detecting emotion: ' + response.error;
        return;
      }

      emotionElement.innerHTML = 'Emotion: ' + response.emotion;
      songOptionsDiv.style.display = 'block';
      songButtonsDiv.innerHTML = ''; // Clear previous buttons

      response.songs.forEach(song => {
        const button = document.createElement('button');
        button.classList.add('song-button');
        button.textContent = song.replace('.mp3', '');  // Remove .mp3 extension

        button.onclick = () => {
          playSong(song);
        };

        songButtonsDiv.appendChild(button);
      });

      isEmotionDetected = true; // Stop further detection
      clearInterval(captureInterval);
    },
    error: () => {
      emotionElement.innerHTML = 'Error communicating with backend.';
    }
  });
}, 2000);  // Capture every 2 seconds

// Function to play selected song
function playSong(song) {
  songPlayer.pause();
  songPlayer.currentTime = 0;

  songSource.src = `/static/music/${song}`;
  songPlayer.style.display = 'block';
  songPlayer.load();
  songPlayer.play();

  stopWebcam();
}

// Stop the webcam stream
function stopWebcam() {
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
