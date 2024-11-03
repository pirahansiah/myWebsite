import cv2, logging, requests, base64, os, numpy as np
from PIL import Image
from io import BytesIO
from langchain.llms import Ollama
logger = logging.getLogger(__name__)
def load_image_or_first_frame_from_video(image_or_video_url, ollama_llm):
   try:
       if image_or_video_url.startswith(('http://', 'https://')):
           response = requests.get(image_or_video_url, stream=True)
           response.raise_for_status()
           if 'video' in response.headers['Content-Type']:
               cap = cv2.VideoCapture(image_or_video_url)
               while True:
                   success, frame = cap.read()
                   if not success: break
                   cv2.imshow("Video Frame", frame)
                   frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                   pil_image = Image.fromarray(frame_rgb)
                   media_base64 = convert_to_base64(pil_image)
                   llm_with_media_context = ollama_llm.bind(images=[media_base64])
                   response = llm_with_media_context.invoke("Describe this image in detail.")
                   print(f"\nFrame Description:\n{response.strip()}\nPress any key for next frame, 'q' to quit")
                   if cv2.waitKey(0) == ord('q'): break
               cap.release()
               cv2.destroyAllWindows()
           else:
               image = Image.open(BytesIO(response.content))
               image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
               cv2.imshow("Image", image_cv)
               media_base64 = convert_to_base64(image.convert('RGB'))
               llm_with_media_context = ollama_llm.bind(images=[media_base64])
               response = llm_with_media_context.invoke("Describe this image in detail.")
               print(f"\nImage Description:\n{response.strip()}\nPress any key to continue")
               cv2.waitKey(0)
               cv2.destroyAllWindows()
       else:
           if any(image_or_video_url.endswith(ext) for ext in ['.mp4', '.avi', '.mov']):
               cap = cv2.VideoCapture(image_or_video_url)
               while True:
                   success, frame = cap.read()
                   if not success: break
                   cv2.imshow("Video Frame", frame)
                   frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                   pil_image = Image.fromarray(frame_rgb)
                   media_base64 = convert_to_base64(pil_image)
                   llm_with_media_context = ollama_llm.bind(images=[media_base64])
                   response = llm_with_media_context.invoke("Describe this image in detail.")
                   print(f"\nFrame Description:\n{response.strip()}\nPress any key for next frame, 'q' to quit")
                   if cv2.waitKey(0) == ord('q'): break
               cap.release()
               cv2.destroyAllWindows()
           else:
               image = Image.open(image_or_video_url)
               image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
               cv2.imshow("Image", image_cv)
               media_base64 = convert_to_base64(image.convert('RGB'))
               llm_with_media_context = ollama_llm.bind(images=[media_base64])
               response = llm_with_media_context.invoke("Describe this image in detail.")
               print(f"\nImage Description:\n{response.strip()}\nPress any key to continue")
               cv2.waitKey(0)
               cv2.destroyAllWindows()
   except Exception as e:
       logger.error(f"Error loading media {image_or_video_url}: {e}")
def convert_to_base64(pil_image):
   buffered = BytesIO()
   pil_image.save(buffered, format="JPEG")
   return base64.b64encode(buffered.getvalue()).decode("utf-8")
def main():
   ollama_llm = Ollama(model=os.environ.get("VISION_MODEL", "llava"), base_url=os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434"))
   media_urls = "http://ap.rdcpix.com/f26d996a7895ac8ef8b44bc5628cce3bl-m1461818644od-w480_h360_x2.webp?w=1080&q=75, http://ap.rdcpix.com/f26d996a7895ac8ef8b44bc5628cce3bl-m3176574316od-w480_h360_x2.webp?w=1080&q=75, http://ap.rdcpix.com/f26d996a7895ac8ef8b44bc5628cce3bl-m1524759205od-w480_h360_x2.webp?w=1080&q=75, http://ap.rdcpix.com/f26d996a7895ac8ef8b44bc5628cce3bl-m2492719933od-w480_h360_x2.webp?w=1080&q=75".split(", ")
   for media_url in media_urls:
       load_image_or_first_frame_from_video(media_url.strip(), ollama_llm)
if __name__ == "__main__":
   main()