import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts and formats the flat/house/unit identifier from an address string.
 * Returns in format like "STUDIO 89", "FLAT 7", "UNIT 3A" in ALL CAPS.
 * Combines property_type with number if only a number is found.
 */
export function getFlatOrUnitNumber(
  addressLine1: string | undefined,
  address: string | undefined,
  city?: string,
  propertyType?: string
): string {
  const addressStr = addressLine1 || address?.split('\n')[0]?.trim() || "";
  
  if (!addressStr) return "";
  
  // Remove city if it's at the end
  let cleanAddress = addressStr;
  if (city) {
    cleanAddress = cleanAddress.replace(new RegExp(`[, ]*${city}`, 'gi'), '').trim();
  }
  
  // Normalize property type for matching
  const normalizedPropertyType = propertyType?.toLowerCase().trim() || "";
  
  // Priority 1: Look for complete flat/unit patterns (Studio 89, Flat 7, Unit 3A, etc.)
  // Match: Unit type followed by space and number/letter combo
  const unitPatterns = [
    /(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+(\d+[A-Za-z]?)/gi,
    /(\d+[A-Za-z]?)\s+(Studio|Flat|Unit|Apartment|Apt|Suite|Room)/gi, // Reverse order: "89 Studio"
  ];
  
  for (const pattern of unitPatterns) {
    const match = cleanAddress.match(pattern);
    if (match) {
      const result = match[0].trim();
      // Normalize: ensure unit type comes first, then number
      const normalized = result.replace(/(\d+[A-Za-z]?)\s+(Studio|Flat|Unit|Apartment|Apt|Suite|Room)/i, '$2 $1');
      return normalized.toUpperCase();
    }
  }
  
  // Priority 2: Look for unit type keywords followed by number anywhere in address
  const unitTypeMatch = cleanAddress.match(/\b(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+(\d+[A-Za-z]?)\b/i);
  if (unitTypeMatch) {
    return `${unitTypeMatch[1]} ${unitTypeMatch[2]}`.toUpperCase();
  }
  
  // Priority 3: Extract number from start of address (most likely unit/house number)
  // Prefer number at the start, then fallback to any number
  let numberMatch = cleanAddress.match(/^(\d+[A-Za-z]?)\b/);
  if (!numberMatch) {
    // Fallback: look for any number in the address
    numberMatch = cleanAddress.match(/\b(\d+[A-Za-z]?)\b/);
  }
  
  if (numberMatch) {
    const number = numberMatch[1];
    
    // If we have a property type, always combine it for consistency
    if (normalizedPropertyType) {
      // Map common property types to unit identifiers
      const unitTypeMap: { [key: string]: string } = {
        'flat': 'FLAT',
        'studio': 'STUDIO',
        'apartment': 'APARTMENT',
        'house': 'HOUSE',
        'unit': 'UNIT',
        'suite': 'SUITE',
        'room': 'ROOM',
      };
      
      const unitType = unitTypeMap[normalizedPropertyType] || normalizedPropertyType.toUpperCase();
      return `${unitType} ${number}`.toUpperCase();
    }
    
    // If no property type but we found a number, return it in uppercase
    return number.toUpperCase();
  }
  
  // Priority 4: Extract first part if it's short (likely a unit identifier)
  const firstPart = cleanAddress.split(',')[0]?.trim();
  if (firstPart && firstPart.split(/\s+/).length <= 3) {
    // Check if it contains a unit type and number
    const unitMatch = firstPart.match(/(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+(\d+[A-Za-z]?)/i);
    if (unitMatch) {
      return `${unitMatch[1]} ${unitMatch[2]}`.toUpperCase();
    }
    // If it's just a number and we have property type
    const numMatch = firstPart.match(/^(\d+[A-Za-z]?)$/);
    if (numMatch && normalizedPropertyType) {
      const unitTypeMap: { [key: string]: string } = {
        'flat': 'FLAT',
        'studio': 'STUDIO',
        'apartment': 'APARTMENT',
        'house': 'HOUSE',
        'unit': 'UNIT',
        'suite': 'SUITE',
        'room': 'ROOM',
      };
      const unitType = unitTypeMap[normalizedPropertyType] || normalizedPropertyType.toUpperCase();
      return `${unitType} ${numMatch[1]}`.toUpperCase();
    }
    return firstPart.toUpperCase();
  }
  
  // Fallback: return empty string to show city instead
  return "";
}