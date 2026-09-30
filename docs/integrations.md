# Connecting mcp.gholl.com to agent frameworks

`mcp.gholl.com` speaks the **Model Context Protocol** over **Streamable HTTP** and
returns **MCP Apps** UI resources (`text/html;profile=mcp-app`). Point any
MCP-capable client at:

```
https://mcp.gholl.com/mcp
```

Discovery document: `https://mcp.gholl.com/.well-known/mcp.json`
Agent-readable index: `https://mcp.gholl.com/llms.txt`

> A legacy alias is available at `https://mcp.gholl.com/mcp/sse`. It accepts the
> same Streamable HTTP requests.

---

## Claude Desktop / Claude Code

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gholl": {
      "type": "http",
      "url": "https://mcp.gholl.com/mcp"
    }
  }
}
```

Or with the CLI:

```bash
claude mcp add --transport http gholl https://mcp.gholl.com/mcp
```

## Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gholl": { "url": "https://mcp.gholl.com/mcp" }
  }
}
```

## VS Code (GitHub Copilot)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "gholl": { "type": "http", "url": "https://mcp.gholl.com/mcp" }
  }
}
```

## LibreChat

`librechat.yaml`:

```yaml
mcpServers:
  gholl:
    type: streamable-http
    url: https://mcp.gholl.com/mcp
```

## Cline / Continue / other HTTP MCP clients

Use transport `streamable-http` (or `http`) with URL
`https://mcp.gholl.com/mcp`. No authentication is required.

## Dify

1. Install / enable an MCP client tool plugin in your Dify workspace.
2. Add a remote MCP server with URL `https://mcp.gholl.com/mcp`
   (transport: Streamable HTTP / SSE).
3. Authorize the tools you want the agent to use.

## FastGPT

Create an app → **Tool Call** → add an external MCP server:

```
URL:    https://mcp.gholl.com/mcp
Method: Streamable HTTP
```

---

## Available tools

| id | What it does |
| --- | --- |
| `vram-calc` | Estimate LLM serving VRAM + GPU recommendations + vLLM/Ollama commands |
| `cron-debugger` | Explain cron expressions and test regular expressions |
| `schema-viewer` | Validate and summarize JSON / JSON-LD |
| `api-uptime` | Live probe + 24h latency/uptime for an endpoint |
| `chrono-energy` | BaZi four pillars + five-element analysis |

Each tool returns both a text/structured result (for non-UI clients) and a UI
resource that hosts may render as a sandboxed iframe.

## Agent framework tool-list submission

To register this server in a framework's directory, use the metadata in
[`server.json`](../server.json) and the [`.well-known/mcp.json`](https://mcp.gholl.com/.well-known/mcp.json)
document.
