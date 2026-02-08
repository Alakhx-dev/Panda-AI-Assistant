import requests
import json

base_url = 'http://127.0.0.1:5000'

# Test /solve-question
print("Testing /solve-question:")
response = requests.post(f'{base_url}/solve-question', json={'question': 'What is 2+2?'})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test /solve-question with physics
response = requests.post(f'{base_url}/solve-question', json={'question': 'Explain force in physics'})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test /youtube-process
print("Testing /youtube-process:")
response = requests.post(f'{base_url}/youtube-process', json={'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test /youtube-process with different URL
response = requests.post(f'{base_url}/youtube-process', json={'url': 'https://www.youtube.com/watch?v=anotherVideo'})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test /upload-image (simulate with a dummy file)
print("Testing /upload-image:")
with open('test_image.jpg', 'wb') as f:
    f.write(b'dummy image content')

with open('test_image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(f'{base_url}/upload-image', files=files)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test with different content
with open('test_image2.jpg', 'wb') as f:
    f.write(b'different dummy content')

with open('test_image2.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(f'{base_url}/upload-image', files=files)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
