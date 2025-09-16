# Space Force Mission Control (SFMC) Documentation

**Human ARC Platform and Space Force Mission Control 2050 - Documentation Hub**

## Quick Start
- **Development**: Run `npm run test` to build and run the app
- **Server**: Runs on http://localhost:5173
- **Purpose**: ARC-AGI puzzle platform for human vs AI benchmarking

## Core Documentation

### 📋 Essential Reading
- [Project Instructions](../CLAUDE.md) - Core development guidelines and architecture principles
- [API Reference](./EXTERNAL_API.md) - Complete API endpoint documentation
- [Architecture Guide](./architecture.md) - Current system architecture and data flow

### 🏗️ Architecture & Integration
- [PlayFab Integration](./playfab-integration.md) - Complete PlayFab service architecture
- [Arc-Explainer API](./arc-explainer-integration.md) - AI performance data integration
- [Data Flow](./data-architecture.md) - How data moves through the system

### 🛠️ Development Guides
- [Service Architecture](./service-patterns.md) - Service layer patterns and best practices
- [Component Patterns](./component-guidelines.md) - React component architecture
- [Debugging Guide](./debugging.md) - Common issues and solutions

### 📊 Platform Features
- [Assessment Interface](./assessment-platform.md) - Human performance testing system
- [HARC Platform](./harc-platform.md) - Human-AI Reasoning Comparison dashboard
- [Officer Track](./officer-track.md) - ARC-AGI puzzle implementation

## Current Status (as of Sept 2025)

### ✅ Production Ready
- **PlayFab Integration**: Complete authentication, user data, leaderboards, event tracking
- **Arc-Explainer API**: AI performance data, batch processing, error resilience
- **Assessment Platform**: Working human vs AI comparison with real-time scoring
- **LLM Winner Detection**: On-demand AI leaderboard updates via user triggers

### 🚧 Active Development
- **HARC Platform Enhancement**: Converting landing page to data-rich research dashboard
- **Documentation Cleanup**: Consolidating and updating all documentation
- **Performance Optimization**: Caching strategies and API optimization

### 🗂️ Legacy Documentation
All outdated documentation has been moved to `docs/archive/` for historical reference.

## Development Workflow

1. **Read the project instructions**: [CLAUDE.md](../CLAUDE.md) contains critical development guidelines
2. **Understand the architecture**: Review architecture docs before making changes
3. **Follow service patterns**: Use established service layer patterns
4. **Test thoroughly**: Always run `npm run test` before committing
5. **Update documentation**: Keep docs current with any architectural changes

## Key Principles

- **No Placeholders**: All functionality must be real, no simulated data
- **Single Responsibility**: One purpose per module, stay DRY
- **PlayFab First**: All data operations go through PlayFab services
- **Error Resilience**: Graceful degradation when APIs fail
- **TypeScript Strict**: Full type safety throughout the codebase

## Support

For technical issues or questions about the architecture, refer to the specific documentation sections above. The documentation is kept current with the codebase and reflects production-ready implementations.