import workerpool from 'workerpool';
import argon2 from 'argon2';

// Worker functions
async function hashPassword(password: string): Promise<string> {
    try {
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 19456,  // 19 MB - OWASP recommended
            timeCost: 2,         // 2 iterations
            parallelism: 1
        });
    } catch (error) {
        console.error('❌ Hash error in worker:', error);
        throw error;
    }
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error('❌ Verify error in worker:', error);
        return false;
    }
}

// Register worker functions
workerpool.worker({
    hashPassword,
    verifyPassword
});