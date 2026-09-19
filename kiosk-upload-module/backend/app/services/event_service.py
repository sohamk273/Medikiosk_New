"""In-memory event broker for Server-Sent Events (SSE) between phone and kiosk."""
import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Set

logger = logging.getLogger(__name__)


class EventBroker:
    """Manages real-time SSE subscriptions for active upload sessions."""

    def __init__(self):
        # Maps session_id -> Set of asyncio.Queue instances
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def subscribe(self, session_id: str) -> asyncio.Queue:
        """Registers a new listener queue for the specified session_id."""
        async with self._lock:
            if session_id not in self._subscribers:
                self._subscribers[session_id] = set()
            queue: asyncio.Queue = asyncio.Queue()
            self._subscribers[session_id].add(queue)
            logger.debug("Client subscribed to session %s (total: %d)", session_id, len(self._subscribers[session_id]))
            return queue

    async def unsubscribe(self, session_id: str, queue: asyncio.Queue) -> None:
        """Removes a listener queue."""
        async with self._lock:
            if session_id in self._subscribers:
                self._subscribers[session_id].discard(queue)
                if not self._subscribers[session_id]:
                    del self._subscribers[session_id]
            logger.debug("Client unsubscribed from session %s", session_id)

    async def publish(self, session_id: str, event_type: str, data: dict) -> None:
        """Dispatches an event to all active listener queues for the session."""
        async with self._lock:
            queues = list(self._subscribers.get(session_id, []))

        if not queues:
            return

        payload = {
            "event": event_type,
            "session_id": session_id,
            "data": data,
        }

        for q in queues:
            try:
                q.put_nowait(payload)
            except Exception as e:
                logger.warning("Failed to queue event for session %s: %s", session_id, e)

    async def event_generator(self, session_id: str, initial_data: dict = None) -> AsyncGenerator[str, None]:
        """Async generator formatting events in standard SSE wire format."""
        queue = await self.subscribe(session_id)
        try:
            # Send initial greeting/current status event if provided
            if initial_data:
                init_json = json.dumps(initial_data)
                yield f"event: initial_state\ndata: {init_json}\n\n"

            while True:
                # 20-second heartbeat to keep connection alive through proxies
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=20.0)
                    event_type = message.get("event", "message")
                    data_str = json.dumps(message.get("data", {}))
                    yield f"event: {event_type}\ndata: {data_str}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            await self.unsubscribe(session_id, queue)


event_broker = EventBroker()


def get_event_broker() -> EventBroker:
    """Dependency provider for FastAPI route handlers."""
    return event_broker
