'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(image, croppedAreaPixels);
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
          <DialogDescription>Zoom and drag to frame the image. You can now zoom out past margins for more creative control.</DialogDescription>
        </DialogHeader>
        <div className="relative h-[450px] w-full bg-black rounded-md overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={0.5}
            maxZoom={10}
            restrictPosition={false}
            cropShape={circular ? 'round' : 'rect'}
            showGrid={!circular}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
          />
        </div>
        <div className="py-4 space-y-4">
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
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleCrop} disabled={isProcessing} className="bg-primary font-bold">
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  // Set background to white for transparent images when cropping past margins
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
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
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}