"""
Speaker Diarization Model
Using pyannote.audio speaker-diarization-3.1 pipeline
"""
import os
import torch
from pyannote.audio import Pipeline


from huggingface_hub import login

class DiarizationModel:
    """Speaker diarization using pyannote.audio"""
    
    def __init__(
        self,
        model_name: str = "pyannote/speaker-diarization-3.1",
        device: str = None,
    ):
        """
        Initialize diarization model
        
        Args:
            model_name: HuggingFace model name
            device: Device to run on (cuda/cpu). Auto-detect if None.
        """
        # Get HF token from environment
        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            raise ValueError("HF_TOKEN environment variable is required")
        
        # Login to Hugging Face
        print(f"Logging in to Hugging Face Hub...")
        try:
            login(token=hf_token)
        except Exception as e:
            print(f"❌ Failed to login to Hugging Face Hub: {e}")
            # Continue anyway, pipeline might fail later if login failed
        
        # Auto-detect device
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.device = device
        
        # Load pipeline
        masked_token = f"{hf_token[:4]}...{hf_token[-4:]}" if len(hf_token) > 8 else "***"
        print(f"Loading diarization model {model_name} on {device}... (Token: {masked_token})")
        
        try:
            self.pipeline = Pipeline.from_pretrained(
                model_name,
                use_auth_token=True, # Uses the token from login()
            )
        except Exception as e:
            print(f"❌ Failed to load pipeline: {e}")
            raise RuntimeError(f"Failed to load pyannote pipeline. Check HF_TOKEN and model access permissions. Error: {e}")

        if self.pipeline is None:
            raise RuntimeError(
                f"Failed to load pipeline '{model_name}'. result is None. "
                "This usually means the HF_TOKEN is invalid or does not have access to the gated model. "
                "Please verify your token at https://huggingface.co/settings/tokens and ensure you accepted the license at https://huggingface.co/pyannote/speaker-diarization-3.1"
            )
        
        # Move to device
        if device == "cuda":
            self.pipeline.to(torch.device("cuda"))
        
        print(f"✓ Diarization model loaded on {device}")
    
    def diarize(
        self,
        waveform: torch.Tensor,
        sample_rate: int = 16000,
        min_speakers: int = None,
        max_speakers: int = None,
    ) -> list[dict]:
        """
        Perform speaker diarization
        
        Args:
            waveform: Audio tensor [1, samples]
            sample_rate: Sample rate (default 16kHz)
            min_speakers: Minimum number of speakers (optional)
            max_speakers: Maximum number of speakers (optional)
        
        Returns:
            List of segments:
            [
                {
                    "speaker": "SPEAKER_00",
                    "start": 0.5,
                    "end": 2.3,
                    "confidence": 0.95
                },
                ...
            ]
        """
        # Prepare audio dict for pyannote
        audio_dict = {
            "waveform": waveform,
            "sample_rate": sample_rate,
        }
        
        # Run diarization
        kwargs = {}
        if min_speakers is not None:
            kwargs["min_speakers"] = min_speakers
        if max_speakers is not None:
            kwargs["max_speakers"] = max_speakers
        
        diarization = self.pipeline(audio_dict, **kwargs)
        
        # Convert to list of dicts
        segments = []
        for segment, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "speaker": speaker,
                "start": float(segment.start),
                "end": float(segment.end),
                "confidence": 1.0,  # pyannote doesn't provide confidence scores
            })
        
        return segments

