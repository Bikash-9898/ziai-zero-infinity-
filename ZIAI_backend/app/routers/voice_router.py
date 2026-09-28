from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws/voice", tags=["voice"])


@router.websocket("/")
async def voice_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            event_type = payload.get("type", "message")
            if event_type == "ping":
                await websocket.send_json({"type": "pong", "status": "ok"})
                continue

            await websocket.send_json({
                "type": "status",
                "status": "connected",
                "event": event_type,
                "message": "Voice socket is ready",
            })
    except WebSocketDisconnect:
        return
