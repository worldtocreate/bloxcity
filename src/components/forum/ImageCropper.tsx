import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for cover
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  type: 'avatar' | 'cover' | 'background';
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ImageCropper({
  imageUrl,
  aspectRatio = 1,
  onCropComplete,
  onCancel,
  type
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }, [aspectRatio]);

  // Detect if the original image is a PNG (for transparency support)
  const isPngImage = imageUrl.toLowerCase().includes('.png') || 
    imageUrl.startsWith('data:image/png');

  const getCroppedImg = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const outputWidth = type === 'avatar' ? 256 : type === 'background' ? 1920 : 1200;
    const outputHeight = type === 'avatar' ? 256 : type === 'background' ? 1080 : Math.round(1200 / aspectRatio);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Keep canvas transparent for PNGs, don't fill with any background
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Use PNG format to preserve transparency, JPEG for others
    const mimeType = isPngImage ? 'image/png' : 'image/jpeg';
    const quality = isPngImage ? undefined : 0.9;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  };

  const handleConfirm = async () => {
    setProcessing(true);
    const blob = await getCroppedImg();
    if (blob) {
      onCropComplete(blob);
    }
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--bc-bg-card))] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">
            Crop {type === 'avatar' ? 'Profile Picture' : type === 'background' ? 'Site Background' : 'Cover Photo'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-[hsl(var(--bc-bg-light))] rounded-lg transition"
          >
            <X className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
          </button>
        </div>

        {/* Cropper */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[hsl(var(--bc-bg-light))]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={type === 'avatar'}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              style={{ transform: `scale(${scale})`, maxHeight: '60vh' }}
              onLoad={onImageLoad}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-[hsl(var(--bc-border))] space-y-4">
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] rounded-lg transition"
            >
              <ZoomOut className="w-5 h-5 text-[hsl(var(--bc-text))]" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32"
            />
            <button
              onClick={() => setScale(Math.min(3, scale + 0.1))}
              className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] rounded-lg transition"
            >
              <ZoomIn className="w-5 h-5 text-[hsl(var(--bc-text))]" />
            </button>
            <button
              onClick={() => setScale(1)}
              className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] rounded-lg transition"
            >
              <RotateCcw className="w-5 h-5 text-[hsl(var(--bc-text))]" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing || !completedCrop}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white rounded-lg transition"
            >
              <Check className="w-4 h-4" />
              {processing ? 'Processing...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
