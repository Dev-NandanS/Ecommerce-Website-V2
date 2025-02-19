import { Product } from '../types';

// Extended stopwords list
const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'device', 'can', 'could', 'would', 'should', 'me', 'my',
  'show', 'find', 'want', 'looking', 'get', 'give'
]);

// Enhanced semantic mappings based on actual product data
const semanticMappings: { [key: string]: string[] } = {
  // Jeans and Clothing
  'jeans': ['denim', 'pants', 'trousers', 'bottoms', 'slim fit', 'regular fit', 'skinny fit'],
  'mens': ['men', 'man', 'male', 'guy', 'boys', 'men\'s'],
  'womens': ['women', 'woman', 'female', 'lady', 'ladies', 'girls', 'women\'s'],
  
  // Specific Clothing Brands (from products data)
  'uspolo': ['u.s. polo', 'polo assn', 'us polo', 'u.s. polo assn'],
  'allensolly': ['allen solly'],
  'jackjones': ['jack & jones', 'jack and jones'],
  'pepe': ['pepe jeans'],
  
  // Fit Types (from products data)
  'slim': ['skinny', 'fitted', 'narrow', 'slim fit'],
  'regular': ['classic', 'straight', 'standard', 'normal', 'regular fit'],
  'loose': ['relaxed', 'comfortable', 'baggy', 'wide'],
  
  // Air Conditioners
  'ac': ['air conditioner', 'air conditioning', 'cooling', 'ton'],
  'inverter': ['dual inverter', 'inverter ac', 'variable speed'],
  'tonnage': ['1.5 ton', '1 ton', '2 ton', '0.8 ton'],
  
  // AC Brands (from products data)
  'lg': ['dual inverter', 'lg ac'],
  'samsung': ['samsung ac', 'wind-free'],
  'carrier': ['carrier ac', 'flexicool'],
  'voltas': ['voltas ac'],
  'daikin': ['daikin ac'],
  
  // Features
  'star': ['5 star', '4 star', '3 star', '2 star'],
  'wifi': ['wi-fi', 'smart', 'connected'],
  'split': ['split ac', 'split unit'],
  'window': ['window ac', 'window unit']
};

// Inverse semantic mappings for faster lookup
const inverseSemanticMappings: { [key: string]: string[] } = {};
Object.entries(semanticMappings).forEach(([concept, terms]) => {
  terms.forEach(term => {
    if (!inverseSemanticMappings[term]) {
      inverseSemanticMappings[term] = [];
    }
    inverseSemanticMappings[term].push(concept);
  });
});

// Enhanced lemmatizer with product-specific variations
const lemmatize = (word: string): string => {
  const variations: { [key: string]: string } = {
    'jeans': 'jean',
    'trousers': 'pant',
    'men\'s': 'mens',
    'women\'s': 'womens',
    'cooling': 'cool',
    'conditioners': 'ac',
    'conditioning': 'ac',
    'fitted': 'fit',
    'skinny': 'slim',
    'straight': 'regular',
    'classic': 'regular'
  };
  
  return variations[word.toLowerCase()] || word.toLowerCase();
};

// Product category detection
const getProductCategory = (product: Product): string => {
  const text = `${product.name} ${product.description}`.toLowerCase();
  
  if (text.includes('jean') || text.includes('pant') || text.includes('trouser')) {
    return 'clothing';
  }
  if (text.includes('ton') && (text.includes('ac') || text.includes('air condition'))) {
    return 'ac';
  }
  return 'other';
};

// Extract keywords and their related terms
const extractKeywords = (text: string): string[] => {
  // Tokenize and clean text
  const tokens = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopWords.has(word))
    .map(lemmatize);

  // Collect keywords and their semantic relatives
  const keywordSet = new Set<string>();
  tokens.forEach(token => {
    keywordSet.add(token);
    
    // Add semantic mappings
    Object.entries(semanticMappings).forEach(([concept, terms]) => {
      if (terms.includes(token) || token === concept) {
        terms.forEach(term => keywordSet.add(term));
        keywordSet.add(concept);
      }
    });
  });

  return Array.from(keywordSet);
};

// Calculate semantic relevance score with category-specific boosts
const calculateRelevance = (product: Product, keywords: string[]): number => {
  let score = 0;
  const productText = `${product.name} ${product.description}`.toLowerCase();
  const category = getProductCategory(product);

  keywords.forEach(keyword => {
    // Direct matches in product name (highest weight)
    const nameMatches = (product.name.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    score += nameMatches * 4;

    // Direct matches in description
    const descMatches = (product.description.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    score += descMatches * 2;

    // Brand matches (high weight)
    if (semanticMappings['uspolo'].includes(keyword) || 
        semanticMappings['allensolly'].includes(keyword) ||
        semanticMappings['jackjones'].includes(keyword) ||
        semanticMappings['lg'].includes(keyword) ||
        semanticMappings['samsung'].includes(keyword)) {
      const brandMatches = (productText.match(new RegExp(keyword, 'gi')) || []).length;
      score += brandMatches * 3;
    }

    // Semantic matches
    if (inverseSemanticMappings[keyword]) {
      inverseSemanticMappings[keyword].forEach(concept => {
        const conceptMatches = (productText.match(new RegExp(`\\b${concept}\\b`, 'g')) || []).length;
        score += conceptMatches * 1.5;
      });
    }
  });

  // Category-specific boosts
  if (category === 'clothing') {
    if (keywords.some(k => 
      semanticMappings['jeans'].includes(k) || 
      semanticMappings['mens'].includes(k) || 
      semanticMappings['womens'].includes(k))) {
      score *= 2;
    }
    
    // Boost fit type matches
    if (keywords.some(k => 
      semanticMappings['slim'].includes(k) || 
      semanticMappings['regular'].includes(k) || 
      semanticMappings['loose'].includes(k))) {
      score *= 1.5;
    }
  }

  if (category === 'ac') {
    if (keywords.some(k => semanticMappings['ac'].includes(k))) {
      score *= 2;
    }
    
    // Boost specific AC features
    if (keywords.some(k => 
      semanticMappings['tonnage'].includes(k) || 
      semanticMappings['star'].includes(k) || 
      semanticMappings['inverter'].includes(k))) {
      score *= 1.5;
    }
  }

  return score;
};

// Enhanced search function
export const enhancedSearch = (products: Product[], query: string): Product[] => {
  if (!query.trim()) return products;

  const keywords = extractKeywords(query);
  
  return products
    .map(product => ({
      product,
      score: calculateRelevance(product, keywords)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
};