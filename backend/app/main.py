from __future__ import annotations

import os
from typing import Any, NoReturn

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


def parse_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


app = FastAPI(
    title="SynapseNote API",
    description="MVP demo API for SynapseNote.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_USERS: dict[str, dict[str, Any]] = {
    "demo-user": {
        "tags": [
            {"tag_id": 1, "tag_name": "AI / 論文"},
            {"tag_id": 2, "tag_name": "数学"},
            {"tag_id": 3, "tag_name": "英語"},
        ],
        "subjects_by_tag": {
            1: [
                {"subject_id": 1, "subject_name": "FlashAttention"},
                {"subject_id": 2, "subject_name": "Transformer"},
            ],
            2: [
                {"subject_id": 3, "subject_name": "線形代数"},
                {"subject_id": 4, "subject_name": "確率統計"},
            ],
            3: [
                {"subject_id": 5, "subject_name": "Academic Writing"},
            ],
        },
        "memos_by_subject": {
            1: [
                {
                    "memo_id": 1,
                    "memo_name": "FlashAttentionとは",
                    "memo_detail": (
                        "FlashAttention は Attention の計算をタイル分割し、"
                        "HBM への読み書きを減らして高速化する手法。"
                    ),
                },
                {
                    "memo_id": 2,
                    "memo_name": "計算量の比較",
                    "memo_detail": (
                        "通常の Attention はスコア行列を明示的に保持する。"
                        "FlashAttention は中間行列を保持せず、メモリ効率を改善する。"
                    ),
                },
            ],
            2: [
                {
                    "memo_id": 3,
                    "memo_name": "Self-Attentionの流れ",
                    "memo_detail": "Query / Key / Value から重み付き和を作る仕組みを整理する。",
                }
            ],
            3: [
                {
                    "memo_id": 4,
                    "memo_name": "固有値と固有ベクトル",
                    "memo_detail": "線形変換で向きが変わらないベクトルと、その倍率を表す。",
                }
            ],
            4: [
                {
                    "memo_id": 5,
                    "memo_name": "ベイズの定理",
                    "memo_detail": "事前確率を観測結果で更新して事後確率を求める。",
                }
            ],
            5: [
                {
                    "memo_id": 6,
                    "memo_name": "Abstractの型",
                    "memo_detail": "背景、問題、手法、結果、貢献の順で短く書く。",
                }
            ],
        },
        "qa": [
            {
                "qa_id": 1,
                "question": "FlashAttentionの革新的な点は？",
                "answer": "Attentionの中間行列をできるだけ保存せず、メモリアクセスを減らす点。",
                "subject_id": 1,
                "memo_id": 1,
            },
            {
                "qa_id": 2,
                "question": "Self-Attentionで使う3つのベクトルは？",
                "answer": "Query、Key、Value。",
                "subject_id": 2,
                "memo_id": 3,
            },
            {
                "qa_id": 3,
                "question": "ベイズの定理は何を更新する？",
                "answer": "事前確率を観測データに基づいて事後確率へ更新する。",
                "subject_id": 4,
                "memo_id": 5,
            },
        ],
        "repeat": [
            {"subject_id": 1, "subject_name": "FlashAttention"},
            {"subject_id": 4, "subject_name": "確率統計"},
        ],
        "repeat_details": {
            1: {
                "subject_id": 1,
                "subject_name": "FlashAttention",
                "subject_detail": (
                    "復習ポイント: なぜ通常Attentionはメモリを多く使うのか、"
                    "FlashAttentionがどのメモリ移動を削減するのかを説明できるようにする。"
                ),
            },
            4: {
                "subject_id": 4,
                "subject_name": "確率統計",
                "subject_detail": (
                    "復習ポイント: ベイズの定理を、事前確率・尤度・事後確率の関係で説明する。"
                ),
            },
        },
    }
}


def success(data: Any) -> dict[str, Any]:
    return {"ok": True, "data": data}


def error_response(code: str, message: str) -> dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message}}


def raise_not_found(message: str) -> NoReturn:
    raise HTTPException(
        status_code=404,
        detail={"code": "NOT_FOUND", "message": message},
    )


def get_user_data(user_id: str) -> dict[str, Any]:
    user_data = DEMO_USERS.get(user_id)
    if user_data is None:
        raise_not_found("user not found")
    return user_data


def find_item(items: list[dict[str, Any]], key: str, value: int) -> dict[str, Any] | None:
    return next((item for item in items if item[key] == value), None)


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        code = str(detail.get("code", "INTERNAL"))
        message = str(detail.get("message", "unexpected error"))
    else:
        code = "INTERNAL"
        message = str(detail)
    return JSONResponse(status_code=exc.status_code, content=error_response(code, message))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, __) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_response("VALIDATION_ERROR", "invalid request parameters"),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, __) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=error_response("INTERNAL", "internal server error"),
    )


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return success({"status": "ok"})


@app.get("/api/{user_id}/tags")
async def list_tags(user_id: str) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    return success(user_data["tags"])


@app.get("/api/{user_id}/tags/{tag_id}")
async def list_subjects(user_id: str, tag_id: int) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    if find_item(user_data["tags"], "tag_id", tag_id) is None:
        raise_not_found("tag not found")
    return success(user_data["subjects_by_tag"].get(tag_id, []))


@app.get("/api/{user_id}/tags/{tag_id}/{subject_id}")
async def list_memos(user_id: str, tag_id: int, subject_id: int) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    subjects = user_data["subjects_by_tag"].get(tag_id)
    if subjects is None:
        raise_not_found("tag not found")
    if find_item(subjects, "subject_id", subject_id) is None:
        raise_not_found("subject not found")

    memo_summaries = [
        {"memo_id": memo["memo_id"], "memo_name": memo["memo_name"]}
        for memo in user_data["memos_by_subject"].get(subject_id, [])
    ]
    return success(memo_summaries)


@app.get("/api/{user_id}/tags/{tag_id}/{subject_id}/{memo_id}")
async def get_memo(
    user_id: str,
    tag_id: int,
    subject_id: int,
    memo_id: int,
) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    subjects = user_data["subjects_by_tag"].get(tag_id)
    if subjects is None:
        raise_not_found("tag not found")
    if find_item(subjects, "subject_id", subject_id) is None:
        raise_not_found("subject not found")

    memo = find_item(user_data["memos_by_subject"].get(subject_id, []), "memo_id", memo_id)
    if memo is None:
        raise_not_found("memo not found")
    return success(memo)


@app.get("/api/{user_id}/QA")
@app.get("/api/{user_id}/qa")
async def list_qa(user_id: str) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    return success(user_data["qa"])


@app.get("/api/{user_id}/repeat")
async def list_repeat_subjects(user_id: str) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    return success(user_data["repeat"])


@app.get("/api/{user_id}/repeat/{subject_id}")
async def get_repeat_subject(user_id: str, subject_id: int) -> dict[str, Any]:
    user_data = get_user_data(user_id)
    repeat_detail = user_data["repeat_details"].get(subject_id)
    if repeat_detail is None:
        raise_not_found("repeat subject not found")
    return success(repeat_detail)
