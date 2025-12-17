"""
Ingest local documents into knowledge_document + knowledge_chunk using a CPU embedding model.

Usage:
    DATABASE_URL="postgresql://..." python ingest_local.py --file /path/to/doc.txt --title "My Doc"

Notes:
- Uses Alibaba-NLP/gte-small (384 dims). Make sure DB column knowledge_chunk.embedding is vector(384).
- Simple chunking by paragraphs with max_len characters; adjust as needed.
"""

import argparse
import os
import uuid
import psycopg2
from typing import List
from sentence_transformers import SentenceTransformer


def chunk_text(text: str, max_len: int = 1200, overlap: int = 200) -> List[str]:
    """Greedy chunk by characters with overlap (fast and simple)."""
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + max_len)
        chunk = text[start:end]
        chunks.append(chunk)
        if end == n:
            break
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main():
    parser = argparse.ArgumentParser(description="Ingest a local text file into knowledge tables with local embeddings.")
    parser.add_argument("--file", required=True, help="Path to text file (already extracted).")
    parser.add_argument("--title", required=True, help="Document title.")
    parser.add_argument("--source", default="local", help="Source label.")
    parser.add_argument("--category", default=None, help="Category label.")
    parser.add_argument("--max-len", type=int, default=1200, help="Chunk size (chars).")
    parser.add_argument("--overlap", type=int, default=200, help="Chunk overlap (chars).")
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise SystemExit("Missing DATABASE_URL env.")

    text = read_file(args.file)
    chunks = chunk_text(text, max_len=args.max_len, overlap=args.overlap)
    if not chunks:
        raise SystemExit("No content to ingest.")

    print(f"Chunks: {len(chunks)}")

    model = SentenceTransformer("Alibaba-NLP/gte-small")
    embeddings = model.encode(chunks, normalize_embeddings=True).tolist()

    doc_id = uuid.uuid4()
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO knowledge_document (id, title, description, source, category, file_type, file_size, storage_key, file_url, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s, now(), now())
                """,
                (
                    doc_id,
                    args.title,
                    None,
                    args.source,
                    args.category,
                    "txt",
                    None,
                    None,
                    None,
                ),
            )

            for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                cur.execute(
                    """
                    INSERT INTO knowledge_chunk (id, document_id, chunk_index, content, embedding, created_at)
                    VALUES (%s,%s,%s,%s,%s, now())
                    """,
                    (
                        uuid.uuid4(),
                        doc_id,
                        idx,
                        chunk,
                        emb,
                    ),
                )
        conn.commit()

    print(f"Inserted document {doc_id} with {len(chunks)} chunks.")


if __name__ == "__main__":
    main()
