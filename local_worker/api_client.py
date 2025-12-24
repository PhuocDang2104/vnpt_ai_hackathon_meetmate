import requests


class APIClient:
    def __init__(self, base_url: str, session_id: str):
        self.base_url = base_url.rstrip("/")
        self.session_id = session_id

    def send_segments(self, segments):
        payload = {
            "segments": segments,
        }
        requests.post(
            f"{self.base_url}/diarization/{self.session_id}",
            json=payload,
            timeout=3,
        )
