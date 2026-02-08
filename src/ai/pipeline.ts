import { streamChat } from '@/api';
import { BUILDER_PROMPTS } from './prompts';
import { SiteIntent, SiteArchitecture, DesignSystem, UXJourney, AssetPlan } from '@/types/builderTypes';
import { generateImageUrl } from '@/services/assetService';

export type PipelineEvent =
    | { type: 'INTENT_GENERATED', payload: SiteIntent }
    | { type: 'ARCHITECTURE_GENERATED', payload: SiteArchitecture }
    | { type: 'UX_GENERATED', payload: UXJourney }
    | { type: 'DESIGN_GENERATED', payload: DesignSystem }
    | { type: 'ASSET_GENERATED', payload: AssetPlan }
    | { type: 'COMPONENT_GENERATED', payload: { sectionId: string, code: string } }
    | { type: 'STEP_STARTED', payload: string }
    | { type: 'ERROR', payload: string }
    | { type: 'COMPLETE', payload: null };

export async function runPlanningPhase(
    userPrompt: string,
    providerId: string,
    apiKey: string,
    modelId: string,
    onupdate: (event: PipelineEvent) => void
) {
    try {
        console.log(`[Builder] Starting planning phase with ${providerId}/${modelId}`);
        onupdate({ type: 'STEP_STARTED', payload: 'Analyzing your intent...' });

        // 1. Intent Reasoning
        const intentPrompt = BUILDER_PROMPTS.INTENT_REASONER + `\n\nUser Request: "${userPrompt}"`;
        const intentJson = await generateJson<SiteIntent>(providerId, apiKey, modelId, intentPrompt);
        onupdate({ type: 'INTENT_GENERATED', payload: intentJson });
        onupdate({ type: 'STEP_STARTED', payload: 'Architecting structure & defining design system...' });

        // 2 & 3. Parallel Architecture and Design System (Both only depend on Intent)
        const archPrompt = BUILDER_PROMPTS.ARCHITECTURE_PLANNER.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));
        const designPrompt = BUILDER_PROMPTS.DESIGN_SYSTEM_GENERATOR.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));

        const [archJson, designJson] = await Promise.all([
            generateJson<SiteArchitecture>(providerId, apiKey, modelId, archPrompt),
            generateJson<DesignSystem>(providerId, apiKey, modelId, designPrompt)
        ]);

        onupdate({ type: 'ARCHITECTURE_GENERATED', payload: archJson });
        onupdate({ type: 'DESIGN_GENERATED', payload: designJson });
        onupdate({ type: 'STEP_STARTED', payload: 'Designing user journeys & sourcing assets...' });

        // 4 & 5. Parallel UX Flow and Asset Intelligence (Both depend on Arch/Design)
        const uxPrompt = BUILDER_PROMPTS.UX_FLOW_DESIGNER
            .replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2))
            .replace('{{ARCHITECTURE_JSON}}', JSON.stringify(archJson, null, 2));

        const assetPrompt = BUILDER_PROMPTS.ASSET_INTELLIGENCE
            .replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2))
            .replace('{{ARCHITECTURE_JSON}}', JSON.stringify(archJson, null, 2))
            .replace('{{DESIGN_JSON}}', JSON.stringify(designJson, null, 2));

        const [uxJson, assetJson] = await Promise.all([
            generateJson<UXJourney>(providerId, apiKey, modelId, uxPrompt),
            generateJson<AssetPlan>(providerId, apiKey, modelId, assetPrompt)
        ]);

        onupdate({ type: 'UX_GENERATED', payload: uxJson });

        // Post-process assets to generate real URLs
        const processedAssets: AssetPlan = {
            section_assets: assetJson.section_assets.map(section => ({
                ...section,
                image_prompts: section.image_prompts.map(prompt => generateImageUrl(prompt))
            }))
        };
        onupdate({ type: 'ASSET_GENERATED', payload: processedAssets });

        // STOP HERE - Wait for user approval
        onupdate({ type: 'COMPLETE', payload: null });

    } catch (error: any) {
        console.error('[Builder] Planning Phase Error:', error);
        onupdate({ type: 'ERROR', payload: error.message || "Planning failed" });
    }
}

export async function runBuildPhase(
    sectionsToBuild: any[], // Ideally typed from SiteArchitecture
    designSystem: DesignSystem,
    assets: AssetPlan,
    providerId: string,
    apiKey: string,
    modelId: string,
    onupdate: (event: PipelineEvent) => void
) {
    try {
        console.log(`[Builder] Starting build phase for ${sectionsToBuild.length} sections`);
        onupdate({ type: 'STEP_STARTED', payload: 'Generating components...' });

        // Generate sections in sequence (Progressive Build Experience)
        for (const section of sectionsToBuild) {
            onupdate({ type: 'STEP_STARTED', payload: `Writing code for "${section.name || section.id}"...` });

            const sectionAssets = assets.section_assets.find(a => a.sectionId === section.id);

            const componentPrompt = BUILDER_PROMPTS.COMPONENT_GENERATOR
                .replace('{{SECTION_JSON}}', JSON.stringify(section, null, 2))
                .replace('{{DESIGN_JSON}}', JSON.stringify(designSystem, null, 2))
                .replace('{{ASSETS_JSON}}', JSON.stringify(sectionAssets || {}, null, 2));

            const code = await generateCode(providerId, apiKey, modelId, componentPrompt);
            onupdate({ type: 'COMPONENT_GENERATED', payload: { sectionId: section.id, code } });
        }

        onupdate({ type: 'COMPLETE', payload: null });

    } catch (error: any) {
        console.error('[Builder] Build Phase Error:', error);
        onupdate({ type: 'ERROR', payload: error.message || "Build failed" });
    }
}

/**
 * Attempts to repair common JSON malformations like trailing commas or unquoted keys.
 */
function repairJson(str: string): string {
    return str
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:\s*/g, '"$2": ') // Ensure quoted keys (best effort)
        .replace(/'/g, '"'); // Single to double quotes
}

/**
 * Extracts the outermost JSON object or array from a string.
 */
function extractJson(str: string): string | null {
    // Try standard code block extraction first
    const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) return codeBlockMatch[1].trim();

    // Find the first { or [ and the corresponding last } or ]
    const firstBrace = str.indexOf('{');
    const firstBracket = str.indexOf('[');
    const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

    if (startIdx === -1) return null;

    const lastBrace = str.lastIndexOf('}');
    const lastBracket = str.lastIndexOf(']');
    const endIdx = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (endIdx === -1 || endIdx < startIdx) return null;

    return str.substring(startIdx, endIdx + 1).trim();
}

// Helper to generate JSON responses with retry logic and robust extraction
async function generateJson<T>(providerId: string, apiKey: string, model: string, prompt: string, retries = 2): Promise<T> {
    let lastError: any = null;
    let lastResponse = '';

    for (let attempt = 0; attempt <= retries; attempt++) {
        let fullResponse = '';
        const messages = [{ role: 'user', content: prompt }];

        try {
            for await (const chunk of streamChat(providerId, apiKey, model, messages)) {
                if (chunk.content) fullResponse += chunk.content;
            }

            lastResponse = fullResponse;
            let cleanJson = extractJson(fullResponse);

            if (!cleanJson) {
                throw new Error("No JSON structure found in response");
            }

            try {
                return JSON.parse(cleanJson) as T;
            } catch (initialError) {
                // Try manual repair
                const repaired = repairJson(cleanJson);
                return JSON.parse(repaired) as T;
            }
        } catch (e) {
            lastError = e;
            console.error(`[Builder] JSON Attempt ${attempt + 1} failed:`, e);
            if (attempt < retries) {
                console.log(`[Builder] Retrying JSON generation... (Attempt ${attempt + 2})`);
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Increased delay
            }
        }
    }

    console.error("[Builder] JSON Generation Exhausted. Final Response:", lastResponse);
    throw new Error(`Failed to generate structured data after ${retries + 1} attempts. Please try again or use a different model.`);
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
