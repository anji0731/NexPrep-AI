import numpy as np
import faiss

class VectorStore:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        # Use IndexFlatL2 for standard L2 (Euclidean) distance search
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks = []

    def add_texts(self, texts: list[str], embeddings: list[list[float]]):
        """Adds text chunks and their embeddings to the FAISS index."""
        if not texts or not embeddings:
            return
        
        # Keep track of original text strings
        self.chunks.extend(texts)
        
        # Convert embeddings to float32 numpy array
        np_embeddings = np.array(embeddings, dtype=np.float32)
        
        # Add to index
        self.index.add(np_embeddings)

    def similarity_search(self, query_embedding: list[float], k: int = 3) -> list[str]:
        """Performs L2 distance search and returns the top k closest text chunks."""
        if not self.chunks:
            return []
        
        # Convert query embedding to float32 numpy array of shape (1, dimension)
        np_query = np.array([query_embedding], dtype=np.float32)
        
        # Search the index
        limit = min(k, len(self.chunks))
        D, I = self.index.search(np_query, limit)
        
        # Map indices back to original text chunks
        retrieved_chunks = []
        for idx in I[0]:
            if 0 <= idx < len(self.chunks):
                retrieved_chunks.append(self.chunks[idx])
                
        return retrieved_chunks
