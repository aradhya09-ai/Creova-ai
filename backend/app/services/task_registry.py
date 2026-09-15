"""In-memory registry for long-running generation tasks.

The video generate endpoint runs in a background thread and exposes live
progress via this registry, so the UI can show a real percentage/phase
instead of a fake spinner that stalls at 75%.
"""
import threading
import uuid

_lock = threading.Lock()
_tasks: dict = {}


def create_task():
    tid = uuid.uuid4().hex[:16]
    with _lock:
        _tasks[tid] = {
            "status": "pending",
            "percent": 5,
            "phase": "Starting…",
            "error": None,
            "result": None,
            "demo": False,
            "mode": None,
            "model": None,
            "entry": None,
            "project_id": None,
        }
    return tid


def update(tid, **kwargs):
    with _lock:
        if tid in _tasks:
            _tasks[tid].update(kwargs)


def get(tid):
    with _lock:
        return dict(_tasks[tid]) if tid in _tasks else None


def complete(tid, result, entry, project_id):
    update(
        tid,
        status="done",
        percent=100,
        phase="Done",
        result=result,
        demo=result.get("demo", False),
        mode=result.get("mode"),
        model=result.get("model"),
        entry=entry,
        project_id=project_id,
    )


def fail(tid, error):
    update(tid, status="error", error=error)


def drop(tid):
    with _lock:
        _tasks.pop(tid, None)