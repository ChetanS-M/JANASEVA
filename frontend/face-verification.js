class FaceVerification {
  constructor(videoElementId, canvasElementId) {
    this.video = document.getElementById(videoElementId);
    this.canvas = document.getElementById(canvasElementId);
    this.stream = null;
    this.detector = null;
    this.modelPromise = null;
    this.selectedLandmarkIndices = [
      10, 67, 103, 109, 127, 137, 151, 162, 172, 199, 234, 251,
      284, 297, 323, 332, 338, 356, 389, 454, 61, 78, 95, 146,
      152, 168, 195, 197, 263, 291, 308, 334
    ];
  }

  async ensureModelLoaded() {
    if (this.detector) return this.detector;
    if (this.modelPromise) return this.modelPromise;

    this.modelPromise = (async () => {
      if (!window.tf || !window.faceLandmarksDetection) {
        throw new Error('Face model scripts are not loaded');
      }

      await tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
      await tf.ready();

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      this.detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
        maxFaces: 1
      });

      return this.detector;
    })();

    return this.modelPromise;
  }

  async startCamera() {
    try {
      await this.ensureModelLoaded();
      this.stopCamera();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      this.video.srcObject = this.stream;
      await new Promise((resolve) => {
        if (this.video.readyState >= 1) {
          resolve();
          return;
        }
        this.video.onloadedmetadata = () => resolve();
      });
      await this.video.play();
      return true;
    } catch (error) {
      console.error('Camera/model init failed:', error);
      alert('Camera and face verification services are required. Please allow camera access and ensure internet is available.');
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
      this.stream = null;
    }
  }

  async capturePhoto() {
    if (!this.video || !this.canvas) {
      throw new Error('Camera elements not found');
    }
    if (!this.stream) {
      throw new Error('Camera is not running');
    }
    if (this.video.readyState < 2) {
      await new Promise((resolve) => {
        this.video.onloadeddata = () => resolve();
      });
    }

    const context = this.canvas.getContext('2d');
    const width = this.video.videoWidth || this.video.clientWidth || 640;
    const height = this.video.videoHeight || this.video.clientHeight || 480;
    this.canvas.width = width;
    this.canvas.height = height;
    context.drawImage(this.video, 0, 0);

    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
  }

  normalizeVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0)) || 1;
    return vector.map(value => Number((value / norm).toFixed(6)));
  }

  averagePoint(keypoints, indices) {
    const total = indices.reduce((acc, index) => {
      const point = keypoints[index];
      acc.x += point.x;
      acc.y += point.y;
      acc.z += point.z || 0;
      return acc;
    }, { x: 0, y: 0, z: 0 });
    const size = indices.length || 1;
    return {
      x: total.x / size,
      y: total.y / size,
      z: total.z / size
    };
  }

  distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
  }

  async extractFaceEmbedding() {
    await this.ensureModelLoaded();
    const faces = await this.detector.estimateFaces(this.canvas, { flipHorizontal: true });
    if (!faces || !faces.length) {
      throw new Error('No face detected');
    }

    const face = faces[0];
    const keypoints = face.keypoints || [];
    if (!keypoints.length) {
      throw new Error('Face landmarks unavailable');
    }

    const leftEye = this.averagePoint(keypoints, [33, 133, 159, 145]);
    const rightEye = this.averagePoint(keypoints, [362, 263, 386, 374]);
    const nose = keypoints[1] || this.averagePoint(keypoints, [1, 4, 168]);
    const interEyeDistance = this.distance(leftEye, rightEye) || 1;

    const landmarkFeatures = [];
    this.selectedLandmarkIndices.forEach(index => {
      const point = keypoints[index];
      if (!point) return;
      landmarkFeatures.push((point.x - nose.x) / interEyeDistance);
      landmarkFeatures.push((point.y - nose.y) / interEyeDistance);
      landmarkFeatures.push((point.z || 0) / interEyeDistance);
    });

    const box = face.box || {
      xMin: Math.min(...keypoints.map(point => point.x)),
      yMin: Math.min(...keypoints.map(point => point.y)),
      xMax: Math.max(...keypoints.map(point => point.x)),
      yMax: Math.max(...keypoints.map(point => point.y))
    };

    const width = this.canvas.width || 640;
    const height = this.canvas.height || 480;
    const paddingX = (box.xMax - box.xMin) * 0.18;
    const paddingY = (box.yMax - box.yMin) * 0.22;
    const x1 = Math.max(0, box.xMin - paddingX);
    const y1 = Math.max(0, box.yMin - paddingY);
    const x2 = Math.min(width, box.xMax + paddingX);
    const y2 = Math.min(height, box.yMax + paddingY);

    const appearanceFeatures = tf.tidy(() => {
      const image = tf.browser.fromPixels(this.canvas).toFloat().div(255);
      const batch = image.expandDims(0);
      const crop = tf.image.cropAndResize(
        batch,
        [[y1 / height, x1 / width, y2 / height, x2 / width]],
        [0],
        [32, 32]
      );
      const grayscale = tf.image.rgbToGrayscale(crop);
      const pooled = tf.avgPool(grayscale, [4, 4], [4, 4], 'valid').reshape([64]);
      return Array.from(pooled.dataSync());
    });

    const combined = this.normalizeVector([...landmarkFeatures, ...appearanceFeatures]);
    return {
      embedding: combined,
      boundingBox: {
        x1: Number(x1.toFixed(2)),
        y1: Number(y1.toFixed(2)),
        x2: Number(x2.toFixed(2)),
        y2: Number(y2.toFixed(2))
      }
    };
  }

  async captureFaceSample() {
    const blob = await this.capturePhoto();
    const face = await this.extractFaceEmbedding();
    return {
      blob,
      embedding: face.embedding,
      boundingBox: face.boundingBox
    };
  }

  async captureFaceBurst(count, delayMs, poseLabel) {
    const samples = [];
    const targetCount = Math.max(1, Number(count) || 1);
    const waitMs = Math.max(0, Number(delayMs) || 0);

    for (let index = 0; index < targetCount; index += 1) {
      try {
        const sample = await this.captureFaceSample();
        sample.pose = poseLabel || 'neutral';
        sample.sequence = index + 1;
        samples.push(sample);
      } catch (error) {}

      if (index < targetCount - 1 && waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }

    if (!samples.length) {
      throw new Error('No usable face frames captured');
    }

    return samples;
  }

  averageEmbeddings(samples) {
    if (!samples.length) return [];
    const length = samples[0].embedding.length;
    const totals = new Array(length).fill(0);
    samples.forEach(sample => {
      sample.embedding.forEach((value, index) => {
        totals[index] += value;
      });
    });
    return this.normalizeVector(totals.map(value => value / samples.length));
  }

  buildFaceProfile(samples) {
    const usableSamples = (samples || []).filter(sample => Array.isArray(sample.embedding) && sample.embedding.length);
    const centroid = this.averageEmbeddings(usableSamples);
    const poseSummary = usableSamples.reduce((acc, sample) => {
      acc[sample.pose] = (acc[sample.pose] || 0) + 1;
      return acc;
    }, {});

    return {
      version: 4,
      engine: 'tensorflowjs-face-landmarks',
      sample_count: usableSamples.length,
      vector_length: centroid.length,
      centroid,
      poses: poseSummary,
      samples: usableSamples.map(sample => ({
        pose: sample.pose,
        sequence: sample.sequence,
        embedding: sample.embedding
      }))
    };
  }

  async verifyFace(userId) {
    const photoBlob = await this.capturePhoto();
    const formData = new FormData();
    formData.append('photo', photoBlob);
    if (userId) {
      formData.append('userId', userId);
    }

    const response = await fetch('/api/verify-face', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

window.FaceVerification = FaceVerification;
