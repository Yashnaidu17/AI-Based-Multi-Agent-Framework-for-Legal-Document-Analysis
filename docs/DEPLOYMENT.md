# Legal Document Analysis Platform - Deployment Guide

## Getting Started

### Option 1: Local Development

#### Prerequisites
- Python 3.9+
- Node.js 16+
- OpenAI API Key

#### Quick Start

1. **Run setup script:**
   ```bash
   python setup.py
   ```

2. **Start backend (Terminal 1):**
   ```bash
   cd backend
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   python main.py
   ```

3. **Start frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Docker Deployment

#### Prerequisites
- Docker
- Docker Compose
- OpenAI API Key

#### Run with Docker Compose

```bash
# Create .env file with your API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env
echo "SECRET_KEY=your-secret-key" >> .env

# Start services
docker-compose up --build

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

#### Build and Run Individual Containers

**Backend:**
```bash
docker build -f Dockerfile.backend -t legal-backend .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-xxx legal-backend
```

**Frontend:**
```bash
docker build -f Dockerfile.frontend -t legal-frontend .
docker run -p 3000:3000 legal-frontend
```

### Option 3: Production Deployment

#### Using Gunicorn + Nginx

**Backend:**
```bash
cd backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

**Nginx Configuration:**
```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

#### Environment Configuration

Create `.env` file with:
```
# Critical for production
OPENAI_API_KEY=sk-your-production-key
SECRET_KEY=generate-a-long-random-string
DATABASE_URL=postgresql://user:pass@host/dbname

# Optional
DEBUG=False
ALLOWED_HOSTS=your-domain.com
CORS_ORIGINS=["https://your-domain.com"]
```

### Option 4: Cloud Deployment

#### Heroku

1. **Install Heroku CLI**

2. **Create Heroku app:**
   ```bash
   heroku create your-legal-app
   ```

3. **Add buildpacks:**
   ```bash
   heroku buildpacks:add heroku/python
   heroku buildpacks:add heroku/nodejs
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=sk-xxx
   heroku config:set SECRET_KEY=your-secret
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

#### AWS

1. **Use Elastic Beanstalk for backend:**
   ```bash
   eb init
   eb create legal-env
   eb deploy
   ```

2. **Use S3 + CloudFront for frontend:**
   ```bash
   npm run build
   # Upload dist/ to S3
   # Create CloudFront distribution
   ```

3. **Use RDS for database:**
   ```
   Update DATABASE_URL to RDS endpoint
   ```

#### Google Cloud

1. **Deploy backend to Cloud Run:**
   ```bash
   gcloud run deploy legal-backend --source . --port 8000
   ```

2. **Deploy frontend to Firebase Hosting:**
   ```bash
   npm install -g firebase-tools
   firebase init
   firebase deploy
   ```

## Configuration

### API Keys

1. **OpenAI API Key:**
   - Go to https://platform.openai.com/account/api-keys
   - Create new secret key
   - Add to `.env`

2. **JWT Secret:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### Database

**SQLite (Development):**
- Default: `sqlite:///./legal_analysis.db`
- Auto-created on first run

**PostgreSQL (Production):**
```
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

### CORS Configuration

Edit `backend/main.py`:
```python
allow_origins=[
    "https://your-domain.com",
    "https://www.your-domain.com"
]
```

## Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Use HTTPS/SSL everywhere
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable database backups
- [ ] Monitor API usage and costs

## Performance Tips

1. **Caching:**
   - Use Redis for session management
   - Cache frequent API responses

2. **Database:**
   - Use PostgreSQL in production
   - Add database indexes
   - Regular vacuum and analyze

3. **Frontend:**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement lazy loading

4. **Backend:**
   - Use async/await for I/O
   - Implement connection pooling
   - Monitor OpenAI API calls

## Monitoring

### Logging
```python
# Configured in main.py
import logging
logging.basicConfig(level=logging.INFO)
```

### Error Tracking
- Sentry: https://sentry.io/
- DataDog: https://www.datadoghq.com/
- New Relic: https://newrelic.com/

### Health Checks
```bash
curl http://localhost:8000/api/health
```

## Scaling

1. **Horizontal Scaling:**
   - Use load balancer (AWS ELB, Nginx)
   - Multiple backend instances
   - Shared database

2. **Vertical Scaling:**
   - Increase server resources
   - Optimize code
   - Better database indexing

## Backup & Recovery

1. **Database:**
   ```bash
   # PostgreSQL backup
   pg_dump dbname > backup.sql
   
   # Restore
   psql dbname < backup.sql
   ```

2. **Files:**
   - Regular S3 backups
   - Version control for code
   - Document configurations

## Troubleshooting

### Backend won't start
```bash
# Check dependencies
pip install -r requirements.txt

# Check API key
echo $OPENAI_API_KEY

# View logs
python main.py --log-level debug
```

### Frontend won't build
```bash
# Clear cache
rm -rf node_modules
npm cache clean --force
npm install

# Rebuild
npm run build
```

### API connection issues
```bash
# Test connectivity
curl http://localhost:8000/api/health

# Check logs
docker logs legal-backend
```

## Support

- Documentation: See README.md
- Issues: GitHub Issues
- Email: support@legalai.com

---

Last Updated: 2024
