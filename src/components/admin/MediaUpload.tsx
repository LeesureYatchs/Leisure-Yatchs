import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Image, Video, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  bucket: string;
  folder: string;
  accept: string;
  label: string;
  existingUrls: string[];
  onChange: (urls: string[]) => void;
  icon?: 'image' | 'video';
}

export function MediaUpload({
  bucket,
  folder,
  accept,
  label,
  existingUrls,
  onChange,
  icon = 'image',
}: MediaUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      onChange([...existingUrls, ...newUrls]);
      toast({ title: `${newUrls.length} file(s) uploaded` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = existingUrls.filter((_, i) => i !== index);
    onChange(updated);
  };

  const IconComponent = icon === 'video' ? Video : Image;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground">{existingUrls.length} file(s)</span>
      </div>

      {existingUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingUrls.map((url, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted aspect-video">
              {icon === 'video' ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const newUrls = [...existingUrls];
                    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
                    onChange(newUrls);
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move Left"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1.5 bg-destructive hover:bg-destructive/90 text-white rounded-full"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={index === existingUrls.length - 1}
                  onClick={() => {
                    const newUrls = [...existingUrls];
                    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
                    onChange(newUrls);
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move Right"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Index Badge */}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {uploading ? 'Uploading...' : `Upload ${label}`}
      </Button>
    </div>
  );
}
