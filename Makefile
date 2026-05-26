.PHONY: help install dev dev-turbo dev-prod build start clean

help:
	@echo "Available commands:"
	@echo "  make install    - Install storefront dependencies"
	@echo "  make dev        - Start storefront dev server with Turbopack (FAST)"
	@echo "  make dev-prod   - Run production build locally (FASTEST - like Fly.io)"
	@echo "  make build      - Build storefront for production"
	@echo "  make start      - Start production server (requires build first)"
	@echo "  make clean      - Remove node_modules and .next"

install:
	cd storefront && bun install

# Fast dev mode with Turbopack (5-10x faster than webpack)
dev:
	cd storefront && bun run dev

# Production build + start locally (fastest, like Fly.io)
dev-prod:
	cd storefront && bun run dev:prod

build:
	cd storefront && bun run build

start:
	cd storefront && bun run start

clean:
	rm -rf storefront/node_modules storefront/.next
