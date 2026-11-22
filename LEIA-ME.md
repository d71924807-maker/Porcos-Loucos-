# Porcos Loucos: como colocar no ar e instalar

Este pacote é o jogo completo como app instalável (PWA). Ele funciona sem internet nos modos
"contra o robô" e "dois jogadores". Para o modo **online**, você precisa de um banco de dados
gratuito do Firebase (passo 1). Ao todo leva uns 10 minutos, tudo pelo navegador.

Arquivos:
- `index.html`: o jogo
- `config.js`: onde você cola o endereço do Firebase
- `manifest.webmanifest`, `sw.js`, `icon-*.png`: fazem o jogo ser instalável e abrir offline

---

## Passo 1. Criar o banco do modo online (Firebase, grátis)

1. Entre em https://console.firebase.google.com com uma conta Google.
2. Clique em **Criar um projeto**, dê um nome (ex.: `porcos-loucos`) e pode desativar o Google Analytics.
3. No menu da esquerda, abra **Build (Criação) → Realtime Database** e clique em **Criar banco de dados**.
   Escolha o local mais perto de você e, quando perguntar, o modo **bloqueado**.
4. Abra a aba **Regras**, apague tudo e cole isto, depois clique em **Publicar**:

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['s', 'rev'])",
        "s": { ".validate": "newData.isString() && newData.val().length < 4000" }
      }
    }
  }
}
```

   Essas regras só deixam o jogo ler e escrever as salas. Nada mais do banco fica aberto.
5. Abra a aba **Dados**. No topo aparece o endereço do banco, parecido com
   `https://porcos-loucos-default-rtdb.firebaseio.com` (em algumas regiões termina em
   `firebasedatabase.app`). Copie esse endereço inteiro.
6. Abra o arquivo `config.js` num editor de texto (o Bloco de Notas serve) e cole entre as aspas:

```js
window.PORCOS_CONFIG = {
  firebaseUrl: "https://porcos-loucos-default-rtdb.firebaseio.com"
};
```

---

## Passo 2. Colocar o jogo na internet (Netlify, grátis)

Opção mais fácil, sem criar repositório:

1. Entre em https://app.netlify.com/drop (crie uma conta grátis se pedir).
2. Arraste a **pasta inteira** do jogo (com o `config.js` já editado) para a área da página.
3. Em alguns segundos você recebe um endereço como `https://nome-aleatorio.netlify.app`.
   Em **Site configuration → Change site name** dá para trocar por algo como `porcos-loucos`.

Outras opções que funcionam igual: GitHub Pages ou Cloudflare Pages (o jogo é só arquivos estáticos).
O endereço precisa ser `https://` para a instalação funcionar, e todos esses serviços já são.

---

## Passo 3. Instalar no celular

- **Android (Chrome):** abra o endereço, toque no menu ⋮ e em **Instalar app** (ou **Adicionar à tela inicial**).
- **iPhone (Safari):** abra o endereço, toque em Compartilhar e em **Adicionar à Tela de Início**.
- **Computador (Chrome ou Edge):** clique no ícone de instalar na barra de endereço.

Depois de instalado, ele abre em tela cheia, com o ícone do porco, e funciona offline
(menos o modo online).

---

## Como jogar online

1. Cada jogador abre o app.
2. Toque em **Modo** até aparecer "online".
3. Um jogador toca em **Criar sala** e depois em **Convidar amigo** (manda um link) ou passa o código de 4 letras.
4. O amigo abre o link, ou digita o código e toca em **Entrar**.

---

## Bom saber

- No plano gratuito do Firebase o uso deste jogo fica muito abaixo dos limites.
- Qualquer pessoa com o código de uma sala pode entrar nela. O jogo é pensado para partidas entre amigos, sem login.
- Ao atualizar o jogo no futuro, troque o número em `sw.js` (`porcos-loucos-v2` para `v3`) para o celular baixar a versão nova.
- Se o online disser que não foi configurado, confira se o endereço está dentro das aspas em `config.js`
  e se você publicou as regras do passo 1.
