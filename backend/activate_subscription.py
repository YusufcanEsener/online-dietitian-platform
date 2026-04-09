import asyncio
from app.core.database import init_db
from app.models.user import Member

async def main():
    await init_db()
    member = await Member.find_one(Member.email == 'uye_test_8080@test.com')
    if member:
        member.subscription_status = True
        await member.save()
        print(f"Subscription active for {member.email}")
    else:
        print("Member not found")

if __name__ == "__main__":
    asyncio.run(main())
