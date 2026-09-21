import httpx
import asyncio
import json

async def test():
    async with httpx.AsyncClient() as c:
        # Turn 1
        res1 = await c.post('http://localhost:8000/api/v1/clinical/next-turn', json={
            "transcript": "I have a high fever",
            "language": "en",
            "case_state": None,
            "turn_number": 1
        }, timeout=30.0)
        state = res1.json().get('case_state')
        print(f"Turn 1 provider: {res1.json().get('provider')}")
        print(f"Turn 1 question: {res1.json().get('next_question')}")
        
        # Turn 2
        res2 = await c.post('http://localhost:8000/api/v1/clinical/next-turn', json={
            "transcript": "Since 3 days",
            "language": "en",
            "case_state": state,
            "turn_number": 2
        }, timeout=30.0)
        state2 = res2.json().get('case_state')
        print(f"Turn 2 provider: {res2.json().get('provider')}")
        print(f"Turn 2 Question: {res2.json().get('next_question')}")
        
        # Turn 3
        res3 = await c.post('http://localhost:8000/api/v1/clinical/next-turn', json={
            "transcript": "I have severe body ache",
            "language": "en",
            "case_state": state2,
            "turn_number": 3
        }, timeout=30.0)
        print(f"Turn 3 provider: {res3.json().get('provider')}")
        print(f"Turn 3 Question: {res3.json().get('next_question')}")
        print(f"Turn 3 Options: {res3.json().get('suggested_options')}")
        
asyncio.run(test())
