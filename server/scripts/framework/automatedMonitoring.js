/*
 * AUTOMATED DATA QUALITY MONITORING
 * 
 * This script monitors data quality and catches new problematic canonicals.
 * Run this periodically (daily/weekly) to maintain data quality.
 */

const { Sequelize } = require('sequelize');
const db = require('../../db/database');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  logFile: path.join(__dirname, '../logs/data_quality_monitoring.log'),
  alertThreshold: 0.95, // Alert if success rate drops below 95%
  maxProblematicCanonicals: 5, // Alert if more than 5 problematic canonicals found
  dryRun: false
};

// Extended blacklist for comprehensive monitoring
const EXTENDED_BLACKLIST = [
  // Preparation methods
  'chopped', 'diced', 'drained', 'melted', 'quartered', 'sliced', 'minced', 'crushed', 'grated', 'shredded',
  'julienned', 'cubed', 'striped', 'beaten', 'softened', 'hardened', 'frozen', 'thawed', 'cooked', 'raw',
  'fresh', 'dried', 'canned', 'peeled', 'seeded', 'cored', 'trimmed', 'washed', 'rinsed',
  
  // Measurement units
  'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'ounce', 'ounces', 'pound', 'pounds',
  'gram', 'grams', 'kg', 'ml', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'l', 'liter', 'liters',
  
  // Common words
  'and', 'or', 'with', 'for', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'from', 'by', 'at',
  'is', 'are', 'was', 'were', 'be', 'ed', 'ing', 'ly', 'er', 'est',
  
  // Invalid ingredients
  'pie', 'up', 'ounces'
];

class DataQualityMonitor {
  constructor(config = CONFIG) {
    this.config = config;
    this.alerts = [];
    this.metrics = {};
  }

  /**
   * Log message with timestamp
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logEntry);
    
    // Append to log file
    fs.appendFileSync(this.config.logFile, logEntry + '\n');
  }

  /**
   * Add alert
   */
  addAlert(severity, message, details = {}) {
    this.alerts.push({
      timestamp: new Date().toISOString(),
      severity, // 'low', 'medium', 'high', 'critical'
      message,
      details
    });
    
    this.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`, 'warn');
  }

  /**
   * Check canonical ingredient quality
   */
  async checkCanonicalQuality() {
    this.log('🔍 Checking canonical ingredient quality...');
    
    const ingredients = await db.query(
      'SELECT id, name, aliases FROM "Ingredients" ORDER BY name',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const issues = [];
    const validIngredients = [];
    
    for (const ingredient of ingredients) {
      const name = ingredient.name.toLowerCase();
      const problems = [];
      
      // Check minimum length
      if (name.length < 3) {
        problems.push(`Too short (${name.length} chars)`);
      }
      
      // Check blacklist
      if (EXTENDED_BLACKLIST.includes(name)) {
        problems.push('Blacklisted word');
      }
      
      // Check for common non-ingredient patterns
      if (name.match(/^(and|or|with|for|the|a|an|of|in|on|to|from|by|at)$/)) {
        problems.push('Common word, not ingredient');
      }
      
      // Check for measurement units
      if (name.match(/^(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|pound|pounds|gram|grams|kg|ml|tbsp|tsp|oz|lb|g|l|liter|liters)$/)) {
        problems.push('Measurement unit, not ingredient');
      }
      
      if (problems.length > 0) {
        issues.push({
          id: ingredient.id,
          name: ingredient.name,
          problems,
          aliases: ingredient.aliases
        });
      } else {
        validIngredients.push(ingredient.name);
      }
    }
    
    this.metrics.canonicalQuality = {
      total: ingredients.length,
      valid: validIngredients.length,
      problematic: issues.length,
      successRate: (validIngredients.length / ingredients.length) * 100
    };
    
    this.log(`📊 Canonical Quality: ${validIngredients.length}/${ingredients.length} valid (${this.metrics.canonicalQuality.successRate.toFixed(1)}%)`);
    
    // Alert if too many problematic ingredients
    if (issues.length > this.config.maxProblematicCanonicals) {
      this.addAlert('high', `Too many problematic canonical ingredients: ${issues.length}`, {
        problematic: issues.map(i => ({ name: i.name, problems: i.problems }))
      });
    }
    
    // Alert if success rate is too low
    if (this.metrics.canonicalQuality.successRate < (this.config.alertThreshold * 100)) {
      this.addAlert('medium', `Canonical quality below threshold: ${this.metrics.canonicalQuality.successRate.toFixed(1)}%`, {
        successRate: this.metrics.canonicalQuality.successRate,
        threshold: this.config.alertThreshold * 100
      });
    }
    
    return { issues, validIngredients, metrics: this.metrics.canonicalQuality };
  }

  /**
   * Check product mapping quality
   */
  async checkProductMappingQuality() {
    this.log('🔍 Checking product mapping quality...');
    
    const mappingStats = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT("canonicalTag") as mapped_products,
        COUNT(CASE WHEN "canonicalTag" IS NULL THEN 1 END) as unmapped_products,
        COUNT(DISTINCT "canonicalTag") as unique_canonicals_used
      FROM "IngredientCategorized"
    `, { type: Sequelize.QueryTypes.SELECT });
    
    const stats = mappingStats[0];
    const mappingRate = (stats.mapped_products / stats.total_products) * 100;
    
    this.metrics.productMapping = {
      total: parseInt(stats.total_products),
      mapped: parseInt(stats.mapped_products),
      unmapped: parseInt(stats.unmapped_products),
      uniqueCanonicals: parseInt(stats.unique_canonicals_used),
      mappingRate
    };
    
    this.log(`📊 Product Mapping: ${stats.mapped_products}/${stats.total_products} mapped (${mappingRate.toFixed(1)}%)`);
    
    // Alert if mapping rate is too low
    if (mappingRate < (this.config.alertThreshold * 100)) {
      this.addAlert('medium', `Product mapping rate below threshold: ${mappingRate.toFixed(1)}%`, {
        mappingRate,
        threshold: this.config.alertThreshold * 100
      });
    }
    
    return this.metrics.productMapping;
  }

  /**
   * Check for new problematic patterns
   */
  async checkForNewProblematicPatterns() {
    this.log('🔍 Checking for new problematic patterns...');
    
    // Check for substring matching issues in recent products
    const recentProducts = await db.query(`
      SELECT description, "canonicalTag" 
      FROM "IngredientCategorized" 
      WHERE "canonicalTag" IS NOT NULL 
      AND "updatedAt" >= NOW() - INTERVAL '7 days'
      LIMIT 1000
    `, { type: Sequelize.QueryTypes.SELECT });
    
    const problematicPatterns = [];
    
    for (const product of recentProducts) {
      const desc = product.description.toLowerCase();
      const tag = product.canonicalTag.toLowerCase();
      
      // Check for substring matching (should be word boundary)
      if (desc.includes(tag) && !new RegExp(`\\b${tag}\\b`, 'i').test(desc)) {
        problematicPatterns.push({
          description: product.description,
          canonicalTag: product.canonicalTag,
          issue: 'substring_match'
        });
      }
    }
    
    this.metrics.problematicPatterns = {
      checked: recentProducts.length,
      found: problematicPatterns.length
    };
    
    this.log(`📊 Problematic Patterns: ${problematicPatterns.length} found in ${recentProducts.length} recent products`);
    
    if (problematicPatterns.length > 0) {
      this.addAlert('medium', `Found ${problematicPatterns.length} new problematic patterns`, {
        patterns: problematicPatterns.slice(0, 5) // Show first 5
      });
    }
    
    return { problematicPatterns, metrics: this.metrics.problematicPatterns };
  }

  /**
   * Generate monitoring report
   */
  async generateReport() {
    this.log('📊 Generating monitoring report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts,
      summary: {
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
        highAlerts: this.alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: this.alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: this.alerts.filter(a => a.severity === 'low').length
      }
    };
    
    // Save report to file
    const reportFile = path.join(__dirname, '../logs/monitoring_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Report saved to: ${reportFile}`);
    
    return report;
  }

  /**
   * Run complete monitoring
   */
  async runMonitoring() {
    this.log('🚀 Starting automated data quality monitoring...');
    
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.dirname(this.config.logFile);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Run all checks
      await this.checkCanonicalQuality();
      await this.checkProductMappingQuality();
      await this.checkForNewProblematicPatterns();
      
      // Generate report
      const report = await this.generateReport();
      
      // Summary
      this.log('\n📊 MONITORING SUMMARY:');
      this.log(`✅ Canonical Quality: ${this.metrics.canonicalQuality?.successRate.toFixed(1)}%`);
      this.log(`✅ Product Mapping: ${this.metrics.productMapping?.mappingRate.toFixed(1)}%`);
      this.log(`✅ Problematic Patterns: ${this.metrics.problematicPatterns?.found || 0} found`);
      this.log(`🚨 Alerts: ${report.summary.totalAlerts} (${report.summary.criticalAlerts} critical, ${report.summary.highAlerts} high)`);
      
      if (this.alerts.length === 0) {
        this.log('🎉 All checks passed! Data quality is excellent.');
      } else {
        this.log('⚠️ Some issues detected. Review alerts above.');
      }
      
      return report;
      
    } catch (error) {
      this.log(`❌ Monitoring failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await db.close();
    }
  }
}

// Run monitoring if called directly
if (require.main === module) {
  const monitor = new DataQualityMonitor();
  monitor.runMonitoring().catch(console.error);
}

module.exports = { DataQualityMonitor }; 