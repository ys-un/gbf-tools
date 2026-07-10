# Firebase 初回設定

## 1. Googleログインの許可ドメイン

Firebase Consoleで次の順に開きます。

1. 「構築」→「Authentication」
2. 「設定」タブ
3. 「承認済みドメイン」
4. 「ドメインを追加」
5. `ys-un.github.io` を追加

独自ドメインへ変更した場合は、そのドメインも追加してください。

## 2. Firestore セキュリティルール

Firebase Consoleで次の順に開きます。

1. 「構築」→「Firestore Database」
2. 「ルール」タブ
3. このフォルダの `firestore.rules` の内容へ全文置換
4. 「公開」を押す

このルールにより、ログインした利用者は自分自身のデータだけ読み書きできます。

## 3. GitHubへアップロード

このフォルダの中身を、GitHubリポジトリ `gbf-tools` のルートへアップロードしてください。

主な追加・変更ファイル：

- `assets/js/firebase.js`
- `assets/js/stone.js`
- `assets/js/meat.js`
- `assets/js/speed.js`
- `assets/js/efficiency.js`
- `assets/css/style.css`
- 各HTMLファイル
- `firestore.rules`

## 保存の動作

- 未ログイン：従来どおり各ブラウザの localStorage に保存
- ログイン中：localStorage と Firestore の両方に保存
- 初回ログイン時にクラウドデータが空なら、その端末の入力値をクラウドへ登録
- クラウドデータが既にある場合は、クラウド側の値を画面へ反映
