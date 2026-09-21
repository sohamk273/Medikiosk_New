import httpx
import asyncio
import json

async def test_turn():
    url = "http://localhost:8000/api/v1/clinical/process-turn"
    payload = {
        "transcript": "I have been having a high fever.",
        "language": "en",
        "case_state": None
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload, timeout=30.0)
        print("Status:", res.status_code)
        if res.status_code == 200:
            data = res.json()
            print("Raw Response:", json.dumps(data, indent=2))
        else:
            print("Error:", res.text)

if __name__ == "__main__":
    asyncio.run(test_turn())
