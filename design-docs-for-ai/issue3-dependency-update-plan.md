# Issue #3: 依存パッケージを最新バージョンに更新する - 実装計画

## 概要

依存パッケージを最新安定版に更新する。TypeScript 6.0 のメジャーバージョンアップ、Mastra 関連パッケージの大幅アップデートが含まれる。

### 作業の全体フロー

```
ステップ 1: 事前準備（現状確認）
    ↓
ステップ 2: TypeScript・開発ツール更新 → tsconfig.json 修正 → 動作確認 → コミット
    ↓
ステップ 3: Mastra パッケージ更新 → 型エラー修正 → テスト確認
    ↓
ステップ 4: Mastra Studio での手動動作確認
    ↓
ステップ 5: 品質管理（format → lint → test → build）→ コミット
```

## AI エージェント向けの注意事項

- Mastra のコードを修正する前に、必ず `/mastra` スキルをロードすること
- Mastra の API は頻繁に変更されるため、内部知識に頼らず必ず embedded docs（`node_modules/@mastra/*/dist/docs/`）で最新の型定義を確認すること
- Context7 MCP を利用して公式ドキュメントの最新情報を参照できる

## 前提条件

- Node.js >= 22.13.0 がインストールされていること
- 以下の環境変数が `.env` に設定されていること（Mastra Studio での動作確認に必要）
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
  - `GOOGLE_GENERATIVE_AI_API_KEY`（Weather Agent が `google/gemini-3.1-pro-preview` を使用）

## 更新対象パッケージ一覧

### dependencies

| パッケージ | 現在 | 更新後 | 備考 |
|---|---|---|---|
| `@mastra/core` | 1.8.0 | 1.16.0 | 大幅更新（8バージョン差） |
| `@mastra/memory` | 1.5.2 | 1.10.0 | 大幅更新 |
| `@mastra/observability` | 1.2.1 | 1.5.1 | |
| `@mastra/libsql` | 1.6.2 | 1.7.2 | |
| `@mastra/loggers` | 1.0.2 | 1.0.3 | パッチ更新 |
| `@mastra/evals` | 1.1.2 | 1.1.2 | 更新不要（既に最新） |
| `zod` | 4.3.6 | 4.3.6 | 更新不要（既に最新） |

### devDependencies

| パッケージ | 現在 | 更新後 | 備考 |
|---|---|---|---|
| `typescript` | 5.9.3 | 6.0.2 | メジャーバージョンアップ |
| `vitest` | 4.0.18 | 4.1.1 | 破壊的変更なし |
| `@vitest/coverage-v8` | 4.0.18 | 4.1.1 | vitest と同バージョンに揃える |
| `@biomejs/biome` | 2.4.4 | 2.4.9 | パッチ更新 |
| `ultracite` | 7.2.4 | 7.3.2 | マイナー更新 |
| `@types/node` | 25.3.2 | 25.5.0 | |
| `mastra`（CLI） | 1.3.5 | 1.3.15 | |
| `prettier` | 3.8.1 | 3.8.1 | 更新不要（既に最新） |

---

## 事前に把握している破壊的変更

### TypeScript 5.9.3 → 6.0.2 の破壊的変更

公式発表: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/

#### 1. `types` のデフォルト値が `[]` に変更（対応必須）

TypeScript 6.0 では `types` のデフォルト値が `[]`（空配列）になった。以前は `node_modules/@types` 配下を自動列挙していたが、6.0 からは明示的に指定が必要。

**このプロジェクトへの影響:** `tsconfig.json` に `types` を明示していないため、`@types/node` が自動認識されなくなる。`process.env` などの Node.js 型定義が参照できずビルドエラーになる。

**対応方法:** `tsconfig.json` の `compilerOptions` に `"types": ["node"]` を追加する。

#### 2. `esModuleInterop` の `false` 設定が削除

`esModuleInterop: false` は設定できなくなった（常に有効）。

**このプロジェクトへの影響:** 現在 `"esModuleInterop": true` を設定しているため動作に影響はない。ただし冗長な設定となっている。

**対応方法:** `tsconfig.json` から `"esModuleInterop": true` を削除する（冗長設定の除去）。

#### 3. `noUncheckedSideEffectImports` がデフォルト `true` に変更

副作用のみのインポート（`import './foo'` 形式）に対して、ファイルの存在チェックが行われるようになった。

**このプロジェクトへの影響:** 現在のコードベースに副作用のみのインポートがないため、影響は限定的。ただしパッケージ更新後にビルドエラーが出れば対応が必要。

#### 4. `rootDir` のデフォルト値が `tsconfig.json` の配置ディレクトリに変更（対応推奨）

従来は入力ファイルの共通ディレクトリ（このプロジェクトでは `src/`）が自動推論されていたが、6.0 では `tsconfig.json` のあるディレクトリ（プロジェクトルート）がデフォルトになった。

**このプロジェクトへの影響:** `"noEmit": true` を設定しているため出力先の問題は直接発生しない。ただし `mastra build` が内部的に `rootDir` を参照している場合は影響が出る可能性がある。

**対応方法:** 予期しない動作を防ぐため、`tsconfig.json` に `"rootDir": "./src"` を明示設定する。

**参考ツール:** TypeScript チームメンバーが作成した移行ツール `ts5to6` で `rootDir` の移行を自動化できる:
```bash
npx @andrewbranch/ts5to6 --fixRootDir .
```

#### 5. 削除・非推奨となった設定（影響なし）

以下はこのプロジェクトで使用していないため影響なし:
- `moduleResolution: "classic"` → 削除（プロジェクトは `"bundler"` を使用）
- `module: "amd"/"umd"/"systemjs"/"none"` → 削除（プロジェクトは `"ES2022"` を使用）
- `outFile` → 削除（未使用）
- `baseUrl` → 非推奨（未使用）

### Mastra 1.8.0 → 1.16.0 の破壊的変更

関連するチェンジログ:
- v1.8.0: https://mastra.ai/blog/changelog-2026-02-26
- v1.9.0: https://mastra.ai/blog/changelog-2026-03-04
- v1.11.0: https://mastra.ai/blog/changelog-2026-03-16
- v1.12.0: https://mastra.ai/blog/changelog-2026-03-12
- v1.13.0: https://mastra.ai/blog/changelog-2026-03-13
- v1.14.0 / v1.16.0: https://github.com/mastra-ai/mastra/releases

#### 1. v1.13.0: `scorerName` → `scorerId` へのリネーム

スコアオブジェクトの識別フィールドが `scorerName` から `scorerId` に変更された。

**このプロジェクトへの影響:** `src/mastra/scorers/weather-scorer.ts` でスコアラーを定義しているが、コード上で `scorerName` を直接参照していないため、コード変更は不要の可能性が高い。内部的なデータ構造の変更。

#### 2. v1.13.0: `ObservabilityBus` コンストラクタ変更

`ObservabilityBus` のコンストラクタが `{ cardinalityFilter, autoExtractMetrics }` をインスタンス化時に受け取る形に変更。

**このプロジェクトへの影響:** `src/mastra/index.ts` では `Observability` クラスを使用しており、`ObservabilityBus` を直接使用していない。ただし `Observability` のコンストラクタにも影響がある可能性があるため、更新後に型チェックで確認が必要。

#### 3. v1.11.0: Zod の最低バージョン要件

Mastra は `Zod ^3.25.0` または `Zod ^4.0.0` を要求するようになった。

**このプロジェクトへの影響:** Zod 4.3.6 を使用しているため問題なし。

#### 4. v1.12.0: ファイルシステムパスの変更、ProcessHandle.pid の型変更

**このプロジェクトへの影響:** ファイルシステム操作やサンドボックスを使用していないため影響なし。

#### 5. AI SDK v4 → v5 移行の影響

Mastra 内部で AI SDK がアップグレードされた。`agent.stream()` や `agent.generate()` の返り値の型が変更されている可能性がある。

**このプロジェクトへの影響:**
- `src/mastra/workflows/weather-workflow.ts:150-162` で `agent.stream()` の `textStream` を使用している
- `vnext-to-standard-apis` 移行ガイド（https://mastra.ai/guides/migrations/vnext-to-standard-apis）によると、`resourceId`/`threadId` が `memory` オブジェクトに移動、`memoryOptions` → `memory` に変更されている
- ただし、このプロジェクトでは `agent.stream()` に `resourceId`/`threadId` を渡していないため、返り値の型変更のみ注意が必要

#### 6. v1.14.0: `@mastra/loggers` 1.0.3 の `PinoLogger` 変更

`PinoLogger` に `prettyPrint` オプションが追加された。破壊的変更ではない。

#### 7. インポートパス（サブパスエクスポート）の変更リスク

現在のコードでは以下のサブパスインポートを使用している:
- `@mastra/core/mastra` → `Mastra`
- `@mastra/core/agent` → `Agent`
- `@mastra/core/tools` → `createTool`
- `@mastra/core/workflows` → `createStep`, `createWorkflow`
- `@mastra/core/evals` → `createScorer`

これらのサブパスエクスポートが 1.16.0 で変更されている可能性がある。更新後に `npx tsc --noEmit` でインポートエラーが出た場合は、embedded docs の SOURCE_MAP.json で正しいエクスポートパスを確認する。

#### 8. `@mastra/memory` のデフォルト値変更（要注意）

`@mastra/memory` のアップデートにより、以下のデフォルト値が変更されている:

| 設定項目 | 旧デフォルト | 新デフォルト |
|---|---|---|
| `workingMemory.scope` | `'thread'` | `'resource'` |
| `semanticRecall.scope` | `'thread'` | `'resource'` |
| `lastMessages` | 40 | 10 |
| `semanticRecall` | 有効 | 無効 |

**このプロジェクトへの影響:** `src/mastra/agents/weather-agent.ts:48` で `new Memory()` を引数なしで使用している。スコープのデフォルト変更により、スレッド横断で記憶が共有される動作に変わる可能性がある。ただし Weather Agent は会話メモリを主に使用しているだけであり、`lastMessages` の削減以外は大きな動作変更にはならない可能性が高い。

**確認方法:** パッケージ更新後に Mastra Studio で Weather Agent と複数回会話し、メモリの動作が期待通りか確認する。

#### 9. DB マイグレーションの可能性

`@mastra/core` v1.13.0 以降で以下のDB構造変更がある:
- `runtimeContext` → `requestContext` カラム名変更
- spans テーブルに `(traceId, spanId)` 一意制約追加

**このプロジェクトへの影響:** Turso（LibSQL）に既存データがある場合、マイグレーションが必要になる可能性がある。開発環境であれば DB を再作成することで対応可能。

#### 10. Mastra CLI（`mastra` パッケージ）の更新影響

`npm run dev`（`mastra dev`）と `npm run build`（`mastra build`）は Mastra CLI を使用する。CLI のバージョンが 1.3.5 → 1.3.15 に変わるため、dev サーバーやビルドプロセスに変更がある可能性がある。ステップ 4 の動作確認で問題がないか確認する。

### Vitest 4.0.18 → 4.1.1

**破壊的変更なし。** 新機能の追加のみ（`aroundEach`/`aroundAll` フック、タグ機能等）。

### Biome 2.4.4 → 2.4.9, Ultracite 7.2.4 → 7.3.2

パッチ/マイナー更新。新しいリントルールが追加されている可能性がある。更新後に `npm run format` → `npm run lint` で確認する。

---

## 実装手順

### ステップ 1: 事前準備

#### 1-1. 現在のテスト・ビルドが通ることを確認

パッケージ更新前に、現在の状態が正常であることを確認する。

```bash
npm run test
npm run build
```

これが通らない場合は、パッケージ更新の前に修正が必要。

#### 1-2. 作業開始前のコミット確認

未コミットの変更がないことを確認する。問題発生時にロールバックできるようにする。

```bash
git status
```

**ステップ 1 の完了基準:** `npm run test` と `npm run build` が共にエラーなしで完了すること。

### ステップ 2: TypeScript と開発ツールの更新

Mastra パッケージより先に TypeScript と開発ツールを更新する。TypeScript のメジャーバージョンアップにより `tsconfig.json` の修正が必要なため、先に対応して基盤を安定させる。

#### 2-1. devDependencies のパッケージ更新

```bash
npm install --save-dev typescript@6.0.2 vitest@4.1.1 @vitest/coverage-v8@4.1.1 @biomejs/biome@2.4.9 ultracite@7.3.2 @types/node@25.5.0 mastra@1.3.15
```

#### 2-2. `tsconfig.json` の修正

以下の変更を行う:

**変更前（現在のファイル内容）:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

**変更後:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

**変更のポイント:**
- `"types": ["node"]` を追加（TypeScript 6.0 で `types` のデフォルトが `[]` に変更されたため）
- `"rootDir": "./src"` を追加（TypeScript 6.0 で `rootDir` のデフォルトが変更されたため、明示設定で予期しない動作を防ぐ）
- `"esModuleInterop": true` を削除（TypeScript 6.0 で常に有効になったため冗長）

#### 2-3. ビルド確認

```bash
npx tsc --noEmit
```

型エラーが出た場合は、エラー内容に基づいて修正する。

#### 2-4. Formatter・Linter・テストの確認

```bash
npm run format
npm run lint
npm run test
```

エラーが出た場合は修正する。Biome/Ultracite のバージョンアップで新しいリントルールが適用される可能性があるため、先に `npm run format` で自動修正を適用してから `npm run lint` を実行する。

**ステップ 2 の完了基準:** `npx tsc --noEmit`、`npm run format`、`npm run lint`、`npm run test` が全てエラーなしで完了すること。

#### 2-5. ステップ 2 完了時のコミット（推奨）

Mastra パッケージ更新で問題が発生した場合の切り分けを容易にするため、ここでコミットしておく。

```bash
# format で修正されたファイルがあればそれも含める
git add package.json package-lock.json tsconfig.json
git add -u  # format による変更があれば追加
git commit -m "#3 TypeScriptと開発ツールを最新バージョンに更新"
```

### ステップ 3: Mastra 関連パッケージの更新

#### 3-1. Mastra パッケージの一括更新

Mastra 公式ドキュメントの推奨に従い、全ての `@mastra` パッケージを同時に更新する。

```bash
npm install @mastra/core@1.16.0 @mastra/memory@1.10.0 @mastra/observability@1.5.1 @mastra/libsql@1.7.2 @mastra/loggers@1.0.3
```

**注意:** `@mastra/evals` は 1.1.2 で既に最新のため更新不要。ただし `@mastra/core` のメジャーアップデートにより `@mastra/evals` が要求する `@mastra/core` のバージョン範囲と合わなくなる可能性がある。次の 3-2 で確認する。

#### 3-2. 依存関係の整合性確認

```bash
npm ls 2>&1 | grep -i "ERR\|WARN\|peer\|invalid" || echo "依存関係に問題なし"
```

peer dependency の警告やエラーがある場合は内容を確認し、必要に応じてバージョンを調整する。

#### 3-3. TypeScript ビルド確認と型エラー修正

```bash
npx tsc --noEmit
```

型エラーが発生した場合、以下の手順で対応する:

**手順:**
1. エラーメッセージを確認する
2. 該当するパッケージの embedded docs で最新の型定義を確認する
3. 必要に応じて以下の方法で公式ドキュメントを確認する
   - **Context7 MCP の利用（推奨）:** `resolve-library-id` で `"@mastra/core"` を検索してライブラリ ID を取得し、`query-docs` で該当 API のドキュメントを取得する
   - **Mastra 公式サイト:** https://mastra.ai/llms.txt からドキュメント構造を把握し、各ページの URL に `.md` を付けて取得する（例: `https://mastra.ai/docs/agents/overview.md`）
4. コードを修正する

**embedded docs の参照方法:**

```bash
# 利用可能なドキュメントを確認
ls node_modules/@mastra/core/dist/docs/

# SOURCE_MAP.json で特定のエクスポートの型定義ファイルパスを検索
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"Agent"'
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"Mastra"'
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"createTool"'
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"createStep"'
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"createWorkflow"'
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"createScorer"'

# 型定義ファイルを読む（SOURCE_MAP.json の出力パスを使用）
cat node_modules/@mastra/core/dist/<SOURCE_MAP出力のパス>

# Memory の API 確認
cat node_modules/@mastra/memory/dist/docs/SOURCE_MAP.json | grep '"Memory"'

# Observability の API 確認
cat node_modules/@mastra/observability/dist/docs/SOURCE_MAP.json

# LibSQLStore の API 確認
cat node_modules/@mastra/libsql/dist/docs/SOURCE_MAP.json | grep '"LibSQLStore"'

# evals の確認
ls node_modules/@mastra/evals/dist/
ls node_modules/@mastra/core/dist/evals/
```

#### 3-4. 特に注意すべきファイルと確認ポイント

以下の表に、変更が必要になる可能性が高いファイルと確認ポイントをまとめる。

| ファイル | 確認ポイント | 現在の使用箇所 |
|---|---|---|
| `src/mastra/index.ts` | `Mastra` / `Observability` / `LibSQLStore` コンストラクタ | L21-52: Mastra インスタンス生成 |
| `src/mastra/agents/weather-agent.ts` | `Agent` / `Memory` コンストラクタ | L6-49: Agent 定義、L48: `new Memory()` 引数なし |
| `src/mastra/tools/weather-tool.ts` | `createTool` の `execute` コールバックの引数 | L38: `execute: async (inputData) => {...}` |
| `src/mastra/workflows/weather-workflow.ts` | `createStep` / `createWorkflow` のシグネチャ、`agent.stream()` の返り値、`.commit()` の呼び出し | L42: `execute: async ({ inputData }) => {...}`, L150: `agent.stream()`, L159: `response.textStream`, L182: `weatherWorkflow.commit()` |
| `src/mastra/scorers/weather-scorer.ts` | `createScorer` API、`@mastra/evals` インポートパス | L1-9: インポート文、L12-88: スコアラー定義 |

#### 各ファイルの現在のコード（参考）

**`src/mastra/index.ts` - Observability の使用箇所（L38-51）:**
```typescript
observability: new Observability({
  configs: {
    default: {
      serviceName: "mastra",
      exporters: [
        new DefaultExporter(),
        new CloudExporter(),
      ],
      spanOutputProcessors: [
        new SensitiveDataFilter(),
      ],
    },
  },
}),
```

**`src/mastra/agents/weather-agent.ts` - Memory の使用箇所（L48）:**
```typescript
memory: new Memory(),
```

**`src/mastra/workflows/weather-workflow.ts` - agent.stream() の使用箇所（L150-162）:**
```typescript
const response = await agent.stream([
  {
    role: "user",
    content: prompt,
  },
]);

let activitiesText = "";

for await (const chunk of response.textStream) {
  process.stdout.write(chunk);
  activitiesText += chunk;
}
```

**`src/mastra/scorers/weather-scorer.ts` - インポート文（L1-9）:**
```typescript
import { createScorer } from "@mastra/core/evals";
import {
  createCompletenessScorer,
  createToolCallAccuracyScorerCode,
} from "@mastra/evals/scorers/prebuilt";
import {
  getAssistantMessageFromRunOutput,
  getUserMessageFromRunInput,
} from "@mastra/evals/scorers/utils";
```

**`src/mastra/workflows/weather-workflow.ts` - ワークフロー定義と commit（L170-184）:**
```typescript
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  outputSchema: z.object({
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
```

**ステップ 3 の完了基準:** `npx tsc --noEmit` がエラーなしで完了し、`npm run test` が全テストパスすること。

### ステップ 4: 動作確認

#### 4-1. テスト実行

```bash
npm run test
```

テストが失敗した場合は、テストコードまたはソースコードを修正する。

#### 4-2. Mastra Studio での動作確認

動作確認に必要なサーバーは起動している前提で、以下を確認する。

```bash
npm run dev
```

Mastra Studio（http://localhost:4111）が正常に起動することを確認する。

以下の動作確認を行う:

1. **Weather Agent の動作確認**
   - Mastra Studio の Agents タブで `weather-agent` を選択
   - 「What's the weather in Tokyo?」のようなプロンプトを送信
   - 正常にレスポンスが返ることを確認
   - `weatherTool` が正しく呼び出されることを確認

2. **Weather Workflow の動作確認**
   - Mastra Studio の Workflows タブで `weather-workflow` を選択
   - `{ "city": "Tokyo" }` のような入力で実行
   - `fetch-weather` ステップで天気予報が取得できることを確認
   - `plan-activities` ステップでアクティビティ提案が生成されることを確認

3. **Scorers の確認**
   - Studio で Scorers が正常に登録されていることを確認

#### 4-3. chrome-devtools MCP を使った動作確認

Mastra Studio をブラウザで開いた状態で、chrome-devtools MCP を使用してブラウザコンソールにエラーが出ていないことを確認する。

**ステップ 4 の完了基準:** Weather Agent と Weather Workflow が正常動作し、Scorers が登録されていること。ブラウザコンソールにエラーがないこと。

### ステップ 5: 品質管理

AGENTS.md に記載の品質管理手順を順番に実施する。**1つでも異常終了した場合は、問題点を修正してエラーが出なくなるまで修正を繰り返す。**

```bash
# 1. Formatter の適用
npm run format

# 2. Linter エラーがないことを確認
npm run lint

# 3. テストコードの実行
npm run test

# 4. ビルドが正常終了することを確認
npm run build
```

**ステップ 5 の完了基準:** 上記 4 コマンドが全てエラーなしで完了すること。

---

## コミット戦略

実装の区切りごとにコミットする。コミットメッセージには `#3` を含める（AGENTS.md のルールに従う）。

| タイミング | コミットメッセージ例 |
|---|---|
| ステップ 2 完了後 | `#3 TypeScriptと開発ツールを最新バージョンに更新` |
| ステップ 3 完了後（ソース修正含む） | `#3 Mastra関連パッケージを最新バージョンに更新` |

ステップ 3 でソースコードの修正が大量になった場合は、修正内容ごとにさらに細かくコミットしてもよい。

---

## トラブルシューティング

### npm install で依存関係の競合が発生する場合

`node_modules` を削除してクリーンインストールを試す。

```bash
rm -rf node_modules package-lock.json
npm install
```

その後、改めて各パッケージを指定バージョンでインストールする。

### `@mastra/evals` と `@mastra/core` のバージョン不整合が発生する場合

`@mastra/evals 1.1.2` が `@mastra/core 1.16.0` と互換性がない場合、peer dependency エラーが発生する可能性がある。

```bash
# @mastra/evals が要求する @mastra/core のバージョン範囲を確認
npm info @mastra/evals@1.1.2 peerDependencies
```

互換性がない場合は、`@mastra/evals` も最新バージョンに更新する:
```bash
npm install @mastra/evals@latest
```

### Memory コンストラクタが変更されている場合

`src/mastra/agents/weather-agent.ts:48` で `new Memory()` を引数なしで呼び出している。更新後に型エラーが発生した場合:

```bash
cat node_modules/@mastra/memory/dist/docs/SOURCE_MAP.json | grep '"Memory"'
# 出力されたパスの型定義ファイルを読んで、コンストラクタの必須引数を確認する
```

なお、型エラーが発生しなくても、デフォルト値の変更（スコープ、lastMessages 等）により動作が変わっている可能性がある。必要に応じて明示的にオプションを指定する:

```typescript
// デフォルト値変更を考慮した明示的設定の例
memory: new Memory({
  options: {
    lastMessages: 40,  // 旧デフォルト値を維持する場合
  },
}),
```

### Observability クラスのコンストラクタが変更されている場合

`src/mastra/index.ts:38-51` で `Observability` を使用している。v1.13.0 で `ObservabilityBus` のコンストラクタが変更されたが、`Observability` ラッパークラスにも影響がある可能性がある。

```bash
cat node_modules/@mastra/observability/dist/docs/SOURCE_MAP.json
# Observability, DefaultExporter, CloudExporter, SensitiveDataFilter の型定義を確認
```

### agent.stream() の返り値が変更されている場合

`src/mastra/workflows/weather-workflow.ts:150-162` で `agent.stream()` を使用している。AI SDK v4→v5 移行で返り値の型が変わっている可能性がある。特に `textStream` プロパティの有無を確認する。

```bash
cat node_modules/@mastra/core/dist/docs/SOURCE_MAP.json | grep '"Agent"'
# Agent クラスの stream メソッドの返り値型を確認
```

`textStream` が廃止されている場合は、Mastra 公式ドキュメントで新しいストリーミング API を確認する:
- https://mastra.ai/docs/agents/overview.md
- https://mastra.ai/guides/migrations/vnext-to-standard-apis.md

### @mastra/evals のインポートパスが変更されている場合

`src/mastra/scorers/weather-scorer.ts` で以下のインポートを使用している:
- `@mastra/core/evals` → `createScorer`
- `@mastra/evals/scorers/prebuilt` → `createCompletenessScorer`, `createToolCallAccuracyScorerCode`
- `@mastra/evals/scorers/utils` → `getAssistantMessageFromRunOutput`, `getUserMessageFromRunInput`

インポートパスの存在確認:
```bash
ls node_modules/@mastra/evals/dist/scorers/
ls node_modules/@mastra/core/dist/evals/
```

### Biome/Ultracite の新しいリントルールでエラーが出る場合

```bash
npm run format
```

を実行して自動修正を試みる。自動修正できないルールについては、エラーメッセージを確認してコードを手動修正する。

---

## ロールバック計画

パッケージ更新で重大な問題が発生し、修正が困難な場合のロールバック手順:

```bash
# 変更を全て元に戻す
git checkout -- .
rm -rf node_modules
npm install
```

ステップ 2 と ステップ 3 を分けて実施するのは、問題発生時の切り分けを容易にするため。ステップ 2 の完了時点でコミットしておくことで、ステップ 3 での問題発生時に TypeScript/ツール更新部分はロールバック不要にできる。

---

## 影響範囲

### 変更対象ファイル（確定）

| ファイル | 変更内容 |
|---|---|
| `package.json` | 更新対象パッケージのバージョン更新 |
| `package-lock.json` | `npm install` で自動更新 |
| `tsconfig.json` | `types: ["node"]` の追加、`rootDir: "./src"` の追加、`esModuleInterop` の削除 |

### 変更対象ファイル（パッケージ更新後の型エラー・動作確認により判明）

| ファイル | 変更が必要になる可能性 |
|---|---|
| `src/mastra/index.ts` | `Observability` コンストラクタの変更への対応 |
| `src/mastra/agents/weather-agent.ts` | `Memory` コンストラクタの変更への対応 |
| `src/mastra/tools/weather-tool.ts` | `createTool` の `execute` シグネチャの変更への対応 |
| `src/mastra/workflows/weather-workflow.ts` | `agent.stream()` 返り値の変更、`createStep` / `createWorkflow` シグネチャの変更への対応 |
| `src/mastra/scorers/weather-scorer.ts` | インポートパスの変更、`createScorer` API の変更への対応 |

### 変更不要のファイル

| ファイル | 理由 |
|---|---|
| `src/lib/turso/turso-config.ts` | Mastra API を使用していない純粋な設定取得関数 |
| `src/features/sample/calculation/add.ts` | 外部依存なし |
| `src/features/sample/calculation/__tests__/add/add.test.ts` | Vitest 4.1 に破壊的変更なし |
| `vitest.config.mts` | Vitest 4.1 の設定に非互換なし |
| `vitest.setup.mts` | 空ファイル |
| `biome.jsonc` | Biome 設定の非互換なし |
