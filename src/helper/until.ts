import * as bcrypt from 'bcrypt';
import { createCipheriv, randomBytes, scrypt, createDecipheriv } from 'crypto';
import { promisify } from 'util';

export const hashedPasswordHelper = async (password: string) => {
    try {
        return await bcrypt.hash(password, Number(process.env.SALT_ROUNDS_KEY));
    } catch (error) {

    }
}

export const comparePasswordHelper = async (password: string, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {

    }
}

export const encryptText = async (secret: string) => {
    const iv = randomBytes(16);
    const salt = randomBytes(16);
    const password = process.env.ENCRYPTION_PASSWORD;
    if (!password) {
        throw new Error('ENCRYPTION_PASSWORD is not defined in environment variables');
    }
    
    const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(secret, 'utf8'),
        cipher.final()
    ]);
    return { iv, salt, encrypted };
}

export const decryptText = async (iv: Buffer, salt: Buffer, encrypted: Buffer) => {
    const password = process.env.ENCRYPTION_PASSWORD;
    if (!password) {
        throw new Error('ENCRYPTION_PASSWORD is not defined in environment variables');
    }
    const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-ctr', key, iv);

    const decryptedText = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decryptedText.toString('utf8');
};

