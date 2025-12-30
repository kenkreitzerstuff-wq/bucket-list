"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripPlanner = void 0;
class TripPlanner {
    constructor() {
        this.EXPERIENCE_DURATION_MAP = {
            // Cultural experiences (days)
            'museum': 0.5,
            'historical site': 1,
            'cultural tour': 1,
            'local festival': 2,
            'art gallery': 0.5,
            'architecture': 1,
            // Adventure experiences (days)
            'hiking': 1,
            'trekking': 3,
            'climbing': 2,
            'safari': 3,
            'diving': 1,
            'snorkeling': 0.5,
            'skiing': 2,
            'surfing': 1,
            // Food & lifestyle (days)
            'food tour': 0.5,
            'cooking class': 0.5,
            'wine tasting': 0.5,
            'shopping': 1,
            'nightlife': 0.5,
            'spa': 1,
            // Nature experiences (days)
            'beach': 2,
            'national park': 2,
            'wildlife': 2,
            'scenic drive': 1,
            'boat tour': 0.5,
            // Default fallback
            'default': 1
        };
        this.BASE_DESTINATION_DAYS = 3; // Minimum days per destination
        this.TRAVEL_BUFFER_DAYS = 1; // Buffer for travel between destinations
    }
    /**
     * Plans a complete trip with optimized routing and duration calculations
     */
    async planTrip(destinations, preferences) {
        if (destinations.length === 0) {
            throw new Error('At least one destination is required for trip planning');
        }
        // Create destination plans with duration calculations
        const destinationPlans = await Promise.all(destinations.map(dest => this.createDestinationPlan(dest, preferences)));
        // Optimize route for multi-destination trips
        const suggestedRoute = destinations.length > 1
            ? await this.optimizeRoute(destinations, preferences.homeLocation || null)
            : destinations;
        // Calculate travel times between destinations
        const travelTimes = await this.calculateTravelTimes(suggestedRoute);
        // Calculate total duration including travel time
        const totalDuration = this.calculateTotalDuration(destinationPlans, travelTimes);
        // Aggregate total cost estimate
        const totalCost = this.aggregateCostEstimates(destinationPlans);
        return {
            destinations: destinationPlans,
            totalDuration,
            totalCost,
            suggestedRoute,
            travelTimes
        };
    }
    /**
     * Optimizes route order to minimize travel time and costs
     */
    async optimizeRoute(destinations, homeLocation) {
        if (destinations.length <= 1) {
            return destinations;
        }
        // For now, implement a simple nearest-neighbor optimization
        // In a real implementation, this would use actual geographic data
        const optimized = [...destinations];
        // Simple heuristic: group destinations by continent/region
        const regionGroups = this.groupDestinationsByRegion(destinations);
        // Flatten groups to create optimized route
        const result = [];
        for (const group of regionGroups) {
            result.push(...group);
        }
        return result;
    }
    /**
     * Creates a detailed plan for a single destination
     */
    async createDestinationPlan(destination, preferences) {
        // Extract experiences from preferences or use defaults
        const experiences = preferences.interests || ['sightseeing', 'local culture'];
        // Calculate suggested duration based on experiences
        const suggestedDuration = this.calculateDestinationDuration(experiences);
        // Create mock cost estimate (in real implementation, would call external APIs)
        const estimatedCost = this.createMockCostEstimate(destination, suggestedDuration, preferences);
        return {
            destination,
            suggestedDuration,
            experiences,
            bestTimeToVisit: this.determineBestTimeToVisit(destination),
            estimatedCost
        };
    }
    /**
     * Calculates optimal duration for a destination based on planned experiences
     */
    calculateDestinationDuration(experiences) {
        let totalDays = this.BASE_DESTINATION_DAYS;
        for (const experience of experiences) {
            // Find matching experience type or use default
            const experienceKey = Object.keys(this.EXPERIENCE_DURATION_MAP)
                .find(key => experience.toLowerCase().includes(key)) || 'default';
            totalDays += this.EXPERIENCE_DURATION_MAP[experienceKey];
        }
        // Round up to nearest half day and ensure minimum duration
        return Math.max(Math.ceil(totalDays * 2) / 2, this.BASE_DESTINATION_DAYS);
    }
    /**
     * Calculates travel times between consecutive destinations
     */
    async calculateTravelTimes(destinations) {
        const travelTimes = {};
        for (let i = 0; i < destinations.length - 1; i++) {
            const from = destinations[i];
            const to = destinations[i + 1];
            const key = `${from}-${to}`;
            // Mock travel time calculation (in real implementation, would use travel APIs)
            travelTimes[key] = this.estimateTravelTime(from, to);
        }
        return travelTimes;
    }
    /**
     * Estimates travel time between two destinations (in hours)
     */
    estimateTravelTime(from, to) {
        // Simple heuristic based on destination types
        // In real implementation, would use actual travel APIs
        const sameCountryKeywords = ['city', 'town', 'village'];
        const fromIsCity = sameCountryKeywords.some(keyword => from.toLowerCase().includes(keyword));
        const toIsCity = sameCountryKeywords.some(keyword => to.toLowerCase().includes(keyword));
        if (fromIsCity && toIsCity) {
            return 4; // Domestic travel: ~4 hours average
        }
        else {
            return 8; // International travel: ~8 hours average (including connections)
        }
    }
    /**
     * Groups destinations by geographic region for route optimization
     */
    groupDestinationsByRegion(destinations) {
        // Simple grouping by common geographic indicators
        const regions = {
            europe: [],
            asia: [],
            americas: [],
            africa: [],
            oceania: [],
            other: []
        };
        for (const dest of destinations) {
            const destLower = dest.toLowerCase();
            if (this.isEuropeanDestination(destLower)) {
                regions.europe.push(dest);
            }
            else if (this.isAsianDestination(destLower)) {
                regions.asia.push(dest);
            }
            else if (this.isAmericasDestination(destLower)) {
                regions.americas.push(dest);
            }
            else if (this.isAfricanDestination(destLower)) {
                regions.africa.push(dest);
            }
            else if (this.isOceaniaDestination(destLower)) {
                regions.oceania.push(dest);
            }
            else {
                regions.other.push(dest);
            }
        }
        // Return non-empty groups
        return Object.values(regions).filter(group => group.length > 0);
    }
    /**
     * Helper methods for region detection
     */
    isEuropeanDestination(dest) {
        const europeanKeywords = ['paris', 'london', 'rome', 'berlin', 'madrid', 'amsterdam', 'vienna', 'prague', 'barcelona', 'italy', 'france', 'spain', 'germany', 'uk', 'england'];
        return europeanKeywords.some(keyword => dest.includes(keyword));
    }
    isAsianDestination(dest) {
        const asianKeywords = ['tokyo', 'beijing', 'seoul', 'bangkok', 'singapore', 'mumbai', 'delhi', 'japan', 'china', 'thailand', 'india', 'korea', 'vietnam'];
        return asianKeywords.some(keyword => dest.includes(keyword));
    }
    isAmericasDestination(dest) {
        const americasKeywords = ['new york', 'los angeles', 'toronto', 'mexico', 'brazil', 'argentina', 'usa', 'canada', 'chile', 'peru'];
        return americasKeywords.some(keyword => dest.includes(keyword));
    }
    isAfricanDestination(dest) {
        const africanKeywords = ['cairo', 'cape town', 'nairobi', 'morocco', 'egypt', 'south africa', 'kenya', 'tanzania'];
        return africanKeywords.some(keyword => dest.includes(keyword));
    }
    isOceaniaDestination(dest) {
        const oceaniaKeywords = ['sydney', 'melbourne', 'auckland', 'australia', 'new zealand', 'fiji'];
        return oceaniaKeywords.some(keyword => dest.includes(keyword));
    }
    /**
     * Determines best time to visit based on destination
     */
    determineBestTimeToVisit(destination) {
        // Simple heuristic - in real implementation would use weather/season APIs
        const destLower = destination.toLowerCase();
        if (this.isEuropeanDestination(destLower)) {
            return 'May-September (Spring/Summer)';
        }
        else if (this.isAsianDestination(destLower)) {
            return 'October-March (Dry season)';
        }
        else if (this.isAmericasDestination(destLower)) {
            return 'April-October (Mild weather)';
        }
        else {
            return 'Year-round (Check local seasons)';
        }
    }
    /**
     * Calculates total trip duration including travel time
     */
    calculateTotalDuration(destinationPlans, travelTimes) {
        const destinationDays = destinationPlans.reduce((total, plan) => total + plan.suggestedDuration, 0);
        // Add travel buffer days for multi-destination trips
        const travelBufferDays = destinationPlans.length > 1
            ? (destinationPlans.length - 1) * this.TRAVEL_BUFFER_DAYS
            : 0;
        return destinationDays + travelBufferDays;
    }
    /**
     * Aggregates cost estimates from all destinations
     */
    aggregateCostEstimates(destinationPlans) {
        const aggregated = {
            transportation: { min: 0, max: 0, currency: 'USD' },
            accommodation: { min: 0, max: 0, currency: 'USD' },
            activities: { min: 0, max: 0, currency: 'USD' },
            food: { min: 0, max: 0, currency: 'USD' },
            total: { min: 0, max: 0, currency: 'USD' },
            currency: 'USD',
            lastUpdated: new Date()
        };
        for (const plan of destinationPlans) {
            const cost = plan.estimatedCost;
            aggregated.transportation.min += cost.transportation.min;
            aggregated.transportation.max += cost.transportation.max;
            aggregated.accommodation.min += cost.accommodation.min;
            aggregated.accommodation.max += cost.accommodation.max;
            aggregated.activities.min += cost.activities.min;
            aggregated.activities.max += cost.activities.max;
            aggregated.food.min += cost.food.min;
            aggregated.food.max += cost.food.max;
        }
        // Calculate total
        aggregated.total.min = aggregated.transportation.min + aggregated.accommodation.min +
            aggregated.activities.min + aggregated.food.min;
        aggregated.total.max = aggregated.transportation.max + aggregated.accommodation.max +
            aggregated.activities.max + aggregated.food.max;
        return aggregated;
    }
    /**
     * Creates mock cost estimate for a destination
     */
    createMockCostEstimate(destination, duration, preferences) {
        // Base costs per day based on travel style
        const baseCosts = {
            budget: { accommodation: 30, food: 25, activities: 20 },
            'mid-range': { accommodation: 80, food: 50, activities: 60 },
            luxury: { accommodation: 200, food: 100, activities: 150 },
            adventure: { accommodation: 50, food: 35, activities: 80 } // Adventure style - mid-range accommodation, more activities
        };
        const style = preferences.travelStyle || 'mid-range';
        const base = baseCosts[style];
        // Transportation costs (one-time per destination)
        const transportationCost = this.estimateTransportationCost(destination, style);
        return {
            transportation: transportationCost,
            accommodation: {
                min: base.accommodation * duration * 0.8,
                max: base.accommodation * duration * 1.2,
                currency: 'USD'
            },
            activities: {
                min: base.activities * duration * 0.7,
                max: base.activities * duration * 1.3,
                currency: 'USD'
            },
            food: {
                min: base.food * duration * 0.8,
                max: base.food * duration * 1.2,
                currency: 'USD'
            },
            total: {
                min: 0, // Will be calculated
                max: 0, // Will be calculated
                currency: 'USD'
            },
            currency: 'USD',
            lastUpdated: new Date()
        };
    }
    /**
     * Estimates transportation costs to a destination
     */
    estimateTransportationCost(destination, travelStyle) {
        const destLower = destination.toLowerCase();
        let baseCost = 500; // Default international flight cost
        // Adjust based on destination
        if (this.isEuropeanDestination(destLower)) {
            baseCost = 400;
        }
        else if (this.isAsianDestination(destLower)) {
            baseCost = 800;
        }
        else if (this.isAmericasDestination(destLower)) {
            baseCost = 300;
        }
        // Adjust based on travel style
        const styleMultiplier = {
            budget: 0.7,
            'mid-range': 1.0,
            luxury: 1.8
        }[travelStyle] || 1.0;
        const adjustedCost = baseCost * styleMultiplier;
        return {
            min: Math.round(adjustedCost * 0.8),
            max: Math.round(adjustedCost * 1.3),
            currency: 'USD'
        };
    }
}
exports.TripPlanner = TripPlanner;
//# sourceMappingURL=TripPlanner.js.map