import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin/middleware';
import { getCollection } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    const singleFile = formData.get('file');

    const fileList = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (fileList.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await ensureDir(uploadDir);

    let sharp;
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default || sharpModule;
    } catch (e) {
      console.warn('Sharp not available, saving raw image buffer:', e?.message);
    }

    const uploadedFiles = [];
    const imagesCol = await getCollection('images');

    for (const file of fileList) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const originalName = file.name || 'image.jpg';
      const ext = path.extname(originalName).toLowerCase();
      const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueId = uuidv4().slice(0, 8);
      const outputFilename = `prod-${baseName}-${Date.now()}-${uniqueId}.webp`;
      const outputPath = path.join(uploadDir, outputFilename);

      let finalBuffer = buffer;
      let width = null;
      let height = null;
      let optimized = false;

      if (sharp) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          width = metadata.width;
          height = metadata.height;

          // Resize if larger than 1200x1200 and convert to webp (quality 85)
          finalBuffer = await image
            .resize({
              width: 1200,
              height: 1200,
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();

          optimized = true;
        } catch (sharpError) {
          console.error('Sharp processing error, falling back to original:', sharpError);
          finalBuffer = buffer;
        }
      }

      let publicUrl = `/uploads/products/${outputFilename}`;
      let storageType = 'disk';

      try {
        await ensureDir(uploadDir);
        await fs.writeFile(outputPath, finalBuffer);
      } catch (fsErr) {
        console.warn('Serverless read-only filesystem detected, falling back to data URL:', fsErr.message);
        storageType = 'inline_base64';
        const mimeType = optimized ? 'image/webp' : (ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg'));
        publicUrl = `data:${mimeType};base64,${finalBuffer.toString('base64')}`;
      }

      // Track in database for image cleanup/monitoring
      await imagesCol.insertOne({
        _id: uuidv4(),
        filename: outputFilename,
        url: publicUrl,
        originalName,
        size: finalBuffer.length,
        optimized,
        storageType,
        uploadedAt: new Date(),
        uploadedBy: auth.user.email
      });

      uploadedFiles.push({
        url: publicUrl,
        name: originalName,
        size: finalBuffer.length,
        filename: outputFilename
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      urls: uploadedFiles.map(f => f.url)
    });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// GET handler to inspect stored/unused images
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imagesCol = await getCollection('images');
    const productsCol = await getCollection('products');

    const [images, products] = await Promise.all([
      imagesCol.find({}).sort({ uploadedAt: -1 }).limit(100).toArray(),
      productsCol.find({}).toArray()
    ]);

    // Build set of used image URLs
    const usedUrls = new Set();
    products.forEach(p => {
      if (p.thumbnail) usedUrls.add(p.thumbnail);
      if (Array.isArray(p.images)) {
        p.images.forEach(img => usedUrls.add(img));
      }
    });

    const annotatedImages = images.map(img => ({
      ...img,
      inUse: usedUrls.has(img.url)
    }));

    return NextResponse.json({
      images: annotatedImages,
      totalCount: annotatedImages.length,
      unusedCount: annotatedImages.filter(i => !i.inUse).length
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
