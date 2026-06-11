"use client";

import CTASection from "./cta-section";
import FeaturesHighlightSection from "./features-highlight-section";
import HeroSection from "./hero-section";

export function HomePage() {
	return (
		<div className="min-h-screen">
			<HeroSection />
			<FeaturesHighlightSection />
			<CTASection />
		</div>
	);
}
