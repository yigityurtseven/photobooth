let stream;
let photosTaken = 0;
const TOTAL_PHOTOS = 4;
const COUNTDOWN_TIME = 3;
const PHOTO_PADDING = 20; // Padding in pixels between photos

const video = document.getElementById('video');
const photoCanvas = document.getElementById('photo-canvas');
const ctx = photoCanvas.getContext('2d');
const finalImage = document.getElementById('final-image');
const startBtn = document.getElementById('start-btn');
const shareBtn = document.getElementById('share-btn');
const restartBtn = document.getElementById('restart-btn');
const countdownDisplay = document.getElementById('countdown');
const saveBtn = document.getElementById('save-btn');

// Initialize camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
}

// Start the photo session
async function startPhotoSession() {
    photosTaken = 0;
    photoCanvas.width = video.videoWidth;
    // Add extra height for padding between photos
    photoCanvas.height = (video.videoHeight * TOTAL_PHOTOS) + (PHOTO_PADDING * (TOTAL_PHOTOS - 1));
    // Fill canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    startBtn.style.display = 'none';
    await takePhotos();
}

// Countdown function
function countdown() {
    return new Promise(resolve => {
        let count = COUNTDOWN_TIME;
        countdownDisplay.style.display = 'block';
        
        const countInterval = setInterval(() => {
            countdownDisplay.textContent = count;
            if (count === 0) {
                clearInterval(countInterval);
                countdownDisplay.style.display = 'none';
                resolve();
            }
            count--;
        }, 1000);
    });
}

// Take photos
async function takePhotos() {
    if (photosTaken < TOTAL_PHOTOS) {
        await countdown();
        // Save current transform state
        ctx.save();
        // Mirror the context
        ctx.scale(-1, 1);
        // Capture photo (adjusted for mirroring)
        ctx.drawImage(
            video, 
            -video.videoWidth, 
            photosTaken * (video.videoHeight + PHOTO_PADDING), // Add padding between photos
            video.videoWidth, 
            video.videoHeight
        );
        // Restore transform state
        ctx.restore();
        
        // Create flash effect
        createFlashEffect();
        
        photosTaken++;
        await takePhotos();
    } else {
        applyVintageFilter();
        showFinalImage();
    }
}

// Apply vintage black and white filter
function applyVintageFilter() {
    const imageData = ctx.getImageData(0, 0, photoCanvas.width, photoCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Skip if pixel is white (background)
        if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
            continue;
        }
        
        // Convert to grayscale
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // Add vintage effect
        const contrast = 1.2; // Increase contrast
        const brightness = 10; // Add slight brightness
        const value = contrast * (avg - 128) + 128 + brightness;
        
        data[i] = data[i + 1] = data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Show final image and controls
function showFinalImage() {
    video.style.display = 'none';
    finalImage.src = photoCanvas.toDataURL('image/jpeg');
    finalImage.style.display = 'block';
    shareBtn.style.display = 'block';
    saveBtn.style.display = 'block';
    restartBtn.style.display = 'block';
}

// Share functionality
async function sharePhoto() {
    try {
        const blob = await new Promise(resolve => photoCanvas.toBlob(resolve, 'image/jpeg'));
        const file = new File([blob], 'valentine-photobooth.jpg', { type: 'image/jpeg' });
        
        if (navigator.share) {
            await navigator.share({
                files: [file],
                title: 'Valentine\'s Photobooth',
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const link = document.createElement('a');
            link.download = 'valentine-photobooth.jpg';
            link.href = photoCanvas.toDataURL('image/jpeg');
            link.click();
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

// Add this new function for saving
function savePhoto() {
    const link = document.createElement('a');
    link.download = 'valentine-photobooth.jpg';
    link.href = photoCanvas.toDataURL('image/jpeg');
    link.click();
}

// Restart the photobooth
function restart() {
    photosTaken = 0;
    finalImage.style.display = 'none';
    video.style.display = 'block';
    shareBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    startBtn.style.display = 'block';
    ctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
}

// Add this new function for the flash effect
function createFlashEffect() {
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

// Event listeners
startBtn.addEventListener('click', startPhotoSession);
shareBtn.addEventListener('click', sharePhoto);
restartBtn.addEventListener('click', restart);
saveBtn.addEventListener('click', savePhoto);

// Initialize camera when page loads
initCamera(); 