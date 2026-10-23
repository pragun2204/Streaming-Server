.PHONY: help install-backend install-frontend dev-backend dev-frontend test-backend test-frontend build docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install-backend   - Install Python backend dependencies"
	@echo "  make install-frontend  - Install Node.js frontend dependencies"
	@echo "  make dev-backend       - Run FastAPI dev server"
	@echo "  make dev-frontend      - Run Vite frontend dev server"
	@echo "  make test-backend      - Run backend pytest suite"
	@echo "  make test-frontend     - Run frontend vitest suite"
	@echo "  make build             - Build frontend and verify backend"
	@echo "  make docker-up         - Start services with Docker Compose"
	@echo "  make docker-down       - Stop Docker Compose services"

install-backend:
	cd apps/api && pip install -r requirements.txt

install-frontend:
	cd apps/web && npm install

dev-backend:
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd apps/web && npm run dev

test-backend:
	cd apps/api && pytest

test-frontend:
	cd apps/web && npm run test

build:
	cd apps/web && npm run build

docker-up:
	docker compose up -d

docker-down:
	docker compose down
