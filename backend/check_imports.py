import sys
print("Python:", sys.version)
errors = []
modules = ["fastapi", "uvicorn", "pdfplumber", "sqlalchemy", "jose", "bcrypt", "aiohttp", "dotenv", "multipart"]
for m in modules:
    try:
        __import__(m)
        print(f"OK: {m}")
    except ImportError as e:
        print(f"MISSING: {m} -> {e}")
        errors.append(m)
print("Missing modules:", errors if errors else "None")
