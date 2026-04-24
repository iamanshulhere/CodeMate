const normalizeText = (value) => value?.toString().trim().toLowerCase() || "";

const uniqueNormalizedList = (items = []) =>
  [...new Set(items.map(normalizeText).filter(Boolean))];

const getSharedItems = (leftItems = [], rightItems = []) => {
  const rightItemSet = new Set(rightItems);
  return leftItems.filter((item) => rightItemSet.has(item));
};

const getUnionSize = (leftItems = [], rightItems = []) =>
  new Set([...leftItems, ...rightItems]).size;

export const extractUserSignals = (user) => ({
  skills: uniqueNormalizedList(user.skills || []),
  techStack: uniqueNormalizedList(user.techStack || []),
  interests: uniqueNormalizedList(user.interests || [])
});

export const buildUserMatchQuery = (user) => {
  const { skills, techStack, interests } = extractUserSignals(user);
  const queryFilters = [];

  if (skills.length) {
    queryFilters.push({ skills: { $in: skills } });
  }

  if (techStack.length) {
    queryFilters.push({ techStack: { $in: techStack } });
  }

  if (interests.length) {
    queryFilters.push({ interests: { $in: interests } });
  }

  return queryFilters.length ? { $or: queryFilters } : {};
};

export const calculateUserMatch = (currentUser, candidateUser) => {
  const currentSignals = extractUserSignals(currentUser);
  const candidateSignals = extractUserSignals(candidateUser);

  const commonSkills = getSharedItems(currentSignals.skills, candidateSignals.skills);
  const commonTechStack = getSharedItems(
    currentSignals.techStack,
    candidateSignals.techStack
  );
  const commonInterests = getSharedItems(
    currentSignals.interests,
    candidateSignals.interests
  );

  const matchScore =
    commonSkills.length + commonTechStack.length + commonInterests.length;
  const compatibilityDenominator =
    getUnionSize(currentSignals.skills, candidateSignals.skills) +
    getUnionSize(currentSignals.techStack, candidateSignals.techStack) +
    getUnionSize(currentSignals.interests, candidateSignals.interests);
  const compatibilityScore = compatibilityDenominator
    ? Number((matchScore / compatibilityDenominator).toFixed(3))
    : 0;

  return {
    userId: String(candidateUser._id),
    matchScore,
    score: compatibilityScore,
    breakdown: {
      commonSkills: commonSkills.length,
      commonTechStack: commonTechStack.length,
      commonInterests: commonInterests.length
    },
    commonSkills,
    commonTechStack,
    commonInterests,
    developer: {
      userId: String(candidateUser._id),
      name: candidateUser.name,
      email: candidateUser.email,
      role: candidateUser.role,
      avatarUrl: candidateUser.avatarUrl || "",
      isOnline: Boolean(candidateUser.isOnline),
      skills: candidateSignals.skills,
      techStack: candidateSignals.techStack,
      interests: candidateSignals.interests
    }
  };
};

export const matchUsers = (currentUser, candidateUsers = [], limit = 10) =>
  candidateUsers
    .filter((candidateUser) => String(candidateUser._id) !== String(currentUser._id))
    .map((candidateUser) => calculateUserMatch(currentUser, candidateUser))
    .filter((match) => match.matchScore > 0)
    .sort((leftMatch, rightMatch) => {
      if (rightMatch.matchScore !== leftMatch.matchScore) {
        return rightMatch.matchScore - leftMatch.matchScore;
      }

      if (rightMatch.score !== leftMatch.score) {
        return rightMatch.score - leftMatch.score;
      }

      return (leftMatch.developer.name || "").localeCompare(
        rightMatch.developer.name || ""
      );
    })
    .slice(0, limit);
