const STORAGE_PREFIX = 'huntboard-'
const STORAGE_VERSION = 1

interface Migration<T> {
  fromVersion: number
  migrate: (old: unknown) => T
}

interface VersionedData<T> {
  version: number
  data: T
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e)
  }
}

/** Load data with versioned key (e.g. huntboard-agent-v1) and run migrations */
export function loadVersioned<T>(key: string, version: number, migrations: Migration<T>[], fallback: T): T {
  const versionedKey = `${key}-v${version}`
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${versionedKey}`)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as VersionedData<T>
      if (parsed.version === version) return parsed.data
      // If version mismatch, run migrations from stored version
      return migrateData(parsed.data, parsed.version, version, migrations, fallback, key)
    }
    // Try unversioned key (legacy)
    const legacyRaw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (legacyRaw !== null) {
      const legacyData = JSON.parse(legacyRaw)
      const migrated = migrateData(legacyData, 0, version, migrations, fallback, key)
      // Save migrated data with version
      saveToStorage(versionedKey, { version, data: migrated })
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      return migrated
    }
    return fallback
  } catch {
    return fallback
  }
}

function migrateData<T>(data: unknown, fromVersion: number, targetVersion: number, migrations: Migration<T>[], fallback: T, key: string): T {
  let current = data
  const applicable = migrations.filter((m) => m.fromVersion > fromVersion && m.fromVersion <= targetVersion)
    .sort((a, b) => a.fromVersion - b.fromVersion)
  for (const migration of applicable) {
    try {
      current = migration.migrate(current)
    } catch (e) {
      console.error(`Migration v${migration.fromVersion} failed for ${key}:`, e)
      return fallback
    }
  }
  return current as T
}

/** Write data with version suffix */
export function saveVersioned<T>(key: string, version: number, data: T): void {
  const versionedKey = `${key}-v${version}`
  const payload: VersionedData<T> = { version, data }
  saveToStorage(versionedKey, payload)
}

/** Export all app data as a JSON blob */
export function exportAllData(): string {
  const exportData: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        exportData[key] = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        exportData[key] = localStorage.getItem(key)
      }
    }
  }
  return JSON.stringify(exportData, null, 2)
}

/** Import app data from a JSON blob with validation */
export function importAllData(json: string): { success: boolean; keysImported: string[]; errors: string[] } {
  const keysImported: string[] = []
  const errors: string[] = []
  try {
    const data = JSON.parse(json) as Record<string, unknown>
    if (typeof data !== 'object' || data === null) {
      return { success: false, keysImported: [], errors: ['Invalid data format: expected JSON object'] }
    }
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(STORAGE_PREFIX)) {
        errors.push(`Skipped key "${key}": not a valid app key`)
        continue
      }
      try {
        localStorage.setItem(key, JSON.stringify(value))
        keysImported.push(key)
      } catch (e) {
        errors.push(`Failed to import "${key}": ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
    return { success: errors.length === 0, keysImported, errors }
  } catch (e) {
    return { success: false, keysImported: [], errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`] }
  }
}