import os
import cv2
import numpy as np
from rembg import remove
from PIL import Image
from flask import Flask, request, send_file, jsonify
from io import BytesIO
import uuid

app = Flask(__name__)

def process_id_photo(input_bytes: bytes, bg_color: str = "white") -> bytes:
    """
    Process ID photo: remove background, detect face, crop to 35:45 ratio, resize to 350x467
    """
    # 1. Load Image from bytes
    input_img = Image.open(BytesIO(input_bytes))
    
    # 2. Remove Background
    no_bg_img = remove(input_img)
    
    # 3. Create solid background
    bg_colors = {
        "white": (255, 255, 255),
        "lightblue": (173, 216, 230),
        "grey": (128, 128, 128)
    }
    color = bg_colors.get(bg_color, (255, 255, 255))
    white_bg = Image.new("RGB", no_bg_img.size, color)
    white_bg.paste(no_bg_img, mask=no_bg_img.split()[3] if no_bg_img.mode == 'RGBA' else None)
    
    # Convert to OpenCV
    open_cv_image = cv2.cvtColor(np.array(white_bg), cv2.COLOR_RGB2BGR)
    
    # 4. Detect Face
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        # No face detected, return original processed image without crop
        final_photo = cv2.resize(open_cv_image, (350, 467), interpolation=cv2.INTER_CUBIC)
    else:
        # Get the primary face
        (x, y, w, h) = faces[0]
        
        # Calculate Crop based on 35:45 aspect ratio
        target_height = int(h / 0.75)
        target_width = int(target_height * (35 / 45))
        
        # Center the crop on the face
        cx, cy = x + w//2, y + h//2
        x1 = max(0, cx - target_width // 2)
        y1 = max(0, cy - int(target_height * 0.45))
        x2 = x1 + target_width
        y2 = y1 + target_height
        
        # Ensure bounds
        x2 = min(x2, open_cv_image.shape[1])
        y2 = min(y2, open_cv_image.shape[0])
        
        cropped_img = open_cv_image[y1:y2, x1:x2]
        
        # 5. Resize to official specs (350x467)
        final_photo = cv2.resize(cropped_img, (350, 467), interpolation=cv2.INTER_CUBIC)
    
    # 6. Convert back to PIL and save to bytes
    final_pil = Image.fromarray(cv2.cvtColor(final_photo, cv2.COLOR_BGR2RGB))
    output_buffer = BytesIO()
    final_pil.save(output_buffer, format="JPEG", quality=95)
    output_buffer.seek(0)
    
    return output_buffer.getvalue()

@app.route('/process-id-photo', methods=['POST'])
def process_photo():
    """
    API endpoint to process ID photo
    Accepts: multipart/form-data with 'file' and 'background' (white/lightblue/grey)
    Returns: Processed JPEG image
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    background = request.form.get('background', 'white')
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        image_bytes = file.read()
        processed = process_id_photo(image_bytes, background)
        
        return send_file(
            BytesIO(processed),
            mimetype='image/jpeg',
            as_attachment=True,
            download_name=f"id_photo_{uuid.uuid4().hex[:8]}.jpg"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting ID Photo API server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
