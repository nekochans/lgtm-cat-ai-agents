# AGENTS.md

This document provides guidance for AI coding agents working in this repository.

## 他のファイルへの参照

**以下のように @<path> の形式で書かれている場合は別のファイルへの参照になりますので、対象ファイルを探して内容を確認してください。**

**以下に記載例を示します。**

@src/mastra/index.ts（src/mastra/index.ts を参照）
@docs/basic-coding-guidelines.md （docs/basic-coding-guidelines.md を参照）

## CRITICAL: Mastra Skill Required

**BEFORE doing ANYTHING with Mastra code or answering Mastra questions, load the Mastra skill FIRST.**

See [Mastra Skills section](#mastra-skills) for loading instructions.

## Project Overview

This is a **Mastra** project written in TypeScript. Mastra is a framework for building AI-powered applications and agents with a modern TypeScript stack.

## Commands

Use these commands to interact with the project.

### Installation

```bash
npm install
```

### Development

Start the Mastra Studio at localhost:4111 by running the `dev` script:

```bash
npm run dev
```

### Build

In order to build a production-ready server, run the `build` script:

```bash
npm run build
```

## Mastra Skills

Skills are modular capabilities that extend agent functionalities. They provide pre-built tools, integrations, and workflows that agents can leverage to accomplish tasks more effectively.

This project has skills installed for the following agents:

- Claude Code
- Codex

### Loading Skills

1. **Load the Mastra skill FIRST** - Use `/mastra` command or Skill tool
2. **Never rely on cached knowledge** - Mastra APIs change frequently between versions
3. **Always verify against current docs** - The skill provides up-to-date documentation

**Why this matters:** Your training data about Mastra is likely outdated. Constructor signatures, APIs, and patterns change rapidly. Loading the skill ensures you use current, correct APIs.

Skills are automatically available to agents in your project once installed. Agents can access and use these skills without additional configuration.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Mastra .well-known skills discovery](https://mastra.ai/.well-known/skills/index.json)

## 関連ドキュメント

### **重要: 基本的なコーディングガイドライン**

必ず以下のドキュメントを参照してから開発を開始してください:

@docs/basic-coding-guidelines.md

### **プロジェクト固有のコーディングガイドライン**

プロジェクト固有のコーディング規約とベストプラクティスについては以下に記載してありますので必ず見てください:

@docs/project-coding-guidelines.md

### **src/ ディレクトリ構成ルール**

`src/` 配下のディレクトリ構成と各レイヤーの責務・依存関係については以下を参照してください:

@src/AGENTS.md
@src/mastra/AGENTS.md
@src/features/AGENTS.md

## 品質管理

全ての開発タスク完了時に、以下の手順を順番に実施してください。1つでも異常終了した場合は、問題点を修正してエラーが出なくなるまで修正を繰り返してください。

1. `npm run format` — Formatterの適用
2. `npm run lint` — Linterエラーがないことを確認
3. `npm run test` — テストコードの実行
4. `npm run build` — ビルドが正常終了することを確認

## GitとGitHubワークフロールール

### GitHubの利用ルール

`gh` コマンドを利用してGitHubへのPRを作成する事が可能です。

許可されている操作は以下の通りです。

- GitHubへのPRの作成
- GitHubへのPRへのコメントの追加
- GitHub Issueの新規作成
- GitHub Issueへのコメントの追加

**以下の操作はユーザーの許可があれば可能です。**

- Gitへのコミット
- GitHubへのプッシュ

### コミットメッセージの作成ルール

- 対応issueがある場合は、コミットメッセージに `#<issue番号>` を記載します

### PR作成ルール

- ブランチはユーザーが作成しますので現在のブランチをそのまま利用します
- PRのタイトルは日本語で入力します
- PRの作成先は特別な指示がない場合は `main` ブランチになります
- PRの説明欄は @.github/PULL_REQUEST_TEMPLATE.md を参考に入力します
- 対応issueがある場合は、PRの説明欄に `#<issue番号>` を記載します
- Issue番号は現在のブランチ名から取得出来ます、例えば `feature/issue7/add-docs` の場合は `7` がIssue番号になります
- PRの説明欄には主に以下の情報を含めてください

#### PRの説明欄に含めるべき情報

- 変更内容の詳細説明よりも、なぜその変更が必要なのかを重視
- 他に影響を受ける機能やAPIエンドポイントがあれば明記

#### 以下の情報はPRの説明欄に記載する事を禁止する

- 1つのissueで1つのPRとは限らないので `fix #issue番号` や `close #issue番号` のようなコメントは禁止します
- 全てのテストをパス、Linter、型チェックを通過などのコメント（テストやCIが通過しているのは当たり前でわざわざ書くべき事ではない）
