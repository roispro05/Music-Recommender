// Accessing the webcam and displaying it in a video element
const video = document.getElementById('video');
const emotionElement = document.getElementById('emotion');
const songElement = document.getElementById('song-link');
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

// Capture image from the webcam every 1 second
let isEmotionDetected = false;
let captureInterval = setInterval(() => {
  if (isEmotionDetected) return;  // Stop capturing if emotion is already detected

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to base64 image
  const imageData = canvas.toDataURL('image/jpeg');

  // Show loading text while detecting emotion
  emotionElement.innerHTML = 'Detecting emotion...';

  // Send the base64 image to the backend for emotion detection
  $.ajax({
    url: '/detect_emotion',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ image: imageData }),
    success: (response) => {
      if (response.error) {
        emotionElement.innerHTML = 'Error detecting emotion: ' + response.error;
      } else {
        emotionElement.innerHTML = 'Emotion: ' + response.emotion;
        
        // Show song options to the user
        songOptionsDiv.style.display = 'block';
        songButtonsDiv.innerHTML = '';  // Clear previous buttons
        
        // Create buttons for each song
        response.songs.forEach(song => {
          const button = document.createElement('button');
          button.classList.add('song-button');
          button.textContent = song;  // Show song filename (or customize this with a title)
          
          // On click, play the selected song
          button.onclick = () => {
            // Pause any currently playing song
            songPlayer.pause();
            songPlayer.currentTime = 0;
            
            songSource.src = `/static/music/${song}`;  // Set the song source
            songPlayer.style.display = 'block';  // Show the audio player
            songPlayer.load();  // Load the audio
            songPlayer.play();  // Play the song

            isEmotionDetected = true;  // Stop further detection after selection
            
            // Stop the webcam stream
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());  // Stop the webcam

            // Clear the interval for capturing images
            clearInterval(captureInterval);
          };

          songButtonsDiv.appendChild(button);
        });
      }
    },
    error: (err) => {
      emotionElement.innerHTML = 'Error communicating with backend.';
    }
  });
}, 1000);  // Capture every second
