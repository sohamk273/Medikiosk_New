import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        resp = await client.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AQ.Ab8RN6L8mMW9j8ptDPrSOCebVlIpWrEhB5P_H6_GSDTSw2LYAw', json={'contents':[{'parts':[{'text':'hi'}]}]})
        print(resp.status_code)
        print(resp.text)

asyncio.run(main())
