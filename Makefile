PYTHON=/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3

.PHONY: install dev-backend dev-frontend prewarm health

install:
	$(PYTHON) -m pip install -r requirements.txt

dev-backend:
	$(PYTHON) -m uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

prewarm:
	$(PYTHON) -m backend.prewarm

health:
	curl -s http://localhost:8000/api/health | $(PYTHON) -m json.tool
