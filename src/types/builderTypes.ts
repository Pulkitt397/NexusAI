export interface SiteIntent {
    goal: string;
    audience: string;
    tone: string;
    primary_action: string;
    site_type: string;
    complexity_level: string;
    content_requirements: string[];
    visual_preferences: string[];
}

export interface SectionSpec {
    id: string;
    name: string;
    type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'footer' | 'header' | 'cta' | 'faq' | 'gallery' | 'contact' | 'generic';
    purpose: string;
    components: string[]; // Component names or descriptions
    priority: 'high' | 'medium' | 'low';
    data_needs?: string[]; // e.g., "pricing_plans", "testimonials_list"
}

export interface SiteArchitecture {
    sections: SectionSpec[];
    layout_strategy: string;
    responsive_rules: string;
    interaction_notes: string;
    navigation_structure: string[];
}

export interface DesignSystem {
    color_palette: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
        surface: string;
    };
    typography: {
        heading_font: string;
        body_font: string;
        scale: string; // e.g., "1.25"
    };
    spacing: {
        unit: number; // e.g., 4 (tailwind default)
        section_padding: string; // e.g., "py-20"
    };
    borderRadius: string; // e.g., "rounded-xl"
    glassmorphism: boolean;
}

export interface ComponentSpec {
    name: string;
    type: string;
    props: Record<string, string>;
    styling: string; // Tailwind classes
    structure: string; // Description of HTML structure
    content_slots: string[];
}

export interface UXJourney {
    overall_strategy: string; // e.g., "Build Trust -> Explain Value -> Convert"
    steps: {
        sectionId: string; // Matches architecture.sections[i].id
        role: 'attention' | 'interest' | 'desire' | 'action' | 'trust' | 'retention';
        user_goal: string; // What the user wants here (e.g., "Verify pricing")
        business_goal: string; // What we want (e.g., "Get sign-up")
        interaction_trigger: string; // e.g., "Scroll to view features", "Click CTA"
    }[];
}

export interface AssetPlan {
    section_assets: {
        sectionId: string;
        image_prompts: string[]; // Prompts for Pollinations.ai, e.g., "cyberpunk city skyline neon"
        icon_keywords: string[]; // Keywords for Lucide icons
    }[];
}

export interface BuilderState {
    stage: 'idle' | 'analyzing' | 'architecting' | 'ux_planning' | 'asset_sourcing' | 'designing' | 'building' | 'complete' | 'error' | 'intent' | 'architecture' | 'build' | 'refine' | 'export';
    intent: SiteIntent | null;
    architecture: SiteArchitecture | null;
    uxJourney: UXJourney | null;
    assets: AssetPlan | null;
    designSystem: DesignSystem | null;
    currentStep: string;
    progress: number; // 0-100
    errors: string[];
}
