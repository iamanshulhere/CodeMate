/**
 * ML-Based Developer Recommendation Engine
 *
 * Uses cosine similarity with weighted feature vectors to intelligently match developers.
 * Implements TF-IDF-inspired vector representation and scoring.
 *
 * Algorithm:
 * 1. Extract profile signals (skills, techStack, interests)
 * 2. Build weighted feature vectors (skills: 50%, techStack: 30%, interests: 20%)
 * 3. Calculate cosine similarity between vectors
 * 4. Generate match explanation
 */

const normalizeText = (value) => value?.toString().trim().toLowerCase() || "";

const uniqueNormalizedList = (items = []) =>
  [...new Set(items.map(normalizeText).filter(Boolean))];

/**
 * Extract normalized signals from a developer profile
 */
function extractProfileSignals(profile) {
  return {
    skills: uniqueNormalizedList((profile.skills || []).map((skill) => skill.name || skill)),
    techStack: uniqueNormalizedList(
      (profile.techStack || []).flatMap((item) => item.technologies || [])
    ),
    interests: uniqueNormalizedList(profile.interests || [])
  };
}

/**
 * Build weighted feature vector for cosine similarity calculation
 *
 * Each signal category gets a category weight:
 * - Skills: 0.5 (50%)
 * - Tech Stack: 0.3 (30%)
 * - Interests: 0.2 (20%)
 */
function buildWeightedFeatureVector(signals) {
  const vector = {};

  // Build feature vector with weighted categories
  signals.skills.forEach((skill) => {
    vector[`skill_${skill}`] = 0.5; // Skills weighted at 50%
  });

  signals.techStack.forEach((tech) => {
    vector[`tech_${tech}`] = 0.3; // Tech stack weighted at 30%
  });

  signals.interests.forEach((interest) => {
    vector[`interest_${interest}`] = 0.2; // Interests weighted at 20%
  });

  return vector;
}

/**
 * Calculate cosine similarity between two feature vectors
 *
 * Cosine Similarity = (A · B) / (||A|| * ||B||)
 *
 * Returns value between 0 and 1:
 * - 0 = no similarity
 * - 1 = perfect similarity
 */
function cosineSimilarity(vectorA, vectorB) {
  const allKeys = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  // Compute dot product and magnitudes
  for (const key of allKeys) {
    const valA = vectorA[key] || 0;
    const valB = vectorB[key] || 0;

    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }

  // Handle zero-magnitude vectors (no profile data)
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Return normalized cosine similarity
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Get intersection of two sets
 */
function getIntersection(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

/**
 * Generate human-readable match explanation
 */
function generateMatchExplanation(commonSkills, commonTechStack, commonInterests, similarity) {
  const matchPercentage = Math.round(similarity * 100);
  const parts = [];

  if (commonSkills.length > 0) {
    parts.push(commonSkills.join(", "));
  }

  if (commonTechStack.length > 0) {
    parts.push(commonTechStack.join(", "));
  }

  if (commonInterests.length > 0) {
    parts.push(commonInterests.join(", "));
  }

  const commonItems = parts.join(" · ");
  return `${matchPercentage}% match based on ${commonItems || "profile compatibility"}`;
}

/**
 * Calculate ML-based match score between two developer profiles
 *
 * Returns comprehensive match object with:
 * - score: cosine similarity (0-1)
 * - commonSkills, commonTechStack, commonInterests: intersection for UI display
 * - explanation: human-readable match summary
 */
export function calculateMLBasedMatch(sourceProfile, targetProfile) {
  // Extract normalized signals from both profiles
  const sourceSignals = extractProfileSignals(sourceProfile);
  const targetSignals = extractProfileSignals(targetProfile);

  // Build weighted feature vectors
  const sourceVector = buildWeightedFeatureVector(sourceSignals);
  const targetVector = buildWeightedFeatureVector(targetSignals);

  // Calculate cosine similarity
  const similarity = cosineSimilarity(sourceVector, targetVector);

  // Calculate common items for UI display
  const commonSkills = getIntersection(sourceSignals.skills, targetSignals.skills);
  const commonTechStack = getIntersection(sourceSignals.techStack, targetSignals.techStack);
  const commonInterests = getIntersection(sourceSignals.interests, targetSignals.interests);

  // Generate explanation
  const explanation = generateMatchExplanation(
    commonSkills,
    commonTechStack,
    commonInterests,
    similarity
  );

  return {
    profileId: targetProfile._id || targetProfile.user || null,
    score: Number(similarity.toFixed(3)),
    explanation,
    breakdown: {
      skillScore: sourceSignals.skills.length > 0 ? commonSkills.length / sourceSignals.skills.length : 0,
      interestScore: sourceSignals.interests.length > 0 ? commonInterests.length / sourceSignals.interests.length : 0,
      techStackScore: sourceSignals.techStack.length > 0 ? commonTechStack.length / sourceSignals.techStack.length : 0
    },
    commonSkills,
    commonTechStack,
    commonInterests
  };
}

/**
 * Match developers using ML-based cosine similarity
 *
 * Replaces rule-based overlap matching with intelligent recommendation algorithm.
 */
export function matchDevelopersML(sourceProfile, candidateProfiles = [], limit = 5) {
  return candidateProfiles
    .filter(
      (candidate) =>
        String(candidate._id || candidate.user || "") !==
        String(sourceProfile._id || sourceProfile.user || "")
    )
    .map((candidate) => calculateMLBasedMatch(sourceProfile, candidate))
    .filter((result) => result.score > 0.05) // Filter out very weak matches (noise threshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
