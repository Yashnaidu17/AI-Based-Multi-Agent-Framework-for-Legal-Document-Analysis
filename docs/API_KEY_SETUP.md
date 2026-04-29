# API Key Manager - Secure setup for API keys

Use this script to securely configure your API keys without committing them to git.

## Quick Setup

### 1. Backend API Key Setup

```bash
# Option A: Using environment variable (Linux/macOS)
export OPENAI_API_KEY="sk-your-api-key-here"

# Option B: Using environment variable (Windows PowerShell)
$env:OPENAI_API_KEY="sk-your-api-key-here"

# Option C: Update .env file
cd backend
echo OPENAI_API_KEY=sk-your-api-key-here >> .env
```

### 2. Verify Setup

```bash
# Backend (Python)
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -c "import os; print('API Key configured!' if os.getenv('OPENAI_API_KEY') else 'API Key missing!')"

# Frontend (no API key needed - uses backend proxy)
```

### 3. Security Best Practices

✅ DO:
- Use `.env` files (ignored by git)
- Use environment variables for production
- Rotate API keys regularly
- Use separate keys for development/production
- Keep `SECRET_KEY` secure and unique per environment

❌ DON'T:
- Commit `.env` files to git
- Share API keys in code
- Use same key for multiple projects
- Expose keys in error messages
- Use default secret keys in production

## Getting Your OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key immediately (won't be shown again)
4. Add to your `.env` file:

```
OPENAI_API_KEY=sk-xxxxx...
```

## Securing Keys in Production

### Docker
```bash
docker run -e OPENAI_API_KEY=$OPENAI_API_KEY legal-backend
```

### Environment Variables
```bash
# Linux/macOS
export OPENAI_API_KEY="sk-..."
python main.py

# Windows
setx OPENAI_API_KEY "sk-..."
# Restart terminal
python main.py
```

### AWS Systems Manager
```bash
aws ssm put-parameter --name OPENAI_API_KEY --value sk-xxx
```

### GitHub Secrets
```yaml
# .github/workflows/deploy.yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Troubleshooting

"OPENAI_API_KEY not found"
→ Make sure .env file exists in backend directory
→ Check environment variable is set
→ Restart terminal/IDE after setting env var

"Invalid API key"
→ Verify key starts with "sk-"
→ Check key hasn't been revoked
→ Ensure it's a Secret Key (not API Key name)
→ Check for trailing spaces

"Rate limit exceeded"
→ Your API usage exceeded quota
→ Wait before making new requests
→ Check Usage on OpenAI dashboard
