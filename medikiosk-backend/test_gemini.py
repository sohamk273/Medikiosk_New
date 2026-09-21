import asyncio
from app.providers.llm.gemini import GeminiClinicalProvider

async def test():
    provider = GeminiClinicalProvider()
    res = await provider.process_clinical_turn(
        transcript="I have a high fever",
        language="en",
        current_case_state=None,
        turn_number=1
    )
    print("Gemini result:")
    print(res.model_dump_json(indent=2))

asyncio.run(test())
