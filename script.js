const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gif = new GIF({ workers: 2, quality: 10 });
const stickers = [];

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(error => { console.error('Camera access error!', error); });

function capturePhoto() {
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw all stickers onto the canvas
    stickers.forEach(sticker => {
        const rect = sticker.img.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        ctx.drawImage(sticker.img, x, y, rect.width, rect.height);
    });
}

function downloadPhoto() {
    capturePhoto(); // Ensure stickers are captured
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'photobooth_image.png';
    link.click();
}

function applyFilter(filter) {
    ctx.filter = filter;
    capturePhoto();
}

function triggerStickerUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = addStickerFromFile;
    input.click();
}

function addStickerFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const img = document.createElement('img');
        img.style.position = 'absolute';
        img.style.top = '50px';
        img.style.left = '100px';
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'contain';
        img.style.cursor = 'move';
        img.classList.add('resizable');
        document.body.appendChild(img);

        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        stickers.push({ img }); // Store reference to sticker

        // Make it Draggable
        img.onmousedown = function(event) {
            event.preventDefault();
            let shiftX = event.clientX - img.getBoundingClientRect().left;
            let shiftY = event.clientY - img.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                img.style.left = pageX - shiftX + 'px';
                img.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(event) {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            img.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                img.onmouseup = null;
            };
        };

        img.ondragstart = function() {
            return false;
        };

        // Make it Resizable
        img.style.resize = 'both';
        img.style.overflow = 'auto';
    }
}

function startGIF() {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            capturePhoto();
            gif.addFrame(canvas, { delay: 100 });
        }, i * 100);
    }
    gif.render();
    gif.on('finished', blob => {
        const gifPreview = document.createElement('img');
        gifPreview.src = URL.createObjectURL(blob);
        gifPreview.style.display = 'block';
        document.body.appendChild(gifPreview);
    });
}

function shareGIF() {
    const url = encodeURIComponent(document.getElementById('gifPreview').src);
    window.open('https://twitter.com/intent/tweet?text=Check out my photobooth GIF!&url=' + url);
}

function shareFacebook() {
    const url = encodeURIComponent(document.getElementById('gifPreview').src);
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + url);
}
