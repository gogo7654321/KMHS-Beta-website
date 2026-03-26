
'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, RotateCcw, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  aspect: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  circular?: boolean;
}

export function ImageCropper({ image, aspect, onCropComplete, onCancel, circular = false }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(blob);
    } catch (e) {
      console.error('Cropping failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[650px] z-[100]">
        <DialogHeader>
          <DialogTitle>Crop & Adjust</DialogTitle>
          <DialogDescription>Zoom and rotate to frame the perfect shot. Adjustments are processed on upload.</DialogDescription>
        </DialogHeader>
        <div className="relative h-[450px] w-full bg-black rounded-md overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={0.5}
            maxZoom={10}
            restrictPosition={false}
            cropShape={circular ? 'round' : 'rect'}
            showGrid={!circular}
            onCropChange={setCrop}
            onRotationChange={setRotation}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
          />
        </div>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Zoom Level</span>
                <span className="text-xs font-mono">{zoom.toFixed(2)}x</span>
            </div>
            <Slider
                value={[zoom]}
                min={0.5}
                max={10}
                step={0.01}
                onValueChange={([val]) => setZoom(val)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground flex items-center gap-2">
                    Rotation
                </span>
                <span className="text-xs font-mono">{rotation}°</span>
            </div>
            <div className="flex items-center gap-4">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setRotation((r) => (r - 90) % 360)}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Slider
                    value={[rotation]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([val]) => setRotation(val)}
                    className="flex-grow"
                />
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setRotation((r) => (r + 90) % 360)}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleCrop} disabled={isProcessing} className="bg-primary font-bold">
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Adjustments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: any, rotation = 0): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  const rotRad = (rotation * Math.PI) / 180;
  
  // Calculate bounding box for rotation
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) throw new Error('No 2d context for crop');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
