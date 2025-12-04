from app.vectorstore.pgvector_client import PgVectorClient


def simple_retrieval(query: str, meeting_id: str | None = None):
    client = PgVectorClient()
    results = client.search(query)
    for hit in results:
        hit['meeting_id'] = meeting_id
    return results