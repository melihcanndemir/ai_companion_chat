import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs/promises';

interface ErrorResponse {
  error: string;
  details?: unknown;
}

interface SuccessResponse {
  url: string;
  alt: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

interface ImageGenerationParams {
  prompt: string;
  negative_prompt: string;
  steps: number;
  width: number;
  height: number;
  cfg_scale: number;
  sampler_name: string;
  alwayson_scripts: {
    controlnet: {
      args: Array<{
        input_image: string;
        module: string;
        model: string;
        weight: number;
        processor_res: number;
        threshold_a: number;
        guidance_start: number;
        guidance_end: number;
      }>;
    };
  };
}

interface ImageGenerationResult {
  images?: string[];
  error?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { emotion, style } = await req.json();
    
    // Referans yüz fotoğrafını oku
    const referenceImage = await fs.readFile('public/ai-avatar.jpg');
    
    // Yüzü işle ve hazırla
    const processedReference = await sharp(referenceImage)
      .resize(512, 512, { fit: 'cover' })
      .toBuffer();
    const base64Reference = processedReference.toString('base64');

    // Prompt oluştur
    const prompt = `beautiful woman, same face as reference, ${emotion} expression, ${style} style, high quality, detailed face, photorealistic`;
    const negativePrompt = "nsfw, nude, bad quality, deformed, different face";

    // Stable Diffusion API'ye ControlNet ile istek at
    const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        steps: 25,
        width: 512,
        height: 512,
        cfg_scale: 7.5,
        sampler_name: "DPM++ 2M Karras",
        alwayson_scripts: {
          controlnet: {
            args: [{
              input_image: base64Reference,
              module: 'face_detector',
              model: 'control_v11p_sd15_openpose [cab727d4]',
              weight: 0.85,
              processor_res: 512,
              threshold_a: 0.8,
              guidance_start: 0.2,
              guidance_end: 1.0
            }]
          }
        }
      })
    });

    const requestParams: ImageGenerationParams = {
      prompt,
      negative_prompt: negativePrompt,
      steps: 25,
      width: 512,
      height: 512,
      cfg_scale: 7.5,
      sampler_name: "DPM++ 2M Karras",
      alwayson_scripts: {
        controlnet: {
          args: [{
            input_image: base64Reference,
            module: 'face_detector',
            model: 'control_v11p_sd15_openpose [cab727d4]',
            weight: 0.85,
            processor_res: 512,
            threshold_a: 0.8,
            guidance_start: 0.2,
            guidance_end: 1.0
          }]
        }
      }
    };

    const result = await response.json();

    // Görüntü kalite kontrolü
    const generateImage = async (params: ImageGenerationParams): Promise<ImageGenerationResult> => {
      const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    };

    const checkImageQuality = async (result: ImageGenerationResult): Promise<SuccessResponse> => {
      if (!result.images?.[0]) {
        // Görüntü oluşturulmadıysa tekrar dene
        const newResult = await generateImage(requestParams);
        if (!newResult.images?.[0]) {
          throw new Error('Failed to generate image');
        }
        return {
          url: `data:image/png;base64,${newResult.images[0]}`,
          alt: `${emotion} expression in ${style} style`
        };
      }
      return {
        url: `data:image/png;base64,${result.images[0]}`,
        alt: `${emotion} expression in ${style} style`
      };
    };

    const checkedResult = await checkImageQuality(result);
    return NextResponse.json<ApiResponse>(checkedResult);
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json<ApiResponse>(
      { error: 'Failed to process image request', details: error },
      { status: 500 }
    );
  }
}