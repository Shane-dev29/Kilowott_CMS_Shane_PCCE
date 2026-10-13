from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas import (
    ChatRequest, ChatResponse, ActionApprovalRequest, ToolExecutionEvent
)
from app.agent.graph import CRMWorkflowManager
from app.agent import tools as crm_tools

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

@router.get("/config-status")
def get_config_status():
    api_key_present = bool((settings.LLM_API_KEY or "").strip())
    return {
        "llm_configured": api_key_present,
        "provider": settings.LLM_PROVIDER,
        "model": settings.LLM_MODEL,
        "message": (
            f"Active Provider: {settings.LLM_PROVIDER} ({settings.LLM_MODEL})"
            if api_key_present
            else "Offline Agent Mode active. To enable external LLM reasoning, set LLM_API_KEY in backend/.env."
        )
    }


@router.post("/chat", response_model=ChatResponse)
def chat_with_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in req.chat_history] if req.chat_history else []
        result = CRMWorkflowManager.run_workflow(
            user_message=req.message,
            db=db,
            customer_context_id=req.customer_context_id,
            chat_history=history_dicts
        )
        return ChatResponse(**result)
    except Exception as e:
        return ChatResponse(
            reply=f"Error executing agent workflow: {str(e)}",
            events=[ToolExecutionEvent(tool_name="error", status="failed", message=str(e))],
            requires_approval=False,
            pending_action=None,
            llm_configured=bool(settings.LLM_API_KEY),
            provider=settings.LLM_PROVIDER,
            model=settings.LLM_MODEL
        )


@router.post("/approve")
def handle_action_approval(req: ActionApprovalRequest, db: Session = Depends(get_db)):
    if not req.approved:
        return {
            "success": False,
            "message": "Action cancelled by user. No modifications were made to CRM records.",
            "events": [
                ToolExecutionEvent(
                    tool_name="action_approval",
                    status="completed",
                    message="Action was rejected by user."
                )
            ]
        }

    tasks = req.payload.get("tasks", [])
    if not tasks:
        raise HTTPException(status_code=400, detail="No tasks found in action payload.")

    created_tasks = []
    failed_tasks = []
    events = []

    for t in tasks:
        cid = t.get("customer_id")
        title = t.get("title")
        desc = t.get("description", "")
        prio = t.get("priority", "medium")
        due_days = t.get("due_days", 3)

        events.append(ToolExecutionEvent(
            tool_name="create_followup_task",
            status="calling",
            input_args={"customer_id": cid, "title": title},
            message=f"Creating follow-up task for Customer #{cid}..."
        ))

        res = crm_tools.create_followup_task_tool(
            db=db,
            customer_id=cid,
            title=title,
            description=desc,
            priority=prio,
            due_days=due_days,
            created_by="AI Copilot (Approved)"
        )

        if res.get("success"):
            created_tasks.append(res)
            events[-1].status = "completed"
            events[-1].output_result = res
            events[-1].message = f"Task created: '{title}' for {res.get('customer_name')}"
        else:
            failed_tasks.append({"customer_id": cid, "error": res.get("error")})
            events[-1].status = "failed"
            events[-1].message = f"Task creation failed: {res.get('error')}"

    return {
        "success": True,
        "message": f"Successfully created {len(created_tasks)} follow-up task(s)." + (f" ({len(failed_tasks)} failed)" if failed_tasks else ""),
        "created_count": len(created_tasks),
        "failed_count": len(failed_tasks),
        "created_tasks": created_tasks,
        "events": events
    }
