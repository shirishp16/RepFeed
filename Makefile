.PHONY: frontend backend dev install

frontend:
	cd frontend && npm run dev

backend:
	cd backend && uvicorn main:app --reload --port 8000

install:
	cd frontend && npm install
	cd backend && pip3 install -r requirements.txt

dev:
	@echo "Run in separate terminals:"
	@echo "  make backend"
	@echo "  make frontend"
