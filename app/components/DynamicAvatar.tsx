'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DynamicAvatarProps {
  emotion?: string;
  style?: string;
  className?: string;
}

export default function DynamicAvatar({ emotion = 'neutral', style = 'default', className = '' }: DynamicAvatarProps) {
  const [imageUrl, setImageUrl] = useState('/ai-avatar.jpg');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateAvatar = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emotion, style })
        });
        
        if (!response.ok) throw new Error('Failed to generate avatar');
        
        const data = await response.json();
        if (data.url) {
          setImageUrl(data.url);
        }
      } catch (error) {
        // Fallback to default avatar on error
        setImageUrl('/ai-avatar.jpg');
      } finally {
        setIsLoading(false);
      }
    };

    if (emotion !== 'neutral' || style !== 'default') {
      generateAvatar();
    }
  }, [emotion, style]);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageUrl}
        alt="AI Avatar"
        width={128}
        height={128}
        className={`rounded-full transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400" />
        </div>
      )}
    </div>
  );
} 