import asyncio
from database import SessionLocal
from auth import login, UserLogin

async def test():
    db = SessionLocal()
    try:
        user_data = UserLogin(email='demo@legal.com', password='demo123')
        res = await login(user_data, db)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
