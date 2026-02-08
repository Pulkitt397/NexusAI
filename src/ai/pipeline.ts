import { streamChat } from '@/api';
import { BUILDER_PROMPTS } from './prompts';
import { SiteIntent, SiteArchitecture, DesignSystem } from '@/types/builderTypes';

export type PipelineEvent =
    | { type: 'INTENT_GENERATED', payload: SiteIntent }
    | { type: 'ARCHITECTURE_GENERATED', payload: SiteArchitecture }
    | { type: 'DESIGN_GENERATED', payload: DesignSystem }
    | { type: 'COMPONENT_GENERATED', payload: { sectionId: string, code: string } }
    | { type: 'ERROR', payload: string }
    | { type: 'COMPLETE', payload: null };

export async function runBuilderPipeline(
    userPrompt: string,
    providerId: string,
    apiKey: string,
    modelId: string,
    onupdate: (event: PipelineEvent) => void
) {
    try {
        console.log(`[Builder] Starting pipeline with ${providerId}/${modelId}`);

        // 1. Intent Reasoning
        const intentPrompt = BUILDER_PROMPTS.INTENT_REASONER + `\n\nUser Request: "${userPrompt}"`;
        const intentJson = await generateJson<SiteIntent>(providerId, apiKey, modelId, intentPrompt);
        onupdate({ type: 'INTENT_GENERATED', payload: intentJson });

        // 2. Architecture Planning
        const archPrompt = BUILDER_PROMPTS.ARCHITECTURE_PLANNER.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));
        const archJson = await generateJson<SiteArchitecture>(providerId, apiKey, modelId, archPrompt);
        onupdate({ type: 'ARCHITECTURE_GENERATED', payload: archJson });

        // 3. Design System Generation
        const designPrompt = BUILDER_PROMPTS.DESIGN_SYSTEM_GENERATOR.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));
        const designJson = await generateJson<DesignSystem>(providerId, apiKey, modelId, designPrompt);
        onupdate({ type: 'DESIGN_GENERATED', payload: designJson });

        // 4. Component Generation (First 2 sections only for prototype speed)
        const sectionsToBuild = archJson.sections.slice(0, 2);

        for (const section of sectionsToBuild) {
            const componentPrompt = BUILDER_PROMPTS.COMPONENT_GENERATOR
                .replace('{{SECTION_JSON}}', JSON.stringify(section, null, 2))
                .replace('{{DESIGN_JSON}}', JSON.stringify(designJson, null, 2));

            const code = await generateCode(providerId, apiKey, modelId, componentPrompt);
            onupdate({ type: 'COMPONENT_GENERATED', payload: { sectionId: section.id, code } });
        }

        onupdate({ type: 'COMPLETE', payload: null });

    } catch (error: any) {
        console.error('[Builder] Pipeline Error:', error);
        onupdate({ type: 'ERROR', payload: error.message || "Pipeline failed" });
    }
}

// Helper to generate JSON responses
async function generateJson<T>(providerId: string, apiKey: string, model: string, prompt: string): Promise<T> {
    let fullResponse = '';
    const messages = [{ role: 'user', content: prompt }];

    try {
        for await (const chunk of streamChat(providerId, apiKey, model, messages)) {
            if (chunk.content) fullResponse += chunk.content;
        }

        // Extract JSON from markdown code blocks if present
        const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/) || fullResponse.match(/```\n([\s\S]*?)\n```/);
        const cleanJson = jsonMatch ? jsonMatch[1] : fullResponse;

        return JSON.parse(cleanJson) as T;
    } catch (e) {
        console.error("JSON Generation Failed", e);
        console.error("Raw Response:", fullResponse);
        throw new Error("Failed to generate structured data.");
    }
}

// Helper to generate Code responses
async function generateCode(providerId: string, apiKey: string, model: string, prompt: string): Promise<string> {
    let fullResponse = '';
    const messages = [{ role: 'user', content: prompt }];

    for await (const chunk of streamChat(providerId, apiKey, model, messages)) {
        if (chunk.content) fullResponse += chunk.content;
    }

    // Extract Code from markdown code blocks if present
    const codeMatch = fullResponse.match(/```tsx\n([\s\S]*?)\n```/) ||
        fullResponse.match(/```jsx\n([\s\S]*?)\n```/) ||
        fullResponse.match(/```typescript\n([\s\S]*?)\n```/) ||
        fullResponse.match(/```javascript\n([\s\S]*?)\n```/) ||
        fullResponse.match(/```\n([\s\S]*?)\n```/);

    return codeMatch ? codeMatch[1] : fullResponse;
}
