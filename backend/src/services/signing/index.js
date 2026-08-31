const SigningProvider = require("./signingProvider");
const InstitutionSigningProvider = require("./institutionSigningProvider");
const canonicalSerializer = require("./canonicalSerializer");

// Global singleton instances
let defaultInstitutionProvider = null;
const customProviders = new Map();

/**
 * Get or initialize a signing provider instance
 * @param {string} [providerType="institution"]
 * @param {Object} [options]
 * @returns {SigningProvider}
 */
function getSigningProvider(providerType = "institution", options = {}) {
  const type = (providerType || "institution").toLowerCase();

  if (type === "institution") {
    if (!defaultInstitutionProvider) {
      defaultInstitutionProvider = new InstitutionSigningProvider(options);
    }
    return defaultInstitutionProvider;
  }

  if (customProviders.has(type)) {
    return customProviders.get(type);
  }

  throw new Error(
    `Unsupported SigningProvider type: "${providerType}". Supported types: "institution" (and registered extensions).`
  );
}

/**
 * Register an extension provider (e.g. CASigningProvider, ESignProvider)
 * @param {string} type
 * @param {SigningProvider} providerInstance
 */
function registerSigningProvider(type, providerInstance) {
  if (!(providerInstance instanceof SigningProvider)) {
    throw new Error("Registered provider must extend SigningProvider");
  }
  customProviders.set(type.toLowerCase(), providerInstance);
}

/**
 * Reset instances (used primarily for test cleanup and isolation)
 */
function resetSigningProviders() {
  defaultInstitutionProvider = null;
  customProviders.clear();
}

module.exports = {
  getSigningProvider,
  registerSigningProvider,
  resetSigningProviders,
  SigningProvider,
  InstitutionSigningProvider,
  ...canonicalSerializer,
};
