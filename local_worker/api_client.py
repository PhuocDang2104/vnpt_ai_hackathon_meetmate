import requests

class APIClient:
    def __init__(self, base_url, meeting_id):
        self.base_url = base_url
        self.meeting_id = meeting_id

    def send_segments(self, segments):
        payload = {
            "meeting_id": self.meeting_id,
            "segments": segments
        }
        requests.post(
            f"{self.base_url}/api/diarization",
            json=payload,
            timeout=3
        )
