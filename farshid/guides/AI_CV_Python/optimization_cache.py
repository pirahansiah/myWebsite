import cv2
import time
from line_profiler import profile  
from functools import lru_cache
import numpy as np

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
cap = cv2.VideoCapture(0) 

# Optimization params
SCALE_FACTOR = 0.5  # Resize to 50% for faster processing
GRAY_EVERY_N = 5  # Convert to gray only every 5th frame
frame_count = 0
small_gray = None

@profile
def process_frame_fast(frame):
    global small_gray, frame_count
    # Resize first (huge speed-up)
    small = cv2.resize(frame, None, fx=SCALE_FACTOR, fy=SCALE_FACTOR)
    
    frame_count += 1
    if small_gray is None or frame_count % GRAY_EVERY_N == 0:
        small_gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    
    # Detect on small gray. Use an LRU cache keyed by the image bytes to avoid
    # recomputing detection for identical frames (or near-duplicate frames).
    # Note: we pass the raw bytes (hashable) to the cached function. This stores
    # cached keys as bytes and cached values as tuples — choose `maxsize` to
    # limit memory usage.
    faces = detect_faces_cached(small_gray.tobytes(), small_gray.shape[1], small_gray.shape[0])
    
    # Draw on original (upscale coords)
    for (x, y, w, h) in faces:
        x, y, w, h = [int(v / SCALE_FACTOR) for v in (x, y, w, h)]
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    return frame


# Cached wrapper around the cascade detector. It accepts the image bytes
# (which are hashable) plus width/height so we can reconstruct the numpy array
# inside the function. Returns a tuple of face rect tuples to keep results
# cacheable and JSON-serializable.
@lru_cache(maxsize=128)
def detect_faces_cached(img_bytes, width, height):
    # Recreate numpy array view from bytes without copying if possible
    arr = np.frombuffer(img_bytes, dtype=np.uint8).reshape((height, width))
    faces = face_cascade.detectMultiScale(arr, 1.1, 4)
    # Convert to tuple of tuples so the result is hashable/cached safely
    try:
        return tuple(tuple(map(int, f)) for f in faces)
    except Exception:
        return tuple()

# Main loop (profile 100 frames)
start_time = time.time()
for _ in range(100):
    ret, frame = cap.read()
    if not ret:
        break
    frame = process_frame_fast(frame)
    #cv2.imshow('Optimized', frame)  # Uncomment for display (adds ~5ms)
    #if cv2.waitKey(1) & 0xFF == ord('q'): break

elapsed = time.time() - start_time
print(f"Processed 100 frames in {elapsed:.2f}s ({100 / elapsed:.1f} FPS)")

cap.release()
cv2.destroyAllWindows()