import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import DeveloperProfile from "../src/models/DeveloperProfile.js";
import Hackathon from "../src/models/Hackathon.js";
import Message from "../src/models/Message.js";
import Project from "../src/models/Project.js";
import User from "../src/models/User.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const envPath = path.resolve(currentDir, "../.env");

dotenv.config({ path: envPath });

const collectionAliases = {
  user: User.collection.collectionName,
  users: User.collection.collectionName,
  profile: DeveloperProfile.collection.collectionName,
  profiles: DeveloperProfile.collection.collectionName,
  developerprofile: DeveloperProfile.collection.collectionName,
  developerprofiles: DeveloperProfile.collection.collectionName,
  project: Project.collection.collectionName,
  projects: Project.collection.collectionName,
  message: Message.collection.collectionName,
  messages: Message.collection.collectionName,
  hackathon: Hackathon.collection.collectionName,
  hackathons: Hackathon.collection.collectionName
};

const args = process.argv.slice(2).map((arg) => arg.trim());
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const requestedTargets = args
  .filter((arg) => !arg.startsWith("--"))
  .map((arg) => arg.toLowerCase());

const shouldDeleteAll = flags.has("--all");
const confirmed = flags.has("--yes");
const wantsHelp = flags.has("--help") || flags.has("-h");

function printUsage() {
  console.log(`
Usage:
  npm run db:clear -- --all
  npm run db:clear -- --all --yes
  npm run db:clear -- users projects messages --yes

Behavior:
  --all      Preview or clear every non-system collection in the database
  --yes      Required to actually delete documents
  --help     Show this help message

Examples:
  npm run db:clear -- --all
  npm run db:clear -- users messages --yes
  npm run db:clear -- developerprofiles projects --yes
`.trim());
}

function normalizeCollectionNames(collectionNames) {
  return [...new Set(collectionNames.filter(Boolean))];
}

async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing. Add it to server/.env before running this script."
    );
  }

  console.log("[db:clear] Loading environment from:", envPath);
  console.log("[db:clear] Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(
    `[db:clear] Connected to MongoDB database "${mongoose.connection.name}"`
  );
}

async function getAvailableCollections() {
  const collectionInfo = await mongoose.connection.db.listCollections().toArray();

  return collectionInfo
    .map(({ name }) => name)
    .filter((name) => !name.startsWith("system."));
}

function resolveRequestedCollections(requestedCollectionNames, availableCollections) {
  const availableCollectionMap = new Map(
    availableCollections.map((collectionName) => [collectionName.toLowerCase(), collectionName])
  );
  const invalidTargets = [];

  const resolvedCollectionNames = requestedCollectionNames.map((target) => {
    const mappedCollectionName =
      collectionAliases[target] || availableCollectionMap.get(target);

    if (!mappedCollectionName) {
      invalidTargets.push(target);
      return null;
    }

    return mappedCollectionName;
  });

  return {
    invalidTargets,
    resolvedCollectionNames: normalizeCollectionNames(resolvedCollectionNames)
  };
}

async function previewCollectionCounts(collectionNames) {
  const previews = [];

  for (const collectionName of collectionNames) {
    const documentCount = await mongoose.connection.db
      .collection(collectionName)
      .countDocuments({});

    previews.push({
      collectionName,
      documentCount
    });
  }

  return previews;
}

async function clearCollections(collectionNames) {
  const deletionResults = [];

  for (const collectionName of collectionNames) {
    const deletionResult = await mongoose.connection.db
      .collection(collectionName)
      .deleteMany({});

    deletionResults.push({
      collectionName,
      deletedCount: deletionResult.deletedCount
    });
  }

  return deletionResults;
}

async function main() {
  if (wantsHelp || (!shouldDeleteAll && requestedTargets.length === 0)) {
    printUsage();
    return;
  }

  await connectToDatabase();

  const availableCollections = await getAvailableCollections();
  const targetCollections = shouldDeleteAll
    ? availableCollections
    : resolveRequestedCollections(requestedTargets, availableCollections);

  if (!shouldDeleteAll && targetCollections.invalidTargets.length) {
    throw new Error(
      `Unknown collections: ${targetCollections.invalidTargets.join(", ")}`
    );
  }

  const collectionsToProcess = shouldDeleteAll
    ? normalizeCollectionNames(targetCollections)
    : targetCollections.resolvedCollectionNames;

  if (!collectionsToProcess.length) {
    console.log("[db:clear] No matching collections found. Nothing to do.");
    return;
  }

  const previewResults = await previewCollectionCounts(collectionsToProcess);
  const totalDocuments = previewResults.reduce(
    (total, result) => total + result.documentCount,
    0
  );

  console.log("[db:clear] Collections selected:");
  previewResults.forEach(({ collectionName, documentCount }) => {
    console.log(`  - ${collectionName}: ${documentCount} document(s)`);
  });
  console.log(`[db:clear] Total documents selected: ${totalDocuments}`);

  if (!confirmed) {
    console.log(
      "[db:clear] Dry run only. Re-run the same command with --yes to delete documents."
    );
    return;
  }

  console.log("[db:clear] Deleting documents...");
  const deletionResults = await clearCollections(collectionsToProcess);
  const totalDeleted = deletionResults.reduce(
    (total, result) => total + result.deletedCount,
    0
  );

  deletionResults.forEach(({ collectionName, deletedCount }) => {
    console.log(`  - Deleted ${deletedCount} document(s) from ${collectionName}`);
  });
  console.log(`[db:clear] Finished. Total deleted: ${totalDeleted}`);
}

try {
  await main();
} catch (error) {
  console.error("[db:clear] Failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("[db:clear] MongoDB connection closed");
  }
}
