const shoppingQueryCorrections: Array<[RegExp, string]> = [
  [/\bhodd(?:y|ie)s?\b/gi, "hoodie"],
  [/\bhoddys\b/gi, "hoodies"],
  [/\bhoddy\b/gi, "hoodie"],
  [/\bhoodys\b/gi, "hoodies"],
  [/\bhoody\b/gi, "hoodie"],
  [/\bhoddies\b/gi, "hoodies"],
  [/\bsweat\s*shirts?\b/gi, "sweatshirt"],
  [/\bt\s*shirts?\b/gi, "tshirt"],
  [/\btee\s*shirts?\b/gi, "tshirt"],
  [/\btrainners?\b/gi, "trainers"],
  [/\bsneekers?\b/gi, "sneakers"],
  [/\btrouseres\b/gi, "trousers"],
  [/\bjeanes\b/gi, "jeans"],
  [/\baddidas\b/gi, "Adidas"],
  [/\bnkie\b/gi, "Nike"],
];

export const normalizeShoppingQuery = (query: string) => {
  const corrected = shoppingQueryCorrections.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    query,
  );

  return corrected.trim().replace(/\s+/g, " ");
};
