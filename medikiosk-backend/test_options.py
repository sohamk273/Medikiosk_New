import httpx
import asyncio
import json

async def test():
    async with httpx.AsyncClient() as c:
        res = await c.post('http://localhost:8000/api/v1/clinical/next-turn', json={
            "transcript": "Fever / High Temperature",
            "language": "en",
            "case_state": None
        }, timeout=30.0)
        data = res.json()
        print("Question:", data.get('next_question'))
        print("Options:", json.dumps(data.get('suggested_options'), indent=2))

asyncio.run(test())
