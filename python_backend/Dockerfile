FROM python:3.9-slim


RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces specific requirements
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy backend code
COPY --chown=user . .

# Pre-download Facenet512 and MTCNN weights to avoid slow cold start
RUN python download_weights.py

# HF Spaces uses port 7860 by default
EXPOSE 7860

# Add a simple health check endpoint to main.py if not exists, 
# or just use the root for health check.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
