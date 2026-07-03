import hashlib
import os
import tempfile

CACHE_DIR = os.path.join(tempfile.gettempdir(), "nextround_faiss_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

class VectorStore:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        # Lazy load faiss
        import faiss
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks = []
        self._hash = None

    def add_texts(self, texts: list[str], embeddings: list[list[float]]):
        """Adds text chunks and their embeddings to the FAISS index."""
        if not texts or not embeddings:
            return
        
        # Keep track of original text strings
        self.chunks.extend(texts)
        
        # Calculate hash for caching
        content = "".join(texts).encode('utf-8')
        self._hash = hashlib.md5(content).hexdigest()
        index_path = os.path.join(CACHE_DIR, f"faiss_{self._hash}.index")
        
        import faiss
        import numpy as np
        
        if os.path.exists(index_path):
            try:
                self.index = faiss.read_index(index_path)
                return
            except Exception:
                pass
        
        # Convert embeddings to float32 numpy array
        np_embeddings = np.array(embeddings, dtype=np.float32)
        
        # Add to index
        self.index.add(np_embeddings)
        
        # Save to cache
        try:
            faiss.write_index(self.index, index_path)
        except Exception:
            pass
            
        # Clean up memory
        del np_embeddings

    def similarity_search(self, query_embedding: list[float], k: int = 3) -> list[str]:
        """Performs L2 distance search and returns the top k closest text chunks."""
        if not self.chunks:
            return []
            
        import numpy as np
        
        # Convert query embedding to float32 numpy array of shape (1, dimension)
        np_query = np.array([query_embedding], dtype=np.float32)
        
        # Search the index
        limit = min(k, len(self.chunks))
        D, I = self.index.search(np_query, limit)
        
        # Clean up memory
        del np_query
        
        # Map indices back to original text chunks
        retrieved_chunks = []
        for idx in I[0]:
            if 0 <= idx < len(self.chunks):
                retrieved_chunks.append(self.chunks[idx])
                
        return retrieved_chunks
