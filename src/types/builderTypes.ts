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

export interface BuilderState {
    stage: 'idle' | 'analyzing' | 'architecting' | 'designing' | 'building' | 'complete' | 'error';
    intent: SiteIntent | null;
    architecture: SiteArchitecture | null;
    designSystem: DesignSystem | null;
    currentStep: string;
    progress: number; // 0-100
    errors: string[];
}
