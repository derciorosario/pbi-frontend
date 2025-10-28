// src/components/ImageCropper.jsx
import { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function ImageCropper({ image, imageDimensions, onCropComplete, onCancel, config, type }) {
  const [crop, setCrop] = useState({
    unit: 'px',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 500 });
  const [minConstraints, setMinConstraints] = useState({ minWidth: 0, minHeight: 0 });

  // Calculate optimal container size based on image dimensions
  useEffect(() => {
    const calculateContainerSize = () => {
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;
      
      let width = Math.min(imageDimensions.width, maxWidth);
      let height = Math.min(imageDimensions.height, maxHeight);

      // Ensure minimum size
      width = Math.max(width, 400);
      height = Math.max(height, 300);

      setContainerSize({
        width: width,
        height: height + 120 // Add space for header and buttons
      });
    };

    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      calculateContainerSize();
    }
  }, [imageDimensions]);

  // Set initial crop when image loads
  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const displayedWidth = e.currentTarget.width;
    const displayedHeight = e.currentTarget.height;
    setImageLoaded(true);

    // Determine scale from natural image to displayed image
    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Scale minimum constraints into displayed pixel space and cap to bounds
    let scaledMinWidth = Math.floor(config.minWidth * scale);
    let scaledMinHeight = Math.floor(config.minHeight * scale);
    scaledMinWidth = Math.max(1, Math.min(scaledMinWidth, displayedWidth));
    scaledMinHeight = Math.max(1, Math.min(scaledMinHeight, displayedHeight));
    setMinConstraints({ minWidth: scaledMinWidth, minHeight: scaledMinHeight });

    // Calculate initial crop based on displayed image dimensions
    let cropWidth, cropHeight;

    if (type === 'avatar') {
      // Avatar: largest centered square within displayed image
      const size = Math.min(displayedWidth, displayedHeight);
      cropWidth = size;
      cropHeight = size;
    } else {
      // Cover: maintain target aspect ratio
      const targetAspect = config.aspect;
      const imageAspect = displayedWidth / displayedHeight;

      if (imageAspect > targetAspect) {
        // Image is wider than target - use full height and calculate width
        cropHeight = displayedHeight;
        cropWidth = cropHeight * targetAspect;
      } else {
        // Image is taller than target - use full width and calculate height
        cropWidth = displayedWidth;
        cropHeight = cropWidth / targetAspect;
      }

      // Enforce scaled minima while maintaining aspect ratio
      if (cropWidth < scaledMinWidth) {
        cropWidth = scaledMinWidth;
        cropHeight = cropWidth / targetAspect;
      }
      if (cropHeight < scaledMinHeight) {
        cropHeight = scaledMinHeight;
        cropWidth = cropHeight * targetAspect;
      }

      // Clamp to displayed image bounds while maintaining aspect ratio
      if (cropWidth > displayedWidth) {
        cropWidth = displayedWidth;
        cropHeight = cropWidth / targetAspect;
      }
      if (cropHeight > displayedHeight) {
        cropHeight = displayedHeight;
        cropWidth = cropHeight * targetAspect;
      }
    }

    // Center the crop on the displayed image
    const x = Math.max(0, (displayedWidth - cropWidth) / 2);
    const y = Math.max(0, (displayedHeight - cropHeight) / 2);

    const initialCrop = {
      unit: 'px',
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      x: Math.round(x),
      y: Math.round(y),
    };

    console.log('Initial crop set:', initialCrop, {
      scaledMinWidth,
      scaledMinHeight,
      displayedWidth,
      displayedHeight,
      naturalWidth,
      naturalHeight,
    });
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  };

  // Generate cropped image blob
  const generateCroppedImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !completedCrop) {
      console.error('No completed crop or canvas');
      return null;
    }

    const image = imgRef.current;
    if (!image) {
      console.error('No image reference');
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;

    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        console.log('Generated blob:', blob ? `size: ${blob.size} bytes` : 'null');
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCrop = async () => {
    console.log('Starting crop process...');
    const blob = await generateCroppedImage();
    if (blob) {
      console.log('Crop successful, calling onCropComplete');
      onCropComplete(blob);
    } else {
      console.error('Failed to generate cropped image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg overflow-hidden flex flex-col"
        style={{ 
          width: `${containerSize.width}px`,
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            Crop {type === 'avatar' ? 'Profile Photo' : 'Cover Image'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {type === 'avatar' 
              ? 'Select a square area for your profile picture' 
              : 'Adjust the crop area for your cover image'}
          </p>
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex justify-center items-center">
            <ReactCrop
              crop={crop}
              onChange={(newCrop) => {
                setCrop(newCrop);
              }}
              onComplete={(completedCrop) => {
                console.log('Crop completed:', completedCrop);
                setCompletedCrop(completedCrop);
              }}
              aspect={type === 'avatar' ? 1 : config.aspect}
              minWidth={minConstraints.minWidth || undefined}
              minHeight={minConstraints.minHeight || undefined}
              keepSelection={true}
            >
              <img
                ref={imgRef}
                src={image}
                onLoad={onImageLoad}
                alt="Crop preview"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '60vh', 
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Hidden canvas for generating final image */}
        <canvas
          ref={previewCanvasRef}
          className="hidden"
        />

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={!completedCrop}
              className="px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}