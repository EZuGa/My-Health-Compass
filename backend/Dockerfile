FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY schema.sql seed_demo.py ./

# Non-root user; /app/uploads is a named volume in compose and inherits this
# ownership on first mount.
RUN useradd --create-home appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# --root-path /api: nginx serves this API under /api/ (prefix stripped), so
# generated URLs (docs, openapi.json) must be rooted there.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", "/api"]
