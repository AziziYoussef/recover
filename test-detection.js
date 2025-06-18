#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const PYTHON_SCRIPT = path.join(__dirname, 'scripts', 'yolo_detector.py');
const OUTPUT_DIR = path.join(__dirname, 'temp', 'detection-results');

// Default detection settings
const DEFAULT_SETTINGS = {
  confidence_threshold: 0.7,
  stationary_threshold: 5, // minutes
  proximity_threshold: 50,
  frame_skip: 30,
  monitored_classes: [
    'backpack', 'handbag', 'suitcase', 'laptop', 'cell phone',
    'book', 'umbrella', 'bottle', 'keys', 'wallet'
  ]
};

async function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
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

function runPythonScript(videoPath, settingsFile, outputFile) {
  return new Promise((resolve, reject) => {
    const args = [
      PYTHON_SCRIPT,
      videoPath,
      '--settings', settingsFile,
      '--output', outputFile,
      '--model', 'yolov8n.pt'
    ];

    // Check if virtual environment exists
    const venvPython = path.join(__dirname, 'detection-env', 'bin', 'python');
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';
    
    console.log(`Running: ${pythonCmd} ${args.join(' ')}`);
    
    const process = spawn(pythonCmd, args);
    
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output.trim());
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log('STDERR:', output.trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function processVideo(videoFile) {
  const videoPath = path.join(UPLOADS_DIR, videoFile);
  const timestamp = Date.now();
  const settingsFile = path.join(OUTPUT_DIR, `settings_${timestamp}.json`);
  const outputFile = path.join(OUTPUT_DIR, `results_${videoFile}_${timestamp}.json`);

  console.log(`\n=== Processing ${videoFile} ===`);
  console.log(`Video path: ${videoPath}`);

  try {
    // Create settings file
    await fs.promises.writeFile(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    console.log(`Settings saved to: ${settingsFile}`);

    // Run detection
    console.log('Starting AI detection...');
    const startTime = Date.now();
    
    await runPythonScript(videoPath, settingsFile, outputFile);
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Read and display results
    if (fs.existsSync(outputFile)) {
      const resultsData = await fs.promises.readFile(outputFile, 'utf-8');
      const results = JSON.parse(resultsData);

      console.log(`\n=== Results for ${videoFile} ===`);
      console.log(`Processing time: ${processingTime.toFixed(1)}s`);
      console.log(`Video duration: ${results.video_info.duration.toFixed(1)}s`);
      console.log(`Frames processed: ${results.processing_stats.frames_processed}`);
      console.log(`Objects detected: ${results.processing_stats.objects_detected}`);
      console.log(`Tracks created: ${results.processing_stats.tracks_created}`);
      console.log(`Lost objects found: ${results.processing_stats.lost_objects_found}`);

      if (results.lost_objects.length > 0) {
        console.log('\n--- Lost Objects ---');
        results.lost_objects.forEach((obj, index) => {
          console.log(`${index + 1}. ${obj.class} (confidence: ${(obj.confidence * 100).toFixed(1)}%)`);
          console.log(`   Stationary for: ${obj.stationary_duration_minutes.toFixed(1)} minutes`);
          console.log(`   Location: center (${obj.center[0]}, ${obj.center[1]})`);
          console.log(`   Detections: ${obj.total_detections}`);
        });
      }

      console.log(`\nFull results saved to: ${outputFile}`);
    } else {
      console.error('No output file generated');
    }

    // Clean up settings file
    await fs.promises.unlink(settingsFile).catch(() => {});

  } catch (error) {
    console.error(`Error processing ${videoFile}:`, error.message);
    
    // Clean up files on error
    await Promise.allSettled([
      fs.promises.unlink(settingsFile).catch(() => {}),
      fs.promises.unlink(outputFile).catch(() => {})
    ]);
  }
}

async function checkDependencies() {
  console.log('Checking dependencies...');
  
  // Check if Python script exists
  if (!fs.existsSync(PYTHON_SCRIPT)) {
    console.error(`Python script not found: ${PYTHON_SCRIPT}`);
    return false;
  }
  console.log('✓ Python script found');

  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(`Uploads directory not found: ${UPLOADS_DIR}`);
    return false;
  }
  console.log('✓ Uploads directory found');

  // Check Python and dependencies
  try {
    const venvPython = path.join(__dirname, 'detection-env', 'bin', 'python');
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';
    
    const result = await new Promise((resolve, reject) => {
      const process = spawn(pythonCmd, ['-c', 'import ultralytics, cv2, numpy; print("OK")']);
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.trim() === 'OK') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      process.on('error', () => resolve(false));
    });

    if (result) {
      console.log('✓ Python dependencies available');
      return true;
    } else {
      console.warn('⚠ Python dependencies not fully available');
      console.log('Install with: pip install -r scripts/requirements.txt');
      return true; // Continue anyway, script will handle missing deps
    }
  } catch (error) {
    console.warn('⚠ Could not check Python dependencies');
    return true; // Continue anyway
  }
}

async function main() {
  console.log('Lost Object Detection Test Script');
  console.log('=================================');

  // Check dependencies
  const depsOk = await checkDependencies();
  if (!depsOk) {
    process.exit(1);
  }

  // Create output directory
  await createDir(OUTPUT_DIR);

  // Get video files
  const videoFiles = await getVideoFiles();
  
  if (videoFiles.length === 0) {
    console.log('No video files found in uploads directory');
    console.log(`Checked: ${UPLOADS_DIR}`);
    process.exit(0);
  }

  console.log(`\nFound ${videoFiles.length} video file(s):`);
  videoFiles.forEach(file => console.log(`  - ${file}`));

  // Process each video
  for (const videoFile of videoFiles) {
    await processVideo(videoFile);
  }

  console.log('\nAll videos processed!');
  console.log(`Results saved in: ${OUTPUT_DIR}`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node test-detection.js

This script will:
1. Find all video files in public/uploads/
2. Run AI detection on each video using the YOLO detector
3. Display results and save detailed output to temp/detection-results/

Video formats supported: .mp4, .avi, .mov, .mkv, .webm

Make sure to install Python dependencies first:
  pip install -r scripts/requirements.txt
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}