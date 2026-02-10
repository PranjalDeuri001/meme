import React from 'react';
import {
    BatteryExclamation,
    Engine,
    Turbine, // For compressor/air
    BrakeIcon, // Custom caliper icon now in IconsPack
    TemperaturePlus, // For temperature alerts
    AlarmSmoke, // For smoke/fire alerts
    Urgent, // For urgent/high priority defaults
    FilterExclamation, // For filter/general maintenance
    Disc, // Alternative brake disc
    MapPinExclamation,
    NavigationExclamation
} from "../Pages/AlertNotification/IcnonsPack";

// Fallbacks from Tabler Icons
import {
    TbAlertTriangle,
    TbSteeringWheel,
    TbSettings,
    TbGauge,
    TbShieldExclamation,
    TbTool,
    TbInfoCircle,
    TbActivityHeartbeat,
    TbTemperatureCelsius // Added for battery temp
} from "react-icons/tb";

// ============================================================================
// INDUSTRIAL STANDARD ALERT CLASSIFICATION SYSTEM
// Based on fleet management best practices and ISO guidelines
// ============================================================================

/**
 * SEVERITY LEVELS (4-tier industrial standard)
 * - CRITICAL: Immediate safety risk, requires instant action
 * - HIGH: Significant issue, requires urgent attention (within hours)
 * - MEDIUM: Moderate issue, requires attention (within 24 hours)
 * - LOW: Minor issue, informational, can be addressed during routine maintenance
 */
export const SEVERITY_LEVELS = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

/**
 * ALERT CATEGORIES (Domain-based classification)
 * - SAFETY: Driver/passenger/pedestrian safety concerns
 * - MAINTENANCE: Vehicle health and maintenance requirements
 * - OPERATIONAL: Operational efficiency and compliance
 * - INFORMATIONAL: General updates and notifications
 */
export const ALERT_CATEGORIES = {
    SAFETY: 'safety',
    MAINTENANCE: 'maintenance',
    OPERATIONAL: 'operational',
    INFORMATIONAL: 'informational'
};

/**
 * Severity color mapping for consistent visual treatment
 */
export const SEVERITY_COLORS = {
    critical: {
        primary: '#dc2626',
        soft: 'rgba(220, 38, 38, 0.1)',
        border: 'rgba(220, 38, 38, 0.3)',
        gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)'
    },
    high: {
        primary: '#ea580c',
        soft: 'rgba(234, 88, 12, 0.1)',
        border: 'rgba(234, 88, 12, 0.3)',
        gradient: 'linear-gradient(135deg, #ea580c, #c2410c)'
    },
    medium: {
        primary: '#d97706',
        soft: 'rgba(217, 119, 6, 0.1)',
        border: 'rgba(217, 119, 6, 0.3)',
        gradient: 'linear-gradient(135deg, #d97706, #b45309)'
    },
    low: {
        primary: '#0284c7',
        soft: 'rgba(2, 132, 199, 0.1)',
        border: 'rgba(2, 132, 199, 0.3)',
        gradient: 'linear-gradient(135deg, #0284c7, #0369a1)'
    }
};

/**
 * Category configuration with icons and labels
 */
export const CATEGORY_CONFIG = {
    safety: {
        label: 'Safety',
        icon: TbShieldExclamation,
        color: '#dc2626'
    },
    maintenance: {
        label: 'Maintenance',
        icon: TbTool,
        color: '#d97706'
    },
    operational: {
        label: 'Operational',
        icon: TbActivityHeartbeat,
        color: '#0284c7'
    },
    informational: {
        label: 'Info',
        icon: TbInfoCircle,
        color: '#64748b'
    }
};

/**
 * Determines the severity level of an alert based on its type/name.
 * Uses industrial fleet management standards for classification.
 * IMPORTANT: API-provided priority is honored FIRST, type-based heuristics are fallback.
 * @param {string} type - The alert type or name
 * @param {string} priority - Optional existing priority from API
 * @returns {string} - Severity level (critical, high, medium, low)
 */
export const getAlertSeverity = (type, priority) => {
    if (!type) return SEVERITY_LEVELS.MEDIUM;

    const lowerType = type.toLowerCase();
    const lowerPriority = priority?.toLowerCase();

    // PRIORITY CHECK FIRST: Honor API-provided priority if available
    if (lowerPriority === 'critical') return SEVERITY_LEVELS.CRITICAL;
    if (lowerPriority === 'high') return SEVERITY_LEVELS.HIGH;
    if (lowerPriority === 'medium') return SEVERITY_LEVELS.MEDIUM;
    if (lowerPriority === 'low') return SEVERITY_LEVELS.LOW;

    // FALLBACK: Type-based heuristics (only if no API priority)

    // CRITICAL: Immediate safety concerns
    if (
        lowerType.includes('fire') ||
        lowerType.includes('smoke') ||
        lowerType.includes('collision') ||
        lowerType.includes('crash') ||
        lowerType.includes('rollover') ||
        lowerType.includes('airbag') ||
        lowerType.includes('emergency')
    ) {
        return SEVERITY_LEVELS.CRITICAL;
    }

    // HIGH: Significant issues requiring urgent attention
    if (
        lowerType.includes('brake') ||
        lowerType.includes('steering') ||
        lowerType.includes('overheat') ||
        lowerType.includes('coolant') ||
        lowerType.includes('engine') && lowerType.includes('fail') ||
        lowerType.includes('battery') ||
        lowerType.includes('temp') ||
        lowerType.includes('pressure') ||
        lowerType.includes('critical')
    ) {
        return SEVERITY_LEVELS.HIGH;
    }

    // MEDIUM: Moderate issues
    if (
        lowerType.includes('soc') ||
        lowerType.includes('filter') ||
        lowerType.includes('maintenance') ||
        lowerType.includes('service') ||
        lowerType.includes('motor') ||
        lowerType.includes('voltage')
    ) {
        return SEVERITY_LEVELS.MEDIUM;
    }

    // LOW: Minor issues / informational
    if (
        lowerType.includes('update') ||
        lowerType.includes('scheduled') ||
        lowerType.includes('reminder') ||
        lowerType.includes('info') ||
        lowerType.includes('location') ||
        lowerType.includes('geofence')
    ) {
        return SEVERITY_LEVELS.LOW;
    }

    // Default to MEDIUM if no specific match
    return SEVERITY_LEVELS.MEDIUM;
};

/**
 * Determines the category of an alert based on its type.
 * @param {string} type - The alert type or name
 * @returns {string} - Category (safety, maintenance, operational, informational)
 */
export const getAlertCategory = (type) => {
    if (!type) return ALERT_CATEGORIES.INFORMATIONAL;

    const lowerType = type.toLowerCase();

    // SAFETY: Life-threatening or injury-risk situations
    if (
        lowerType.includes('fire') ||
        lowerType.includes('smoke') ||
        lowerType.includes('collision') ||
        lowerType.includes('crash') ||
        lowerType.includes('rollover') ||
        lowerType.includes('airbag') ||
        lowerType.includes('brake') ||
        lowerType.includes('steering') ||
        lowerType.includes('emergency')
    ) {
        return ALERT_CATEGORIES.SAFETY;
    }

    // MAINTENANCE: Vehicle health and upkeep
    if (
        lowerType.includes('engine') ||
        lowerType.includes('motor') ||
        lowerType.includes('battery') ||
        // ‘soc’ moved to Info/Default
        lowerType.includes('filter') ||
        lowerType.includes('coolant') ||
        lowerType.includes('temp') ||
        lowerType.includes('maintenance') ||
        lowerType.includes('service') ||
        lowerType.includes('pressure')
    ) {
        return ALERT_CATEGORIES.MAINTENANCE;
    }

    // OPERATIONAL: Fleet operations and efficiency
    if (
        lowerType.includes('geofence') ||
        lowerType.includes('location') ||
        lowerType.includes('idle') ||
        lowerType.includes('speeding') ||
        // ‘charging’ moved to Info/Default
        lowerType.includes('route') ||
        lowerType.includes('schedule')
    ) {
        return ALERT_CATEGORIES.OPERATIONAL;
    }

    // Default: INFORMATIONAL
    return ALERT_CATEGORIES.INFORMATIONAL;
};

/**
 * Gets the appropriate color set for a severity level.
 * @param {string} severity - The severity level
 * @returns {object} - Color object with primary, soft, border, gradient
 */
export const getSeverityColor = (severity) => {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;
};

/**
 * Gets a human-readable severity label with description.
 * @param {string} severity - The severity level
 * @returns {object} - { label, description, actionRequired }
 */
export const getSeverityInfo = (severity) => {
    const info = {
        critical: {
            label: 'CRITICAL',
            description: 'Immediate action required - Safety risk',
            actionRequired: 'Stop vehicle immediately if safe. Contact emergency services if needed.',
            responseTime: 'Immediate'
        },
        high: {
            label: 'HIGH',
            description: 'Urgent attention needed - Significant issue',
            actionRequired: 'Address within the hour. Schedule immediate service if driving.',
            responseTime: 'Within 1 hour'
        },
        medium: {
            label: 'MEDIUM',
            description: 'Attention required - Moderate issue',
            actionRequired: 'Address within 24 hours. Monitor vehicle performance.',
            responseTime: 'Within 24 hours'
        },
        low: {
            label: 'LOW',
            description: 'Informational - Minor issue',
            actionRequired: 'Address during next scheduled maintenance.',
            responseTime: 'Routine'
        }
    };

    return info[severity] || info.medium;
};

/**
 * Returns the appropriate icon component based on the alert type/name.
 * matches case-insensitive.
 * @param {string} type - The alert type or name (e.g., "Low SoC", "Brake Pressure")
 * @returns {JSX.Element} - The icon component
 */
export const getAlertIcon = (type) => {
    if (!type) return <TbAlertTriangle size={20} strokeWidth={1.5} />;

    const lowerType = type.toLowerCase();

    // Temperature / Heat -> TbTemperatureCelsius (Check BEFORE Battery to catch 'Battery Temp')
    if (lowerType.includes("temp") || lowerType.includes("heat") || lowerType.includes("coolant")) {
        return <TbTemperatureCelsius size={22} strokeWidth={1.5} />;
    }

    // Battery / SoC -> BatteryExclamation
    if (lowerType.includes("soc") || lowerType.includes("battery")) {
        return <BatteryExclamation size={20} strokeWidth={1.5} />;
    }

    // Brakes -> BrakeIcon (Caliper style)
    if (lowerType.includes("brake")) {
        return <BrakeIcon size={20} strokeWidth={1.5} />;
    }

    // Smoke / Fire -> AlarmSmoke
    if (lowerType.includes("smoke") || lowerType.includes("fire")) {
        return <AlarmSmoke size={20} strokeWidth={1.5} />;
    }

    // Steering -> TbSteeringWheel (Tabler)
    if (lowerType.includes("steering")) {
        return <TbSteeringWheel size={20} strokeWidth={1.5} />;
    }

    // Compressor / Air / Ecompressor -> Turbine
    if (lowerType.includes("compressor") || lowerType.includes("ecompressor") || lowerType.includes("air") || lowerType.includes("pressure")) {
        return <Turbine size={20} strokeWidth={1.5} />;
    }

    // Engine / Motor -> Engine
    if (lowerType.includes("engine") || lowerType.includes("motor")) {
        return <Engine size={20} strokeWidth={1.5} />;
    }

    // Filter / Maintenance -> FilterExclamation
    if (lowerType.includes("filter") || lowerType.includes("maintenance")) {
        return <FilterExclamation size={20} strokeWidth={1.5} />;
    }

    // Location -> MapPinExclamation
    if (lowerType.includes("location") || lowerType.includes("geofence")) {
        return <MapPinExclamation size={20} strokeWidth={1.5} />;
    }

    // Urgent / Critical -> Urgent
    if (lowerType.includes("critical") || lowerType.includes("urgent") || lowerType.includes("danger")) {
        return <Urgent size={20} strokeWidth={1.5} />;
    }

    // Default
    return <TbAlertTriangle size={20} strokeWidth={1.5} />;
};

/**
 * Get category icon component
 * @param {string} category - Alert category
 * @returns {JSX.Element} - Icon component
 */
export const getCategoryIcon = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.informational;
    const IconComponent = config.icon;
    return <IconComponent size={16} style={{ color: config.color }} />;
};

