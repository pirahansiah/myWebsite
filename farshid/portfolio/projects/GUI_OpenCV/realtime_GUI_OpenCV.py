import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget,
    QTextEdit, QMessageBox, QPushButton, QFileDialog, QHBoxLayout
)
from PyQt5.QtGui import QPixmap, QImage
from PyQt5.QtCore import Qt
import cv2
import numpy as np
from screeninfo import get_monitors
import traceback

class CVFunctionTester(QMainWindow):
    def __init__(self):
        super().__init__()
        self.original_image = None
        self.processed_image = None
        self.history = []
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Farshid Pirahansiah - Real-time OpenCV Function Tester')
        self.setGeometry(100, 100, 800, 600)

        main_layout = QVBoxLayout()

        # Image display
        self.image_label = QLabel(self)
        self.image_label.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(self.image_label)

        # Buttons layout
        buttons_layout = QHBoxLayout()

        # Load image button
        self.load_image_button = QPushButton('Load Image', self)
        self.load_image_button.clicked.connect(self.loadImage)
        buttons_layout.addWidget(self.load_image_button)

        # Undo button
        self.undo_button = QPushButton('Undo', self)
        self.undo_button.clicked.connect(self.undo)
        self.undo_button.setEnabled(False)
        buttons_layout.addWidget(self.undo_button)

        main_layout.addLayout(buttons_layout)

        # Textbox for OpenCV function
        self.textbox = QTextEdit(self)
        self.textbox.setPlaceholderText('Enter OpenCV code here (e.g., self.processed_image = cv2.GaussianBlur(self.processed_image, (7, 7), 3.5))')
        self.textbox.setFixedHeight(100)
        main_layout.addWidget(self.textbox)

        # Apply function button
        self.apply_button = QPushButton('Apply OpenCV Function', self)
        self.apply_button.clicked.connect(self.applyFunction)
        self.apply_button.setEnabled(False)
        main_layout.addWidget(self.apply_button)

        central_widget = QWidget()
        central_widget.setLayout(main_layout)
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
        file_name, _ = QFileDialog.getOpenFileName(
            self, "Open Image", "", "Image Files (*.png *.jpg *.jpeg *.bmp *.gif)"
        )
        if file_name:
            self.original_image = cv2.imread(file_name)
            image_height, image_width = self.original_image.shape[:2]

            # Get the screen resolution
            screen = get_monitors()[0]
            half_screen_width = screen.width * 0.8
            half_screen_height = screen.height * 0.8

            # Check if the image is larger than half the screen size
            if image_width > half_screen_width or image_height > half_screen_height:
                # Calculate the ratio to maintain aspect ratio
                ratio = min(half_screen_width / image_width, half_screen_height / image_height)
                new_dimensions = (int(image_width * ratio), int(image_height * ratio))

                # Resize the image
                self.original_image = cv2.resize(self.original_image, new_dimensions)

            self.processed_image = self.original_image.copy()
            self.history = [self.processed_image.copy()]
            self.setImage(self.processed_image)
            self.apply_button.setEnabled(True)
            self.undo_button.setEnabled(False)

    def applyFunction(self):
        """Executes the entered OpenCV code when the button is clicked."""
        code_str = self.textbox.toPlainText().strip()
        if not code_str or self.processed_image is None:
            return

        local_vars = {
            'cv2': cv2,
            'np': np,
            'self': self,
        }

        try:
            # Save current state for undo functionality
            self.history.append(self.processed_image.copy())
            # Execute the code safely
            exec(code_str, {'__builtins__': None}, local_vars)
            self.processed_image = local_vars.get('self').processed_image
            self.setImage(self.processed_image)
            self.undo_button.setEnabled(True)
        except Exception as e:
            self.history.pop()  # Remove the last state since the operation failed
            error_msg = ''.join(traceback.format_exception_only(type(e), e))
            QMessageBox.warning(self, 'Error', f'Failed to execute code:\n{error_msg}', QMessageBox.Ok)

    def undo(self):
        """Reverts to the previous image state."""
        if len(self.history) > 1:
            self.history.pop()
            self.processed_image = self.history[-1].copy()
            self.setImage(self.processed_image)
            if len(self.history) == 1:
                self.undo_button.setEnabled(False)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = CVFunctionTester()
    ex.show()
    sys.exit(app.exec_())