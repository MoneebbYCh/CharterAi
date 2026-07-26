import * as vscode from 'vscode'
import { BRAND_NAME } from './brand'

const SECRET_KEY = 'charterAi.apiKey'
const LEGACY_SECRET_KEY = 'reqGathSys.apiKey'

export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const key = await context.secrets.get(SECRET_KEY)
  if (key) return key
  const legacy = await context.secrets.get(LEGACY_SECRET_KEY)
  if (legacy) {
    await context.secrets.store(SECRET_KEY, legacy)
    return legacy
  }
  return undefined
}

export async function setApiKey(context: vscode.ExtensionContext, key: string): Promise<void> {
  await context.secrets.store(SECRET_KEY, key)
}

export async function clearApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_KEY)
  await context.secrets.delete(LEGACY_SECRET_KEY)
}

export async function promptForApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const existing = await getApiKey(context)
  const value = await vscode.window.showInputBox({
    title: `${BRAND_NAME}: Configure API Key`,
    prompt: 'Enter your DeepSeek / Kimi / OpenAI-compatible API key',
    password: true,
    placeHolder: 'sk-...',
    value: existing ? '••••••••' : undefined,
    ignoreFocusOut: true,
  })

  if (value === undefined) return undefined
  if (!value || value === '••••••••') return existing

  await setApiKey(context, value.trim())
  vscode.window.showInformationMessage(`${BRAND_NAME} API key saved securely.`)
  return value.trim()
}

export async function ensureApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const key = await getApiKey(context)
  if (key) return key
  return promptForApiKey(context)
}
