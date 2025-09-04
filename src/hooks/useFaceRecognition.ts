import { useState, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceRecognitionState {
  isLoading: boolean;
  isModelLoaded: boolean;
  isScanning: boolean;
  confidence: number | null;
  error: string | null;
  faceDetected: boolean;
}

export const useFaceRecognition = () => {
  const [state, setState] = useState<FaceRecognitionState>({
    isLoading: false,
    isModelLoaded: false,
    isScanning: false,
    confidence: null,
    error: null,
    faceDetected: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const storedDescriptorRef = useRef<Float32Array | null>(null);

  const loadModels = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const MODEL_URL = '/models'; // We'll need to add face-api.js models to public/models
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isModelLoaded: true 
      }));
      
      console.log('Face recognition models loaded successfully');
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load face recognition models' 
      }));
      console.error('Error loading models:', error);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera' 
      }));
      console.error('Camera access error:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureReference = useCallback(async () => {
    if (!videoRef.current || !state.isModelLoaded) {
      setState(prev => ({ ...prev, error: 'Camera or models not ready' }));
      return null;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        storedDescriptorRef.current = detection.descriptor;
        setState(prev => ({ ...prev, faceDetected: true }));
        return detection.descriptor;
      } else {
        setState(prev => ({ ...prev, error: 'No face detected. Please position your face clearly in the camera.' }));
        return null;
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Face capture failed' }));
      console.error('Face capture error:', error);
      return null;
    }
  }, [state.isModelLoaded]);

  const verifyFace = useCallback(async () => {
    if (!videoRef.current || !storedDescriptorRef.current || !state.isModelLoaded) {
      setState(prev => ({ ...prev, error: 'Reference face not captured or models not loaded' }));
      return false;
    }

    setState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const distance = faceapi.euclideanDistance(
          storedDescriptorRef.current,
          detection.descriptor
        );
        
        // Lower distance means higher similarity
        const confidence = Math.max(0, (1 - distance) * 100);
        const threshold = 60; // 60% confidence threshold
        
        setState(prev => ({ 
          ...prev, 
          isScanning: false, 
          confidence, 
          faceDetected: true 
        }));

        return confidence >= threshold;
      } else {
        setState(prev => ({ 
          ...prev, 
          isScanning: false, 
          error: 'No face detected during verification' 
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: 'Face verification failed' 
      }));
      console.error('Face verification error:', error);
      return false;
    }
  }, [state.isModelLoaded]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    videoRef,
    loadModels,
    startCamera,
    stopCamera,
    captureReference,
    verifyFace,
    clearError,
  };
};