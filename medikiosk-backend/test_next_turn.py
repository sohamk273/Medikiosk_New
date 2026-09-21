import httpx
import asyncio
import json

async def test_turn():
    url = "http://localhost:8000/api/v1/clinical/next-turn"
    payload = {
        "transcript": "Fever / High Temperature",
        "language": "en",
        "case_state": None
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload, timeout=30.0)
        print("Status:", res.status_code)
        print("Body:", res.text)

if __name__ == "__main__":
    asyncio.run(test_turn())
