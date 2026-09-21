import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        resp = await client.get('https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6L8mMW9j8ptDPrSOCebVlIpWrEhB5P_H6_GSDTSw2LYAw')
        print(resp.status_code)
        print(resp.json())

asyncio.run(main())
