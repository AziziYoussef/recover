#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test AI detection service directly using TypeScript/Node.js approach
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

async function testAIDetectionService() {
  console.log('Testing AI Detection Service (TypeScript Implementation)');
  console.log('======================================================');

  // Import the AI detection service
  try {
    // Since this is CommonJS, we need to compile the TypeScript first or use a different approach
    console.log('Note: This would normally use the TypeScript AIDetectionService');
    console.log('For now, testing the Python script directly with basic checks...');
    
    const videoFiles = await getVideoFiles();
    
    if (videoFiles.length === 0) {
      console.log('No video files found in uploads directory');
      return;
    }

    console.log(`Found ${videoFiles.length} video file(s):`);
    videoFiles.forEach(file => console.log(`  - ${file}`));

    // Test basic video info extraction
    for (const videoFile of videoFiles) {
      await testVideoInfo(videoFile);
    }

  } catch (error) {
    console.error('Error testing AI detection service:', error.message);
  }
}

async function getVideoFiles() {
  try {
    const files = await fs.promises.readdir(UPLOADS_DIR);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext);
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error.message);
    return [];
  }
}

async function testVideoInfo(videoFile) {
  const videoPath = path.join(UPLOADS_DIR, videoFile);
  
  console.log(`\n=== Testing ${videoFile} ===`);
  console.log(`File path: ${videoPath}`);
  
  try {
    // Check file exists and get basic info
    const stats = await fs.promises.stat(videoPath);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Modified: ${stats.mtime.toISOString()}`);

    // Try to get video metadata using ffprobe if available
    try {
      const metadata = await getVideoMetadata(videoPath);
      if (metadata) {
        console.log(`Duration: ${metadata.duration.toFixed(1)}s`);
        console.log(`Format: ${metadata.format_name}`);
        if (metadata.streams) {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          if (videoStream) {
            console.log(`Resolution: ${videoStream.width}x${videoStream.height}`);
            console.log(`FPS: ${eval(videoStream.r_frame_rate) || 'unknown'}`);
          }
        }
      }
    } catch (metaError) {
      console.log('Could not extract video metadata (ffprobe not available)');
    }

    // Simulate AI detection results
    console.log('\n--- Simulated AI Detection Results ---');
    console.log('Status: Would process with YOLO when dependencies are installed');
    console.log('Expected processing time: ~30-60 seconds');
    console.log('Expected detectable objects: backpack, handbag, laptop, phone, etc.');
    
  } catch (error) {
    console.error(`Error testing ${videoFile}:`, error.message);
  }
}

function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);
    
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && stdout) {
        try {
          const metadata = JSON.parse(stdout);
          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            format_name: metadata.format.format_name || 'unknown',
            streams: metadata.streams || []
          });
        } catch (parseError) {
          reject(parseError);
        }
      } else {
        reject(new Error(`ffprobe failed: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Check installation progress
async function checkInstallationStatus() {
  console.log('Checking Python Dependencies Installation Status');
  console.log('===============================================');
  
  const venvPath = path.join(__dirname, 'detection-env');
  const venvPython = path.join(venvPath, 'bin', 'python');
  
  if (!fs.existsSync(venvPath)) {
    console.log('❌ Virtual environment not found');
    console.log('Run: python3 -m venv detection-env');
    return false;
  }
  
  console.log('✓ Virtual environment exists');
  
  if (!fs.existsSync(venvPython)) {
    console.log('❌ Python executable not found in virtual environment');
    return false;
  }
  
  console.log('✓ Python executable found');
  
  // Test if packages are installed
  try {
    const result = await new Promise((resolve, reject) => {
      const process = spawn(venvPython, ['-c', 'import cv2, numpy, ultralytics; print("All packages installed")']);
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        resolve({ code, output });
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });

    if (result.code === 0) {
      console.log('✓ All Python packages installed and working');
      return true;
    } else {
      console.log('❌ Some packages missing or not working');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking packages:', error.message);
    return false;
  }
}

async function main() {
  // Check installation status first
  const depsReady = await checkInstallationStatus();
  
  if (depsReady) {
    console.log('\n🎉 Dependencies are ready! You can now run full AI detection.');
    console.log('Run: node test-detection.js\n');
  } else {
    console.log('\n⏳ Dependencies still installing or missing.');
    console.log('Install with: source detection-env/bin/activate && pip install -r scripts/requirements.txt\n');
  }
  
  // Run basic tests anyway
  await testAIDetectionService();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}