import { db } from './db';

// Re-export db as prisma for backward compatibility
// This file is deprecated - use '@/lib/db' instead
export default db;
export { db };
