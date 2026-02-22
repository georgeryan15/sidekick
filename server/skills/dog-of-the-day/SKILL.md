---
name: dog-of-the-day
description: Returns today's featured dog
---

# Dog of the Day

Returns today's featured dog.

No authentication required.

## Usage

```bash
node {baseDir}/scripts/dog-cli.js get
node {baseDir}/scripts/dog-cli.js get --pretty
node {baseDir}/scripts/dog-cli.js help
```

## Commands

| Command | Description |
|---------|-------------|
| `get` | Fetch today's featured dog (default) |
| `help` | Show help message |

## Flags

| Flag | Description |
|------|-------------|
| `--pretty` | Pretty-print the JSON output |

## Response

```json
{
  "type": "dog",
  "name": "Buddy",
  "breed": "Golden Retriever",
  "age": 3,
  "description": "A friendly and energetic golden retriever who loves playing fetch and swimming."
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"dog"` |
| `name` | string | The dog's name |
| `breed` | string | The dog's breed |
| `age` | number | Age in years |
| `description` | string | Short description of the dog |
