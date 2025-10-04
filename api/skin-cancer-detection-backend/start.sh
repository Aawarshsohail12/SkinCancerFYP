#!/bin/bash

# Create necessary directories
mkdir -p static/uploads
mkdir -p uploads/doctors

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}