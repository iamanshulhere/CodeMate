const normalizeText = (value) => value?.toString().trim().toLowerCase() || "";

const uniqueNormalizedList = (items = []) =>
  [...new Set(items.map(normalizeText).filter(Boolean))];

const extractSkillNames = (profile) =>
  uniqueNormalizedList((profile.skills || []).map((skill) => skill.name));

const extractInterests = (profile) => uniqueNormalizedList(profile.interests || []);

const extractTechStack = (profile) =>
  uniqueNormalizedList(
    (profile.techStack || []).flatMap((item) => item.technologies || [])
  );

const getIntersection = (left = [], right = []) => {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
};

const scoreOverlap = (sourceItems = [], targetItems = []) => {
  if (!sourceItems.length || !targetItems.length) {
    return 0;
  }

  const sharedItems = getIntersection(sourceItems, targetItems);
  const denominator = new Set([...sourceItems, ...targetItems]).size;

  return denominator ? sharedItems.length / denominator : 0;
};

export const calculateDeveloperMatch = (sourceProfile, targetProfile) => {
  const sourceSkills = extractSkillNames(sourceProfile);
  const targetSkills = extractSkillNames(targetProfile);
  const sourceInterests = extractInterests(sourceProfile);
  const targetInterests = extractInterests(targetProfile);
  const sourceTechStack = extractTechStack(sourceProfile);
  const targetTechStack = extractTechStack(targetProfile);

  const sharedSkills = getIntersection(sourceSkills, targetSkills);
  const sharedInterests = getIntersection(sourceInterests, targetInterests);
  const sharedTechStack = getIntersection(sourceTechStack, targetTechStack);

  const skillScore = scoreOverlap(sourceSkills, targetSkills);
  const interestScore = scoreOverlap(sourceInterests, targetInterests);
  const techStackScore = scoreOverlap(sourceTechStack, targetTechStack);
  const weightedScore =
    skillScore * 0.5 + interestScore * 0.3 + techStackScore * 0.2;

  return {
    profileId: targetProfile._id || targetProfile.user || null,
    score: Number(weightedScore.toFixed(3)),
    breakdown: {
      skillScore: Number(skillScore.toFixed(3)),
      interestScore: Number(interestScore.toFixed(3)),
      techStackScore: Number(techStackScore.toFixed(3))
    },
    commonSkills: sharedSkills,
    commonInterests: sharedInterests,
    commonTechStack: sharedTechStack
  };
};

export const matchDevelopers = (sourceProfile, candidateProfiles = [], limit = 5) =>
  candidateProfiles
    .filter(
      (candidate) =>
        String(candidate._id || candidate.user || "") !==
        String(sourceProfile._id || sourceProfile.user || "")
    )
    .map((candidate) => calculateDeveloperMatch(sourceProfile, candidate))
    .filter(
      (result) =>
        result.commonSkills.length ||
        result.commonInterests.length ||
        result.commonTechStack.length
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
