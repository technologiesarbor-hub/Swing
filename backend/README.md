# Backend

All Swing backend services live here. Each service is an independent Go module with the **goserving** layout (`main.go`, `web/`, `app/cmd`, `config/setup/`, `build/`).

| Service | Folder | Notes |
|---------|--------|-------|
| **serving** | `serving/` | Main REST API (auth today; planes/chats later). May rename to **eros**. |
| *(future)* | e.g. `recommend/` | Friend recommendation, etc. |

Add new services as **sibling folders**, not inside `serving/`.
