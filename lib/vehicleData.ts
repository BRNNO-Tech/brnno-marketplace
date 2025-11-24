// Common vehicle makes list (fallback)
export const VEHICLE_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac",
  "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC",
  "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan", "Porsche", "Ram", "Rolls-Royce", "Subaru", "Tesla", "Toyota", "Volkswagen",
  "Volvo"
];

// Common vehicle models by make (fallback)
export const VEHICLE_MODELS: Record<string, string[]> = {
  "Acura": ["ILX", "MDX", "RDX", "TLX", "NSX", "RLX"],
  "Chevrolet": ["Camaro", "Corvette", "Cruze", "Equinox", "Impala", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Ford": ["Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Fiesta", "Focus", "Mustang", "Ranger"],
  "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Pilot", "Ridgeline"],
  "Toyota": ["4Runner", "Avalon", "Camry", "Corolla", "Highlander", "RAV4", "Sequoia", "Sienna", "Tacoma", "Tundra"],
  "Nissan": ["Altima", "Armada", "Frontier", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan"],
};

// Vehicle colors
export const VEHICLE_COLORS = [
  "Black", "White", "Silver", "Gray", "Blue", "Red", "Green", "Brown",
  "Beige", "Tan", "Gold", "Yellow", "Orange", "Purple", "Maroon", "Navy",
  "Teal", "Pink", "Other"
];

// Years from 1990 to current year + 1
export const getVehicleYears = (): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let year = currentYear + 1; year >= 1990; year--) {
    years.push(year.toString());
  }
  return years;
};

// Fetch all makes from NHTSA API
export const fetchAllMakes = async (): Promise<string[]> => {
  try {
    const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json');
    const data = await res.json();
    if (data.Results) {
      return data.Results.map((r: any) => r.Make_Name).sort();
    }
    return VEHICLE_MAKES;
  } catch (error) {
    console.error('Error fetching makes:', error);
    return VEHICLE_MAKES;
  }
};

// Fetch models for a specific make from NHTSA API
export const fetchModelsForMake = async (make: string, year?: string): Promise<string[]> => {
  if (!make) return [];
  
  try {
    // Use the model year endpoint - if year provided, use it, otherwise use current year
    const queryYear = year || new Date().getFullYear().toString();
    
    // First, get make ID
    const makesRes = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json');
    const makesData = await makesRes.json();
    const makeObj = makesData.Results?.find((m: any) => 
      m.Make_Name.toLowerCase() === make.toLowerCase()
    );
    
    if (!makeObj) {
      // Fallback to static list
      return VEHICLE_MODELS[make] || [];
    }
    
    const makeId = makeObj.MakeId;
    
    // Get models for this make and year
    const modelsRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${queryYear}?format=json`
    );
    const modelsData = await modelsRes.json();
    
    if (modelsData.Results && modelsData.Results.length > 0) {
      // Remove duplicates and sort
      const uniqueModels = Array.from(new Set(modelsData.Results.map((m: any) => m.Model_Name))).sort();
      return uniqueModels;
    }
    
    // Fallback to static list if no results
    return VEHICLE_MODELS[make] || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    // Fallback to static list
    return VEHICLE_MODELS[make] || [];
  }
};

