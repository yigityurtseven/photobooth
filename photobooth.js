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
const saveWithBgBtn = document.getElementById('save-with-bg-btn');
const layoutBtn = document.getElementById('layout-btn');
let isGridLayout = false;
let originalPhotos = null;

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
    const SIDE_PADDING = 40; // Padding for left and right sides
    photoCanvas.width = video.videoWidth + (SIDE_PADDING * 2); // Add padding to width
    photoCanvas.height = (video.videoHeight * TOTAL_PHOTOS) + (PHOTO_PADDING * (TOTAL_PHOTOS - 1)) + (SIDE_PADDING * 2); // Add padding to height
    
    // Fill entire canvas with white background
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
        // Capture photo (adjusted for mirroring and padding)
        ctx.drawImage(
            video, 
            -(video.videoWidth + 40), // Account for side padding
            photosTaken * (video.videoHeight + PHOTO_PADDING) + 40, // Account for top padding
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
    // Store original photos before first layout update
    if (!originalPhotos) {
        originalPhotos = document.createElement('canvas');
        originalPhotos.width = photoCanvas.width;
        originalPhotos.height = photoCanvas.height;
        originalPhotos.getContext('2d').drawImage(photoCanvas, 0, 0);
    }
    updateLayout();
    finalImage.style.display = 'block';
    layoutBtn.style.display = 'block';
    shareBtn.style.display = 'block';
    saveBtn.style.display = 'block';
    saveWithBgBtn.style.display = 'block';
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

// Modify the savePhoto function to handle both layouts
function savePhoto() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const photoWidth = video.videoWidth;
    const photoHeight = video.videoHeight;

    if (isGridLayout) {
        // For 2x2 grid layout
        tempCanvas.width = photoWidth * 2;
        tempCanvas.height = photoHeight * 2;

        // Draw photos in 2x2 grid without padding
        for (let i = 0; i < TOTAL_PHOTOS; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            tempCtx.drawImage(
                originalPhotos,
                40, // Source x
                40 + (i * (photoHeight + PHOTO_PADDING)),
                photoWidth,
                photoHeight,
                col * photoWidth,
                row * photoHeight,
                photoWidth,
                photoHeight
            );
        }
    } else {
        // For vertical strip layout
        tempCanvas.width = photoWidth;
        tempCanvas.height = photoHeight * TOTAL_PHOTOS;

        // Draw photos vertically without padding
        for (let i = 0; i < TOTAL_PHOTOS; i++) {
            tempCtx.drawImage(
                originalPhotos,
                40,
                40 + (i * (photoHeight + PHOTO_PADDING)),
                photoWidth,
                photoHeight,
                0,
                i * photoHeight,
                photoWidth,
                photoHeight
            );
        }
    }

    const link = document.createElement('a');
    link.download = 'valentine-photobooth.jpg';
    link.href = tempCanvas.toDataURL('image/jpeg');
    link.click();
}

// Update savePhotoWithBackground function to handle both layouts
function savePhotoWithBackground() {
    const link = document.createElement('a');
    link.download = 'valentine-photobooth-with-bg.jpg';
    link.href = photoCanvas.toDataURL('image/jpeg');
    link.click();
}

// Restart the photobooth
function restart() {
    photosTaken = 0;
    isGridLayout = false;
    originalPhotos = null; // Reset originalPhotos
    finalImage.style.display = 'none';
    video.style.display = 'block';
    layoutBtn.style.display = 'none';
    shareBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    saveWithBgBtn.style.display = 'none';
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

// Add new function to handle layout switching
function updateLayout() {
    const SIDE_PADDING = 40;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const photoWidth = video.videoWidth;
    const photoHeight = video.videoHeight;
    
    if (isGridLayout) {
        // 2x2 grid layout
        tempCanvas.width = (photoWidth * 2) + (SIDE_PADDING * 3);
        tempCanvas.height = (photoHeight * 2) + (SIDE_PADDING * 3);
        
        // Fill with white background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw photos in 2x2 grid
        for (let i = 0; i < TOTAL_PHOTOS; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            tempCtx.drawImage(
                originalPhotos,
                SIDE_PADDING, // Source x
                SIDE_PADDING + (i * (photoHeight + PHOTO_PADDING)), // Source y
                photoWidth,
                photoHeight,
                SIDE_PADDING + (col * (photoWidth + SIDE_PADDING)), // Destination x
                SIDE_PADDING + (row * (photoHeight + SIDE_PADDING)), // Destination y
                photoWidth,
                photoHeight
            );
        }
    } else {
        // Original vertical strip layout
        tempCanvas.width = originalPhotos.width;
        tempCanvas.height = originalPhotos.height;
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(originalPhotos, 0, 0);
    }
    
    // Update only the display image, don't modify the original canvas
    finalImage.src = tempCanvas.toDataURL('image/jpeg');
    photoCanvas.width = tempCanvas.width;
    photoCanvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
}

// Add layout toggle function
function toggleLayout() {
    isGridLayout = !isGridLayout;
    updateLayout();
}

// Event listeners
startBtn.addEventListener('click', startPhotoSession);
shareBtn.addEventListener('click', sharePhoto);
restartBtn.addEventListener('click', restart);
saveBtn.addEventListener('click', savePhoto);
saveWithBgBtn.addEventListener('click', savePhotoWithBackground);
layoutBtn.addEventListener('click', toggleLayout);

// Initialize camera when page loads
initCamera(); 