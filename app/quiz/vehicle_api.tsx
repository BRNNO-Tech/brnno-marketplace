// --- Fetch all car makes (NHTSA API) ---
export async function getMakes() {
  try {
    const res = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
    );
    const data = await res.json();

    if (data.Results) {
      return data.Results.map((m: any) => m.MakeName).sort();
    }

    return [];
  } catch (err) {
    console.error("NHTSA Makes Error:", err);
    return [];
  }
}

// --- Fetch models for a given make + year (NHTSA API) ---
export async function getModels(make: string, year: string) {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(
        make
      )}/modelyear/${year}?format=json`
    );
    const data = await res.json();

    if (data.Results) {
      return data.Results.map((m: any) => m.Model_Name).sort();
    }

    return [];
  } catch (err) {
    console.error("NHTSA Models Error:", err);
    return [];
  }
}