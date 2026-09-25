# Carga Certa

O **Carga Certa** é um aplicativo de treino feito com HTML, CSS e JavaScript/TypeScript no frontend. Ele não usa login, banco de dados ou servidor para guardar os treinos: cada aparelho salva os dados no próprio navegador usando `localStorage`.

## Abrir no VS Code

1. Instale o [Node.js](https://nodejs.org/) no computador, caso ainda não tenha.
2. Abra o VS Code.
3. Escolha **File > Open Folder** e selecione a pasta `carga-certa`.
4. Abra o terminal integrado do VS Code em **Terminal > New Terminal**.
5. Rode `pnpm install` (ou `npm install`, se preferir usar npm).
6. Rode `pnpm dev`.
7. Abra o endereço local mostrado no terminal, normalmente `http://localhost:3000`.

## Como usar

Na tela inicial, clique em **Registrar treino**, escolha o exercício e informe a carga, as repetições e o número de séries. O registro aparece imediatamente no painel, no histórico e na biblioteca de exercícios.

Em **Ajustes**, você pode colocar seu nome, uma frase de treino e uma foto. Também pode alternar entre tema claro e escuro.

## Backup

Como não existe banco de dados, cada pessoa terá os próprios registros no aparelho em que usar o aplicativo. Para proteger os dados, abra **Ajustes > Seus dados > Exportar backup** e guarde o arquivo `.json` em um local seguro. Se trocar de aparelho, use **Importar backup**.

Apagar os dados do navegador, limpar o armazenamento do aplicativo ou trocar de aparelho pode remover os registros que ainda não foram exportados.

## Publicar gratuitamente

Para compartilhar com os amigos, você pode publicar a pasta compilada em serviços de hospedagem estática como **Netlify**, **GitHub Pages** ou **Vercel**. Não é necessário contratar banco de dados. Depois de abrir o link no celular, use **Adicionar à tela inicial** ou **Instalar aplicativo**.

O projeto já inclui `manifest.json`, `icon.svg` e `sw.js` para funcionar como PWA e carregar o shell básico offline.

## Estrutura principal

- `client/src/pages/Home.tsx`: telas e lógica do aplicativo.
- `client/src/index.css`: identidade visual e responsividade.
- `client/public/manifest.json`: configuração de instalação.
- `client/public/sw.js`: cache básico para uso offline.
- `client/public/icon.svg`: ícone do aplicativo.
