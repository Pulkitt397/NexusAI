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
        onupdate({ type: 'STEP_STARTED', payload: 'Architecting your site structure...' });

        // 2. Architecture Planning
        const archPrompt = BUILDER_PROMPTS.ARCHITECTURE_PLANNER.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));
        const archJson = await generateJson<SiteArchitecture>(providerId, apiKey, modelId, archPrompt);
        onupdate({ type: 'ARCHITECTURE_GENERATED', payload: archJson });
        onupdate({ type: 'STEP_STARTED', payload: 'Designing user journeys...' });

        // 3. UX Flow Design
        const uxPrompt = BUILDER_PROMPTS.UX_FLOW_DESIGNER
            .replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2))
            .replace('{{ARCHITECTURE_JSON}}', JSON.stringify(archJson, null, 2));
        const uxJson = await generateJson<UXJourney>(providerId, apiKey, modelId, uxPrompt);
        onupdate({ type: 'UX_GENERATED', payload: uxJson });
        onupdate({ type: 'STEP_STARTED', payload: 'Creating design system...' });

        // 4. Design System Generation
        const designPrompt = BUILDER_PROMPTS.DESIGN_SYSTEM_GENERATOR.replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2));
        const designJson = await generateJson<DesignSystem>(providerId, apiKey, modelId, designPrompt);
        onupdate({ type: 'DESIGN_GENERATED', payload: designJson });
        onupdate({ type: 'STEP_STARTED', payload: 'Sourcing high-quality assets...' });

        // 5. Asset Intelligence
        const assetPrompt = BUILDER_PROMPTS.ASSET_INTELLIGENCE
            .replace('{{INTENT_JSON}}', JSON.stringify(intentJson, null, 2))
            .replace('{{ARCHITECTURE_JSON}}', JSON.stringify(archJson, null, 2))
            .replace('{{DESIGN_JSON}}', JSON.stringify(designJson, null, 2));

        const assetJson = await generateJson<AssetPlan>(providerId, apiKey, modelId, assetPrompt);

        // Post-process assets to generate real URLs
        const processedAssets: AssetPlan = {
            section_assets: assetJson.section_assets.map(section => ({
                ...section,
                image_prompts: section.image_prompts.map(prompt => generateImageUrl(prompt))
            }))
        };
        onupdate({ type: 'ASSET_GENERATED', payload: processedAssets });

        // STOP HERE - Wait for user approval
        onupdate({ type: 'COMPLETE', payload: null }); // Using COMPLETE to signal end of *this* phase

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

        // Generate all requested sections
        const actualSections = sectionsToBuild;

        for (const section of actualSections) {
            // Find assets for this section
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
