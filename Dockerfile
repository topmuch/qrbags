version: '3.8'

services:
  qrbag:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/qrbag.db
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=https://qrbags.com
    volumes:
      - qrbag_data:/app/data
    restart: unless-stopped
    networks:
      - coolify

networks:
  coolify:
    external: true

volumes:
  qrbag_data:
