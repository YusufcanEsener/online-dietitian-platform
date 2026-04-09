import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Login
        login_data = {"username": "diyetisyen@dietplatform.com", "password": "Diet1234!"}
        resp = await client.post("http://localhost:8000/api/v1/auth/login", data=login_data)
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return
            
        token = resp.json()["access_token"]
        
        # Test daily-report
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.post("http://localhost:8000/api/v1/ai/daily-report", headers=headers)
        print("Status Code:", resp.status_code)
        print("Response:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
