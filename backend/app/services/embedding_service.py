import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

# Global model instance, lazily initialized on first import
_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("Initializing SentenceTransformer model 'all-MiniLM-L6-v2' on CPU...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    return _model

@lru_cache(maxsize=128)
def _cached_get_embedding(text: str) -> tuple[float, ...]:
    """Caches generating an embedding vector for a single string. Returns tuple for hashability."""
    model = get_model()
    vec = model.encode(text)
    return tuple(vec.tolist())

class EmbeddingService:
    @staticmethod
    def get_embeddings(texts: list[str]) -> list[list[float]]:
        """Generates embedding vectors for a list of text strings."""
        if not texts:
            return []
        model = get_model()
        # model.encode returns numpy arrays, convert to python lists
        embeddings = model.encode(texts)
        return [vec.tolist() for vec in embeddings]

    @staticmethod
    def get_embedding(text: str) -> list[float]:
        """Generates an embedding vector for a single string."""
        return list(_cached_get_embedding(text))
