import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Scan } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import toast from 'react-hot-toast';

/**
 * Face Check-In Modal (Simplified)
 * Captures webcam photo and sends to server for comparison
 */
export default function FaceCheckInModal({ isOpen, onClose, onCheckInSuccess, enrolledFaceUrl, selectedDate }) {
  console.log('FaceCheckInModal rendered - isOpen:', isOpen);
  
  const [step, setStep] = useState('camera'); // camera | processing | success | error
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start webcam when modal opens
  useEffect(() => {
    console.log('FaceCheckInModal useEffect - isOpen:', isOpen, 'step:', step);
    
    if (isOpen && step === 'camera') {
      startWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [isOpen, step]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast.error('Failed to access webcam. Please grant camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const captureAndCheckIn = async () => {
    console.log('captureAndCheckIn called', { cameraReady, loading });
    
    if (!cameraReady) {
      toast.error('Camera is not ready. Please wait.');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Capture current frame
      const video = videoRef.current;
      console.log('Video element:', video, 'Video dimensions:', video?.videoWidth, video?.videoHeight);
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      console.log('Image captured, size:', imageDataUrl.length, 'bytes');
      setPreviewImage(imageDataUrl);

      // Send to backend for comparison (Python service will do the face comparison)
      const { checkInWithFace } = await import('@/api/face');
      const dateStr = selectedDate?.toISOString().split('T')[0];
      
      console.log('Sending check-in request for date:', dateStr);
      
      // Python service will compare faces and return confidence score
      const result = await checkInWithFace(imageDataUrl, dateStr);
      
      console.log('Check-in successful:', result);
      toast.success(`Checked in successfully! Face match: ${result.matchPercentage}%`);
      setStep('success');
      
      setTimeout(() => {
        onCheckInSuccess(result.attendance);
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Check-in error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || error.response?.data?.details || 'Failed to check in');
      setStep('error');
      toast.error(error.response?.data?.error || 'Failed to check in with facial recognition');
    } finally {
      setLoading(false);
      stopWebcam();
    }
  };

  const handleClose = () => {
    stopWebcam();
    setStep('camera');
    setCameraReady(false);
    setError('');
    setPreviewImage(null);
    onClose();
  };

  const handleRetry = () => {
    setStep('camera');
    setError('');
    setPreviewImage(null);
  };

  if (!isOpen) return null;

  console.log('FaceCheckInModal rendering UI - step:', step, 'cameraReady:', cameraReady);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-6">{/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Face Check-In</h2>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>

          {/* Camera Step */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Status */}
                <div className="absolute top-4 right-4">
                  {cameraReady ? (
                    <div className="flex items-center gap-2 bg-green-500/90 text-white px-3 py-2 rounded-full">
                      <CheckCircle size={16} />
                      <span className="text-sm">Camera Ready</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-orange-500/90 text-white px-3 py-2 rounded-full">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Starting Camera...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📸 Instructions:</h4>
                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Position your face clearly in the camera</li>
                  <li>Ensure good lighting</li>
                  <li>Look directly at the camera</li>
                  <li>Click the button below to capture and check-in</li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  console.log('Button clicked!', { cameraReady, loading });
                  captureAndCheckIn();
                }}
                disabled={!cameraReady || loading}
                className="w-full"
                size="lg"
              >
                <Camera className="mr-2" size={20} />
                Capture & Check-In
              </Button>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-rose-500" />
              <h3 className="text-xl font-semibold mb-2">Verifying your identity...</h3>
              <p className="text-sm text-muted-foreground">Comparing with your enrolled face photo</p>
              {previewImage && (
                <div className="mt-6">
                  <img src={previewImage} alt="Captured" className="w-32 h-32 mx-auto rounded-lg object-cover" />
                </div>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Checked In Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Face verified successfully
              </p>
              {previewImage && (
                <div className="mt-6">
                  <img src={previewImage} alt="Verified" className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-green-500" />
                </div>
              )}
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Check-In Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              {previewImage && (
                <div className="mt-6">
                  <img src={previewImage} alt="Failed" className="w-32 h-32 mx-auto rounded-lg object-cover border-2 border-red-500" />
                </div>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Button onClick={handleRetry} variant="outline">
                  <Camera className="mr-2" size={16} />
                  Try Again
                </Button>
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
