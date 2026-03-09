# CLAUDE.md - Claude Code 開発ガイドライン

このファイルはClaude Codeがこのリポジトリで作業する際の指針です。

## プロジェクト概要

QuestLogic 子ども向けモバイルアプリのフロントエンドプロトタイプ。
React Native (Expo) で構築されたiOS/Android対応アプリ。

## 技術スタック

- **フレームワーク**: Expo ~54 / React Native 0.81
- **言語**: TypeScript
- **ナビゲーション**: React Navigation (Bottom Tabs)
- **ストレージ**: AsyncStorage / expo-secure-store
- **HTTP**: axios
- **音声**: expo-av
- **フォント**: @expo-google-fonts/dotgothic16

## プロジェクト構造

```
src/
  api/          # APIクライアント・エンドポイント定義
  components/   # 再利用可能なUIコンポーネント
  context/      # React Context (状態管理)
  navigation/   # ナビゲーション設定
  screens/      # 画面コンポーネント
  types/        # TypeScript型定義
  utils/        # ユーティリティ関数
```

## 開発コマンド

```bash
npm start          # Expo開発サーバー起動
npm run ios        # iOSシミュレーターで起動
npm run android    # Androidエミュレーターで起動
```

## コーディング規約

- TypeScriptを使用し、型定義を明示する
- コンポーネントは関数コンポーネント + Hooksで実装
- スタイルは StyleSheet.create() を使用
- 画面コンポーネントは `src/screens/` に配置
- 共通コンポーネントは `src/components/` に配置

## 注意事項

- `back_to_front.md` はAPI仕様書（.gitignore対象）
- `.claude/` は個人設定のため .gitignore 対象（チームに共有しない）
- 環境変数は `.env` に記述（.gitignore対象）
