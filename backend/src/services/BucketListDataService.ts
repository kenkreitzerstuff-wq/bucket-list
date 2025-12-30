import { BucketItem, LocationData } from '../types';

/**
 * BucketListDataService manages Ken and Gail's original travel bucket list data
 * This serves as the core data source for personalized recommendations
 */
export class BucketListDataService {
  
  /**
   * Ken and Gail's original bucket list data from CSV
   */
  private static readonly ORIGINAL_BUCKET_LIST = [
    {
      destination: "Machu Picchu (Peru)",
      kenPriority: 1,
      gailInterestLevel: "HIGH",
      status: "",
      experiences: ["Ancient ruins exploration", "Hiking Inca Trail", "Cultural immersion", "Photography"],
      estimatedDuration: 10,
      difficulty: "challenging",
      bestSeason: "May-September (dry season)",
      tags: ["adventure", "culture", "history", "hiking"]
    },
    {
      destination: "African Safari (South Africa, Zambia, Tanzania)",
      kenPriority: 1,
      gailInterestLevel: "HIGH",
      status: "",
      experiences: ["Wildlife safari", "Big Five viewing", "Cultural villages", "Photography"],
      estimatedDuration: 14,
      difficulty: "moderate",
      bestSeason: "May-October (dry season)",
      tags: ["wildlife", "adventure", "photography", "nature"]
    },
    {
      destination: "New Zealand",
      kenPriority: 2,
      gailInterestLevel: "",
      status: "",
      experiences: ["Scenic drives", "Adventure sports", "Hobbiton tours", "Fjord exploration"],
      estimatedDuration: 14,
      difficulty: "moderate",
      bestSeason: "October-April (summer)",
      tags: ["adventure", "nature", "scenic", "outdoor"]
    },
    {
      destination: "Yosemite (California)",
      kenPriority: 2,
      gailInterestLevel: "",
      status: "",
      experiences: ["Hiking", "Rock climbing", "Photography", "Nature walks"],
      estimatedDuration: 5,
      difficulty: "moderate",
      bestSeason: "April-October",
      tags: ["nature", "hiking", "photography", "national-park"]
    },
    {
      destination: "Iceland",
      kenPriority: 2,
      gailInterestLevel: "HIGH",
      status: "",
      experiences: ["Northern Lights", "Geysers", "Waterfalls", "Blue Lagoon", "Ring Road"],
      estimatedDuration: 10,
      difficulty: "easy",
      bestSeason: "June-August (summer) or September-March (Northern Lights)",
      tags: ["nature", "scenic", "unique", "photography"]
    },
    {
      destination: "Bryce, Zions, Arches, Capitol Reef, Canyonlands",
      kenPriority: 2,
      gailInterestLevel: "",
      status: "",
      experiences: ["Hiking", "Photography", "Scenic drives", "Rock formations"],
      estimatedDuration: 12,
      difficulty: "moderate",
      bestSeason: "April-May, September-October",
      tags: ["nature", "hiking", "photography", "national-park"]
    },
    {
      destination: "Norway/Sweden/Finland",
      kenPriority: 3,
      gailInterestLevel: "",
      status: "",
      experiences: ["Northern Lights", "Fjord cruises", "Sami culture", "Arctic experiences"],
      estimatedDuration: 12,
      difficulty: "easy",
      bestSeason: "June-August (midnight sun) or December-March (Northern Lights)",
      tags: ["nature", "culture", "scenic", "unique"]
    },
    {
      destination: "Amalfi Coast (Italy)",
      kenPriority: 3,
      gailInterestLevel: "",
      status: "",
      experiences: ["Coastal drives", "Italian cuisine", "Historic towns", "Mediterranean culture"],
      estimatedDuration: 8,
      difficulty: "easy",
      bestSeason: "April-June, September-October",
      tags: ["culture", "food", "scenic", "relaxation"]
    },
    {
      destination: "Thailand, Vietnam, Cambodia, Laos",
      kenPriority: 3,
      gailInterestLevel: "",
      status: "",
      experiences: ["Temple visits", "Street food", "Cultural immersion", "Historic sites"],
      estimatedDuration: 21,
      difficulty: "moderate",
      bestSeason: "November-March (cool/dry season)",
      tags: ["culture", "food", "history", "adventure"]
    },
    {
      destination: "Prague (Czech Republic)",
      kenPriority: 3,
      gailInterestLevel: "",
      status: "",
      experiences: ["Historic architecture", "Castle tours", "Local cuisine", "Cultural walks"],
      estimatedDuration: 5,
      difficulty: "easy",
      bestSeason: "April-June, September-October",
      tags: ["culture", "history", "architecture", "food"]
    },
    {
      destination: "Ireland",
      kenPriority: 4,
      gailInterestLevel: "LOW",
      status: "",
      experiences: ["Scenic drives", "Pub culture", "Historic sites", "Countryside"],
      estimatedDuration: 10,
      difficulty: "easy",
      bestSeason: "May-September",
      tags: ["culture", "scenic", "history", "relaxation"]
    },
    {
      destination: "Scotland",
      kenPriority: 4,
      gailInterestLevel: "LOW",
      status: "",
      experiences: ["Highland tours", "Castle visits", "Whisky tasting", "Scenic drives"],
      estimatedDuration: 10,
      difficulty: "easy",
      bestSeason: "May-September",
      tags: ["culture", "scenic", "history", "food"]
    },
    {
      destination: "Patagonia (Argentina)",
      kenPriority: 4,
      gailInterestLevel: "HIGH",
      status: "",
      experiences: ["Hiking", "Glacier viewing", "Wildlife", "Adventure activities"],
      estimatedDuration: 14,
      difficulty: "challenging",
      bestSeason: "October-April (summer)",
      tags: ["adventure", "nature", "hiking", "wildlife"]
    },
    {
      destination: "Marrakesh (Morocco)",
      kenPriority: 4,
      gailInterestLevel: "",
      status: "",
      experiences: ["Medina exploration", "Souks shopping", "Moroccan cuisine", "Desert trips"],
      estimatedDuration: 7,
      difficulty: "moderate",
      bestSeason: "October-April",
      tags: ["culture", "food", "adventure", "unique"]
    },
    {
      destination: "Great Smokies (TN)",
      kenPriority: 4,
      gailInterestLevel: "LOW",
      status: "",
      experiences: ["Hiking", "Wildlife viewing", "Scenic drives", "Fall foliage"],
      estimatedDuration: 5,
      difficulty: "easy",
      bestSeason: "April-May, September-October",
      tags: ["nature", "hiking", "scenic", "national-park"]
    },
    {
      destination: "Other Parks: Badlands, Death Valley, Sequoia, Grand Teton, Glacier, Rainier, Shenandoah",
      kenPriority: 4,
      gailInterestLevel: "",
      status: "",
      experiences: ["Hiking", "Photography", "Wildlife viewing", "Scenic drives"],
      estimatedDuration: 20,
      difficulty: "moderate",
      bestSeason: "Varies by park",
      tags: ["nature", "hiking", "photography", "national-park"]
    },
    {
      destination: "Bora Bora",
      kenPriority: 5,
      gailInterestLevel: "",
      status: "",
      experiences: ["Beach relaxation", "Water sports", "Overwater bungalows", "Snorkeling"],
      estimatedDuration: 7,
      difficulty: "easy",
      bestSeason: "May-October (dry season)",
      tags: ["relaxation", "beach", "luxury", "water-sports"]
    },
    {
      destination: "Tahiti",
      kenPriority: 5,
      gailInterestLevel: "",
      status: "",
      experiences: ["Beach relaxation", "Polynesian culture", "Water activities", "Island hopping"],
      estimatedDuration: 7,
      difficulty: "easy",
      bestSeason: "May-October (dry season)",
      tags: ["relaxation", "beach", "culture", "water-sports"]
    },
    {
      destination: "Fiji",
      kenPriority: 5,
      gailInterestLevel: "",
      status: "",
      experiences: ["Beach relaxation", "Snorkeling", "Island culture", "Water sports"],
      estimatedDuration: 7,
      difficulty: "easy",
      bestSeason: "May-October (dry season)",
      tags: ["relaxation", "beach", "culture", "water-sports"]
    },
    {
      destination: "Bali (Indonesia)",
      kenPriority: 5,
      gailInterestLevel: "",
      status: "",
      experiences: ["Temple visits", "Rice terraces", "Balinese culture", "Beach relaxation"],
      estimatedDuration: 10,
      difficulty: "easy",
      bestSeason: "April-October (dry season)",
      tags: ["culture", "relaxation", "beach", "spiritual"]
    },
    {
      destination: "Yellowstone (Wyoming)",
      kenPriority: 6,
      gailInterestLevel: "",
      status: "Done - 2024",
      experiences: ["Geysers", "Wildlife viewing", "Hot springs", "Hiking"],
      estimatedDuration: 7,
      difficulty: "easy",
      bestSeason: "April-October",
      tags: ["nature", "wildlife", "national-park", "unique"]
    },
    {
      destination: "New Orleans (Louisiana)",
      kenPriority: 6,
      gailInterestLevel: "",
      status: "Done",
      experiences: ["Jazz music", "Creole cuisine", "French Quarter", "Cultural tours"],
      estimatedDuration: 4,
      difficulty: "easy",
      bestSeason: "October-May",
      tags: ["culture", "food", "music", "history"]
    },
    {
      destination: "Banff (Calgary)",
      kenPriority: 6,
      gailInterestLevel: "",
      status: "Done - 2025",
      experiences: ["Mountain scenery", "Lake activities", "Wildlife viewing", "Hiking"],
      estimatedDuration: 7,
      difficulty: "moderate",
      bestSeason: "June-September",
      tags: ["nature", "scenic", "hiking", "wildlife"]
    }
  ];

  /**
   * Gets all bucket list items
   */
  public static getAllBucketListItems(): any[] {
    return this.ORIGINAL_BUCKET_LIST;
  }

  /**
   * Gets incomplete bucket list items (not done yet)
   */
  public static getIncompleteBucketListItems(): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => 
      !item.status || (!item.status.toLowerCase().includes('done'))
    );
  }

  /**
   * Gets completed bucket list items
   */
  public static getCompletedBucketListItems(): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => 
      item.status && item.status.toLowerCase().includes('done')
    );
  }

  /**
   * Gets high priority items (Ken's priority 1-2 or Gail's HIGH interest)
   */
  public static getHighPriorityItems(): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => 
      item.kenPriority <= 2 || item.gailInterestLevel === 'HIGH'
    );
  }

  /**
   * Gets items by priority level
   */
  public static getItemsByPriority(priority: number): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => item.kenPriority === priority);
  }

  /**
   * Gets items by Gail's interest level
   */
  public static getItemsByGailInterest(level: 'HIGH' | 'LOW'): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => item.gailInterestLevel === level);
  }

  /**
   * Gets items by tags/interests
   */
  public static getItemsByTags(tags: string[]): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item =>
      tags.some(tag => item.tags.includes(tag.toLowerCase()))
    );
  }

  /**
   * Gets items by difficulty level
   */
  public static getItemsByDifficulty(difficulty: 'easy' | 'moderate' | 'challenging'): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => item.difficulty === difficulty);
  }

  /**
   * Gets items suitable for a given duration
   */
  public static getItemsByDuration(minDays: number, maxDays: number): any[] {
    return this.ORIGINAL_BUCKET_LIST.filter(item => 
      item.estimatedDuration >= minDays && item.estimatedDuration <= maxDays
    );
  }

  /**
   * Gets items suitable for current season
   */
  public static getItemsForSeason(month: number): any[] {
    // Simple season mapping - could be enhanced
    const season = this.getSeasonFromMonth(month);
    
    return this.ORIGINAL_BUCKET_LIST.filter(item => {
      const bestSeason = item.bestSeason.toLowerCase();
      return bestSeason.includes(season) || bestSeason.includes('year-round');
    });
  }

  /**
   * Searches items by destination name or experiences
   */
  public static searchItems(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    
    return this.ORIGINAL_BUCKET_LIST.filter(item =>
      item.destination.toLowerCase().includes(lowerQuery) ||
      item.experiences.some((exp: string) => exp.toLowerCase().includes(lowerQuery)) ||
      item.tags.some((tag: string) => tag.includes(lowerQuery))
    );
  }

  /**
   * Gets recommended items based on user preferences
   */
  public static getRecommendedItems(preferences: {
    interests?: string[];
    travelStyle?: string;
    difficulty?: string;
    duration?: string;
    prioritizeGailInterest?: boolean;
  }): any[] {
    let items = this.getIncompleteBucketListItems();

    // Filter by interests/tags
    if (preferences.interests && preferences.interests.length > 0) {
      items = items.filter(item =>
        preferences.interests!.some(interest =>
          item.tags.includes(interest.toLowerCase()) ||
          item.experiences.some((exp: string) => 
            exp.toLowerCase().includes(interest.toLowerCase())
          )
        )
      );
    }

    // Filter by difficulty
    if (preferences.difficulty) {
      items = items.filter(item => item.difficulty === preferences.difficulty);
    }

    // Filter by duration preference
    if (preferences.duration) {
      const durationMap = {
        'short': { min: 1, max: 7 },
        'medium': { min: 7, max: 14 },
        'long': { min: 14, max: 30 }
      };
      
      const range = durationMap[preferences.duration as keyof typeof durationMap];
      if (range) {
        items = items.filter(item => 
          item.estimatedDuration >= range.min && item.estimatedDuration <= range.max
        );
      }
    }

    // Sort by priority and Gail's interest
    items.sort((a, b) => {
      // Prioritize Gail's HIGH interest if requested
      if (preferences.prioritizeGailInterest) {
        if (a.gailInterestLevel === 'HIGH' && b.gailInterestLevel !== 'HIGH') return -1;
        if (b.gailInterestLevel === 'HIGH' && a.gailInterestLevel !== 'HIGH') return 1;
      }
      
      // Then sort by Ken's priority
      return a.kenPriority - b.kenPriority;
    });

    return items;
  }

  /**
   * Converts bucket list item to standard BucketItem format
   */
  public static toBucketItem(item: any, homeLocation?: LocationData): BucketItem {
    return {
      id: `bucket-${item.destination.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      destination: item.destination,
      experiences: item.experiences,
      estimatedDuration: item.estimatedDuration,
      costEstimate: this.estimateCost(item, homeLocation),
      priority: item.kenPriority,
      status: item.status?.toLowerCase().includes('done') ? 'completed' : 'planned',
      notes: `Ken Priority: ${item.kenPriority}, Gail Interest: ${item.gailInterestLevel || 'Not specified'}`
    };
  }

  /**
   * Estimates cost for a bucket list item
   */
  private static estimateCost(item: any, homeLocation?: LocationData): {
    min: number;
    max: number;
    currency: string;
  } {
    // Base cost estimation based on destination and duration
    let baseCostPerDay = 150; // Default mid-range daily cost
    
    // Adjust based on destination
    const destination = item.destination.toLowerCase();
    if (destination.includes('africa') || destination.includes('peru') || destination.includes('morocco')) {
      baseCostPerDay = 120; // Lower cost destinations
    } else if (destination.includes('norway') || destination.includes('iceland') || destination.includes('bora bora')) {
      baseCostPerDay = 300; // Higher cost destinations
    } else if (destination.includes('thailand') || destination.includes('vietnam') || destination.includes('cambodia')) {
      baseCostPerDay = 80; // Budget-friendly destinations
    }

    // Add transportation costs (rough estimates)
    let transportationCost = 800; // Domestic travel
    if (destination.includes('africa') || destination.includes('peru') || destination.includes('new zealand')) {
      transportationCost = 1500; // International long-haul
    } else if (destination.includes('europe') || destination.includes('iceland')) {
      transportationCost = 1000; // International medium-haul
    }

    const totalBaseCost = (baseCostPerDay * item.estimatedDuration) + transportationCost;
    
    return {
      min: Math.round(totalBaseCost * 0.8), // 20% below base
      max: Math.round(totalBaseCost * 1.4), // 40% above base
      currency: 'USD'
    };
  }

  /**
   * Gets season from month number
   */
  private static getSeasonFromMonth(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Gets travel company recommendations from the original data
   */
  public static getTravelCompanyRecommendations(): string[] {
    return [
      'https://www.intrepidtravel.com/us',
      'https://www.thenaturaladventure.com/'
    ];
  }
}