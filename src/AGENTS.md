# src/ ディレクトリ構成ルール

`src/` 配下のディレクトリ構成と各レイヤーの責務・依存関係を定義します。

## ディレクトリ概要

| ディレクトリ / ファイル | 責務                                       |
| --- |------------------------------------------|
| `src/features/` | 機能単位のコード（詳細は @src/features/AGENTS.md 参照） |
| `src/types/` | **共通利用する**型定義（主にドメインオブジェクト）              |
| `src/lib/` | 外部ライブラリに依存した処理                           |
| `src/functions/` | **共通利用する**ビジネスロジック（原則として外部ライブラリ非依存）      |
| `src/constants/` | **共通利用する**定数                             |
| `src/utils/` | **共通利用する**汎用関数（ビジネスロジックを持たない）            |
| `src/mastra/` | Mastra 関連ファイル（詳細は @src/mastra/AGENTS.md ） |
| `src/scripts/` | ビルド・開発用スクリプト                             |

## features ディレクトリの概要

特定の機能に閉じたコードは `src/features/<機能名>/` 配下に配置します。

- トップレベルの共通ディレクトリと同じ構成を取れます
- 許可されるサブディレクトリ: `types/`, `functions/`, `constants/`
- `lib/` と `utils/` は features 配下には作りません（共通の `src/lib/`（抽象インターフェースパターンで間接的に利用する事）, `src/utils/` を利用してください）
- 詳細は @src/features/AGENTS.md を参照してください

## レイヤー依存関係

```text
src/mastra/          → 全レイヤーに依存可能
src/features/<機能>/  → 共通レイヤー (types, functions, constants, utils, lib（抽象インターフェースパターンで間接的に利用）) に依存可能
                        同一機能内の types, functions, constants に依存可能
                        他の機能への直接依存は禁止
src/functions/        → types, constants に依存可能（lib には原則非依存）
src/lib/              → types, constants に依存可能
src/utils/            → 他レイヤーに依存しない
src/constants/        → 他レイヤーに依存しない
src/types/            → 他レイヤーに依存しない
```

**矢印の逆方向への依存は禁止です。** 例えば `src/types/` から `src/functions/` を import することはできません。

## 各ディレクトリ / ファイルの詳細ルール

### `src/types/`

共通利用する型を定義します。主にドメインオブジェクトで利用する型を定義する場所です。

- **全てのレイヤーから利用される可能性があります**
- ビジネス上意味のある値には Branded Types を利用します（@docs/project-coding-guidelines.md 参照）
- **全ての型をここに定義する訳ではありません。** 特定の機能でしか使わない型は `src/features/<機能名>/types/` に定義してください
- ここに置くのは **複数箇所で共通利用される型** のみです

### `src/lib/`

特定の外部ライブラリに依存した処理を定義します。

- `src/functions/` から `src/lib/` の機能を利用する場合は、`src/types/` に抽象的なインターフェース型を定義し、`src/lib/` 側でその型に準拠する実装を提供します

```typescript
// src/types/upload/storage.ts に抽象インターフェースを定義
export type UploadToStorageFunc = (
  file: File,
  presignedPutUrl: string
) => Promise<UploadToStorageResult>;

// src/lib/ 側で型に準拠した実装を定義
import type { UploadToStorageFunc } from "@/types/upload/storage";

export const uploadToR2: UploadToStorageFunc = async (
  file: File,
  presignedPutUrl: string
): Promise<UploadToStorageResult> => {
  // 実装
};
```

### `src/functions/`

ビジネスロジックを実現する為の関数を格納します。

- **全てのレイヤーから利用される可能性があります**
- 原則として純粋な関数として定義し、テスト可能な構造にします
- **テストを必ず用意します**
- **原則として `src/lib/` には依存しません**（上記の抽象インターフェースパターンで間接的に利用します）

#### 例外的に依存を許可する外部ライブラリ

以下には直接依存しても構いません。ただし **必ずテストコードを用意して動作担保を行ってください。**

- **`zod`**: バリデーション処理のインフラとして広く利用されており、無理に抽象化するとコードが複雑になるため
- **複数の JavaScript ランタイムで共通して利用可能な標準 API**: Node.js、Bun、Cloudflare Workers 等のランタイムで共通のインターフェースを持つ API であれば依存して問題ありません。特定のランタイム固有の API には依存しないでください
  - 例: `fetch`, `URL`, `URLSearchParams`, `Request`, `Response`, `Headers`, `crypto`（Web Crypto API）, `TextEncoder`, `TextDecoder`, `AbortController`, `structuredClone`, `ReadableStream`, `Blob`, `FormData` 等

### `src/constants/`

共通利用する定数を格納します。

- **全てのレイヤーから利用される可能性があります**
- 少しでも値の加工や条件分岐を行っている場合は `src/functions/` に定義します

### `src/utils/`

ビジネスロジックを持たない汎用的な関数を定義します。

- **全てのレイヤーから利用される可能性があります**
- **この層にファイルを追加する際は、まず他のレイヤーに定義できないか十分な検討を行ってください**
- **この層に大量のファイルが増える場合、設計に問題がある可能性が高いです**

### `src/mastra/`

Mastra に関連するファイルが格納されます。

詳細は @src/mastra/AGENTS.md を参照してください。

- **全てのレイヤーのファイルに依存可能です**
- **ここにビジネスロジックは含めません。** 各レイヤーの関数やファイルを呼び出す形で実装します

### `src/scripts/`

ビルド・開発用のスクリプトが格納されます。
