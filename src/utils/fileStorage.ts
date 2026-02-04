import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class FileStorage {
    private uploadDir: string;

    constructor(uploadDir: string = 'uploads') {
        this.uploadDir = path.join(process.cwd(), uploadDir);
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            if (!fs.existsSync(this.uploadDir)) {
                await mkdir(this.uploadDir, { recursive: true });
            }

            // Create subdirectories
            const subdirs = ['avatars', 'receipts', 'documents'];
            for (const subdir of subdirs) {
                const subdirPath = path.join(this.uploadDir, subdir);
                if (!fs.existsSync(subdirPath)) {
                    await mkdir(subdirPath, { recursive: true });
                }
            }
        } catch (error) {
            console.error('Error creating upload directories:', error);
        }
    }

    /**
     * Generate a unique filename
     */
    private generateFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const hash = crypto.randomBytes(16).toString('hex');
        return `${Date.now()}-${hash}${ext}`;
    }

    /**
     * Save a file from buffer
     */
    async saveFile(
        buffer: Buffer,
        originalName: string,
        category: 'avatars' | 'receipts' | 'documents' = 'documents'
    ): Promise<string> {
        const fileName = this.generateFileName(originalName);
        const filePath = path.join(this.uploadDir, category, fileName);

        await writeFile(filePath, buffer);

        // Return relative path for URL storage
        return `/${category}/${fileName}`;
    }

    /**
     * Save a base64 image
     */
    async saveBase64Image(
        base64Data: string,
        category: 'avatars' | 'receipts' | 'documents' = 'avatars'
    ): Promise<string> {
        // Remove data URL prefix if present
        const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');

        const fileName = this.generateFileName('image.png');
        const filePath = path.join(this.uploadDir, category, fileName);

        await writeFile(filePath, buffer);

        return `/${category}/${fileName}`;
    }

    /**
     * Get file path
     */
    getFilePath(relativePath: string): string {
        return path.join(this.uploadDir, relativePath);
    }

    /**
     * Delete a file
     */
    async deleteFile(relativePath: string): Promise<boolean> {
        try {
            const filePath = path.join(this.uploadDir, relativePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Generate a realistic avatar using DiceBear API
     * Uses various styles for diversity
     */
    generateAvatarUrl(firstName: string, lastName: string, gender?: string): string {
        const seed = `${firstName}-${lastName}`;

        // Different avatar styles for variety
        // avataaars: cartoon-style avatars
        // bottts: robot avatars
        // personas: human-like avatars
        // initials: simple initials
        // adventurer: illustrated avatars
        const styles = ['avataaars', 'personas', 'adventurer', 'big-smile', 'lorelei'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];

        // DiceBear API format: https://api.dicebear.com/7.x/{style}/svg?seed={seed}
        return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
}

export const fileStorage = new FileStorage();
