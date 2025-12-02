#pip install line_profiler
#kernprof -l -v Line_profiler_Benchmarking.py\
import cv2
#import cProfile
#import pstats
from line_profiler import profile 
@profile
def process_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    for (x,y,w,h) in faces:
        cv2.rectangle(frame,(x,y),(x+w,y+h),(255,0,0),2)
    return frame

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
cap = cv2.VideoCapture(0)

#profiler = cProfile.Profile()
#profiler.enable()

ret, frame = cap.read()
for _ in range(100):          # profile 100 frames
    frame = process_frame(frame)
    ret, frame = cap.read()

#profiler.disable()
#stats = pstats.Stats(profiler).sort_stats('cumtime')
#stats.print_stats(10)