# Testing Guide

## Overview

This directory contains unit tests and integration tests for the MeetMate backend.

## Test Structure

```
tests/
├── unit/              # Unit tests for services
│   ├── test_agenda_service.py
│   └── test_document_service.py
├── integration/      # Integration tests for API endpoints
│   ├── test_agenda_api.py
│   ├── test_documents_api.py
│   └── test_minutes_api.py
├── conftest.py       # Pytest fixtures
└── __init__.py
```

## Running Tests

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/unit/test_agenda_service.py
pytest tests/integration/test_agenda_api.py
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Run with Verbose Output

```bash
pytest -v
```

## Test Categories

### Unit Tests

Test individual service functions in isolation:
- `test_agenda_service.py` - Agenda service CRUD operations
- `test_document_service.py` - Document service CRUD operations

### Integration Tests

Test API endpoints end-to-end:
- `test_agenda_api.py` - Agenda API endpoints
- `test_documents_api.py` - Documents API endpoints
- `test_minutes_api.py` - Minutes API endpoints

## Notes

- Services using in-memory storage (documents, agenda) use mock database sessions
- Integration tests use FastAPI TestClient for HTTP testing
- Some tests may fail if external services (Gemini AI) are unavailable - this is expected

## Writing New Tests

1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Use fixtures from `conftest.py`
3. Follow naming convention: `test_*.py` for files, `test_*` for functions
4. Use `@pytest.mark.asyncio` for async tests

