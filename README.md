# BeRP Rewrite (bedrock-protocol)

A Bedrock Realms/Server bridge rebuilt on top of `bedrock-protocol` (Prismarine). It currently runs in **offline mode** (no Xbox/Minecraft entitlement required). Target protocol: **Bedrock 1.21.93** (`bedrock-protocol@3.52.0`). Online-auth servers will reject offline clients.

## Requirements
- Node.js 18+ (tested on Node 22)
- Windows/macOS/Linux
- (Optional) A Bedrock/Xbox account only if you need to join servers that enforce Xbox auth

## Install & Run
```
npm install
npm run build
npm start           # runs dist/index.js
# or
npm run dev         # ts-node for development
```

## Quick Usage
From the BeRP console:
- Connect direct: `connect <host> <port>` (e.g., `connect play.example.net 19132`)
- List connections: `connections`
- Disconnect: `disconnect <id>` or `kill <id>`
- Show help: `help`
- Accounts (used for display name in offline mode): `account add`, `account list`, `account remove <username>`

## Local Offline Test (no Xbox auth)
Run a local offline server in a separate terminal (from project root):
```
node -e "const bedrock=require('bedrock-protocol');const s=bedrock.createServer({host:'0.0.0.0',port:19132,version:'1.21.93',offline:true});s.on('connect',c=>{console.log('client connecting');c.on('join',()=>console.log('client joined'));});"
```
Then in BeRP:
```
connect 127.0.0.1 19132
```
You should see `client connecting / client joined` in the server terminal.

## Versioning & Compatibility
- Advertised version: `1.21.93` (`CUR_VERSION` in `src/Constants.ts`, protocol `819`).
- `bedrock-protocol@3.52.0` ships data through 1.21.93. 1.21.131 is not yet available upstream; to upgrade later:
  1) `npm i bedrock-protocol@latest`
  2) Update `CUR_VERSION`/protocol in `src/Constants.ts`
  3) `npm run build` and restart
- Offline mode is enabled. Servers requiring Xbox auth will kick with “Please log into Xbox” or similar.

## Project Layout (high level)
- `src/berp/network/ConnectionHandler.ts` — bedrock-protocol client wrapper (offline mode, event forwarding)
- `src/console/commands/*.ts` — CLI commands (`connect`, `disconnect`, `account`, etc.)
- `src/Constants.ts` — protocol/version constants, Realms endpoints
- `src/berp/plugin/pluginapi/*` — plugin surface (players, events, sockets)
- `src/types/*.ts` — packet and API type declarations

## Common Commands (CLI)
- `account add` — link an account (for display name only in offline mode)
- `connect <host> <port>` — join a server directly
- `connections` — list active connections
- `disconnect <id>` / `kill <id>` — drop a connection
- `plugins` — list plugins (folder is `plugins/`)
- `help` — list commands

## Limitations / Gotchas
- Offline mode cannot join servers that enforce Xbox/Minecraft authentication.
- Protocol limited to 1.21.93 until bedrock-protocol ships newer data.
- Legacy protodef compilers remain for compatibility; the active network path uses bedrock-protocol.

## Scripts
- `npm run build` — compile TypeScript to `dist/`
- `npm run dev` — run via ts-node (development)
- `npm start` — run compiled output (`dist/index.js`)

## Contributing
- Ensure `npm run build` passes before PRs.
- Keep `CUR_VERSION` in sync with the installed `bedrock-protocol` version.
- For auth-enabled support later, flip `offline: true` to `offline: false` in `ConnectionHandler` and use an entitled account.
