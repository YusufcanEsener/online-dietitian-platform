import asyncio
from app.core.database import init_db
from app.models.user import Dietitian

async def main():
    await init_db()
    dyt = await Dietitian.find_one(Dietitian.email == 'dyt_test_8080@test.com')
    if dyt:
        dyt.is_active = True
        await dyt.save()
        print(f"Approved {dyt.email}")
    else:
        print("Dietitian not found")

if __name__ == "__main__":
    asyncio.run(main())
