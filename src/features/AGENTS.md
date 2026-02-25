# src/features/ ディレクトリ構成ルール

`src/features/` は、特定の機能に閉じたコードを機能単位でまとめるディレクトリです。

## 目的と方針

- 特定の機能にしか使われないコードは `src/features/<機能名>/` 配下に配置します
- 複数の機能で共通利用されるコードはトップレベルの共通ディレクトリ（`src/types/`, `src/functions/` 等）に配置してください
- 機能の境界が曖昧な場合は、まず features に配置し、共通化の必要が生じた段階で共通レイヤーに移動してください

## サブディレクトリ構成

```
src/features/<機能名>/
├── types/        ← 機能固有の型定義
├── functions/    ← 機能固有のビジネスロジック
├── constants/    ← 機能固有の定数
└── __tests__/    ← テストファイル
```

### 各サブディレクトリのルール

各サブディレクトリは、対応するトップレベルの共通ディレクトリと同じルールに従います:

- `types/` → `src/types/` と同じルール
- `functions/` → `src/functions/` と同じルール（テスト必須等）
- `constants/` → `src/constants/` と同じルール

### 作成禁止のサブディレクトリ

以下のディレクトリは features 配下には作りません:

- **`lib/`** — 外部ライブラリに依存した処理は共通の `src/lib/` に配置してください
- **`utils/`** — 汎用関数は共通の `src/utils/` に配置してください

## 依存関係のルール

### 許可される依存

- 共通レイヤー: `src/types/`, `src/functions/`, `src/constants/`, `src/utils/`
- 同一機能内のサブディレクトリ間の依存（`types/`, `functions/`, `constants/` 等）

**`src/lib/` の機能を利用する際は @src/AGENTS.md に記載されている抽象インターフェースパターンで間接的に利用します。**

### 禁止される依存

- **他の機能への直接依存は禁止です。** `src/features/auth/` から `src/features/main/` を直接 import することはできません
- 複数の機能で共有したいコードが生じた場合は、共通レイヤー（`src/types/`, `src/functions/` 等）に移動してください

## テストファイルの配置

テストファイルは `@docs/project-coding-guidelines.md` に準拠して配置します。

```
src/features/<機能名>/<ソースディレクトリ>/__tests__/<ソースファイル名>/<関数名>.test.ts
```

例: `src/features/auth/functions/login.ts` 内に実装されている `passwordLogin` 関数のテスト

```
src/features/auth/functions/__tests__/login/password-login.test.ts
```
