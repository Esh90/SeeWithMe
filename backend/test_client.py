import asyncio
import base64
import time
import requests
from websockets.sync.client import connect

def run_tests():
    print("Testing /api/vqa...")
    # Create a dummy image
    dummy_image = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00"
    files = {'image': ('dummy.jpg', dummy_image, 'image/jpeg')}
    data = {'query': 'What is the total on this receipt?'}
    res = requests.post("http://127.0.0.1:8000/api/vqa", files=files, data=data)
    print("VQA Response:", res.json())

    print("\nTesting /api/navigate...")
    data_nav = {'start': 'Lobby', 'destination': 'Elevator'}
    res_nav = requests.post("http://127.0.0.1:8000/api/navigate", data=data_nav)
    print("Navigate Response:", res_nav.json())

    print("\nTesting /ws/video...")
    try:
        with connect("ws://127.0.0.1:8000/ws/video") as websocket:
            print("Connected to WebSocket. Sending 40 mock frames...")
            # Send 40 frames
            for i in range(1, 41):
                # Send dummy base64 string
                websocket.send("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE...")
                
                # We expect a warning every 30 frames
                try:
                    # set a small timeout for recv
                    response = websocket.recv(timeout=0.01)
                    print(f"Frame {i}: Received from server:", response)
                except TimeoutError:
                    pass
                time.sleep(0.01)
            print("WebSocket test complete.")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    run_tests()
