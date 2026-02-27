# lgtm-cat-ai-agents

[LGTMeow](https://lgtmeow.com) で利用するAIエージェントのバックエンドプロジェクト。

## Getting Started

### 1. 依存packageのインストール

```bash
npm ci
```

### 2. 環境変数の設定

`.env` を配置します。

必要な環境変数は `.env.example` に記載済です。

実際の値に関しては機密情報を含むため関係者にだけ共有します。

### 3. 開発サーバーの起動

以下を実行します。

```bash
npm run dev
```

開発用のWebUIが起動してここからエージェントの動作確認ができます。

開発中は基本的にこのWebUIで動作確認を行うことが多いと思います。

## APIサーバーへの通信

動作確認用の天気予報エージェントに接続する為には以下のようにcurlコマンドを実行します。

```bash
curl -v -N -X POST \
-H "Content-Type: application/json" \
-d '{
  "messages": [
    { "role": "user", "content": "今日の新宿の天気が知りたいです。日本語で教えてください。" }
  ]
}' \
http://localhost:4111/api/agents/weatherAgent/stream
```

これでServer Sent Events（SSE）形式のデータが返ってきます。

`weatherAgent` の部分をエージェントIDに変更することで他のエージェントにも接続できます。

エージェントの一覧は以下のAPIを実行することで取得出来ます。

```bash
curl -v http://localhost:4111/api/agents | jq
```
