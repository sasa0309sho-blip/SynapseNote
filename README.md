# SynapseNote

SynapseNote は、学習ノート・一問一答・復習対象をつなげて管理するための学習支援アプリです。

まずは Notion に近い感覚でノートを眺められて、そこから復習や一問一答に自然につながる MVP を目指します。  
この README は、フロントエンドとバックエンドの理想像をすり合わせるための叩き台です。

## 作りたいもの

SynapseNote でやりたいことは、単にメモを保存することではなく、学んだ内容をあとから思い出しやすい形に整理することです。

- タグごとに学習テーマを整理する
- テーマごとにノートを一覧・詳細表示する
- ノートから一問一答を作り、知識確認に使う
- 復習すべきテーマを一覧化し、重要ポイントを見返せるようにする
- 将来的には、ユーザー認証・検索・自動QA生成・復習スケジューリングなどへ拡張する

## MVP の画面イメージ

最初の MVP では、画面遷移に必要なデータを取得できることを優先します。

### ノート一覧

Notion のギャラリー風に、タグからテーマ、テーマからメモへ辿れる画面です。

1. タグ一覧を見る
2. タグ配下のテーマ一覧を見る
3. テーマ配下のメモ一覧を見る
4. メモ詳細を見る

### 一問一答

登録済みの QA を一覧で取得し、問題と答えを確認する画面です。

### 覚えているか？

復習対象のテーマを一覧で表示し、テーマごとの要約・重要ポイント・復習ガイドを確認する画面です。

## バックエンド方針

バックエンドは FastAPI を想定します。まずは動く MVP を優先し、DB 設計や API 名は後から見直せる前提にします。

- ベース URL は `/api`
- 認証は仮で path の `user_id` を使う
- データは `user_id` ごとに分離する
- 最初はインメモリの `dict` または SQLite でよい
- Next.js から呼ぶため CORS を許可する
- FastAPI の OpenAPI / Swagger を使って API 仕様を確認できるようにする

## 開発環境

環境差を減らすため、MVP 開発では Docker を使う方針にします。Python / Node.js のバージョンや依存関係を各自の PC に直接入れなくても、同じ構成で起動できます。

Docker Desktop を起動した状態で、リポジトリ直下から実行します。

```bash
docker compose up --build
```

起動後に確認する URL は次の通りです。

| 用途 | URL |
| --- | --- |
| フロントエンド | `http://localhost:3000` |
| バックエンド API | `http://localhost:8000/api/health` |
| Swagger UI | `http://localhost:8000/docs` |

現在はデモ用ユーザーとして `demo-user` を使います。

```bash
curl http://localhost:8000/api/demo-user/tags
```

Docker を使わずにローカルで直接起動する場合は、フロントエンドとバックエンドを別々に起動します。

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

## ディレクトリ構成

```text
.
├── backend
│   ├── app
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── app
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── Dockerfile
│   ├── package-lock.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 共通レスポンス

成功時はすべて次の形に揃えます。

```json
{
  "ok": true,
  "data": {}
}
```

エラー時は次の形に揃えます。

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "memo not found"
  }
}
```

## MVP のデータ構造

### Tag

```json
{
  "tag_id": 1,
  "tag_name": "数学"
}
```

### Subject

```json
{
  "subject_id": 1,
  "subject_name": "FlashAttention"
}
```

### Memo

```json
{
  "memo_id": 1,
  "memo_name": "FlashAttentionとは",
  "memo_detail": "...markdown/tex..."
}
```

### QA

```json
{
  "qa_id": 1,
  "question": "FlashAttentionの革新的な点は？",
  "answer": "...",
  "subject_id": 1,
  "memo_id": 1
}
```

### RepeatSubject

```json
{
  "subject_id": 1,
  "subject_name": "FlashAttention"
}
```

## MVP API

ベース URL は `https://<domain>/api` を想定します。

| 目的 | Method | Endpoint |
| --- | --- | --- |
| ユーザーのタグ一覧を取得 | GET | `/{user_id}/tags` |
| タグ配下の科目一覧を取得 | GET | `/{user_id}/tags/{tag_id}` |
| 科目配下のメモ一覧を取得 | GET | `/{user_id}/tags/{tag_id}/{subject_id}` |
| メモ詳細を取得 | GET | `/{user_id}/tags/{tag_id}/{subject_id}/{memo_id}` |
| 一問一答一覧を取得 | GET | `/{user_id}/QA` |
| 復習科目一覧を取得 | GET | `/{user_id}/repeat` |
| 復習科目詳細を取得 | GET | `/{user_id}/repeat/{subject_id}` |

実装ではフロントエンドから扱いやすいように、`/{user_id}/qa` も同じレスポンスを返すエイリアスとして用意しています。

## エラーコード

| Code | 意味 |
| --- | --- |
| `NOT_FOUND` | `tag_id` / `subject_id` / `memo_id` などが存在しない |
| `VALIDATION_ERROR` | path params や request body の型が不正 |
| `INTERNAL` | 想定外のサーバーエラー |

## これから確認したいこと

理想と実装を近づけるために、次の点をフィードバックしながら決めたいです。

- `Tag -> Subject -> Memo` の階層で本当に使いやすいか
- `QA` はメモに紐づくのか、テーマにだけ紐づくこともあるのか
- `repeat` は手動で登録するのか、復習間隔や正答率から自動で出すのか
- メモ詳細の `memo_detail` は Markdown / TeX をそのまま保存する形でよいか
- API 名は MVP 後に REST らしく整理するか
- 最初の DB は SQLite で十分か、それとも Supabase / PostgreSQL を早めに使うか

## 開発ロードマップ案

1. FastAPI で MVP API を実装する
2. インメモリデータで Swagger から動作確認する
3. Next.js から API を叩いて画面遷移を確認する
4. SQLite か PostgreSQL に保存先を移す
5. 認証を `user_id` path 指定から JWT などに移行する
6. QA 生成・復習ロジック・検索を追加する
