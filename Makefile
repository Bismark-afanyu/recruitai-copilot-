.PHONY: dev
dev:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

.PHONY: dev-frontend
dev-frontend:
	cd frontend && npm run dev

.PHONY: dev-all
dev-all:
	@echo "Starting backend on :8000 and frontend on :5173..."
	@trap 'kill 0' EXIT; \
		(cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000) & \
		(cd frontend && npm run dev) & \
		wait
