import type { AiProvider } from './types'
import { MockAiProvider } from './mockProvider'

const instances = new Map<string, AiProvider>()

export function createAiProvider(type: 'mock' | 'openai' | 'nim'): AiProvider {
  if (type !== 'mock') {
    throw new Error(`Provider '${type}' not yet implemented`)
  }
  if (!instances.has(type)) {
    instances.set(type, new MockAiProvider())
  }
  return instances.get(type)!
}