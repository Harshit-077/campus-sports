.PHONY: backend-install backend-run backend-test backend-lint create-admin seed seed-demo explain frontend-run

backend-install:
	cd backend && python3.12 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt

backend-run:
	cd backend && .venv/bin/uvicorn app.main:create_app --factory --reload --port 8000

backend-test:
	cd backend && .venv/bin/pytest -v

backend-lint:
	cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .

create-admin:
	cd backend && .venv/bin/python -m scripts.create_admin

seed:
	cd backend && .venv/bin/python -m scripts.seed_catalog

seed-demo:
	cd backend && .venv/bin/python -m scripts.seed_demo

explain:
	cd backend && .venv/bin/python -m scripts.explain_queries

frontend-run:
	cd frontend && npm run dev
