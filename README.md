# バーコードスキャン WTP調査アプリ

iPhone/iPadのカメラでバーコード（JANコード）を読み取り、支払意思額（WTP）を記録するWebアプリケーションです。

## 機能

- 📷 カメラによるバーコードスキャン（JANコード対応）
- 📦 商品名の自動表示（事前登録リストから）
- 🖼️ 商品画像の自動表示（NEW!）
- 💰 支払意思額（WTP）の入力・記録
- 📊 記録データの一覧表示
- 💾 CSV形式でのデータダウンロード
- 📱 iPhone/iPad Safari対応

## 技術スタック

- HTML5
- CSS3
- JavaScript（Vanilla）
- html5-qrcode.js ライブラリ

## ローカルでの起動方法

1. このリポジトリをクローン
2. HTTPSサーバーで起動（カメラアクセスにHTTPS必須）

```bash
# Python使用の場合
python -m http.server 5000

# Node.js使用の場合  
npx http-server -p 5000
```

3. ブラウザで `https://localhost:5000` にアクセス

## GitHub Pagesへのデプロイ

1. GitHubリポジトリの Settings > Pages に移動
2. Source で "Deploy from a branch" を選択
3. Branch で "main" ブランチと "/ (root)" を選択
4. Save をクリック
5. 数分後、提供されたURLでアプリにアクセス可能

## 使用方法

1. 「📷 スキャン開始」ボタンをタップ
2. カメラ許可を求められたら「許可」を選択
3. バーコードをカメラに向ける
4. 商品情報が表示されたら、支払意思額を入力
5. 「✅ 送信」ボタンで記録
6. 「💾 CSVダウンロード」で記録データを保存

## 商品データの追加

`app.js` の `productDatabase` オブジェクトに商品を追加できます：

```javascript
const productDatabase = {
    "バーコード番号": {
        name: "商品名",
        image: "画像URL"
    },
    "4901777018686": {
        name: "ポカリスエット 500ml",
        image: "https://via.placeholder.com/300x300/4A90E2/ffffff?text=ポカリスエット"
    },
    // 追加の商品...
};
```

**画像URLについて**:
- 実際の商品画像URLを使用することを推奨
- プレースホルダー画像サービス（https://via.placeholder.com/）も利用可能
- 未登録商品の場合は自動的にプレースホルダー画像が表示されます

## データ形式

CSVファイルには以下の情報が記録されます：

- タイムスタンプ
- バーコード番号
- 商品名
- WTP金額（円）

## 注意事項

- カメラ機能を使用するため、HTTPS環境が必須です
- Safari（iOS）での動作を確認済み
- データはブラウザのローカルストレージに保存されます
- ブラウザキャッシュをクリアするとデータが消えるため、定期的にCSVをダウンロードしてください

## ライセンス

MIT License
