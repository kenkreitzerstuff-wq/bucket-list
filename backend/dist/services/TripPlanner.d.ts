import { ITripPlanner } from '../types';
import { TripPlan, LocationData, TravelPreferences } from '../types';
export declare class TripPlanner implements ITripPlanner {
    private readonly EXPERIENCE_DURATION_MAP;
    private readonly BASE_DESTINATION_DAYS;
    private readonly TRAVEL_BUFFER_DAYS;
    /**
     * Plans a complete trip with optimized routing and duration calculations
     */
    planTrip(destinations: string[], preferences: TravelPreferences): Promise<TripPlan>;
    /**
     * Optimizes route order to minimize travel time and costs
     */
    optimizeRoute(destinations: string[], homeLocation: LocationData | null): Promise<string[]>;
    /**
     * Creates a detailed plan for a single destination
     */
    private createDestinationPlan;
    /**
     * Calculates optimal duration for a destination based on planned experiences
     */
    private calculateDestinationDuration;
    /**
     * Calculates travel times between consecutive destinations
     */
    private calculateTravelTimes;
    /**
     * Estimates travel time between two destinations (in hours)
     */
    private estimateTravelTime;
    /**
     * Groups destinations by geographic region for route optimization
     */
    private groupDestinationsByRegion;
    /**
     * Helper methods for region detection
     */
    private isEuropeanDestination;
    private isAsianDestination;
    private isAmericasDestination;
    private isAfricanDestination;
    private isOceaniaDestination;
    /**
     * Determines best time to visit based on destination
     */
    private determineBestTimeToVisit;
    /**
     * Calculates total trip duration including travel time
     */
    private calculateTotalDuration;
    /**
     * Aggregates cost estimates from all destinations
     */
    private aggregateCostEstimates;
    /**
     * Creates mock cost estimate for a destination
     */
    private createMockCostEstimate;
    /**
     * Estimates transportation costs to a destination
     */
    private estimateTransportationCost;
}
//# sourceMappingURL=TripPlanner.d.ts.map