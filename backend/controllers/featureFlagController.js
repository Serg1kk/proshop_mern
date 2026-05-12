import fs from 'fs/promises'
import path from 'path'
import asyncHandler from 'express-async-handler'

const featureFlagsPath = path.resolve('backend', 'features.json')
const featureAnalysisPath = path.resolve(
  'feature flags',
  'features-analysis-ru.md'
)

const stripMarkdown = (value = '') =>
  value
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/[🟢🟡🧪🔴🚫⚠️✅❌⭐]/g, '')
    .trim()

const getFeatureAnalysis = async () => {
  let analysisFile

  try {
    analysisFile = await fs.readFile(featureAnalysisPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }

    throw error
  }

  return analysisFile
    .split('\n')
    .filter((line) => /^\| \d+ \|/.test(line))
    .reduce((analysis, line) => {
      const columns = line
        .split('|')
        .slice(1, -1)
        .map((column) => stripMarkdown(column))

      const keyMatch = columns[1].match(/^([^ ]+) — (.+)$/)

      if (!keyMatch) {
        return analysis
      }

      const key = keyMatch[1]

      analysis[key] = {
        name: keyMatch[2],
        description: columns[7],
        complexity: columns[8],
        priority: columns[9],
        m4_figma: columns[10],
      }

      return analysis
    }, {})
}

// @desc    Fetch all feature flags
// @route   GET /api/feature-flags
// @access  Private/Admin
const getFeatureFlags = asyncHandler(async (req, res) => {
  const featureFlagsFile = await fs.readFile(featureFlagsPath, 'utf8')
  const featureFlags = JSON.parse(featureFlagsFile)
  const featureAnalysis = await getFeatureAnalysis()

  const features = Object.entries(featureFlags).map(([key, feature]) => ({
    key,
    name: feature.name,
    status: feature.status,
    traffic_percentage: feature.traffic_percentage,
    last_modified: feature.last_modified,
    depends_on: feature.dependencies || [],
    description:
      (featureAnalysis[key] && featureAnalysis[key].description) ||
      feature.description ||
      '',
    analysis: featureAnalysis[key] || null,
  }))

  res.json(features)
})

export { getFeatureFlags }
