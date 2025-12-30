"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostEstimator = void 0;
class CostEstimator {
    constructor() {
        this.CURRENCY = 'USD';
        // Base cost multipliers by travel style
        this.STYLE_MULTIPLIERS = {
            budget: { accommodation: 0.6, food: 0.7, activities: 0.5, transport: 0.8 },
            'mid-range': { accommodation: 1.0, food: 1.0, activities: 1.0, transport: 1.0 },
            luxury: { accommodation: 2.5, food: 1.8, activities: 2.0, transport: 1.5 }
        };
        // Base daily costs by destination region (USD)
        this.REGIONAL_BASE_COSTS = {
            europe: { accommodation: 80, food: 45, activities: 60 },
            asia: { accommodation: 40, food: 25, activities: 35 },
            americas: { accommodation: 90, food: 50, activities: 70 },
            africa: { accommodation: 60, food: 30, activities: 50 },
            oceania: { accommodation: 120, food: 60, activities: 80 },
            default: { accommodation: 70, food: 40, activities: 55 }
        };
        // Transportation base costs by distance/region (USD)
        this.TRANSPORT_BASE_COSTS = {
            domestic: { min: 200, max: 600 },
            regional: { min: 400, max: 1200 },
            intercontinental: { min: 800, max: 2500 }
        };
    }
    /**
     * Estimates comprehensive costs for a trip using home location as departure point
     */
    async estimateCosts(trip, homeLocation) {
        try {
            if (!trip.destinations || trip.destinations.length === 0) {
                const error = new Error('Trip must have at least one destination for cost estimation');
                error.statusCode = 400;
                error.details = {
                    trip: {
                        hasDestinations: !!trip.destinations,
                        destinationCount: trip.destinations?.length || 0,
                        hasDuration: !!trip.duration,
                        hasExperiences: !!trip.experiences
                    },
                    timestamp: new Date().toISOString(),
                    service: 'CostEstimator.estimateCosts'
                };
                throw error;
            }
            if (!homeLocation) {
                const error = new Error('Home location is required for cost estimation');
                error.statusCode = 400;
                error.details = {
                    homeLocation: null,
                    trip: {
                        destinationCount: trip.destinations?.length || 0,
                        destinations: trip.destinations
                    },
                    timestamp: new Date().toISOString(),
                    service: 'CostEstimator.estimateCosts'
                };
                throw error;
            }
            // Calculate transportation costs from home location
            const transportationCost = this.calculateTransportationCosts(trip.destinations, homeLocation);
            // Calculate accommodation costs based on duration and destinations
            const accommodationCost = this.calculateAccommodationCosts(trip);
            // Calculate activity costs based on experiences and destinations
            const activitiesCost = this.calculateActivitiesCosts(trip);
            // Calculate food costs based on duration and destinations
            const foodCost = this.calculateFoodCosts(trip);
            // Calculate total cost range
            const totalCost = this.calculateTotalCostRange([
                transportationCost,
                accommodationCost,
                activitiesCost,
                foodCost
            ]);
            return {
                transportation: transportationCost,
                accommodation: accommodationCost,
                activities: activitiesCost,
                food: foodCost,
                total: totalCost,
                currency: this.CURRENCY,
                lastUpdated: new Date()
            };
        }
        catch (error) {
            if (error.statusCode) {
                // Re-throw validation errors with existing details
                throw error;
            }
            const errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                trip: {
                    destinationCount: trip?.destinations?.length || 0,
                    destinations: trip?.destinations || [],
                    duration: trip?.duration,
                    experienceCount: trip?.experiences?.length || 0,
                    experiences: trip?.experiences || []
                },
                homeLocation: {
                    hasLocation: !!homeLocation,
                    city: homeLocation?.city,
                    country: homeLocation?.country,
                    hasCoordinates: !!(homeLocation?.coordinates?.lat && homeLocation?.coordinates?.lng)
                },
                timestamp: new Date().toISOString(),
                service: 'CostEstimator.estimateCosts'
            };
            console.error('Detailed error estimating costs:', errorDetails);
            const enhancedError = new Error(`Failed to estimate trip costs: ${errorDetails.message}`);
            enhancedError.details = errorDetails;
            enhancedError.statusCode = 500;
            throw enhancedError;
        }
    }
    /**
     * Updates cost estimate for an existing trip
     */
    async updateCostEstimate(tripId) {
        try {
            // In a real implementation, this would fetch trip data from storage
            // For now, throw an error indicating this needs to be implemented with actual data storage
            const error = new Error(`Cost estimate update for trip ${tripId} requires data storage implementation`);
            error.statusCode = 501; // Not Implemented
            error.details = {
                tripId,
                reason: 'Data storage layer not implemented',
                timestamp: new Date().toISOString(),
                service: 'CostEstimator.updateCostEstimate'
            };
            throw error;
        }
        catch (error) {
            if (error.statusCode) {
                // Re-throw with existing details
                throw error;
            }
            const errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                tripId,
                timestamp: new Date().toISOString(),
                service: 'CostEstimator.updateCostEstimate'
            };
            console.error('Detailed error updating cost estimate:', errorDetails);
            const enhancedError = new Error(`Failed to update cost estimate for trip ${tripId}: ${errorDetails.message}`);
            enhancedError.details = errorDetails;
            enhancedError.statusCode = 500;
            throw enhancedError;
        }
    }
    /**
     * Calculates transportation costs from home location to all destinations
     */
    calculateTransportationCosts(destinations, homeLocation) {
        let totalMinCost = 0;
        let totalMaxCost = 0;
        // Calculate cost from home to first destination
        const firstDestinationCost = this.calculateFlightCost(homeLocation, destinations[0]);
        totalMinCost += firstDestinationCost.min;
        totalMaxCost += firstDestinationCost.max;
        // Calculate costs between destinations for multi-destination trips
        for (let i = 0; i < destinations.length - 1; i++) {
            const fromDest = destinations[i];
            const toDest = destinations[i + 1];
            const segmentCost = this.calculateFlightCost(fromDest, toDest);
            totalMinCost += segmentCost.min;
            totalMaxCost += segmentCost.max;
        }
        // Calculate return cost from last destination to home
        if (destinations.length > 0) {
            const returnCost = this.calculateFlightCost(destinations[destinations.length - 1], homeLocation);
            totalMinCost += returnCost.min;
            totalMaxCost += returnCost.max;
        }
        return {
            min: Math.round(totalMinCost),
            max: Math.round(totalMaxCost),
            currency: this.CURRENCY
        };
    }
    /**
     * Calculates flight cost between two locations
     */
    calculateFlightCost(from, to) {
        const fromLocation = typeof from === 'string' ? from : `${from.city}, ${from.country}`;
        const toLocation = typeof to === 'string' ? to : `${to.city}, ${to.country}`;
        // Determine distance category
        const distanceCategory = this.determineDistanceCategory(fromLocation, toLocation);
        const baseCost = this.TRANSPORT_BASE_COSTS[distanceCategory];
        // Add some variation based on destination popularity and seasonality
        const popularityMultiplier = this.getDestinationPopularityMultiplier(toLocation);
        return {
            min: Math.round(baseCost.min * popularityMultiplier * 0.9),
            max: Math.round(baseCost.max * popularityMultiplier * 1.1),
            currency: this.CURRENCY
        };
    }
    /**
     * Determines distance category between two locations
     */
    determineDistanceCategory(from, to) {
        const fromRegion = this.getLocationRegion(from);
        const toRegion = this.getLocationRegion(to);
        // Same country indicators
        if (this.isSameCountry(from, to)) {
            return 'domestic';
        }
        // Same region
        if (fromRegion === toRegion) {
            return 'regional';
        }
        // Different continents
        return 'intercontinental';
    }
    /**
     * Calculates accommodation costs based on trip duration and destinations
     */
    calculateAccommodationCosts(trip) {
        const duration = trip.duration || 7; // Default 7 days if not specified
        let totalMinCost = 0;
        let totalMaxCost = 0;
        // Calculate accommodation cost for each destination
        for (const destination of trip.destinations) {
            const region = this.getLocationRegion(destination);
            const baseCosts = this.REGIONAL_BASE_COSTS[region] || this.REGIONAL_BASE_COSTS.default;
            // Estimate days per destination (evenly distributed)
            const daysPerDestination = Math.ceil(duration / trip.destinations.length);
            // Apply variation range (±20%)
            const minCostPerNight = baseCosts.accommodation * 0.8;
            const maxCostPerNight = baseCosts.accommodation * 1.2;
            totalMinCost += minCostPerNight * daysPerDestination;
            totalMaxCost += maxCostPerNight * daysPerDestination;
        }
        return {
            min: Math.round(totalMinCost),
            max: Math.round(totalMaxCost),
            currency: this.CURRENCY
        };
    }
    /**
     * Calculates activity costs based on experiences and destinations
     */
    calculateActivitiesCosts(trip) {
        const duration = trip.duration || 7;
        const experienceCount = trip.experiences?.length || 3; // Default 3 experiences
        let totalMinCost = 0;
        let totalMaxCost = 0;
        for (const destination of trip.destinations) {
            const region = this.getLocationRegion(destination);
            const baseCosts = this.REGIONAL_BASE_COSTS[region] || this.REGIONAL_BASE_COSTS.default;
            // Estimate days per destination
            const daysPerDestination = Math.ceil(duration / trip.destinations.length);
            // Calculate activity costs based on experience types
            const experienceCostMultiplier = this.getExperienceCostMultiplier(trip.experiences || []);
            const minCostPerDay = baseCosts.activities * 0.7 * experienceCostMultiplier;
            const maxCostPerDay = baseCosts.activities * 1.3 * experienceCostMultiplier;
            totalMinCost += minCostPerDay * daysPerDestination;
            totalMaxCost += maxCostPerDay * daysPerDestination;
        }
        return {
            min: Math.round(totalMinCost),
            max: Math.round(totalMaxCost),
            currency: this.CURRENCY
        };
    }
    /**
     * Calculates food costs based on trip duration and destinations
     */
    calculateFoodCosts(trip) {
        const duration = trip.duration || 7;
        let totalMinCost = 0;
        let totalMaxCost = 0;
        for (const destination of trip.destinations) {
            const region = this.getLocationRegion(destination);
            const baseCosts = this.REGIONAL_BASE_COSTS[region] || this.REGIONAL_BASE_COSTS.default;
            // Estimate days per destination
            const daysPerDestination = Math.ceil(duration / trip.destinations.length);
            // Food costs with variation (±25%)
            const minCostPerDay = baseCosts.food * 0.75;
            const maxCostPerDay = baseCosts.food * 1.25;
            totalMinCost += minCostPerDay * daysPerDestination;
            totalMaxCost += maxCostPerDay * daysPerDestination;
        }
        return {
            min: Math.round(totalMinCost),
            max: Math.round(totalMaxCost),
            currency: this.CURRENCY
        };
    }
    /**
     * Calculates total cost range from component cost ranges
     */
    calculateTotalCostRange(costRanges) {
        const totalMin = costRanges.reduce((sum, range) => sum + range.min, 0);
        const totalMax = costRanges.reduce((sum, range) => sum + range.max, 0);
        return {
            min: totalMin,
            max: totalMax,
            currency: this.CURRENCY
        };
    }
    /**
     * Determines the geographic region of a location
     */
    getLocationRegion(location) {
        const locationLower = location.toLowerCase();
        // European destinations
        if (this.isEuropeanDestination(locationLower)) {
            return 'europe';
        }
        // Asian destinations
        if (this.isAsianDestination(locationLower)) {
            return 'asia';
        }
        // Americas destinations
        if (this.isAmericasDestination(locationLower)) {
            return 'americas';
        }
        // African destinations
        if (this.isAfricanDestination(locationLower)) {
            return 'africa';
        }
        // Oceania destinations
        if (this.isOceaniaDestination(locationLower)) {
            return 'oceania';
        }
        return 'default';
    }
    /**
     * Helper methods for region detection
     */
    isEuropeanDestination(location) {
        const europeanKeywords = [
            'paris', 'london', 'rome', 'berlin', 'madrid', 'amsterdam', 'vienna', 'prague',
            'barcelona', 'italy', 'france', 'spain', 'germany', 'uk', 'england', 'portugal',
            'greece', 'switzerland', 'austria', 'netherlands', 'belgium', 'sweden', 'norway'
        ];
        return europeanKeywords.some(keyword => location.includes(keyword));
    }
    isAsianDestination(location) {
        const asianKeywords = [
            'tokyo', 'beijing', 'seoul', 'bangkok', 'singapore', 'mumbai', 'delhi', 'japan',
            'china', 'thailand', 'india', 'korea', 'vietnam', 'indonesia', 'malaysia', 'philippines'
        ];
        return asianKeywords.some(keyword => location.includes(keyword));
    }
    isAmericasDestination(location) {
        const americasKeywords = [
            'new york', 'los angeles', 'toronto', 'mexico', 'brazil', 'argentina', 'usa',
            'canada', 'chile', 'peru', 'colombia', 'united states', 'america'
        ];
        return americasKeywords.some(keyword => location.includes(keyword));
    }
    isAfricanDestination(location) {
        const africanKeywords = [
            'cairo', 'cape town', 'nairobi', 'morocco', 'egypt', 'south africa', 'kenya',
            'tanzania', 'ghana', 'nigeria', 'ethiopia', 'uganda'
        ];
        return africanKeywords.some(keyword => location.includes(keyword));
    }
    isOceaniaDestination(location) {
        const oceaniaKeywords = [
            'sydney', 'melbourne', 'auckland', 'australia', 'new zealand', 'fiji', 'tahiti'
        ];
        return oceaniaKeywords.some(keyword => location.includes(keyword));
    }
    /**
     * Checks if two locations are in the same country
     */
    isSameCountry(from, to) {
        // Simple heuristic - check if both contain same country indicators
        const countries = ['usa', 'canada', 'uk', 'france', 'germany', 'italy', 'spain', 'japan', 'australia'];
        for (const country of countries) {
            if (from.toLowerCase().includes(country) && to.toLowerCase().includes(country)) {
                return true;
            }
        }
        // Check for explicit country names in both locations
        const fromParts = from.toLowerCase().split(',').map(part => part.trim());
        const toParts = to.toLowerCase().split(',').map(part => part.trim());
        return fromParts.some(part => toParts.includes(part));
    }
    /**
     * Gets popularity multiplier for destination pricing
     */
    getDestinationPopularityMultiplier(destination) {
        const destLower = destination.toLowerCase();
        // High-demand destinations
        const highDemandDestinations = ['paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona'];
        if (highDemandDestinations.some(dest => destLower.includes(dest))) {
            return 1.3;
        }
        // Medium-demand destinations
        const mediumDemandDestinations = ['berlin', 'madrid', 'seoul', 'bangkok', 'sydney'];
        if (mediumDemandDestinations.some(dest => destLower.includes(dest))) {
            return 1.1;
        }
        // Default multiplier
        return 1.0;
    }
    /**
     * Gets cost multiplier based on experience types
     */
    getExperienceCostMultiplier(experiences) {
        let multiplier = 1.0;
        for (const experience of experiences) {
            const expLower = experience.toLowerCase();
            // Expensive experiences
            if (expLower.includes('luxury') || expLower.includes('private') || expLower.includes('helicopter')) {
                multiplier += 0.5;
            }
            // Adventure experiences
            else if (expLower.includes('safari') || expLower.includes('diving') || expLower.includes('climbing')) {
                multiplier += 0.3;
            }
            // Cultural experiences
            else if (expLower.includes('tour') || expLower.includes('museum') || expLower.includes('cultural')) {
                multiplier += 0.1;
            }
            // Budget experiences
            else if (expLower.includes('hiking') || expLower.includes('walking') || expLower.includes('free')) {
                multiplier -= 0.1;
            }
        }
        // Ensure multiplier stays within reasonable bounds
        return Math.max(0.5, Math.min(3.0, multiplier));
    }
    /**
     * Applies travel style adjustments to cost estimate
     */
    applyTravelStyleAdjustments(baseCost, travelStyle) {
        const multipliers = this.STYLE_MULTIPLIERS[travelStyle];
        return {
            transportation: {
                min: Math.round(baseCost.transportation.min * multipliers.transport),
                max: Math.round(baseCost.transportation.max * multipliers.transport),
                currency: this.CURRENCY
            },
            accommodation: {
                min: Math.round(baseCost.accommodation.min * multipliers.accommodation),
                max: Math.round(baseCost.accommodation.max * multipliers.accommodation),
                currency: this.CURRENCY
            },
            activities: {
                min: Math.round(baseCost.activities.min * multipliers.activities),
                max: Math.round(baseCost.activities.max * multipliers.activities),
                currency: this.CURRENCY
            },
            food: {
                min: Math.round(baseCost.food.min * multipliers.food),
                max: Math.round(baseCost.food.max * multipliers.food),
                currency: this.CURRENCY
            },
            total: {
                min: Math.round((baseCost.transportation.min * multipliers.transport) +
                    (baseCost.accommodation.min * multipliers.accommodation) +
                    (baseCost.activities.min * multipliers.activities) +
                    (baseCost.food.min * multipliers.food)),
                max: Math.round((baseCost.transportation.max * multipliers.transport) +
                    (baseCost.accommodation.max * multipliers.accommodation) +
                    (baseCost.activities.max * multipliers.activities) +
                    (baseCost.food.max * multipliers.food)),
                currency: this.CURRENCY
            },
            currency: this.CURRENCY,
            lastUpdated: new Date()
        };
    }
}
exports.CostEstimator = CostEstimator;
//# sourceMappingURL=CostEstimator.js.map