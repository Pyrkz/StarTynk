import { createWebStorage } from '@repo/shared/storage'

/**
 * Example migration utility to move from localStorage to unified storage
 * This demonstrates how to migrate existing localStorage data to the new system
 */

interface MigrationConfig {
  key: string
  transform?: (data: any) => any
  validate?: (data: any) => boolean
}

/**
 * Migrate a single localStorage key to unified storage
 */
export async function migrateStorageKey<T>(
  config: MigrationConfig,
  defaultValue: T
): Promise<boolean> {
  const { key, transform, validate } = config

  try {
    // Check if data exists in localStorage
    const oldData = localStorage.getItem(key)
    if (!oldData) {
      return false // Nothing to migrate
    }

    // Parse the old data
    let parsedData = JSON.parse(oldData)

    // Transform if needed
    if (transform) {
      parsedData = transform(parsedData)
    }

    // Validate if provided
    if (validate && !validate(parsedData)) {
      console.warn(`Invalid data for key ${key}, skipping migration`)
      return false
    }

    // Create new storage instance
    const newStorage = createWebStorage<T>({
      key,
      defaultValue,
    })

    // Save to new storage
    await newStorage.set(parsedData)

    // Remove from localStorage after successful migration
    localStorage.removeItem(key)
    
    console.log(`Successfully migrated ${key} to unified storage`)
    return true
  } catch (error) {
    console.error(`Failed to migrate ${key}:`, error)
    return false
  }
}

/**
 * Batch migrate multiple keys
 */
export async function batchMigrateStorage(
  migrations: Array<{ config: MigrationConfig; defaultValue: any }>
): Promise<{ successful: string[]; failed: string[] }> {
  const results = {
    successful: [] as string[],
    failed: [] as string[],
  }

  for (const { config, defaultValue } of migrations) {
    const success = await migrateStorageKey(config, defaultValue)
    if (success) {
      results.successful.push(config.key)
    } else {
      results.failed.push(config.key)
    }
  }

  return results
}

/**
 * Example usage: Migrate common localStorage keys
 */
export async function migrateAppStorage() {
  const migrations = [
    {
      config: {
        key: 'user_theme',
        transform: (data: string) => ({ theme: data }), // Transform simple string to object
      },
      defaultValue: { theme: 'light' },
    },
    {
      config: {
        key: 'auth_token',
        validate: (data: any) => typeof data === 'string' && data.length > 0,
      },
      defaultValue: null,
    },
    {
      config: {
        key: 'user_settings',
        validate: (data: any) => typeof data === 'object' && data !== null,
      },
      defaultValue: {},
    },
  ]

  const results = await batchMigrateStorage(migrations)
  
  console.log('Migration completed:', {
    successful: results.successful.length,
    failed: results.failed.length,
  })

  return results
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(keys: string[]): boolean {
  return keys.some(key => localStorage.getItem(key) !== null)
}

/**
 * Example: Run migration on app initialization
 */
export async function initializeStorageMigration() {
  const keysToCheck = ['user_theme', 'auth_token', 'user_settings', 'header_recent_searches']
  
  if (isMigrationNeeded(keysToCheck)) {
    console.log('Storage migration needed, starting...')
    await migrateAppStorage()
  } else {
    console.log('No storage migration needed')
  }
}