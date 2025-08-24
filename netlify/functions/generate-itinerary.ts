import type { Handler } from '@netlify/functions';

interface ItineraryRequest {
  city: string;
  budget: number;
  days: number;
  travelers: number;
  interests: string[];
  accommodation: string;
  transportation: string;
}

interface ItineraryDay {
  day: number;
  activities: string[];
  meals: string[];
  accommodation: string;
  estimatedCost: number;
}

interface ItineraryResponse {
  city: string;
  summary: string;
  totalBudget: number;
  days: ItineraryDay[];
  tips: string[];
  emergencyContacts: string[];
}

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Handle POST request
  if (event.httpMethod === 'POST') {
    try {
      const body: ItineraryRequest = JSON.parse(event.body || '{}');
      
      // Validate input
      if (!body.city || body.budget <= 0 || body.days <= 0 || body.travelers <= 0) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Invalid input parameters'
          }),
        };
      }

      // Generate mock itinerary (since we can't use Google Places API in serverless)
      const itinerary = await generateMockItinerary(body);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(itinerary),
      };
    } catch (error) {
      console.error('Error in Netlify function:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Internal server error' }),
      };
    }
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};

async function generateMockItinerary(request: ItineraryRequest): Promise<ItineraryResponse> {
  const { city, budget, days, travelers, interests, accommodation, transportation } = request;
  
  // Convert USD budget to INR
  const budgetInINR = budget * 83; // Approximate USD to INR conversion
  
  // Calculate realistic daily budget based on user's actual budget
  const maxDailyBudget = Math.floor(budgetInINR / days);
  
  // Generate accommodation-specific daily costs that fit within budget
  const accommodationMultipliers = {
    budget: 0.4,     // 40% of daily budget (very budget-friendly)
    hotel: 0.6,      // 60% of daily budget (moderate)
    luxury: 0.8,     // 80% of daily budget (luxury but controlled)
    apartment: 0.5,  // 50% of daily budget
    camping: 0.3     // 30% of daily budget (very cheap)
  };
  
  const multiplier = accommodationMultipliers[accommodation as keyof typeof accommodationMultipliers] || 0.6;
  const adjustedDailyCost = Math.min(maxDailyBudget * multiplier, maxDailyBudget);
  
  // Ensure total cost doesn't exceed budget - be more strict
  const totalCost = adjustedDailyCost * days;
  const finalBudget = Math.min(budgetInINR, totalCost);
  
  // Final safety check - ensure we never exceed user's budget
  const safetyBudget = Math.min(finalBudget, budgetInINR);
  
  return {
    city,
    summary: `Experience the magic of ${city} with this carefully crafted ${days}-day itinerary! Discover ${interests.join(', ')} while enjoying ${accommodation} accommodations and ${transportation} transportation. Your adventure is perfectly planned to fit within your ₹${budgetInINR.toLocaleString('en-IN')} budget.`,
    totalBudget: safetyBudget,
    days: await generateEnhancedDays(days, city, interests, accommodation, adjustedDailyCost),
    tips: generateEnhancedTips(city, interests),
    emergencyContacts: generateEnhancedContacts(city)
  };
}

async function generateEnhancedDays(days: number, city: string, interests: string[], accommodation: string, dailyCost: number): Promise<ItineraryDay[]> {
  return Array.from({ length: days }, (_, index) => {
    const dayNumber = index + 1;
    const selectedInterests = interests.length > 0 ? interests : ['Local Experiences'];
    
    // Generate specific daily schedule with times and locations - make each day unique
    const daySchedule = generateDailySchedule(dayNumber, city, selectedInterests, accommodation, days);
    
    // Vary accommodation description by day
    let accommodationDesc = `${accommodation.charAt(0).toUpperCase() + accommodation.slice(1)} accommodation in ${city}`;
    if (dayNumber === 1) accommodationDesc = `Check-in at your ${accommodation} in ${city}`;
    else if (dayNumber === days) accommodationDesc = `Final night at your ${accommodation} in ${city}`;
    else accommodationDesc = `Continue your stay at ${accommodation} in ${city}`;
    
    // Calculate daily cost with minimal variation to stay within budget
    const costVariation = 0.95 + (Math.random() * 0.1); // 95% to 105% of daily cost
    const finalDailyCost = Math.round(dailyCost * costVariation);
    
    return {
      day: dayNumber,
      activities: daySchedule.activities,
      meals: daySchedule.meals,
      accommodation: accommodationDesc,
      estimatedCost: finalDailyCost
    };
  });
}

function generateDailySchedule(day: number, city: string, interests: string[], accommodation: string, totalDays: number): any {
  // Create a structured daily schedule - make each day unique
  const dailyActivities = [];
  const dailyMeals = [];
  
  // Different time patterns for different days to create variety
  const dayPatterns = {
    1: { // Day 1: Early start, full day of exploration
      slots: [
        { start: '8:00 AM', end: '10:00 AM', label: 'Early Morning' },
        { start: '10:30 AM', end: '12:30 PM', label: 'Late Morning' },
        { start: '2:00 PM', end: '4:00 PM', label: 'Afternoon' },
        { start: '4:30 PM', end: '6:30 PM', label: 'Late Afternoon' },
        { start: '7:00 PM', end: '9:00 PM', label: 'Evening' }
      ]
    },
    2: { // Day 2: Relaxed morning, focus on afternoon/evening
      slots: [
        { start: '9:30 AM', end: '11:30 AM', label: 'Morning' },
        { start: '12:00 PM', end: '2:00 PM', label: 'Midday' },
        { start: '3:00 PM', end: '5:00 PM', label: 'Afternoon' },
        { start: '5:30 PM', end: '7:30 PM', label: 'Evening' },
        { start: '8:00 PM', end: '10:00 PM', label: 'Night' }
      ]
    },
    3: { // Day 3: Mid-morning start, evening focus
      slots: [
        { start: '10:00 AM', end: '12:00 PM', label: 'Late Morning' },
        { start: '1:00 PM', end: '3:00 PM', label: 'Early Afternoon' },
        { start: '4:00 PM', end: '6:00 PM', label: 'Late Afternoon' },
        { start: '6:30 PM', end: '8:30 PM', label: 'Evening' },
        { start: '9:00 PM', end: '11:00 PM', label: 'Late Night' }
      ]
    }
  };
  
  // Use day-specific pattern or default pattern
  const timeSlots = dayPatterns[day as keyof typeof dayPatterns]?.slots || dayPatterns[1].slots;
  
  // Generate activities for the day
  const landmarks = [
    `${city} City Center`,
    `${city} Main Square`,
    `${city} Local Market`,
    `${city} Historical District`,
    `${city} Cultural Quarter`
  ];
  
  // Rotate through landmarks based on day number
  const startIndex = (day - 1) * 2;
  const rotatedLandmarks = [...landmarks.slice(startIndex), ...landmarks.slice(0, startIndex)];
  
  // Assign landmarks to time slots
  timeSlots.forEach((slot, index) => {
    if (index < 4 && rotatedLandmarks[index]) {
      const duration = Math.random() > 0.5 ? '2 hours' : '1.5 hours';
      dailyActivities.push(`${slot.start} - ${rotatedLandmarks[index]} (${duration}) - City Center`);
    }
  });
  
  // Add day-specific themed activities
  if (day === 1) {
    dailyActivities.push(`11:00 AM - ${city} Orientation Tour (1 hour) - Tourist Center`);
  } else if (day === 2) {
    dailyActivities.push(`2:30 PM - ${city} Local Market Experience (1.5 hours) - Market District`);
  } else if (day === 3) {
    dailyActivities.push(`4:00 PM - ${city} Shopping & Entertainment (2 hours) - Shopping District`);
  }
  
  // Add meals with specific times and locations - vary by day
  const restaurants = [
    `${city} Local Cafe`,
    `${city} Traditional Restaurant`,
    `${city} Fine Dining`,
    `${city} Street Food Corner`,
    `${city} Rooftop Bistro`
  ];
  
  const breakfastTime = day === 1 ? '7:30 AM' : day === 2 ? '8:30 AM' : '8:00 AM';
  const lunchTime = day === 1 ? '12:30 PM' : day === 2 ? '1:30 PM' : '1:00 PM';
  const dinnerTime = day === 1 ? '7:30 PM' : day === 2 ? '8:00 PM' : '7:00 PM';
  
  dailyMeals.push(`${breakfastTime} - Breakfast at ${restaurants[0]} - City Center (Rating: 4.0/5)`);
  dailyMeals.push(`${lunchTime} - Lunch at ${restaurants[1]} - Market District (Rating: 4.2/5)`);
  dailyMeals.push(`${dinnerTime} - Dinner at ${restaurants[2]} - Cultural Quarter (Rating: 4.5/5)`);
  
  return {
    activities: dailyActivities.slice(0, 4),
    meals: dailyMeals
  };
}

function generateEnhancedTips(city: string, interests: string[]): string[] {
  const baseTips = [
    `Research local customs and etiquette before visiting ${city}`,
    'Keep emergency numbers handy and know embassy locations',
    'Learn basic phrases in the local language',
    'Always carry copies of important documents',
    'Be aware of local scams and tourist traps',
    'Respect local dress codes and cultural norms',
    'Keep valuables secure and be mindful of pickpockets'
  ];

  const interestSpecificTips = interests.map(interest => {
    switch (interest) {
      case 'Food & Dining':
        return `Try local specialties and ask locals for restaurant recommendations in ${city}`;
      case 'Culture & History':
        return `Visit ${city} during local festivals for authentic cultural experiences`;
      case 'Nature & Outdoors':
        return `Check weather conditions and pack appropriate gear for outdoor activities in ${city}`;
      case 'Shopping':
        return `Visit local markets early in the morning for the best selection and prices in ${city}`;
      case 'Adventure Sports':
        return `Ensure you have proper safety equipment and local guides for adventure activities in ${city}`;
      default:
        return `Research ${interest.toLowerCase()} opportunities specific to ${city}`;
    }
  });

  return [...baseTips, ...interestSpecificTips].slice(0, 8);
}

function generateEnhancedContacts(city: string): string[] {
  return [
    'Emergency Services: 911 (or local equivalent)',
    'Local Police: Check with your hotel for nearest station',
    'Hospital: Ask your hotel for nearest medical facility',
    'Your Country\'s Embassy: Check embassy website',
    'Hotel Front Desk: Available 24/7 for assistance',
    'Tourist Information Center: Usually in city center',
    `${city} Tourism Board: Visit official tourism website`,
    'Local Emergency: Ask hotel staff for local emergency numbers'
  ];
}
