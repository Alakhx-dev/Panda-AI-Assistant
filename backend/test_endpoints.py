import requests
import io
from PIL import Image, ImageDraw

def create_sample_image(text):
    """Creates a simple image with text for testing OCR."""
    img = Image.new('RGB', (800, 200), color='white')
    d = ImageDraw.Draw(img)
    # Default font is used, which is small but usually readable by Tesseract
    d.text((20, 20), text, fill='black')
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_upload_image():
    url = "http://127.0.0.1:5000/upload-image"
    print(f"Testing POST {url}...")
    
    # Sample text: A short definition of Machine Learning
    sample_text = "Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy."
    
    img_data = create_sample_image(sample_text)
    files = {'image': ('test_sample.png', img_data, 'image/png')}
    
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(response.json())
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Please ensure the Flask app is running on port 5000.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Note: Ensure 'requests' is installed and the backend server is running
    test_upload_image()