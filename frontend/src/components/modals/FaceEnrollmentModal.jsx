import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import toast from 'react-hot-toast';

/**
 * Face Enrollment Modal
 * Allows users to enroll their face photo for facial recognition check-in
 * Simplified version without real-time face detection
 */
export default function FaceEnrollmentModal({ isOpen, onClose, onEnrollSuccess, existingEnrollment }) {
  const [step, setStep] = useState('camera'); // camera | preview | processing | success
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start webcam when modal opens
  useEffect(() => {
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

  const capturePhoto = () => {
    if (!cameraReady) {
      toast.error('Camera is not ready. Please wait.');
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    setStep('preview');
    stopWebcam();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep('camera');
  };

  const enrollPhoto = async () => {
    setLoading(true);
    setStep('processing');
    
    try {
      const { enrollFace } = await import('@/api/face');
      const result = await enrollFace(capturedImage, 1.0); // Default quality score
      
      toast.success('Face enrolled successfully!');
      setStep('success');
      
      setTimeout(() => {
        onEnrollSuccess(result.enrollment);
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.response?.data?.error || 'Failed to enroll face');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopWebcam();
    setCapturedImage(null);
    setStep('camera');
    setCameraReady(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Face Enrollment</h2>
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
                
                {/* Camera Status Indicator */}
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
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Position your face in the center of the camera</li>
                  <li>Ensure good lighting (no shadows on face)</li>
                  <li>Look directly at the camera</li>
                  <li>Remove glasses or hats for better recognition</li>
                  <li>Keep a neutral expression</li>
                </ul>
              </div>

              <Button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-full"
                size="lg"
              >
                <Camera className="mr-2" size={20} />
                Capture Photo
              </Button>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-auto"
                />
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <p className="text-sm">
                  ✅ Photo captured successfully!
                  <br />
                  This photo will be used for facial recognition check-in.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Retake Photo
                </Button>
                <Button
                  onClick={enrollPhoto}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Enrolling...
                    </>
                  ) : (
                    'Confirm & Enroll'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-rose-500" />
              <h3 className="text-xl font-semibold mb-2">Uploading face photo...</h3>
              <p className="text-sm text-muted-foreground">Please wait while we process your enrollment</p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Face Enrolled Successfully!</h3>
              <p className="text-sm text-muted-foreground">You can now use facial recognition for check-in</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
