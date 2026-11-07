from fastapi import APIRouter, status

from app.schemas.agent import AgentQueryRequest, AgentResponse
from app.services.agent.engine import disruption_agent

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post(
    "/chat",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Process natural language passenger query with autonomous disruption agent",
    description="Invokes the Disruption Agent with Function Calling over flight context, operational events, and airline policies.",
)
def chat_with_agent(payload: AgentQueryRequest) -> AgentResponse:
    """
    Receives a passenger question with a 6-character booking reference,
    executes the agentic reasoning loop with Function Calling,
    and returns a verified, structured response with human-in-the-loop flags
    and empathetic conversational reply.
    """
    return disruption_agent.run(payload)

