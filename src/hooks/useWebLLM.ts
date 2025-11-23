import { useState, useEffect, useCallback, useRef } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressCallback } from '@mlc-ai/web-llm';

export const AVAILABLE_MODELS = [
    {
        id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        name: 'Llama 3.2 1B',
        description: 'Fastest, good for simple tasks',
        size: '~0.6GB',
    },
    {
        id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        name: 'Llama 3.2 3B',
        description: 'Balanced performance and quality',
        size: '~1.9GB',
    },
    {
        id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        name: 'Phi 3.5 Mini',
        description: 'High quality, Microsoft\'s latest',
        size: '~2.3GB',
    },
    {
        id: 'gemma-2-2b-it-q4f16_1-MLC',
        name: 'Gemma 2 2B',
        description: 'Google\'s efficient open model',
        size: '~1.6GB',
    },
    {
        id: 'Qwen2-1.5B-Instruct-q4f16_1-MLC',
        name: 'Qwen2 1.5B',
        description: 'Strong reasoning capabilities',
        size: '~0.9GB',
    },
    {
        id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
        name: 'Mistral 7B v0.3',
        description: 'Powerful, larger model (requires more VRAM)',
        size: '~4.4GB',
    },
    {
        id: 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC',
        name: 'Hermes 2 Pro',
        description: 'Advanced instruction following',
        size: '~4.9GB',
    },
];

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface LoadingProgress {
    progress: number;
    text: string;
}

export function useWebLLM() {
    const [engine, setEngine] = useState<MLCEngine | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [progress, setProgress] = useState<LoadingProgress>({ progress: 0, text: '' });
    const [error, setError] = useState<string | null>(null);

    // Initialize engine
    useEffect(() => {
        const initEngine = async () => {
            try {
                setIsLoading(true);
                setIsModelLoaded(false);
                setError(null);

                const initProgressCallback: InitProgressCallback = (report) => {
                    console.log('Init progress:', report);
                    setProgress({
                        progress: report.progress,
                        text: report.text,
                    });
                };

                const newEngine = await CreateMLCEngine(selectedModel, { initProgressCallback });

                setEngine(newEngine);
                setIsModelLoaded(true);
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to initialize WebLLM:', err);
                setError(err instanceof Error ? err.message : 'Failed to load model');
                setIsLoading(false);
            }
        };

        initEngine();

        // Cleanup function to unload model if needed (WebLLM might handle this internally on engine disposal, but good practice)
        return () => {
            // engine?.unload(); // If unload is available
        };
    }, [selectedModel]);

    // Generate response
    const generateResponse = useCallback(
        async (messages: Message[], onUpdate: (text: string) => void) => {
            if (!engine) return;

            try {
                const completion = await engine.chat.completions.create({
                    messages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 1024,
                });

                let fullResponse = '';
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    fullResponse += content;
                    onUpdate(fullResponse);
                }

                return fullResponse;
            } catch (err) {
                console.error('Generation error:', err);
                throw err;
            }
        },
        [engine]
    );

    return {
        isLoading,
        isModelLoaded,
        progress,
        error,
        generateResponse,
        selectedModel,
        setSelectedModel,
    };
}
