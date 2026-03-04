import * as workerpool from 'workerpool';

// Create a worker pool
const pool = workerpool.pool({
    minWorkers: 2,
    maxWorkers: 4,
    workerType: 'thread'
});

// Define worker functions that import dependencies INSIDE with error handling
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        // Import argon2 INSIDE the function (worker context)
        const argon2Module = await import('argon2');
        const argon2 = argon2Module.default;
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error('Argon2 verification error:', error);
        return false;
    }
}

async function hashPassword(password: string): Promise<string> {
    try {
        // Import argon2 INSIDE the function (worker context)
        const argon2Module = await import('argon2');
        const argon2 = argon2Module.default;
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 19456,  // 19 MB - OWASP recommended
            timeCost: 2,         // 2 iterations
            parallelism: 1
        });
    } catch (error) {
        console.error('Argon2 hashing error:', error);
        throw new Error(`Password hashing failed: ${error.message}`);
    }
}

// Export wrapper functions
export const argon2Worker = {
    /**
     * Verify password against hash using worker thread
     */
    async verify(password: string, hash: string): Promise<boolean> {
        try {
            return await pool.exec(verifyPassword, [password, hash]);
        } catch (error) {
            console.error('Worker pool execution error:', error);
            // Fallback to direct execution if worker fails
            try {
                const argon2Module = await import('argon2');
                const argon2 = argon2Module.default;
                return await argon2.verify(hash, password);
            } catch (fallbackError) {
                console.error('Fallback verification failed:', fallbackError);
                return false;
            }
        }
    },

    /**
     * Hash password using worker thread
     */
    async hash(password: string): Promise<string> {
        try {
            return await pool.exec(hashPassword, [password]);
        } catch (error) {
            console.error('Worker pool execution error:', error);
            // Fallback to direct execution if worker fails
            try {
                const argon2Module = await import('argon2');
                const argon2 = argon2Module.default;
                return await argon2.hash(password, {
                    type: argon2.argon2id,
                    memoryCost: 19456,
                    timeCost: 2,
                    parallelism: 1
                });
            } catch (fallbackError) {
                console.error('Fallback hashing failed:', fallbackError);
                throw new Error('Password hashing failed');
            }
        }
    },

    /**
     * Terminate the worker pool (call during app shutdown)
     */
    async terminate(): Promise<void> {
        await pool.terminate();
        console.log('Worker pool terminated');
    }
};
