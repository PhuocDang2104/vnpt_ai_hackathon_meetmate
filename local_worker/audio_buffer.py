import numpy as np
import torch

class AudioBuffer:
    def __init__(self, sample_rate=16000, chunk_sec=10, overlap_sec=3):
        self.sr = sample_rate
        self.chunk_size = chunk_sec * sample_rate
        self.step_size = (chunk_sec - overlap_sec) * sample_rate
        self.buffer = np.zeros(0, dtype=np.float32)

    def push(self, samples: np.ndarray):
        self.buffer = np.concatenate([self.buffer, samples])

    def pop_chunk(self):
        if len(self.buffer) < self.chunk_size:
            return None

        chunk = self.buffer[: self.chunk_size]
        self.buffer = self.buffer[self.step_size :]
        return torch.tensor(chunk).unsqueeze(0)
