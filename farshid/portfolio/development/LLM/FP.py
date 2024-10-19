import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget, QTextEdit, QMessageBox, QPushButton, QFileDialog
from PyQt5.QtGui import QPixmap, QImage
from PyQt5.QtCore import Qt
import cv2
import numpy as np
from screeninfo import get_monitors

class CVFunctionTester(QMainWindow):
    def __init__(self):
        super().__init__()
        self.original_image = None
        self.processed_image = None
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Farshid Pirahansiah; Real-time OpenCV Function Tester')
        self.setGeometry(100, 100, 800, 600)

        layout = QVBoxLayout()

        self.image_label = QLabel(self)
        
        # Button to load the image
        self.load_image_button = QPushButton('Load Image', self)
        self.load_image_button.clicked.connect(self.loadImage)

        self.textbox = QTextEdit(self)
        self.textbox.setPlaceholderText('Enter OpenCV function here (e.g., img=cv2.GaussianBlur(img, (7, 7), 3.5))')
        #cv2.resize(img,None,img,fx=0.5,fy=0.5,interpolation=cv2.INTER_AREA)
        # opencv to blob analysis
        #img=cv2.imread('image.jpg')
        #img = cv2.resize(img, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        # self.processed_image = cv2.resize(self.processed_image, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        # detector = cv2.SimpleBlobDetector()
        # keypoints = detector.detect(self.processed_image)
        # self.processed_image = cv2.drawKeypoints(self.processed_image, keypoints, np.array([]), (0,0,255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        
        
        # detector = cv2.SimpleBlobDetector_create()
        # keypoints = detector.detect(self.processed_image)
        # self.processed_image = cv2.drawKeypoints(self.processed_image, keypoints, None, (0,0,255), cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        # self.setImage(self.processed_image)

        # 
        
        # # Detect blobs.
        # 
        
        # # Draw detected blobs as red circles.
        # # cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS ensures the size of the circle corresponds to the size of blob
        # 
        
        # # Show keypoints
        # cv2.imshow("Keypoints", im_with_keypoints)



        
        # Button to apply the OpenCV function
        self.apply_button = QPushButton('Apply OpenCV Function', self)
        self.apply_button.clicked.connect(self.applyFunction)
        self.apply_button.setEnabled(False)  # Disable until an image is loaded

        layout.addWidget(self.image_label)
        layout.addWidget(self.load_image_button)
        layout.addWidget(self.textbox)
        layout.addWidget(self.apply_button)

        central_widget = QWidget()
        central_widget.setLayout(layout)
        self.setCentralWidget(central_widget)

    def setImage(self, img):
        """Converts an OpenCV image to QPixmap and displays it."""
        if img is not None:
            rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb_image.shape
            bytes_per_line = ch * w
            qt_image = QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format_RGB888)
            pixmap = QPixmap.fromImage(qt_image)
            self.image_label.setPixmap(pixmap)
        else:
            self.image_label.clear()

    def loadImage(self):
        """Opens a file dialog for the user to select an image, and loads it."""
        file_name, _ = QFileDialog.getOpenFileName(self, "Open Image", "", "Image Files (*.png *.jpg *.jpeg *.bmp *.gif)")
        if file_name:
            self.original_image = cv2.imread(file_name)
            image_height, image_width = self.original_image.shape[:2]

            # Get the screen resolution
            screen = get_monitors()[0]
            half_screen_width = screen.width // 2
            half_screen_height = screen.height // 2

            # Check if the image is larger than half the screen size
            if image_width > half_screen_width or image_height > half_screen_height:
                # Calculate the ratio to maintain aspect ratio
                ratio = min(half_screen_width / image_width, half_screen_height / image_height)
                new_dimensions = (int(image_width * ratio), int(image_height * ratio))
                
                # Resize the image
                self.original_image = cv2.resize(self.original_image, new_dimensions)

            self.processed_image = self.original_image.copy()
            self.setImage(self.original_image)
            self.apply_button.setEnabled(True)


    def applyFunction(self):
        """Executes the entered OpenCV functions when the button is clicked."""
        function_str = self.textbox.toPlainText().strip()
        if not function_str or self.original_image is None:
            return
        
        # Split the input text by lines and process each line
        function_lines = function_str.split('\n')
        try:
            for line in function_lines:
                # Prepare each line for execution
                safe_function_str = line.strip().replace('img', 'self.processed_image')
                # Execute the prepared line. The execution context is updated with each iteration.
                exec(safe_function_str, globals(), locals())
            # After processing all lines, update the displayed image
            self.setImage(self.processed_image)
        except Exception as e:
            QMessageBox.warning(self, 'Error', f'Failed to execute function: {e}', QMessageBox.Ok)


    # def applyFunction(self):
    #     """Executes the entered OpenCV function when the button is clicked."""
    #     function_str = self.textbox.toPlainText().strip()
    #     if not function_str or self.original_image is None:
    #         return

    #     function_lines = function_str.split('\n')
    #     for line in function_lines:
    #         safe_function_str = line.replace('img', 'self.original_image')
    #         try:
    #             exec(f'self.processed_image = {safe_function_str}', globals(), locals())
    #         except Exception as e:
    #             QMessageBox.warning(self, 'Error', f'Failed to execute function: {e}', QMessageBox.Ok)
    #     self.setImage(self.processed_image)
if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = CVFunctionTester()
    ex.show()
    sys.exit(app.exec_())