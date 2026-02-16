// check-cache.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('🔍 CACHE DIAGNOSTIC TOOL');
console.log('='.repeat(60));

// Define paths
const mergeCachePath = '../../merged-cache.json';
const embeddingCachePath = '../../embeddings-cache.json';

// Get absolute paths
const absoluteMergePath = path.resolve(__dirname, mergeCachePath);
const absoluteEmbeddingPath = path.resolve(__dirname, embeddingCachePath);

console.log('\n📁 FILE LOCATIONS:');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Script location:', __filename);
console.log('\n🔍 Cache paths:');
console.log('Merge cache (relative):', mergeCachePath);
console.log('Merge cache (absolute):', absoluteMergePath);
console.log('Embedding cache (absolute):', absoluteEmbeddingPath);

// Check if files exist
console.log('\n📋 EXISTENCE CHECK:');
console.log(
    'Merge cache exists?',
    fs.existsSync(absoluteMergePath) ? '✅ YES' : '❌ NO'
);
console.log(
    'Embedding cache exists?',
    fs.existsSync(absoluteEmbeddingPath) ? '✅ YES' : '❌ NO'
);

// If files exist, check their content
if (fs.existsSync(absoluteMergePath)) {
    console.log('\n📄 MERGE CACHE DETAILS:');
    try {
        const stats = fs.statSync(absoluteMergePath);
        console.log('File size:', stats.size, 'bytes');
        console.log('Last modified:', stats.mtime);

        const content = fs.readFileSync(absoluteMergePath, 'utf-8');
        console.log(
            'First 100 chars:',
            JSON.stringify(content.substring(0, 100))
        );

        // Try to parse JSON
        try {
            const jsonData = JSON.parse(content);
            console.log('JSON parsing: ✅ SUCCESS');
            console.log('Number of entries:', Object.keys(jsonData).length);
            if (Object.keys(jsonData).length > 0) {
                console.log('Sample keys:', Object.keys(jsonData).slice(0, 3));
                console.log(
                    'Sample value:',
                    JSON.stringify(
                        jsonData[Object.keys(jsonData)[0]]
                    ).substring(0, 100) + '...'
                );
            } else {
                console.log('⚠️ Cache file is empty (no entries)');
            }
        } catch (e) {
            console.log('JSON parsing: ❌ FAILED -', e.message);
        }
    } catch (e) {
        console.log('Error reading file:', e.message);
    }
}

if (fs.existsSync(absoluteEmbeddingPath)) {
    console.log('\n📄 EMBEDDING CACHE DETAILS:');
    try {
        const stats = fs.statSync(absoluteEmbeddingPath);
        console.log('File size:', stats.size, 'bytes');
        console.log('Last modified:', stats.mtime);

        const content = fs.readFileSync(absoluteEmbeddingPath, 'utf-8');
        console.log(
            'First 100 chars:',
            JSON.stringify(content.substring(0, 100))
        );

        // Try to parse JSON
        try {
            const jsonData = JSON.parse(content);
            console.log('JSON parsing: ✅ SUCCESS');
            console.log('Number of entries:', Object.keys(jsonData).length);
        } catch (e) {
            console.log('JSON parsing: ❌ FAILED -', e.message);
        }
    } catch (e) {
        console.log('Error reading file:', e.message);
    }
}

// Test write permissions
console.log('\n✏️ WRITE PERMISSION TEST:');

// Try to write a test file in the same directory as the cache
const testFile = path.join(path.dirname(absoluteMergePath), 'test-write.tmp');
console.log('Test file location:', testFile);

try {
    fs.writeFileSync(testFile, 'test content');
    console.log('Write test: ✅ SUCCESS - can write to this directory');

    // Clean up
    fs.removeSync(testFile);
    console.log('Cleanup: ✅ SUCCESS - test file removed');
} catch (e) {
    console.log('Write test: ❌ FAILED -', e.message);
}

// Try to write directly to the cache files
console.log('\n🔧 CACHE WRITE TEST:');

try {
    // Try to write to merge cache
    const testData = {
        test: 'writing permission check',
        timestamp: Date.now(),
    };
    fs.writeJSONSync(absoluteMergePath, testData, { spaces: 2 });
    console.log('Write to merge cache: ✅ SUCCESS');

    // Read it back to verify
    const verifyData = fs.readJSONSync(absoluteMergePath);
    console.log('Verification read: ✅ SUCCESS - content:', verifyData);

    // Restore original content? (commented out to be safe)
    // if you want to restore, uncomment next lines
    // const originalContent = {}; // you'd need to have this saved
    // fs.writeJSONSync(absoluteMergePath, originalContent, { spaces: 2 });

    console.log(
        '⚠️ Test data written to cache file - restore manually if needed'
    );
} catch (e) {
    console.log('Write to merge cache: ❌ FAILED -', e.message);
}

// Check directory permissions
console.log('\n📁 DIRECTORY PERMISSIONS:');
const cacheDir = path.dirname(absoluteMergePath);
console.log('Cache directory:', cacheDir);
console.log('Directory exists?', fs.existsSync(cacheDir) ? '✅ YES' : '❌ NO');

if (fs.existsSync(cacheDir)) {
    try {
        const dirStats = fs.statSync(cacheDir);
        console.log('Directory permissions:', dirStats.mode.toString(8));
        console.log(
            'Is writable?',
            !!(dirStats.mode & 0o200) ? '✅ YES' : '❌ NO'
        );
    } catch (e) {
        console.log('Could not check directory permissions:', e.message);
    }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Diagnostic complete');
console.log('='.repeat(60));
