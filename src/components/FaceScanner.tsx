import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { useToast } from '@/hooks/use-toast';

interface FaceScannerProps {
  onFaceVerified: (confidence: number) => void;
  disabled?: boolean;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({ onFaceVerified, disabled }) => {
  const {
    videoRef,
    isLoading,
    isModelLoaded,
    isScanning,
    confidence,
    error,
    faceDetected,
    loadModels,
    startCamera,
    stopCamera,
    captureReference,
    verifyFace,
    clearError,
  } = useFaceRecognition();

  const { toast } = useToast();
  const [step, setStep] = useState<'idle' | 'camera' | 'reference' | 'verify' | 'success'>('idle');
  const [hasReference, setHasReference] = useState(false);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, [loadModels, stopCamera]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Face Recognition Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleStartScanning = async () => {
    if (!isModelLoaded) {
      toast({
        title: "Models Loading",
        description: "Please wait for face recognition models to load",
        variant: "destructive",
      });
      return;
    }

    setStep('camera');
    clearError();
    await startCamera();
  };

  const handleCaptureReference = async () => {
    const descriptor = await captureReference();
    if (descriptor) {
      setHasReference(true);
      setStep('reference');
      toast({
        title: "Reference Captured",
        description: "Your face has been registered successfully!",
      });
    }
  };

  const handleVerifyFace = async () => {
    setStep('verify');
    const isVerified = await verifyFace();
    
    if (isVerified && confidence !== null) {
      setStep('success');
      onFaceVerified(confidence);
      toast({
        title: "Face Verified",
        description: `Identity confirmed with ${confidence.toFixed(1)}% confidence`,
      });
    } else {
      setStep('camera');
      toast({
        title: "Verification Failed",
        description: "Face verification failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    setStep('idle');
  };

  const getStepContent = () => {
    switch (step) {
      case 'idle':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Face Recognition</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start camera to verify your identity
              </p>
              <Button 
                onClick={handleStartScanning}
                disabled={disabled || isLoading || !isModelLoaded}
                variant="scan"
                className="w-full"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading Models</>
                ) : (
                  <><Camera className="w-4 h-4" /> Start Face Scan</>
                )}
              </Button>
            </div>
            {!isModelLoaded && (
              <p className="text-xs text-muted-foreground">
                Loading face recognition models...
              </p>
            )}
          </div>
        );

      case 'camera':
        return (
          <div className="space-y-4">
            <div className="relative">
              <div className={`face-scan-frame ${isScanning ? 'scanning' : faceDetected ? 'success' : ''}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-48 object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!hasReference ? (
                <Button
                  onClick={handleCaptureReference}
                  disabled={isScanning}
                  variant="hero"
                  className="flex-1"
                >
                  <User className="w-4 h-4" />
                  Capture Reference
                </Button>
              ) : (
                <Button
                  onClick={handleVerifyFace}
                  disabled={isScanning}
                  variant="success"
                  className="flex-1"
                >
                  {isScanning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Verify Face</>
                  )}
                </Button>
              )}
              <Button
                onClick={handleStopCamera}
                variant="outline"
                disabled={isScanning}
              >
                Stop
              </Button>
            </div>

            {confidence !== null && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Confidence: {confidence.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        );

      case 'reference':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-success mb-2">Reference Captured</h3>
              <p className="text-sm text-muted-foreground">
                Your face template has been stored securely. You can now verify your identity.
              </p>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verifying Identity</h3>
              <p className="text-sm text-muted-foreground">
                Please look directly at the camera...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-success mb-2">Identity Verified</h3>
              <p className="text-sm text-muted-foreground">
                Face recognition successful with {confidence?.toFixed(1)}% confidence
              </p>
            </div>
            <Button
              onClick={() => setStep('idle')}
              variant="outline"
              className="w-full"
            >
              Reset Scanner
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 attendance-card">
      {getStepContent()}
      
      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}
    </Card>
  );
};