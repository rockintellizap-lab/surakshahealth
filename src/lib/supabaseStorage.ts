import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'medical-reports';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export async function uploadReportFile(userId: string, file: File): Promise<UploadedFile> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Use PDF, JPG, or PNG.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File must be under 5 MB.');
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `reports/${userId}/${timestamp}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return {
    name: file.name,
    url: publicUrl,
    size: file.size,
    type: file.type,
  };
}

export async function deleteReportFile(url: string): Promise<void> {
  try {
    // Extract path from public URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET);
    if (bucketIndex === -1) return;
    const path = pathParts.slice(bucketIndex + 1).join('/');

    await supabase.storage.from(BUCKET).remove([path]);
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
}

export function validateReportFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Use PDF, JPG, or PNG.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be under 5 MB.' };
  }
  return { valid: true };
}