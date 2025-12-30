import { ICostEstimator } from '../types';
import { CostEstimate, TripData, LocationData } from '../types';
export declare class CostEstimator implements ICostEstimator {
    private readonly CURRENCY;
    private readonly STYLE_MULTIPLIERS;
    private readonly REGIONAL_BASE_COSTS;
    private readonly TRANSPORT_BASE_COSTS;
    /**
     * Estimates comprehensive costs for a trip using home location as departure point
     */
    estimateCosts(trip: TripData, homeLocation: LocationData): Promise<CostEstimate>;
    /**
     * Updates cost estimate for an existing trip
     */
    updateCostEstimate(tripId: string): Promise<CostEstimate>;
    /**
     * Calculates transportation costs from home location to all destinations
     */
    private calculateTransportationCosts;
    /**
     * Calculates flight cost between two locations
     */
    private calculateFlightCost;
    /**
     * Determines distance category between two locations
     */
    private determineDistanceCategory;
    /**
     * Calculates accommodation costs based on trip duration and destinations
     */
    private calculateAccommodationCosts;
    /**
     * Calculates activity costs based on experiences and destinations
     */
    private calculateActivitiesCosts;
    /**
     * Calculates food costs based on trip duration and destinations
     */
    private calculateFoodCosts;
    /**
     * Calculates total cost range from component cost ranges
     */
    private calculateTotalCostRange;
    /**
     * Determines the geographic region of a location
     */
    private getLocationRegion;
    /**
     * Helper methods for region detection
     */
    private isEuropeanDestination;
    private isAsianDestination;
    private isAmericasDestination;
    private isAfricanDestination;
    private isOceaniaDestination;
    /**
     * Checks if two locations are in the same country
     */
    private isSameCountry;
    /**
     * Gets popularity multiplier for destination pricing
     */
    private getDestinationPopularityMultiplier;
    /**
     * Gets cost multiplier based on experience types
     */
    private getExperienceCostMultiplier;
    /**
     * Applies travel style adjustments to cost estimate
     */
    applyTravelStyleAdjustments(baseCost: CostEstimate, travelStyle: 'budget' | 'mid-range' | 'luxury'): CostEstimate;
}
//# sourceMappingURL=CostEstimator.d.ts.map