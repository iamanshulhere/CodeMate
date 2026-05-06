/**
 * MIGRATION NOTE: Matching logic now uses ML-based recommendation engine
 * See mlRecommendationService.js for implementation details
 */
import { matchDevelopersML } from "./mlRecommendationService.js";

export const matchDevelopers = matchDevelopersML;
