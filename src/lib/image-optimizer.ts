/**
 * Utility to optimize image URLs, specifically handling Unsplash URLs 
 * by appending width, height, and quality parameters.
 */
export function optimizeImage(id: string | null | undefined, width = 800, quality = 80): string {
  if (!id) return 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80';
  
  // If it's already a full URL
  if (id.startsWith('http')) {
    // If it's an Unsplash URL, we can inject our own parameters
    if (id.includes('unsplash.com')) {
      // Remove existing params and add optimized ones
      const baseUrl = id.split('?')[0];
      return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return id;
  }
  
  // Handle relative paths
  return id;
}
