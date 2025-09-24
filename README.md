# 薬飲み忘れ管理システム

薬を飲んだかどうかを管理するWebアプリケーションです。朝・昼・晩の服薬状況を記録・管理できます。

## 機能

- ユーザー登録・ログイン機能
- 薬の服薬記録（朝・昼・晩）
- 管理者ユーザー管理機能
- モバイル対応レスポンシブデザイン
- OpenAPI仕様書によるAPI管理

## 技術構成

### バックエンド
- **FastAPI**: Python製高速WebAPIフレームワーク
- **SQLAlchemy**: Pythonデータベースライブラリ
- **PostgreSQL**: リレーショナルデータベース
- **JWT認証**: セキュアなトークンベース認証

### フロントエンド
- **React**: UIライブラリ
- **TypeScript**: 型安全なJavaScript
- **Vite**: 高速ビルドツール
- **Material-UI**: モダンなUIコンポーネント

### インフラ
- **Docker**: コンテナ化
- **Docker Compose**: マルチコンテナアプリケーション管理

## セットアップ・起動方法

### 前提条件
- Docker
- Docker Compose

### 起動手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd kusurinonda
```

2. Docker Composeで起動（開発環境）
```bash
docker-compose up --build
```

3. アクセス
- フロントエンド: http://localhost:8001
- バックエンドAPI: http://localhost:8000
- API仕様書（開発環境のみ）: http://localhost:8000/docs

### 本番環境での起動
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

本番環境では：
- API仕様書（/docs、/redoc）は無効化されます
- ホットリロードは無効になります
- フロントエンドは http://localhost:8001 でアクセス可能です

## 使用方法

### 初期ユーザー作成
管理者ユーザーを作成する場合は、バックエンドAPIを直接呼び出すか、データベースで直接設定してください。

```bash
# 管理者ユーザー作成例（開発環境）
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "is_admin": true
  }'
```

### 一般ユーザー使用方法
1. ログイン画面でユーザー名・パスワードを入力
2. ダッシュボードで今日の服薬状況を記録
3. 過去の記録を確認

### 管理者機能
- ユーザー一覧の確認
- 全ユーザーの服薬記録確認

## API仕様

詳細なAPI仕様は `api-spec.yaml` または `http://localhost:8000/docs` で確認できます。

### 主要エンドポイント

- `POST /token` - ログイン
- `POST /register` - ユーザー登録
- `GET /users/me` - 現在のユーザー情報
- `GET /medication-records` - 服薬記録取得
- `POST /medication-records` - 服薬記録作成
- `PUT /medication-records/{id}` - 服薬記録更新

## ディレクトリ構成

```
.
├── docker-compose.yml
├── api-spec.yaml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── auth.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── contexts/
        │   └── AuthContext.tsx
        └── components/
            ├── Login.tsx
            ├── Dashboard.tsx
            ├── AdminPanel.tsx
            └── ProtectedRoute.tsx
```

## 開発について

### 環境変数

以下の環境変数が設定可能です：

**バックエンド**
- `DATABASE_URL`: データベース接続URL
- `SECRET_KEY`: JWT署名用秘密鍵

**フロントエンド**
- `VITE_API_URL`: バックエンドAPIのURL

### 開発環境での起動

開発環境では、ファイルの変更を監視して自動でリロードされます。

```bash
# 開発環境で起動
docker-compose up --build

# ログ確認
docker-compose logs -f backend
docker-compose logs -f frontend
```

## セキュリティ

本番環境で使用する場合は、以下の点にご注意ください：

- `SECRET_KEY`を本番用の安全な値に変更
- データベースの認証情報を適切に設定
- HTTPSの使用を推奨
- パスワードの複雑度要件の設定

## ライセンス

MIT License
