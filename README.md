# BeRP Rewrite (bedrock-protocol)

A Bedrock Realms/Server bridge rebuilt on top of bedrock-protocol. Uses offline mode by default so you can connect without a Bedrock/Xbox entitlement. Target protocol: 1.21.93 (bedrock-protocol 3.52.0).

## Quick start
1) Install deps: `npm install`
2) Build: `npm run build`
3) Run: `npm start` (or `npm run dev` for ts-node)

## Connecting
- Direct server: `connect <host> <port>` (e.g., `connect play.example.net 19132`)
- List connections: `connections`
- Disconnect: `disconnect <id>` or `kill <id>`
- Help: `help`
- Accounts: `account add` (only used for display name in offline mode), `account list`, `account remove <username>`

i'll finish this readme soon
